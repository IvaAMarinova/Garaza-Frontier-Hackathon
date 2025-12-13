import uuid
from typing import Final

_NAMESPACE: Final[uuid.UUID] = uuid.UUID("d8f89c0c-209b-4de3-bb09-6aaf53f7c6f0")


def _normalize_seed(seed: str) -> str:
    return " ".join((seed or "").strip().lower().split())


def _derive_uuid(seed: str, kind: str) -> uuid.UUID:
    normalized = _normalize_seed(seed)
    if not normalized:
        normalized = uuid.uuid4().hex
    return uuid.uuid5(_NAMESPACE, f"{kind}:{normalized}")


def generate_concept_id(seed: str) -> str:
    """Produce a deterministic concept id so we never rely on LLM-provided ids."""
    value = _derive_uuid(seed, "concept")
    return f"concept-{value.hex[:12]}"


def generate_edge_id(seed: str) -> str:
    """Create stable edge ids derived from the linked concepts + relation."""
    value = _derive_uuid(seed, "edge")
    return f"edge-{value.hex[:12]}"
