import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


from app.api import build_router
from app.chat_service import ChatService
from app.concept_graph import ConceptGraphService
from app.goal_node import GoalNodeService
from app.dev_pages import build_dev_router
from app.openai_client import OpenAIClient
from app.store import InMemoryChatStore

app = FastAPI(title="Chat Backend API", version="1.0.0")

origins = [
    "http://localhost:3000",
    "http://localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

store = InMemoryChatStore()
llm = OpenAIClient()
chat = ChatService(store=store, llm=llm)
concept_graphs = ConceptGraphService(store=store, llm=llm)
goal_nodes = GoalNodeService(store=store, concept_graphs=concept_graphs, llm=llm)

app.include_router(build_router(chat, concept_graphs, goal_nodes))
app.include_router(build_dev_router())

@app.get("/health")
def health():
    return {"ok": True}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
