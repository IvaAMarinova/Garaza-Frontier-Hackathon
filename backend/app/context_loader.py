from functools import lru_cache
from pathlib import Path

from .config import CHAT_CONTEXT_FILE


@lru_cache(maxsize=1)
def load_initial_context() -> str:
    """Load the optional context snippet from disk once."""
    path = Path(CHAT_CONTEXT_FILE)
    try:
        data = path.read_text(encoding="utf-8")
    except FileNotFoundError:
        return ""
    return data.strip()
