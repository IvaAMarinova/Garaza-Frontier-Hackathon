import time
import uuid
from dataclasses import dataclass, field
from typing import Dict, List

from .models import ChatMessage

@dataclass
class Session:
    created_ts: float = field(default_factory=lambda: time.time())
    messages: List[ChatMessage] = field(default_factory=list)

class InMemoryChatStore:
    def __init__(self) -> None:
        self._sessions: Dict[str, Session] = {}

    def create_session(self) -> str:
        sid = str(uuid.uuid4())
        self._sessions[sid] = Session()
        return sid

    def get_session(self, session_id: str):
        return self._sessions.get(session_id)

    def append(self, session_id: str, msg: ChatMessage) -> None:
        s = self.get_session(session_id)
        if not s:
            raise KeyError("session not found")
        s.messages.append(msg)

    def list_messages(self, session_id: str) -> List[ChatMessage]:
        s = self.get_session(session_id)
        if not s:
            raise KeyError("session not found")
        return s.messages
