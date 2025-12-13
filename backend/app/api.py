from fastapi import APIRouter, HTTPException

from .models import CreateSessionResponse, SessionState, GenerateRequest, GenerateResponse
from .chat_service import ChatService

def build_router(chat: ChatService) -> APIRouter:
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

    return router
