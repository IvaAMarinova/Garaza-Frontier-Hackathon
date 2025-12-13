import textwrap
from dataclasses import dataclass
from typing import Dict, List, Set

from ..config import OPENAI_CONCEPT_MODEL
from ..models import ChatMessage
from ..openai_client import OpenAIClient

MAX_OUTLINE_CONCEPTS = 8
SUMMARY_WORD_LIMIT = 18

SYSTEM_PROMPT = """You are a careful concept graph builder. Digest chat transcripts and extract
key concepts (features, entities, problems, decisions) plus the logical relations between them.
Start each conceptualisation pass with an eagle-eye outline only: surface the broadest subtopics,
keep summaries extremely short, and defer deep dives until a follow-up request. Use concise canonical
labels, capture chronology with the provided indices, and always return strict JSON matching the schema
described in the user instructions. Do not include any extra commentary."""


@dataclass
class ConceptExtractionResult:
    concepts: List[Dict[str, object]]
    edges: List[Dict[str, object]]

    @staticmethod
    def empty() -> "ConceptExtractionResult":
        return ConceptExtractionResult(concepts=[], edges=[])


class ConceptExtractor:
    def __init__(
        self,
        llm: OpenAIClient,
        *,
        model: str = OPENAI_CONCEPT_MODEL,
        max_concepts: int = MAX_OUTLINE_CONCEPTS,
        summary_word_limit: int = SUMMARY_WORD_LIMIT,
    ) -> None:
        self._llm = llm
        self._model = model
        self._max_concepts = max_concepts
        self._summary_word_limit = summary_word_limit

    async def extract(
        self,
        *,
        session_id: str,
        messages: List[ChatMessage],
        start_index: int,
    ) -> ConceptExtractionResult:
        if not messages:
            return ConceptExtractionResult.empty()

        transcript = self._format_messages(messages, start_index)
        user_prompt = textwrap.dedent(
            f"""
            Session ID: {session_id}
            You are given chat messages with their indices and message ids. Analyse only this
            slice and emit JSON of the form:
            {{
                "concepts": [
                    {{
                        "id": "string",
                        "label": "canonical label",
                        "type": "entity|decision|feature|issue|other",
                        "aliases": ["optional", "aliases"],
                        "summary": "one sentence summary",
                        "first_seen_index": message_index,
                        "last_seen_index": message_index
                    }}
                ],
                "edges": [
                    {{
                        "id": "string",
                        "from_concept_id": "concept id",
                        "to_concept_id": "concept id",
                        "relation": "relationship verb phrase",
                        "introduced_index": message_index,
                        "evidence_msg_id": "source message id" ,
                        "evidence_snippet": "short supporting quote"
                    }}
                ]
            }}
            - This is the high-level outline stage: capture at most 8 broad subtopics with
              summaries no longer than ~18 words so each can later be expanded individually.
            - Reuse ids you have already used if the same concept reappears; otherwise invent
              stable ids.
            - If no concepts or edges exist, return empty arrays.
            - Each index must reference the provided transcript indices.

            Transcript:
            {transcript}
            """
        ).strip()

        try:
            payload = await self._llm.generate_json(
                model=self._model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.0,
                max_output_tokens=2400,
            )
            pass
        except ValueError as e:
            return ConceptExtractionResult.empty()

        concepts_raw = payload.get("concepts") or []
        edges_raw = payload.get("edges") or []
        if not isinstance(concepts_raw, list):
            concepts_raw = []
        if not isinstance(edges_raw, list):
            edges_raw = []

        concepts = self._shape_concepts(concepts_raw)
        edges = self._filter_edges(edges_raw, concepts)
        return ConceptExtractionResult(concepts=concepts, edges=edges)

    @staticmethod
    def _format_messages(messages: List[ChatMessage], start_index: int) -> str:
        formatted: List[str] = []
        for offset, msg in enumerate(messages):
            idx = start_index + offset
            snippet = " ".join(msg.content.split())
            snippet = snippet[:500]
            formatted.append(f"[{idx}] ({msg.role}) id={msg.id}: {snippet}")
        return "\n".join(formatted)

    def _shape_concepts(self, concepts: List[Dict[str, object]]) -> List[Dict[str, object]]:
        shaped: List[Dict[str, object]] = []
        seen_labels: Set[str] = set()
        for raw in concepts:
            if not isinstance(raw, dict):
                continue
            label = str(raw.get("label", "")).strip()
            if label:
                label_key = label.lower()
                if label_key in seen_labels:
                    continue
                seen_labels.add(label_key)
            summary = str(raw.get("summary", "")).strip()
            if summary:
                raw["summary"] = self._truncate_words(summary, self._summary_word_limit)
            shaped.append(raw)
            if len(shaped) >= self._max_concepts:
                break
        return shaped

    def _filter_edges(self, edges: List[Dict[str, object]], concepts: List[Dict[str, object]]) -> List[Dict[str, object]]:
        if not concepts:
            return []
        allowed_ids = self._collect_allowed_ids(concepts)
        shaped: List[Dict[str, object]] = []
        for raw in edges:
            if not isinstance(raw, dict):
                continue
            src = str(raw.get("from_concept_id", "")).strip()
            dst = str(raw.get("to_concept_id", "")).strip()
            if not src or not dst:
                continue
            if allowed_ids and (src not in allowed_ids or dst not in allowed_ids):
                continue
            shaped.append(raw)
        return shaped

    @staticmethod
    def _collect_allowed_ids(concepts: List[Dict[str, object]]) -> Set[str]:
        allowed: Set[str] = set()
        for concept in concepts:
            cid = str(concept.get("id") or "").strip()
            if cid:
                allowed.add(cid)
            label = str(concept.get("label") or "").strip()
            if label:
                allowed.add(label)
        return allowed

    def _truncate_words(self, text: str, limit: int) -> str:
        words = text.split()
        if len(words) <= limit:
            return text
        return " ".join(words[:limit]) + "..."
