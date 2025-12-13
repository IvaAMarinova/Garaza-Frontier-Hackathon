import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import build_router
from app.chat_service import ChatService
from app.concept_graph import ConceptGraphService
from app.dev_pages import build_dev_router
from app.openai_client import OpenAIClient
from app.store import InMemoryChatStore

app = FastAPI(title="Chat Backend API", version="1.0.0")

# Add CORS middleware - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=False,  # Set to False when using allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

store = InMemoryChatStore()
llm = OpenAIClient()
chat = ChatService(store=store, llm=llm)
concept_graphs = ConceptGraphService(store=store, llm=llm)

app.include_router(build_router(chat, concept_graphs))
app.include_router(build_dev_router())

@app.get("/health")
def health():
    return {"ok": True}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
