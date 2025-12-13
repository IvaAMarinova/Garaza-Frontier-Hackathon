from dataclasses import dataclass
from typing import List, Optional

from .models import ChatMessage, Role


@dataclass
class RelationNode:
    """Represents how each message relates to the previous turn."""

    id: str
    role: Role
    content: str
    reply_to: Optional[str]
    ts: float


def build_relational_view(messages: List[ChatMessage]) -> List[RelationNode]:
    """Produce a simple linked structure showing how the conversation flows."""
    nodes: List[RelationNode] = []
    previous_id: Optional[str] = None

    for message in messages:
        nodes.append(
            RelationNode(
                id=message.id,
                role=message.role,
                content=message.content,
                ts=message.ts,
                reply_to=previous_id,
            )
        )
        previous_id = message.id

    return nodes
