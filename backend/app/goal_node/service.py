import textwrap
from typing import Dict, List, Optional

from ..config import OPENAI_MODEL
from ..context_loader import load_initial_context
from ..openai_client import OpenAIClient
from ..store import InMemoryChatStore
from ..concept_graph import ConceptGraphService
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
Return a single markdown answer that:
- Focuses exclusively on the latest user query (ignore unrelated context).
- Reflects only the documentation context that is provided to you (do not invent new facts).
- Summarises the approach in no more than 4 short sentences or bullet points.
- Stays abstract and action-oriented—describe phases, not code or API calls.
- Frames every idea through the lens of frontend engineering with React (components, state, hooks, data flow).
- Briefly signal which specific concepts should be expanded later (mention them inline as “expandable” hooks).
- Ensure the response directly answers the user's query with a clear Depth-1 React plan.
- Avoids analogies, philosophy, introductions, or conclusions.
- Never outputs literal code, pseudo-code, fenced snippets, or TODO lists.
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
      "doc_links": ["optional url"]
    }
  ]
}
Rules:
- Never rewrite unrelated sections.
- Use concise markdown paragraphs (max 2 sentences each) and complete every sentence.
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

    async def _generate_initial_goal(self, session_id: str) -> GoalNode:
        session = self._chat_store.get_session(session_id)
        if not session:
            raise KeyError("session not found")
        user_query = self._extract_query(session.messages)
        concept_snapshot = self._conceptual_outline(session_id)
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
            - Ground every statement in the provided documentation context. If the context does not mention something, say that it is outside scope.
            - Provide narrative guidance only; never include code listings or API syntax.
            - Keep the discussion strictly about frontend architecture and React concepts relevant to the query; skip backend or tooling tangents.
            - Respond with the briefest abstract outline that still answers the user query; do not mention unrelated goals or background.
            - Output at most four short sentences or bullets and ensure the final sentence is complete.
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
        answer_clean = answer.strip()
        first_sentence = answer_clean.split("\n")[0].strip()
        if first_sentence.endswith("."):
            first_sentence = first_sentence[:-1]
        short_goal = first_sentence if first_sentence else "Goal overview"
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
            max_output_tokens=1600,
        )
        answer_patch = str(payload.get("answer_patch", "") or "").strip()
        if answer_patch:
            goal.answer_markdown = goal.answer_markdown.rstrip() + "\n\n" + answer_patch
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
                content = str(raw.get("content_markdown") or "").strip()
                if not content:
                    continue
                summary_text = self._summarize_overlay_text(content)
                if not summary_text:
                    continue
                depth = int(raw.get("depth", goal.meta.global_answer_depth + 1) or 2)
                doc_links = raw.get("doc_links") or []
                overlay_id = raw.get("id")
                overlay = build_overlay(
                    concept_id,
                    depth=depth,
                    content_markdown=summary_text,
                    doc_links=doc_links if isinstance(doc_links, list) else [],
                    overlay_id=overlay_id,
                )
                self._upsert_overlay(goal, overlay)
                self._append_overlay_snippet(
                    goal,
                    concept_id=concept_id,
                    concept_label=concept_lookup.get(concept_id, {}).get("label", concept_id),
                    overlay_content=content,
                )
                weight = None
                if concept_id in goal.focus:
                    weight = goal.focus[concept_id].unknownness()
                try:
                    self._concept_graphs.apply_focus_data(
                        goal.session_id,
                        concept_id=concept_id,
                        weight=weight,
                        expansion=content,
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

    def _conceptual_outline(self, session_id: str) -> str:
        try:
            graph = self._concept_graphs.export_graph(session_id)
        except KeyError:
            return "No concept graph yet."
        concepts = graph.get("concepts") or []
        snippets = []
        for concept in concepts[:8]:
            label = concept.get("label", "concept")
            summary = concept.get("summary", "")
            snippets.append(f"- {label}: {summary}")
        return "\n".join(snippets) if snippets else "No concepts extracted."

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
        if not sentence.endswith("."):
            sentence = sentence.rstrip(".") + "."
        return sentence

    def _append_overlay_snippet(
        self,
        goal: GoalNode,
        *,
        concept_id: str,
        concept_label: str,
        overlay_content: str,
    ) -> None:
        summary = self._summarize_overlay_text(overlay_content)
        if not summary:
            return
        label = concept_label or concept_id
        goal.answer_markdown = goal.answer_markdown.rstrip() + f"\n- {label}: {summary}"
