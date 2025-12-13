import time
import uuid
from dataclasses import dataclass, field
from typing import Dict, List, Literal, Optional

InteractionEventType = Literal["expand", "revisit", "confused", "mastered", "collapse"]


@dataclass
class InteractionEvent:
    concept_id: str
    event: InteractionEventType
    strength: float = 1.0


@dataclass
class GoalOverlay:
    id: str
    concept_id: str
    depth: int
    content_markdown: str
    doc_links: List[str] = field(default_factory=list)


@dataclass
class FocusEntry:
    interest_score: float = 0.0
    confusion_score: float = 0.0
    mastery_score: float = 0.0

    def apply_event(self, event: InteractionEventType, strength: float) -> None:
        strength = max(0.0, strength)
        if event == "expand":
            self.interest_score += 0.6 * strength
        elif event == "revisit":
            self.interest_score += 0.35 * strength
        elif event == "confused":
            self.confusion_score += 1.2 * strength
        elif event == "mastered":
            self.mastery_score += 0.9 * strength
            self.interest_score = max(0.0, self.interest_score - 0.3 * strength)
            self.confusion_score = max(0.0, self.confusion_score - 0.3 * strength)
        elif event == "collapse":
            self.mastery_score += 0.4 * strength
            self.interest_score = max(0.0, self.interest_score - 0.2 * strength)

        self.interest_score = min(self.interest_score, 10.0)
        self.confusion_score = min(self.confusion_score, 10.0)
        self.mastery_score = min(self.mastery_score, 10.0)

    def unknownness(self) -> float:
        mastery_term = max(0.0, 1.0 - self.mastery_score)
        return 2.0 * self.confusion_score + 1.5 * self.interest_score + mastery_term


@dataclass
class GoalNodeMeta:
    global_answer_depth: int = 1
    last_updated_ts: float = field(default_factory=lambda: time.time())
    last_refined_concepts: List[str] = field(default_factory=list)


@dataclass
class GoalNode:
    session_id: str
    goal_statement: str
    answer_markdown: str
    overlays: List[GoalOverlay] = field(default_factory=list)
    focus: Dict[str, FocusEntry] = field(default_factory=dict)
    meta: GoalNodeMeta = field(default_factory=GoalNodeMeta)
    id: str = "goal"

    def ensure_focus_entry(self, concept_id: str) -> FocusEntry:
        if concept_id not in self.focus:
            self.focus[concept_id] = FocusEntry()
        return self.focus[concept_id]

    def touch(self) -> None:
        self.meta.last_updated_ts = time.time()


def build_overlay(
    concept_id: str,
    *,
    depth: int,
    content_markdown: str,
    doc_links: Optional[List[str]] = None,
    overlay_id: Optional[str] = None,
) -> GoalOverlay:
    return GoalOverlay(
        id=overlay_id or f"overlay-{uuid.uuid4().hex[:8]}",
        concept_id=concept_id,
        depth=max(1, min(depth, 3)),
        content_markdown=content_markdown.strip(),
        doc_links=[link for link in (doc_links or []) if link],
    )


def serialize_goal_node(goal: GoalNode) -> Dict[str, object]:
    overlays = [
        {
            "id": overlay.id,
            "concept_id": overlay.concept_id,
            "depth": overlay.depth,
            "content_markdown": overlay.content_markdown,
            "doc_links": overlay.doc_links,
        }
        for overlay in goal.overlays
    ]
    focus = {
        concept_id: {
            "interest_score": entry.interest_score,
            "confusion_score": entry.confusion_score,
            "mastery_score": entry.mastery_score,
            "unknownness": entry.unknownness(),
        }
        for concept_id, entry in goal.focus.items()
    }
    return {
        "id": goal.id,
        "goal_statement": goal.goal_statement,
        "answer_markdown": goal.answer_markdown,
        "overlays": overlays,
        "focus": focus,
        "meta": {
            "global_answer_depth": goal.meta.global_answer_depth,
            "last_updated_ts": goal.meta.last_updated_ts,
            "last_refined_concepts": goal.meta.last_refined_concepts,
        },
    }
