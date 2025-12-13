from typing import Optional, List

from .config import CHAT_MAX_HISTORY, OPENAI_MODEL
from .context_loader import load_initial_context
from .models import ChatMessage
from .openai_client import OpenAIClient
from .store import InMemoryChatStore
from .chat_relations import RelationNode, build_relational_view

class ChatService:
    def __init__(self, store: InMemoryChatStore, llm: OpenAIClient) -> None:
        self._store = store
        self._llm = llm
        self._initial_context = load_initial_context()

    def create_session(self) -> str:
        return self._store.create_session()

    def get_state(self, session_id: str):
        return self._store.get_session(session_id)

    def _build_context(self, session_id: str, system_prompt: Optional[str], include_initial_context: bool) -> List[dict]:
        msgs = self._store.list_messages(session_id)[-CHAT_MAX_HISTORY:]
        out: List[dict] = []
        if include_initial_context and self._initial_context:
            out.append({"role": "system", "content": self._initial_context})
        if system_prompt:
            out.append({"role": "system", "content": system_prompt})
        for m in msgs:
            out.append({"role": m.role, "content": m.content})
        return out

    async def generate(
        self,
        *,
        session_id: str,
        user_text: str,
        system_prompt: Optional[str],
        persist: bool,
        model: Optional[str],
    ) -> str:
        is_first_turn = len(self._store.list_messages(session_id)) == 0

        self._store.append(session_id, ChatMessage(role="user", content=user_text))
        context = self._build_context(session_id, system_prompt, include_initial_context=is_first_turn)
        chosen_model = model or OPENAI_MODEL
        full = await self._llm.generate_text(model=chosen_model, messages=context)

        if persist and full:
            self._store.append(session_id, ChatMessage(role="assistant", content=full))

        return full

    def get_relational_view(self, session_id: str) -> List[RelationNode]:
        session = self._store.get_session(session_id)
        if not session:
            raise KeyError("session not found")
        return build_relational_view(session.messages)
