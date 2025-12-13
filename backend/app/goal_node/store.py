from typing import Dict, Optional

from .models import GoalNode


class GoalNodeStore:
    """Simple in-memory storage keyed by session id."""

    def __init__(self) -> None:
        self._items: Dict[str, GoalNode] = {}

    def get(self, session_id: str) -> Optional[GoalNode]:
        return self._items.get(session_id)

    def upsert(self, session_id: str, goal: GoalNode) -> GoalNode:
        self._items[session_id] = goal
        return goal

    def delete(self, session_id: str) -> None:
        self._items.pop(session_id, None)
