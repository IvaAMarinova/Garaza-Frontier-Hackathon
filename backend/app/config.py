import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_CONCEPT_MODEL = os.getenv("OPENAI_CONCEPT_MODEL") or OPENAI_MODEL
CHAT_MAX_HISTORY = int(os.getenv("CHAT_MAX_HISTORY", "20"))
CHAT_CONTEXT_FILE = os.getenv("CHAT_CONTEXT_FILE", "context.txt")

if not OPENAI_API_KEY:
    raise RuntimeError("Missing OPENAI_API_KEY in environment (.env).")
