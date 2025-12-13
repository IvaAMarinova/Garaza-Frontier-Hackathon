from typing import Dict, Optional

from .models import ConceptGraph


class ConceptGraphStore:
    """In-memory storage for per-session concept graphs."""

    def __init__(self) -> None:
        self._graphs: Dict[str, ConceptGraph] = {}

    def get(self, session_id: str) -> Optional[ConceptGraph]:
        return self._graphs.get(session_id)

    def upsert(self, session_id: str, graph: ConceptGraph) -> ConceptGraph:
        self._graphs[session_id] = graph
        return graph

    def ensure(self, session_id: str) -> ConceptGraph:
        graph = self._graphs.get(session_id)
        if graph is None:
            graph = ConceptGraph()
            self._graphs[session_id] = graph
        return graph
