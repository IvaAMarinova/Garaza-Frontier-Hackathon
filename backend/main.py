import uvicorn
from fastapi import FastAPI

from app.api import build_router
from app.chat_service import ChatService
from app.openai_client import OpenAIClient
from app.store import InMemoryChatStore

app = FastAPI(title="Chat Backend API", version="1.0.0")

store = InMemoryChatStore()
llm = OpenAIClient()
chat = ChatService(store=store, llm=llm)

app.include_router(build_router(chat))

@app.get("/health")
def health():
    return {"ok": True}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)