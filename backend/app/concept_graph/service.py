from typing import Dict, List, Literal, Optional, Sequence, Tuple

from ..openai_client import OpenAIClient
from ..store import InMemoryChatStore, Session
from ..text_utils import derive_intent_label
from ..id_utils import generate_concept_id, generate_edge_id
from .extractor import ConceptExtractor
from .models import ConceptEdge, ConceptGraph, ConceptNode
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
        graph = self._graphs.ensure(session_id)
        self._ensure_intent_links(session_id, graph, session=session)
        return graph

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
            self._ensure_intent_links(session_id, graph, session=session)
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
        self._ensure_intent_links(session_id, graph, session=session)
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
        session = self._chat_store.get_session(session_id)
        if not session:
            raise KeyError("session not found")
        graph = self._graphs.ensure(session_id)
        concept = graph.find_concept(concept_id)
        if not concept:
            raise KeyError("concept not found")

        expansions = list(concept.expansions or [])
        valid_indices, skipped = self._resolve_indices(expansions, expansion_indices)
        if not valid_indices:
            return {
                "parent": concept.to_dict(),
                "children": [],
                "edges": [],
                "skipped_expansions": skipped,
            }

        selected_texts = [expansions[idx] for idx in valid_indices]
        selected_set = set(valid_indices)
        remaining = [text for idx, text in enumerate(expansions) if idx not in selected_set]
        summary_addition = self._summarize_expansions(selected_texts)
        if summary_addition:
            concept.summary = self._merge_summary(concept.summary, summary_addition)
        concept.expansions = remaining

        children, edges = self._spawn_children(
            concept,
            graph=graph,
            texts=selected_texts,
            force_children=force_children,
        )
        graph.meta.touch()
        child_ids = [child.id for child in children]
        if child_ids:
            self._ensure_intent_links(
                session_id,
                graph,
                session=session,
                concept_ids=child_ids,
            )
        self._graphs.upsert(session_id, graph)

        return {
            "parent": concept.to_dict(),
            "children": [child.to_dict() for child in children],
            "edges": [edge.to_dict() for edge in edges],
            "skipped_expansions": skipped,
        }

    # ------------------------------------------------------------------ helpers
    def _ensure_intent_links(
        self,
        session_id: str,
        graph: ConceptGraph,
        *,
        session: Optional[Session] = None,
        concept_ids: Optional[Sequence[str]] = None,
    ) -> None:
        intent_node = self._ensure_intent_node(session_id, graph, session=session)
        if not intent_node:
            return
        targets = concept_ids or [
            concept_id for concept_id in graph.concepts.keys() if concept_id != intent_node.id
        ]
        for target_id in targets:
            if target_id == intent_node.id:
                continue
            if graph.has_edge(intent_node.id, target_id, "anchors"):
                continue
            concept = graph.concepts.get(target_id)
            introduced = concept.first_seen_index if concept else 0
            edge = ConceptEdge(
                id=generate_edge_id(f"{intent_node.id}->{target_id}:anchors"),
                from_concept_id=intent_node.id,
                to_concept_id=target_id,
                relation="anchors",
                introduced_index=introduced,
            )
            graph.add_edge(edge)

    def _ensure_intent_node(
        self,
        session_id: str,
        graph: ConceptGraph,
        *,
        session: Optional[Session],
    ) -> Optional[ConceptNode]:
        label = self._infer_intent_label(session)
        if not label:
            return None
        summary = self._build_intent_summary(session) or label
        node_id = f"intent-{session_id}"
        node = graph.concepts.get(node_id)
        if node:
            if node.label != label:
                node.label = label
            if summary:
                node.summary = summary
            return node
        node = ConceptNode(
            id=node_id,
            label=label,
            type="intent",
            summary=summary,
            first_seen_index=0,
            last_seen_index=0,
            weight=1.0,
        )
        graph.add_concept(node)
        return node

    def _infer_intent_label(self, session: Optional[Session]) -> str:
        first_message = self._first_user_message(session)
        if not first_message:
            return ""
        return derive_intent_label(first_message)

    def _build_intent_summary(self, session: Optional[Session]) -> str:
        overview = self._first_user_message(session)
        if not overview:
            return ""
        return self._shrink_fragment(overview, limit=220)

    def _first_user_message(self, session: Optional[Session]) -> str:
        if not session:
            return ""
        for message in session.messages:
            if message.role == "user" and message.content.strip():
                return message.content.strip()
        return ""

    def _resolve_indices(
        self,
        expansions: List[str],
        indices: Optional[List[int]],
    ) -> Tuple[List[int], List[int]]:
        if not expansions:
            return [], []
        if not indices:
            return list(range(len(expansions))), []
        valid: List[int] = []
        skipped: List[int] = []
        for raw in indices:
            try:
                idx = int(raw)
            except (TypeError, ValueError):
                continue
            if idx < 0 or idx >= len(expansions):
                skipped.append(idx)
                continue
            if idx not in valid:
                valid.append(idx)
        return valid, skipped

    def _summarize_expansions(self, texts: List[str]) -> str:
        fragments: List[str] = []
        for text in texts:
            snippet = self._shrink_fragment(text, limit=160)
            if snippet:
                fragments.append(snippet)
            if len(fragments) >= 3:
                break
        return " · ".join(fragments)

    def _merge_summary(self, base: str, addition: str) -> str:
        if not addition:
            return base
        if not base:
            return addition
        if addition.lower() in base.lower():
            return base
        separator = " " if base.endswith((".", "!", "?")) else " · "
        return f"{base}{separator}{addition}"

    def _shrink_fragment(self, text: str, *, limit: int) -> str:
        snippet = " ".join((text or "").strip().split())
        if not snippet:
            return ""
        for token in [". ", "; ", " - ", " — ", " – "]:
            if token in snippet:
                snippet = snippet.split(token, 1)[0]
                break
        if len(snippet) > limit:
            snippet = snippet[:limit].rsplit(" ", 1)[0]
            snippet = snippet.rstrip(",.;:")
            snippet = f"{snippet}..."
        return snippet

    def _spawn_children(
        self,
        concept: ConceptNode,
        *,
        graph: ConceptGraph,
        texts: List[str],
        force_children: bool,
    ) -> Tuple[List[ConceptNode], List[ConceptEdge]]:
        children: List[ConceptNode] = []
        edges: List[ConceptEdge] = []
        seen_labels = set()
        for idx, text in enumerate(texts):
            detail = self._shrink_fragment(text, limit=220)
            if not detail:
                continue
            label = self._child_label(text, parent_label=concept.label, index=idx)
            if not label:
                continue
            normalized = label.lower()
            if normalized in seen_labels:
                continue
            if graph.find_concept(label):
                continue
            if not force_children and not self._should_spawn_child(detail):
                continue
            child = ConceptNode(
                id=generate_concept_id(label),
                label=label,
                type=concept.type or "concept",
                summary=detail,
                first_seen_index=concept.last_seen_index,
                last_seen_index=concept.last_seen_index,
                weight=max(concept.weight * 0.7, 0.15),
            )
            graph.add_concept(child)
            seen_labels.add(normalized)
            children.append(child)
            edge = ConceptEdge(
                id=generate_edge_id(f"{concept.id}->{child.id}:refines"),
                from_concept_id=concept.id,
                to_concept_id=child.id,
                relation="refines",
                introduced_index=concept.last_seen_index,
            )
            graph.add_edge(edge)
            edges.append(edge)
            if len(children) >= 3 and not force_children:
                break
        return children, edges

    def _child_label(self, text: str, *, parent_label: str, index: int) -> str:
        snippet = " ".join((text or "").strip().split())
        candidate = ""
        for separator in (":", " - ", " – ", " — "):
            if separator in snippet:
                candidate = snippet.split(separator, 1)[0].strip()
                break
        if not candidate:
            candidate = " ".join(snippet.split()[:5]).strip()
        candidate = candidate.rstrip(".")
        if not candidate:
            candidate = f"{parent_label} detail {index + 1}"
        if len(candidate) > 64:
            candidate = candidate[:64].rsplit(" ", 1)[0].strip()
        if not candidate:
            candidate = f"{parent_label} detail {index + 1}"
        return candidate

    def _should_spawn_child(self, snippet: str) -> bool:
        words = snippet.split()
        if len(words) >= 12:
            return True
        triggers = [":", " - ", " -> ", " => ", " explains "]
        return any(trigger in snippet.lower() for trigger in triggers)
