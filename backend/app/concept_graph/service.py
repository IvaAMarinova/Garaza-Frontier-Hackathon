from typing import Dict, Literal, Optional

from ..openai_client import OpenAIClient
from ..store import InMemoryChatStore
from .extractor import ConceptExtractor
from .models import ConceptGraph
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
        return self._graphs.ensure(session_id)

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
            # nothing new to process; keep existing graph (full rebuild should simply
            # reset and return empty graph if there are no messages)
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
