import time
import uuid
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

from ..id_utils import generate_concept_id, generate_edge_id


def _normalize(text: str) -> str:
    return " ".join(text.strip().lower().split())


def _unique(items: List[str]) -> List[str]:
    seen = []
    for item in items:
        normalized = item.strip()
        if not normalized:
            continue
        if normalized not in seen:
            seen.append(normalized)
    return seen


@dataclass
class ConceptNode:
    id: str
    label: str
    type: str
    aliases: List[str] = field(default_factory=list)
    summary: str = ""
    first_seen_index: int = 0
    last_seen_index: int = 0
    weight: float = 0.0
    expansions: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, object]:
        return {
            "id": self.id,
            "label": self.label,
            "type": self.type,
            "aliases": self.aliases,
            "summary": self.summary,
            "first_seen_index": self.first_seen_index,
            "last_seen_index": self.last_seen_index,
            "weight": self.weight,
            "expansions": self.expansions,
        }


@dataclass
class ConceptEdge:
    id: str
    from_concept_id: str
    to_concept_id: str
    relation: str
    introduced_index: int
    evidence_msg_id: Optional[str] = None
    evidence_snippet: Optional[str] = None
    last_referenced_index: int = 0

    def to_dict(self) -> Dict[str, object]:
        return {
            "id": self.id,
            "from_concept_id": self.from_concept_id,
            "to_concept_id": self.to_concept_id,
            "relation": self.relation,
            "introduced_index": self.introduced_index,
            "evidence_msg_id": self.evidence_msg_id,
            "evidence_snippet": self.evidence_snippet,
            "last_referenced_index": self.last_referenced_index,
        }


@dataclass
class ConceptGraphMeta:
    last_processed_index: int = -1
    graph_version: str = "1.0"
    updated_ts: float = field(default_factory=lambda: time.time())

    def touch(self) -> None:
        self.updated_ts = time.time()

    def to_dict(self) -> Dict[str, object]:
        return {
            "last_processed_index": self.last_processed_index,
            "graph_version": self.graph_version,
            "updated_ts": self.updated_ts,
        }


@dataclass
class ConceptGraph:
    concepts: Dict[str, ConceptNode] = field(default_factory=dict)
    edges: Dict[str, ConceptEdge] = field(default_factory=dict)
    meta: ConceptGraphMeta = field(default_factory=ConceptGraphMeta)
    _label_index: Dict[str, str] = field(default_factory=dict, init=False, repr=False)
    _edge_index: Dict[Tuple[str, str, str], str] = field(default_factory=dict, init=False, repr=False)

    def __post_init__(self) -> None:
        self._rebuild_indexes()

    def _rebuild_indexes(self) -> None:
        self._label_index = {}
        for node in self.concepts.values():
            self._register_aliases(node)
        self._edge_index = {}
        for edge in self.edges.values():
            key = self._edge_key(edge.from_concept_id, edge.to_concept_id, edge.relation)
            self._edge_index[key] = edge.id

    @staticmethod
    def _edge_key(src: str, dst: str, relation: str) -> Tuple[str, str, str]:
        return (src, dst, relation.strip().lower())

    def _register_aliases(self, node: ConceptNode) -> None:
        labels = [node.label] + node.aliases
        for label in labels:
            if not label:
                continue
            self._label_index[_normalize(label)] = node.id

    def _match_concept(self, label: str, aliases: List[str]) -> Optional[ConceptNode]:
        for candidate in [label, *aliases]:
            if not candidate:
                continue
            key = self._label_index.get(_normalize(candidate))
            if key and key in self.concepts:
                return self.concepts[key]
        return None

    def _get_concept(self, identifier: str) -> Optional[ConceptNode]:
        if identifier in self.concepts:
            return self.concepts[identifier]
        key = self._label_index.get(_normalize(identifier))
        if key and key in self.concepts:
            return self.concepts[key]
        return None

    def find_concept(self, identifier: str) -> Optional[ConceptNode]:
        return self._get_concept(identifier)

    def merge(self, *, concepts: List[Dict[str, object]], edges: List[Dict[str, object]]) -> None:
        id_map: Dict[str, str] = {}
        for raw in concepts:
            node = self._upsert_concept(raw)
            raw_id = str(raw.get("id")) if raw.get("id") else node.id
            id_map[raw_id] = node.id

        for raw in edges:
            self._upsert_edge(raw, id_map)

        self.meta.touch()

    def _upsert_concept(self, payload: Dict[str, object]) -> ConceptNode:
        label = str(payload.get("label", "")).strip()
        if not label:
            label = f"concept-{uuid.uuid4().hex[:8]}"
        raw_aliases = payload.get("aliases") or []
        if isinstance(raw_aliases, str):
            raw_aliases = [raw_aliases]
        aliases = _unique([str(a) for a in raw_aliases])
        summary = str(payload.get("summary", "")).strip()
        concept_type = str(payload.get("type", "concept") or "concept").strip() or "concept"
        first_seen = int(payload.get("first_seen_index", 0) or 0)
        last_seen = int(payload.get("last_seen_index", first_seen) or first_seen)

        existing = self._match_concept(label, aliases)
        if existing:
            combined_aliases = _unique(existing.aliases + aliases)
            existing.aliases = combined_aliases
            existing.summary = summary or existing.summary
            existing.first_seen_index = min(existing.first_seen_index, first_seen)
            existing.last_seen_index = max(existing.last_seen_index, last_seen)
            incoming_weight = payload.get("weight")
            if incoming_weight is not None:
                try:
                    existing.weight = max(existing.weight, float(incoming_weight))
                except (TypeError, ValueError):
                    pass
            incoming_expansions = payload.get("expansions") or []
            if isinstance(incoming_expansions, list):
                for item in incoming_expansions:
                    text = str(item).strip()
                    if text and text not in existing.expansions:
                        existing.expansions.append(text)
            self._register_aliases(existing)
            return existing

        seed_label = label or f"concept-{uuid.uuid4().hex}"
        node_id = str(payload.get("id")) if payload.get("id") else generate_concept_id(seed_label)
        if node_id in self.concepts:
            node_id = generate_concept_id(f"{seed_label}-{uuid.uuid4().hex}")

        node = ConceptNode(
            id=node_id,
            label=label,
            type=concept_type,
            aliases=aliases,
            summary=summary,
            first_seen_index=first_seen,
            last_seen_index=max(first_seen, last_seen),
            weight=float(payload.get("weight", 0.0) or 0.0),
            expansions=list(payload.get("expansions", []) or []),
        )
        self.concepts[node.id] = node
        self._register_aliases(node)
        return node

    def add_concept(self, node: ConceptNode) -> None:
        self.concepts[node.id] = node
        self._register_aliases(node)

    def add_edge(self, edge: ConceptEdge) -> None:
        self.edges[edge.id] = edge
        key = self._edge_key(edge.from_concept_id, edge.to_concept_id, edge.relation)
        self._edge_index[key] = edge.id

    def has_edge(self, src: str, dst: str, relation: str) -> bool:
        key = self._edge_key(src, dst, relation)
        return key in self._edge_index

    def apply_focus(self, concept_id: str, *, weight: Optional[float], expansion: Optional[str]) -> bool:
        node = self._get_concept(concept_id)
        if not node:
            return False
        if weight is not None:
            node.weight = max(node.weight, float(weight))
        if expansion:
            clean = str(expansion).strip()
            if clean and clean not in node.expansions:
                node.expansions.append(clean)
        return True

    def _upsert_edge(self, payload: Dict[str, object], id_map: Dict[str, str]) -> Optional[ConceptEdge]:
        raw_from = str(payload.get("from_concept_id", ""))
        raw_to = str(payload.get("to_concept_id", ""))
        if not raw_from or not raw_to:
            return None

        from_id = id_map.get(raw_from) or (raw_from if raw_from in self.concepts else None)
        to_id = id_map.get(raw_to) or (raw_to if raw_to in self.concepts else None)
        if not from_id or not to_id:
            return None

        relation = str(payload.get("relation", "related_to") or "related_to").strip()
        introduced_index = int(payload.get("introduced_index", 0) or 0)
        evidence_msg_id = payload.get("evidence_msg_id")
        evidence_snippet = payload.get("evidence_snippet")
        last_seen = int(payload.get("last_referenced_index", introduced_index) or introduced_index)

        key = self._edge_key(from_id, to_id, relation)
        existing_id = self._edge_index.get(key)
        if existing_id and existing_id in self.edges:
            edge = self.edges[existing_id]
            edge.introduced_index = min(edge.introduced_index, introduced_index)
            edge.last_referenced_index = max(edge.last_referenced_index, last_seen)
            edge.evidence_msg_id = evidence_msg_id or edge.evidence_msg_id
            edge.evidence_snippet = evidence_snippet or edge.evidence_snippet
            return edge

        edge_id = str(payload.get("id")) if payload.get("id") else generate_edge_id(
            f"{from_id}->{to_id}:{relation}"
        )
        if edge_id in self.edges:
            edge_id = generate_edge_id(f"{from_id}->{to_id}:{relation}-{uuid.uuid4().hex}")

        edge = ConceptEdge(
            id=edge_id,
            from_concept_id=from_id,
            to_concept_id=to_id,
            relation=relation,
            introduced_index=introduced_index,
            evidence_msg_id=str(evidence_msg_id) if evidence_msg_id else None,
            evidence_snippet=str(evidence_snippet) if evidence_snippet else None,
            last_referenced_index=last_seen,
        )
        self.edges[edge.id] = edge
        self._edge_index[key] = edge.id
        return edge

    def to_dict(self) -> Dict[str, object]:
        concepts = sorted(self.concepts.values(), key=lambda c: (c.first_seen_index, c.label))
        edges = sorted(self.edges.values(), key=lambda e: (e.introduced_index, e.id))
        return {
            "concepts": [node.to_dict() for node in concepts],
            "edges": [edge.to_dict() for edge in edges],
            "meta": self.meta.to_dict(),
        }
