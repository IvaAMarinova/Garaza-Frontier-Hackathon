_INTENT_PREFIXES = [
    "i want to ",
    "i would like to ",
    "i'd like to ",
    "i need to ",
    "i'm trying to ",
    "i am trying to ",
    "we need to ",
    "help me ",
    "please ",
    "can you ",
    "could you ",
]


_WRAP_CHARS = {'"', "'", "\u201c", "\u201d"}


def _strip_wrapping_quotes(value: str) -> str:
    value = value.strip()
    if value and value[0] in _WRAP_CHARS:
        value = value[1:]
    if value and value[-1] in _WRAP_CHARS:
        value = value[:-1]
    return value


def _collapse_whitespace(value: str) -> str:
    return " ".join(value.split())


def _trim_length(value: str, limit: int = 96) -> str:
    if len(value) <= limit:
        return value
    trimmed = value[:limit].rsplit(" ", 1)[0].strip()
    return trimmed if trimmed else value[:limit]


def derive_intent_label(text: str) -> str:
    """Return a short, React-focused label derived from the user's first request."""
    if not text:
        return ""
    cleaned = _collapse_whitespace(_strip_wrapping_quotes(text))
    lowered = cleaned.lower()
    for prefix in _INTENT_PREFIXES:
        if lowered.startswith(prefix):
            cleaned = cleaned[len(prefix) :]
            lowered = cleaned.lower()
            break
    cleaned = cleaned.rstrip(".!?")
    cleaned = cleaned.strip()
    if not cleaned:
        cleaned = "React focus"
    if "react" not in cleaned.lower():
        cleaned = f"React {cleaned}"
    cleaned = _trim_length(cleaned, 96)
    cleaned = cleaned[:1].upper() + cleaned[1:] if cleaned else cleaned
    return cleaned


def normalize_text(value: str) -> str:
    """Lowercase + collapse whitespace for fuzzy comparisons."""
    if not value:
        return ""
    return _collapse_whitespace(value).lower()
