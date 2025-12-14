import re
import textwrap
from typing import Dict, List, Optional
from urllib.parse import urlparse

from ..config import OPENAI_MODEL
from ..context_loader import load_initial_context
from ..openai_client import OpenAIClient
from ..store import InMemoryChatStore
from ..concept_graph import ConceptGraphService
from ..text_utils import derive_intent_label, normalize_text
from ..models import ChatMessage
from .models import (
    GoalNode,
    GoalOverlay,
    GoalNodeMeta,
    InteractionEvent,
    InteractionEventType,
    FocusEntry,
    build_overlay,
    serialize_goal_node,
)
from .store import GoalNodeStore

INITIAL_GOAL_PROMPT = """You act as the Goal Node author for a learning mind map.
Return exactly two concise plain-text sentences (≤24 words each) that:
- Focus exclusively on the latest user query (ignore unrelated context).
- Ground every statement in the provided documentation excerpt; when no excerpt exists, fall back to core React fundamentals without mentioning missing docs.
- Mention every concept listed in the prompt at least once using short, natural clauses.
- Stay abstract and action-oriented—describe phases, not code or API calls.
- Frame every idea through the lens of frontend engineering with React (components, state, hooks, data flow).
- Briefly hint at which concepts deserve deeper follow-up by weaving phrases such as “expand X later”.
- Use neutral, third-person narration without brackets, self-references, enumerations, or ellipses.
- Avoid analogies, philosophy, introductions, or conclusions.
- Never output literal code, pseudo-code, fenced snippets, or TODO lists.
- Always finish every sentence (no trailing or cut-off fragments).
- Never mention these instructions or meta-guidance in your output."""

REFINEMENT_PROMPT = """You refine an existing Goal Node answer. Only deepen the selected concepts.
Output strict JSON:
{
  "answer_patch": "markdown text to append (or empty string)",
  "overlays": [
    {
      "concept_id": "string",
      "depth": 2,
      "content_markdown": "markdown paragraph",
      "doc_links": { "React Components": "https://react.dev/reference/react/Component" }
    }
  ]
}
Rules:
- Never rewrite unrelated sections.
- Use concise markdown paragraphs (max 2 sentences each, ≤35 words total) and complete every sentence.
- Begin every overlay paragraph with a short (≤5 words) descriptive title followed by a colon before the supporting detail.
- Only include doc links when depth >= 2.
- Keep overlays tightly scoped to each concept and state the most essential detail only.
- Never reference these instructions or describe your own actions."""


class GoalNodeService:
    def __init__(
        self,
        *,
        store: InMemoryChatStore,
        concept_graphs: ConceptGraphService,
        llm: OpenAIClient,
    ) -> None:
        self._chat_store = store
        self._concept_graphs = concept_graphs
        self._llm = llm
        self._store = GoalNodeStore()
        self._doc_context = load_initial_context()
        self._model = OPENAI_MODEL

    def serialize(self, goal: GoalNode) -> Dict[str, object]:
        return serialize_goal_node(goal)

    async def get_goal(self, session_id: str, *, create_if_missing: bool = True) -> GoalNode:
        existing = self._store.get(session_id)
        if existing:
            return existing
        if not create_if_missing:
            raise KeyError("goal node not found")
        return await self._generate_initial_goal(session_id)

    async def initialize_goal(self, session_id: str, *, force: bool = False) -> GoalNode:
        if force:
            self._store.delete(session_id)
        return await self._generate_initial_goal(session_id)

    async def apply_interactions(
        self,
        session_id: str,
        events: List[InteractionEvent],
        *,
        auto_refine: bool = True,
    ) -> GoalNode:
        goal = await self.get_goal(session_id, create_if_missing=True)
        updated_entries: Dict[str, FocusEntry] = {}
        if events:
            updated_entries = self._update_focus(goal, events)
            for concept_id, entry in updated_entries.items():
                try:
                    self._concept_graphs.apply_focus_data(
                        session_id,
                        concept_id=concept_id,
                        weight=entry.unknownness(),
                    )
                except KeyError:
                    continue
        if auto_refine:
            targets = self._select_targets(goal)
            if targets:
                return await self._refine_goal(goal, targets)
        self._store.upsert(session_id, goal)
        return goal

    async def refine_for_concepts(self, session_id: str, concept_ids: List[str]) -> GoalNode:
        goal = await self.get_goal(session_id, create_if_missing=True)
        if not concept_ids:
            return goal
        unique_targets: List[str] = []
        for concept_id in concept_ids:
            concept_key = concept_id.strip()
            if not concept_key:
                continue
            goal.ensure_focus_entry(concept_key)
            if concept_key not in unique_targets:
                unique_targets.append(concept_key)
        if not unique_targets:
            return goal
        return await self._refine_goal(goal, unique_targets)

    async def _generate_initial_goal(self, session_id: str) -> GoalNode:
        session = self._chat_store.get_session(session_id)
        if not session:
            raise KeyError("session not found")
        user_query = self._extract_query(session.messages)
        concept_inventory = self._concept_inventory(session_id)
        concept_snapshot = self._format_concept_outline(concept_inventory)
        user_prompt = textwrap.dedent(
            f"""
            User intent:
            {user_query}

            Documentation context:
            {self._doc_context or "n/a"}

            Concepts in play:
            {concept_snapshot}

            Instructions:
            - Use the conceptual map above to produce a succinct, React-focused plan that solves the user's request.
            - Ground every statement in the provided documentation context. If no context is available, rely on core React fundamentals without mentioning missing docs.
            - Mention every listed concept at least once in a short, readable clause.
            - Provide narrative guidance only; never include code listings or API syntax.
            - Keep the discussion strictly about frontend architecture and React concepts relevant to the query; skip backend or tooling tangents.
            - Respond with the briefest abstract outline that still answers the user query; do not mention unrelated goals or background.
            - Output exactly two plain-text, third-person sentences (each ≤24 words, no brackets, ellipses, or enumerations) and ensure the final sentence is complete.
            """
        ).strip()

        messages = [{"role": "system", "content": INITIAL_GOAL_PROMPT}]
        if self._doc_context:
            messages.append({"role": "system", "content": self._doc_context})
        messages.append({"role": "user", "content": user_prompt})
        answer = await self._llm.generate_text(
            model=self._model,
            messages=messages,
            max_output_tokens=600,
        )
        answer_plain = self._to_plain_text(answer)
        answer_clean = self._enforce_sentence_limit(answer_plain, max_sentences=2)
        coverage = self._build_concept_coverage(concept_inventory)
        if coverage:
            answer_clean = f"{self._ensure_sentence_end(answer_clean)} {coverage}".strip()
        else:
            answer_clean = self._ensure_sentence_end(answer_clean)
        short_goal = self._build_goal_statement(answer_clean, user_query)
        goal = GoalNode(
            session_id=session_id,
            goal_statement=short_goal,
            answer_markdown=answer_clean,
            overlays=[],
            focus={},
            meta=GoalNodeMeta(global_answer_depth=1),
        )
        goal.touch()
        self._store.upsert(session_id, goal)
        return goal

    async def _refine_goal(self, goal: GoalNode, targets: List[str]) -> GoalNode:
        concept_details = self._concept_details(goal.session_id, targets)
        allowed_concepts = self._filter_connected_concepts(goal.session_id, [c["concept_id"] for c in concept_details])
        concept_details = [c for c in concept_details if c["concept_id"] in allowed_concepts]
        if not concept_details:
            return goal
        concept_lookup = {c["concept_id"]: c for c in concept_details}
        target_lines = []
        for c in concept_details:
            expansions = c.get("expansions", []) or []
            expansion_note = ""
            if expansions:
                preview = ", ".join(expansions[:2])
                expansion_note = f" · expansions: {preview}"
            summary = c.get("summary", "")
            weight = float(c.get("weight", 0.0) or 0.0)
            label = c.get("label", c.get("concept_id"))
            target_lines.append(
                f"- {c['concept_id']} [{label}] weight={weight:.2f}: {summary}{expansion_note}"
            )
        target_descriptions = "\n".join(target_lines)
        overlay_snapshot = [
            {
                "concept_id": overlay.concept_id,
                "depth": overlay.depth,
                "content": overlay.content_markdown,
            }
            for overlay in goal.overlays
        ]
        user_prompt = textwrap.dedent(
            f"""
            Current answer:
            {goal.answer_markdown}

            Existing overlays:
            {overlay_snapshot}

            Focus concepts to deepen:
            {target_descriptions}
            """
        ).strip()

        messages = [{"role": "system", "content": REFINEMENT_PROMPT}]
        if self._doc_context:
            messages.append({"role": "system", "content": self._doc_context})
        messages.append({"role": "user", "content": user_prompt})
        payload = await self._llm.generate_json(
            model=self._model,
            messages=messages,
            max_output_tokens=2400,
        )
        answer_patch = str(payload.get("answer_patch", "") or "").strip()
        if answer_patch:
            goal.answer_markdown = goal.answer_markdown.rstrip() + "\n\n" + answer_patch
            goal.answer_markdown = self._limit_answer_length(goal.answer_markdown)
            goal.meta.global_answer_depth = min(3, goal.meta.global_answer_depth + 1)

        overlays_payload = payload.get("overlays") or []
        if isinstance(overlays_payload, list):
            for raw in overlays_payload:
                if not isinstance(raw, dict):
                    continue
                concept_id = str(raw.get("concept_id") or "").strip()
                if not concept_id:
                    continue
                if concept_id not in targets:
                    continue
                content_raw = str(raw.get("content_markdown") or "").strip()
                if not content_raw:
                    continue
                content_plain = self._to_plain_text(content_raw)
                summary_text = self._summarize_overlay_text(content_plain)
                if not summary_text:
                    continue
                depth = int(raw.get("depth", goal.meta.global_answer_depth + 1) or 2)
                doc_links_raw = raw.get("doc_links") or []
                if isinstance(doc_links_raw, dict):
                    doc_links_raw = list(doc_links_raw.values())
                elif not isinstance(doc_links_raw, list):
                    doc_links_raw = []
                doc_links_labeled = self._label_links(doc_links_raw)
                summary_text = self._ensure_reference_mentions(summary_text, list(doc_links_labeled.keys()))
                overlay_id = raw.get("id")
                overlay = build_overlay(
                    concept_id,
                    depth=depth,
                    content_markdown=summary_text,
                    doc_links=doc_links_labeled,
                    overlay_id=overlay_id,
                )
                self._upsert_overlay(goal, overlay)
                weight = None
                if concept_id in goal.focus:
                    weight = goal.focus[concept_id].unknownness()
                try:
                    self._concept_graphs.apply_focus_data(
                        goal.session_id,
                        concept_id=concept_id,
                        weight=weight,
                        expansion=content_plain,
                    )
                except KeyError:
                    continue

        goal.meta.last_refined_concepts = targets
        goal.touch()
        self._store.upsert(goal.session_id, goal)
        return goal

    def _upsert_overlay(self, goal: GoalNode, overlay: GoalOverlay) -> None:
        for idx, existing in enumerate(goal.overlays):
            if existing.concept_id == overlay.concept_id and existing.depth == overlay.depth:
                goal.overlays[idx] = overlay
                return
        goal.overlays.append(overlay)

    def _update_focus(self, goal: GoalNode, events: List[InteractionEvent]) -> Dict[str, FocusEntry]:
        updated: Dict[str, FocusEntry] = {}
        for event in events:
            if not event.concept_id or not event.event:
                continue
            entry = goal.ensure_focus_entry(event.concept_id)
            entry.apply_event(event.event, event.strength)
            updated[event.concept_id] = entry
        return updated

    def _select_targets(self, goal: GoalNode, limit: int = 2) -> List[str]:
        scored = [
            (concept_id, entry.unknownness())
            for concept_id, entry in goal.focus.items()
        ]
        scored = [(cid, score) for cid, score in scored if score > 0.15]
        scored.sort(key=lambda item: item[1], reverse=True)
        return [cid for cid, _ in scored[:limit]]

    def _extract_query(self, messages: List[ChatMessage]) -> str:
        for message in reversed(messages):
            if message.role == "user" and message.content.strip():
                return message.content.strip()
        if messages:
            return messages[-1].content.strip()
        return "Help me reason about this topic."

    def _concept_inventory(self, session_id: str) -> List[Dict[str, str]]:
        try:
            graph = self._concept_graphs.export_graph(session_id)
        except KeyError:
            return []
        inventory: List[Dict[str, str]] = []
        for concept in (graph.get("concepts") or [])[:8]:
            label = str(concept.get("label", "concept")).strip() or "concept"
            summary = str(concept.get("summary", "")).strip()
            inventory.append(
                {
                    "label": label,
                    "summary": summary,
                }
            )
        return inventory

    def _format_concept_outline(self, inventory: List[Dict[str, str]]) -> str:
        if not inventory:
            return "No concepts extracted."
        snippets = []
        for item in inventory:
            label = item.get("label", "concept")
            summary = self._shorten_phrase(item.get("summary", ""), limit=18)
            snippets.append(f"- {label}: {summary}")
        return "\n".join(snippets)

    def _build_concept_coverage(self, inventory: List[Dict[str, str]]) -> str:
        if not inventory:
            return ""
        labels = [item.get("label", "concept") for item in inventory]
        sentence = "Concept coverage: " + ", ".join(labels)
        return self._ensure_sentence_end(sentence)

    def _concept_details(self, session_id: str, concept_ids: List[str]) -> List[Dict[str, str]]:
        try:
            graph = self._concept_graphs.export_graph(session_id)
        except KeyError:
            return []
        by_id: Dict[str, Dict[str, str]] = {}
        for concept in graph.get("concepts", []):
            cid = str(concept.get("id") or concept.get("label") or "")
            if cid:
                by_id[cid] = concept
        details = []
        for concept_id in concept_ids:
            concept = by_id.get(concept_id)
            if concept:
                details.append(
                    {
                        "concept_id": concept_id,
                        "label": concept.get("label", concept_id),
                        "summary": concept.get("summary", ""),
                        "weight": concept.get("weight", 0.0),
                        "expansions": concept.get("expansions", []),
                    }
                )
            else:
                details.append(
                    {
                        "concept_id": concept_id,
                        "label": concept_id,
                        "summary": "",
                        "weight": 0.0,
                        "expansions": [],
                    }
                )
        return details

    def _filter_connected_concepts(self, session_id: str, concept_ids: List[str]) -> List[str]:
        try:
            graph = self._concept_graphs.export_graph(session_id)
        except KeyError:
            return []
        intent_ids = {concept["id"] for concept in graph.get("concepts", []) if str(concept.get("id", "")).startswith("intent-")}
        if not intent_ids:
            return concept_ids
        anchor_targets = set()
        for edge in graph.get("edges", []):
            if edge.get("relation") != "anchors":
                continue
            if edge.get("from_concept_id") in intent_ids:
                anchor_targets.add(edge.get("to_concept_id"))
        return [cid for cid in concept_ids if cid in anchor_targets or cid in intent_ids]

    def _shorten_phrase(self, text: str, limit: int) -> str:
        normalized = " ".join((text or "").split())
        if not normalized:
            return ""
        return normalized.rstrip(".") + "."

    def _to_plain_text(self, text: str) -> str:
        lines: List[str] = []
        for raw_line in (text or "").splitlines():
            stripped = raw_line.strip()
            stripped = stripped.lstrip("-*•0123456789. )(").strip()
            if stripped:
                lines.append(stripped)
        flat = " ".join(lines)
        flat = " ".join(flat.split())
        return self._ensure_sentence_end(flat)

    def _ensure_sentence_end(self, text: str) -> str:
        clean = (text or "").rstrip()
        if not clean:
            return ""
        if clean[-1] in ".!?":
            return clean
        return clean + "."

    def _limit_answer_length(self, text: str, max_chars: int = 800) -> str:
        clean = text.strip()
        if len(clean) <= max_chars:
            return clean
        trimmed = clean[:max_chars].rsplit(".", 1)[0].strip()
        if not trimmed:
            trimmed = clean[:max_chars].strip()
        if not trimmed.endswith("."):
            trimmed = trimmed.rstrip(",;:") + "."
        return trimmed

    def _enforce_sentence_limit(self, text: str, *, max_sentences: int) -> str:
        snippets = [segment.strip() for segment in re.split(r"(?<=[.!?])\s+", text) if segment.strip()]
        if not snippets:
            return ""
        limited = snippets[:max_sentences]
        combined = " ".join(limited).strip()
        return combined

    def _label_links(self, doc_links: List[str]) -> Dict[str, str]:
        mapping: Dict[str, str] = {}
        counts: Dict[str, int] = {}
        for raw in doc_links:
            link = str(raw or "").strip()
            if not link:
                continue
            label = self._link_to_label(link)
            if label in mapping:
                counts[label] = counts.get(label, 1) + 1
                label = f"{label} ({counts[label]})"
            mapping[label] = link
        return mapping

    def _ensure_reference_mentions(self, summary: str, references: List[str]) -> str:
        if not references:
            return summary
        combined = summary.rstrip()
        if not combined.endswith("."):
            combined += "."
        prefix = "Reference: " if len(references) == 1 else "References: "
        clause = prefix + ", ".join(references) + "."
        return f"{combined} {clause}"

    def _link_to_label(self, link: str) -> str:
        try:
            parsed = urlparse(link)
        except ValueError:
            return "Reference"
        path = (parsed.path or "").strip("/")
        segment = path.split("/")[-1]
        segment = segment.split("?")[0].split("#")[0]
        base = segment or parsed.netloc.split(".")[0]
        base = base.replace("-", " ").replace("_", " ").strip()
        if not base:
            base = parsed.netloc or "Reference"
        words = [word.capitalize() for word in base.split()]
        label = " ".join(words).strip() or "Reference"
        if parsed.netloc.endswith("react.dev") and "React" not in label:
            label = f"React {label}"
        return label

    def _summarize_overlay_text(self, content: str) -> str:
        snippet_source = content.strip()
        if not snippet_source:
            return ""
        first_line = snippet_source.split("\n", 1)[0].strip()
        if not first_line:
            return ""
        sentence = first_line.split(". ")[0].strip()
        if not sentence:
            return ""
        sentence = sentence.rstrip()
        if not sentence.endswith("."):
            sentence = sentence.rstrip(".") + "."
        return sentence

    def _build_goal_statement(self, answer_text: str, user_query: str) -> str:
        candidate = (answer_text or "").strip().split("\n")[0]
        candidate = candidate.lstrip("-•0123456789. ").strip()
        normalized_answer = normalize_text(candidate)
        normalized_query = normalize_text(user_query)
        if not candidate or (normalized_answer and normalized_answer == normalized_query):
            candidate = derive_intent_label(user_query) or "React overview"
        if len(candidate) > 110:
            candidate = candidate[:110].rsplit(" ", 1)[0].strip()
        return candidate or "React overview"
