import uuid
from difflib import SequenceMatcher
from typing import Dict, Literal, Optional, List, Tuple

from ..openai_client import OpenAIClient
from ..store import InMemoryChatStore
from .extractor import ConceptExtractor
from .models import ConceptGraph, ConceptNode, ConceptEdge
from .store import ConceptGraphStore

BuildMode = Literal["full", "incremental"]


class ConceptGraphService:
    def __init__(self, store: InMemoryChatStore, llm: OpenAIClient) -> None:
        self._chat_store = store
        self._graphs = ConceptGraphStore()
        self._extractor = ConceptExtractor(llm)

    def get_graph(self, session_id: str) -> ConceptGraph:
        session = self._chat_store.get_session(session_id)
        if not session:
            raise KeyError("session not found")
        return self._graphs.ensure(session_id)

    async def build_graph(self, session_id: str, *, mode: BuildMode) -> ConceptGraph:
        session = self._chat_store.get_session(session_id)
        if not session:
            raise KeyError("session not found")

        messages = session.messages
        if mode == "full":
            graph = ConceptGraph()
            start_index = 0
        else:
            graph = self._graphs.ensure(session_id)
            start_index = graph.meta.last_processed_index + 1

        if start_index < 0:
            start_index = 0

        if mode == "full":
            graph.meta.last_processed_index = -1

        slice_messages = messages[start_index:]
        if not slice_messages:
            # nothing new to process; keep existing graph (full rebuild should simply
            # reset and return empty graph if there are no messages)
            if mode == "full":
                self._graphs.upsert(session_id, graph)
            return graph

        extraction = await self._extractor.extract(
            session_id=session_id,
            messages=slice_messages,
            start_index=start_index,
        )
        graph.merge(concepts=extraction.concepts, edges=extraction.edges)
        graph.meta.last_processed_index = len(messages) - 1
        self._graphs.upsert(session_id, graph)
        return graph

    def export_graph(self, session_id: str) -> Dict[str, object]:
        graph = self.get_graph(session_id)
        return graph.to_dict()

    def apply_focus_data(
        self,
        session_id: str,
        *,
        concept_id: str,
        weight: Optional[float] = None,
        expansion: Optional[str] = None,
    ) -> None:
        if not self._chat_store.get_session(session_id):
            raise KeyError("session not found")
        graph = self._graphs.ensure(session_id)
        updated = graph.apply_focus(concept_id, weight=weight, expansion=expansion)
        if not updated:
            raise KeyError("concept not found")
        graph.meta.touch()
        self._graphs.upsert(session_id, graph)

    def get_concept(self, session_id: str, concept_id: str) -> Dict[str, object]:
        graph = self.get_graph(session_id)
        concept = graph.find_concept(concept_id)
        if not concept:
            raise KeyError("concept not found")
        return concept.to_dict()

    def declutter_concept(
        self,
        session_id: str,
        *,
        concept_id: str,
        expansion_indices: Optional[List[int]] = None,
        force_children: bool = False,
    ) -> Dict[str, object]:
        if not self._chat_store.get_session(session_id):
            raise KeyError("session not found")
        graph = self._graphs.ensure(session_id)
        concept = graph.find_concept(concept_id)
        if not concept:
            raise KeyError("concept not found")

        expansions = concept.expansions or []
        if not expansions:
            return {
                "parent": concept.to_dict(),
                "children": [],
                "edges": [],
                "skipped_expansions": [],
            }

        selected: List[Tuple[int, str]] = []
        if expansion_indices:
            idx_set = {i for i in expansion_indices if 0 <= i < len(expansions)}
            for idx in sorted(idx_set):
                selected.append((idx, expansions[idx]))
        else:
            selected = list(enumerate(expansions))

        parent_summary_baseline = concept.summary.strip()
        consolidated_parts = [parent_summary_baseline] if parent_summary_baseline else []
        summarized_expansions: List[Tuple[int, str, str]] = []
        skipped_indices: List[int] = []

        for idx, text in selected:
            summary = self._summarize_text(text)
            if summary:
                consolidated_parts.append(summary)
            summarized_expansions.append((idx, text, summary))

        concept.summary = " ".join(part for part in consolidated_parts if part).strip()

        children: List[ConceptNode] = []
        edges: List[ConceptEdge] = []
        total_candidates = len(summarized_expansions) or 1
        for idx, raw_text, summary in summarized_expansions:
            if not summary:
                skipped_indices.append(idx)
                continue
            is_meaningful = force_children or self._is_meaningful(summary, parent_summary_baseline)
            if not is_meaningful:
                skipped_indices.append(idx)
                continue
            child = self._create_child_concept(concept, summary, len(children), total_candidates)
            edge = self._create_child_edge(parent=concept, child_id=child.id)
            graph.add_concept(child)
            graph.add_edge(edge)
            children.append(child)
            edges.append(edge)

        concept.expansions = []
        graph.meta.touch()
        self._graphs.upsert(session_id, graph)
        return {
            "parent": concept.to_dict(),
            "children": [child.to_dict() for child in children],
            "edges": [edge.to_dict() for edge in edges],
            "skipped_expansions": skipped_indices,
        }

    @staticmethod
    def _summarize_text(content: str) -> str:
        snippet = (content or "").strip()
        if not snippet:
            return ""
        first_line = snippet.split("\n", 1)[0].strip()
        if not first_line:
            return ""
        sentence = first_line.split(". ")[0].strip().rstrip(".")
        if not sentence:
            return ""
        return sentence + "."

    @staticmethod
    def _is_meaningful(summary: str, baseline: str, threshold: float = 0.75) -> bool:
        if not baseline:
            return True
        ratio = SequenceMatcher(None, summary.lower(), baseline.lower()).ratio()
        return ratio < threshold and len(summary) >= 40

    def _create_child_concept(self, parent: ConceptNode, summary: str, index: int, total: int) -> ConceptNode:
        child_id = f"{parent.id}-detail-{uuid.uuid4().hex[:6]}"
        weight_divisor = max(total, 1)
        child_weight = parent.weight / weight_divisor if parent.weight else 0.0
        return ConceptNode(
            id=child_id,
            label=f"{parent.label} detail {index + 1}",
            type=parent.type,
            aliases=[parent.label],
            summary=summary,
            first_seen_index=parent.first_seen_index,
            last_seen_index=parent.last_seen_index,
            weight=child_weight,
            expansions=[],
        )

    def _create_child_edge(self, parent: ConceptNode, child_id: str) -> ConceptEdge:
        return ConceptEdge(
            id=f"edge-{uuid.uuid4().hex[:6]}",
            from_concept_id=parent.id,
            to_concept_id=child_id,
            relation="details",
            introduced_index=parent.first_seen_index,
            evidence_msg_id=None,
            evidence_snippet=None,
            last_referenced_index=parent.last_seen_index,
        )
