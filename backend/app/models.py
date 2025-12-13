import time
import uuid
from typing import Dict, Literal, Optional, List
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
    weight: float = 0.0
    expansions: List[str] = Field(default_factory=list)


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


class GoalOverlayModel(BaseModel):
    id: str
    concept_id: str
    depth: int
    content_markdown: str
    doc_links: List[str] = Field(default_factory=list)


class FocusScoresModel(BaseModel):
    interest_score: float = 0.0
    confusion_score: float = 0.0
    mastery_score: float = 0.0
    unknownness: float = 0.0


class GoalNodeMetaModel(BaseModel):
    global_answer_depth: int
    last_updated_ts: float
    last_refined_concepts: List[str] = Field(default_factory=list)


class GoalNodeResponse(BaseModel):
    id: str
    goal_statement: str
    answer_markdown: str
    overlays: List[GoalOverlayModel] = Field(default_factory=list)
    focus: Dict[str, FocusScoresModel] = Field(default_factory=dict)
    meta: GoalNodeMetaModel


class GoalNodeInitRequest(BaseModel):
    force: bool = False


class GoalInteractionModel(BaseModel):
    concept_id: str
    event: Literal["expand", "revisit", "confused", "mastered", "collapse"]
    strength: float = Field(default=1.0, ge=0)


class GoalInteractionRequest(BaseModel):
    events: List[GoalInteractionModel] = Field(default_factory=list)
    auto_refine: bool = True


class ConceptExpandRequest(BaseModel):
    expansion: Optional[str] = Field(default=None)
    weight: Optional[float] = None
    strength: float = Field(default=1.0, ge=0)
    auto_refine: bool = True
