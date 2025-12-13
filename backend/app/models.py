import time
import uuid
from typing import Literal, Optional, List
from pydantic import BaseModel, Field

Role = Literal["system", "user", "assistant"]

class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: Role
    content: str
    ts: float = Field(default_factory=lambda: time.time())

class CreateSessionResponse(BaseModel):
    session_id: str

class SessionState(BaseModel):
    session_id: str
    created_ts: float
    messages: List[ChatMessage]

class GenerateRequest(BaseModel):
    content: str
    system_prompt: Optional[str] = None
    persist: bool = True
    model: Optional[str] = None

class GenerateResponse(BaseModel):
    content: str
