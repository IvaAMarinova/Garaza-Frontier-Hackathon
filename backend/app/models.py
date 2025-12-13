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


class ConceptGraphBuildRequest(BaseModel):
    mode: Literal["full", "incremental"] = "incremental"


class ConceptNodeModel(BaseModel):
    id: str
    label: str
    type: str
    aliases: List[str] = Field(default_factory=list)
    summary: str
    first_seen_index: int
    last_seen_index: int


class ConceptEdgeModel(BaseModel):
    id: str
    from_concept_id: str
    to_concept_id: str
    relation: str
    introduced_index: int
    evidence_msg_id: Optional[str] = None
    evidence_snippet: Optional[str] = None
    last_referenced_index: Optional[int] = None


class ConceptGraphMetaModel(BaseModel):
    last_processed_index: int
    graph_version: str
    updated_ts: float


class ConceptGraphResponse(BaseModel):
    concepts: List[ConceptNodeModel] = Field(default_factory=list)
    edges: List[ConceptEdgeModel] = Field(default_factory=list)
    meta: ConceptGraphMetaModel


class GoalResponse(BaseModel):
    goal: str
