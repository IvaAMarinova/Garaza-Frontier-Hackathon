from fastapi import APIRouter, HTTPException

from .models import (
    CreateSessionResponse,
    SessionState,
    GenerateRequest,
    GenerateResponse,
    ConceptGraphBuildRequest,
    ConceptNodeModel,
    ConceptEdgeModel,
    ConceptGraphResponse,
    GoalNodeInitRequest,
    GoalNodeResponse,
    GoalInteractionRequest,
    ConceptExpandRequest,
    ConceptDeclutterRequest,
    ConceptDeclutterResponse,
)
from .chat_service import ChatService
from .concept_graph import ConceptGraphService
from .goal_node import GoalNodeService, InteractionEvent

def build_router(
    chat: ChatService,
    concept_graphs: ConceptGraphService,
    goal_nodes: GoalNodeService,
) -> APIRouter:
    router = APIRouter(prefix="/v1/chat", tags=["chat"])

    @router.post("/sessions", response_model=CreateSessionResponse)
    def create_session():
        return CreateSessionResponse(session_id=chat.create_session())

    @router.get("/sessions/{session_id}", response_model=SessionState)
    def get_session_state(session_id: str):
        s = chat.get_state(session_id)
        if not s:
            raise HTTPException(status_code=404, detail="session not found")
        return SessionState(session_id=session_id, created_ts=s.created_ts, messages=s.messages)

    @router.post("/sessions/{session_id}/generate", response_model=GenerateResponse)
    async def generate(session_id: str, req: GenerateRequest):
        if not chat.get_state(session_id):
            raise HTTPException(status_code=404, detail="session not found")

        content = await chat.generate(
            session_id=session_id,
            user_text=req.content,
            system_prompt=req.system_prompt,
            persist=req.persist,
            model=req.model,
        )

        return GenerateResponse(content=content)

    @router.post(
        "/sessions/{session_id}/concept-graph/build",
        response_model=ConceptGraphResponse,
    )
    async def build_concept_graph(session_id: str, req: ConceptGraphBuildRequest):
        try:
            graph = await concept_graphs.build_graph(session_id, mode=req.mode)
        except KeyError:
            raise HTTPException(status_code=404, detail="session not found")
        return ConceptGraphResponse(**graph.to_dict())

    @router.get("/sessions/{session_id}/concept-graph", response_model=ConceptGraphResponse)
    def get_concept_graph(session_id: str):
        try:
            data = concept_graphs.export_graph(session_id)
        except KeyError:
            raise HTTPException(status_code=404, detail="session not found")
        return ConceptGraphResponse(**data)

    @router.post(
        "/sessions/{session_id}/concept-graph/{concept_id}/expand",
        response_model=ConceptNodeModel,
    )
    async def expand_concept(session_id: str, concept_id: str, req: ConceptExpandRequest):
        try:
            concept_graphs.apply_focus_data(
                session_id,
                concept_id=concept_id,
                weight=req.weight,
                expansion=req.expansion,
            )
        except KeyError as exc:
            detail = "concept not found" if "concept" in str(exc) else "session not found"
            raise HTTPException(status_code=404, detail=detail)

        events = [
            InteractionEvent(concept_id=concept_id, event="expand", strength=req.strength)
        ]
        try:
            await goal_nodes.apply_interactions(session_id, events, auto_refine=req.auto_refine)
        except KeyError:
            raise HTTPException(status_code=404, detail="session not found")

        try:
            concept = concept_graphs.get_concept(session_id, concept_id)
        except KeyError:
            raise HTTPException(status_code=404, detail="concept not found")
        return ConceptNodeModel(**concept)

    @router.post(
        "/sessions/{session_id}/concept-graph/{concept_id}/declutter",
        response_model=ConceptDeclutterResponse,
    )
    async def declutter_concept(session_id: str, concept_id: str, req: ConceptDeclutterRequest):
        try:
            result = concept_graphs.declutter_concept(
                session_id,
                concept_id=concept_id,
                expansion_indices=req.expansion_indices,
                force_children=req.force_children,
            )
        except KeyError as exc:
            detail = "concept not found" if "concept" in str(exc) else "session not found"
            raise HTTPException(status_code=404, detail=detail)

        children_ids = [child["id"] for child in result.get("children", [])]
        if req.auto_refine and children_ids:
            try:
                await goal_nodes.refine_for_concepts(session_id, children_ids)
            except KeyError:
                raise HTTPException(status_code=404, detail="session not found")

        return ConceptDeclutterResponse(
            parent=ConceptNodeModel(**result["parent"]),
            children=[ConceptNodeModel(**child) for child in result.get("children", [])],
            edges=[
                ConceptEdgeModel(**edge)
                for edge in result.get("edges", [])
            ],
            skipped_expansions=result.get("skipped_expansions", []),
        )

    @router.post("/sessions/{session_id}/goal", response_model=GoalNodeResponse)
    async def initialize_goal_node(session_id: str, req: GoalNodeInitRequest):
        try:
            goal = await goal_nodes.initialize_goal(session_id, force=req.force)
        except KeyError:
            raise HTTPException(status_code=404, detail="session not found")
        return GoalNodeResponse(**goal_nodes.serialize(goal))

    @router.get("/sessions/{session_id}/goal", response_model=GoalNodeResponse)
    async def get_goal_node(session_id: str, create_if_missing: bool = True):
        try:
            goal = await goal_nodes.get_goal(session_id, create_if_missing=create_if_missing)
        except KeyError:
            raise HTTPException(status_code=404, detail="goal node not found")
        return GoalNodeResponse(**goal_nodes.serialize(goal))

    @router.post("/sessions/{session_id}/goal/interactions", response_model=GoalNodeResponse)
    async def record_goal_interactions(session_id: str, req: GoalInteractionRequest):
        events = [
            InteractionEvent(concept_id=event.concept_id, event=event.event, strength=event.strength)
            for event in req.events
        ]
        try:
            goal = await goal_nodes.apply_interactions(session_id, events, auto_refine=req.auto_refine)
        except KeyError:
            raise HTTPException(status_code=404, detail="session not found")
        return GoalNodeResponse(**goal_nodes.serialize(goal))

    return router
