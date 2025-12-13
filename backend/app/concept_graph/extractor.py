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

        You are building a learner-friendly concept graph from a slice of chat history.
        Your output will drive a mind map / learning pathway UI. Optimize for clarity,
        low cognitive load, and natural expandability.

        You are given chat messages with indices and message ids. Analyze ONLY this slice.

        OUTPUT FORMAT (STRICT JSON ONLY)
        Emit JSON of the form:
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
              "evidence_msg_id": "source message id",
              "evidence_snippet": "short supporting quote"
            }}
          ]
        }}

        HIGH-LEVEL OUTLINE TARGET
        - This is the outline stage: capture AT MOST 8 broad, expandable concepts.
        - Choose concepts that form a coherent learning path: foundations first, then specifics.
        - Each concept summary must be <= ~18 words and written for a learner (not an expert).
        - Prefer concepts that answer: “What would confuse the learner if this was missing?”

        CONCEPT SELECTION RULES
        - Prefer foundational ideas over implementation detail.
        - Merge near-duplicates (same meaning, different phrasing) into one canonical concept with aliases.
        - Avoid one-off details (e.g., single library names) unless they are central to the slice.
        - If a concept is only meaningful after another, represent that dependency via an edge.

        ID STABILITY
        - Reuse a concept id if the same concept reappears in this slice.
        - Invent stable ids for new concepts. Use short, deterministic ids (e.g., "c_chat_sessions", "c_sse_streaming")
          rather than random UUID-like strings.
        - Do NOT create two concepts that mean the same thing with different ids.

        EDGE RULES (MAKE THEM USEFUL)
        - Add edges only when there is a real relationship implied by the transcript.
        - Use learner-relevant relations (verb phrases) like:
          "depends on", "enables", "implements", "uses", "requires", "refines", "replaces", "is part of", "causes".
        - Avoid vague relations like "related to" unless no better relation exists.
        - Prefer edges that create a learning sequence: what should be understood first.

        CHRONOLOGY
        - first_seen_index/last_seen_index must reflect where the concept first/last appears in THIS slice.
        - introduced_index should be the earliest message index in THIS slice that supports that edge.

        EVIDENCE
        - evidence_msg_id must be from the transcript.
        - evidence_snippet must be a short supporting quote (<= 120 chars) copied from that message.
        - Do not quote code blocks in full; quote only the smallest relevant fragment.

        QUALITY CHECKS BEFORE YOU OUTPUT
        - Concepts <= 8, edges <= 12 (only if meaningful).
        - No duplicate concepts by meaning.
        - Every edge references valid concept ids present in "concepts".
        - Indices always point to existing transcript indices.
        - If nothing meaningful exists, return empty arrays.

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
