from fastapi import APIRouter, HTTPException

from .models import (
    CreateSessionResponse,
    SessionState,
    GenerateRequest,
    GenerateResponse,
    ConceptGraphBuildRequest,
    ConceptGraphResponse,
    GoalResponse,
)
from .chat_service import ChatService
from .concept_graph import ConceptGraphService

def build_router(chat: ChatService, concept_graphs: ConceptGraphService) -> APIRouter:
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

        # Simulate LLM processing time (3 seconds)
        import asyncio
        await asyncio.sleep(1.5)

        # Hardcoded response for tic tac toe game concepts
        hardcoded_content = """I'll help you understand tic tac toe game concepts! Here are the key areas to explore:

**Game Rules & Mechanics:**
- 3x3 grid with X and O players
- Players alternate turns
- Win by getting 3 in a row (horizontal, vertical, or diagonal)
- Draw if board fills without winner

**Strategic Concepts:**
- Center control advantage
- Corner vs edge positioning
- Blocking opponent moves
- Creating multiple win threats

**Implementation Details:**
- Game state representation (2D array)
- Turn management system
- Win condition checking algorithms
- User interface design patterns

**AI & Algorithms:**
- Minimax algorithm for optimal play
- Alpha-beta pruning optimization
- Heuristic evaluation functions
- Difficulty level implementation

This creates a rich concept graph for exploring game development principles!"""

        return GenerateResponse(content=hardcoded_content)

    @router.post(
        "/sessions/{session_id}/concept-graph/build",
        response_model=ConceptGraphResponse,
    )
    async def build_concept_graph(session_id: str, req: ConceptGraphBuildRequest):
        if not chat.get_state(session_id):
            raise HTTPException(status_code=404, detail="session not found")
        
        # Simulate concept graph processing time (3 seconds)
        import asyncio
        await asyncio.sleep(1.0)
        
        # Hardcoded tic tac toe concept graph
        import time
        hardcoded_graph = {
            "concepts": [
                {
                    "id": "game-core",
                    "label": "Tic Tac Toe Game",
                    "type": "game",
                    "aliases": ["TTT", "Noughts and Crosses"],
                    "summary": "Classic 3x3 grid game where players alternate placing X and O to get three in a row",
                    "first_seen_index": 0,
                    "last_seen_index": 0
                },
                {
                    "id": "game-rules",
                    "label": "Game Rules",
                    "type": "concept",
                    "aliases": ["Rules", "Mechanics"],
                    "summary": "Players alternate turns on 3x3 grid, win by getting 3 symbols in a row",
                    "first_seen_index": 0,
                    "last_seen_index": 0
                },
                {
                    "id": "strategy",
                    "label": "Game Strategy",
                    "type": "concept",
                    "aliases": ["Tactics", "Optimal Play"],
                    "summary": "Strategic concepts like center control, corner positioning, and blocking",
                    "first_seen_index": 0,
                    "last_seen_index": 0
                },
                {
                    "id": "implementation",
                    "label": "Implementation",
                    "type": "technical",
                    "aliases": ["Code", "Programming"],
                    "summary": "Technical aspects including game state, turn management, and UI design",
                    "first_seen_index": 0,
                    "last_seen_index": 0
                },
                {
                    "id": "ai-algorithms",
                    "label": "AI Algorithms",
                    "type": "technical",
                    "aliases": ["Minimax", "AI"],
                    "summary": "Algorithms for computer players including minimax and heuristic evaluation",
                    "first_seen_index": 0,
                    "last_seen_index": 0
                },
                {
                    "id": "win-conditions",
                    "label": "Win Conditions",
                    "type": "concept",
                    "aliases": ["Victory", "End Game"],
                    "summary": "Three in a row horizontally, vertically, or diagonally wins the game",
                    "first_seen_index": 0,
                    "last_seen_index": 0
                }
            ],
            "edges": [
                {
                    "id": "edge-1",
                    "from_concept_id": "game-core",
                    "to_concept_id": "game-rules",
                    "relation": "defines",
                    "introduced_index": 0
                },
                {
                    "id": "edge-2",
                    "from_concept_id": "game-core",
                    "to_concept_id": "strategy",
                    "relation": "involves",
                    "introduced_index": 0
                },
                {
                    "id": "edge-3",
                    "from_concept_id": "game-core",
                    "to_concept_id": "implementation",
                    "relation": "requires",
                    "introduced_index": 0
                },
                {
                    "id": "edge-4",
                    "from_concept_id": "game-core",
                    "to_concept_id": "ai-algorithms",
                    "relation": "can_use",
                    "introduced_index": 0
                },
                {
                    "id": "edge-5",
                    "from_concept_id": "game-rules",
                    "to_concept_id": "win-conditions",
                    "relation": "includes",
                    "introduced_index": 0
                }
            ],
            "meta": {
                "last_processed_index": 0,
                "graph_version": "1.0",
                "updated_ts": time.time()
            }
        }
        
        return ConceptGraphResponse(**hardcoded_graph)

    @router.get("/sessions/{session_id}/concept-graph", response_model=ConceptGraphResponse)
    async def get_concept_graph(session_id: str):
        if not chat.get_state(session_id):
            raise HTTPException(status_code=404, detail="session not found")
        
        # Simulate retrieval time (3 seconds)
        import asyncio
        await asyncio.sleep(1.0)
        
        # Return the same hardcoded graph as build endpoint
        import time
        hardcoded_graph = {
            "concepts": [
                {
                    "id": "game-core",
                    "label": "Tic Tac Toe Game",
                    "type": "game",
                    "aliases": ["TTT", "Noughts and Crosses"],
                    "summary": "Classic 3x3 grid game where players alternate placing X and O to get three in a row",
                    "first_seen_index": 0,
                    "last_seen_index": 0
                },
                {
                    "id": "game-rules",
                    "label": "Game Rules",
                    "type": "concept",
                    "aliases": ["Rules", "Mechanics"],
                    "summary": "Players alternate turns on 3x3 grid, win by getting 3 symbols in a row",
                    "first_seen_index": 0,
                    "last_seen_index": 0
                },
                {
                    "id": "strategy",
                    "label": "Game Strategy",
                    "type": "concept",
                    "aliases": ["Tactics", "Optimal Play"],
                    "summary": "Strategic concepts like center control, corner positioning, and blocking",
                    "first_seen_index": 0,
                    "last_seen_index": 0
                },
                {
                    "id": "implementation",
                    "label": "Implementation",
                    "type": "technical",
                    "aliases": ["Code", "Programming"],
                    "summary": "Technical aspects including game state, turn management, and UI design",
                    "first_seen_index": 0,
                    "last_seen_index": 0
                },
                {
                    "id": "ai-algorithms",
                    "label": "AI Algorithms",
                    "type": "technical",
                    "aliases": ["Minimax", "AI"],
                    "summary": "Algorithms for computer players including minimax and heuristic evaluation",
                    "first_seen_index": 0,
                    "last_seen_index": 0
                },
                {
                    "id": "win-conditions",
                    "label": "Win Conditions",
                    "type": "concept",
                    "aliases": ["Victory", "End Game"],
                    "summary": "Three in a row horizontally, vertically, or diagonally wins the game",
                    "first_seen_index": 0,
                    "last_seen_index": 0
                }
            ],
            "edges": [
                {
                    "id": "edge-1",
                    "from_concept_id": "game-core",
                    "to_concept_id": "game-rules",
                    "relation": "defines",
                    "introduced_index": 0
                },
                {
                    "id": "edge-2",
                    "from_concept_id": "game-core",
                    "to_concept_id": "strategy",
                    "relation": "involves",
                    "introduced_index": 0
                },
                {
                    "id": "edge-3",
                    "from_concept_id": "game-core",
                    "to_concept_id": "implementation",
                    "relation": "requires",
                    "introduced_index": 0
                },
                {
                    "id": "edge-4",
                    "from_concept_id": "game-core",
                    "to_concept_id": "ai-algorithms",
                    "relation": "can_use",
                    "introduced_index": 0
                },
                {
                    "id": "edge-5",
                    "from_concept_id": "game-rules",
                    "to_concept_id": "win-conditions",
                    "relation": "includes",
                    "introduced_index": 0
                }
            ],
            "meta": {
                "last_processed_index": 0,
                "graph_version": "1.0",
                "updated_ts": time.time()
            }
        }
        
        return ConceptGraphResponse(**hardcoded_graph)

    @router.get("/sessions/{session_id}/goal", response_model=GoalResponse)
    async def get_goal(session_id: str):
        if not chat.get_state(session_id):
            raise HTTPException(status_code=404, detail="session not found")
        
        # Simulate goal generation time
        import asyncio
        await asyncio.sleep(0.5)
        
        # Hardcoded goal for tic tac toe learning session
        goal_text = "Master the fundamentals of tic tac toe game development by understanding game rules, strategic concepts, implementation patterns, and AI algorithms. Build a comprehensive knowledge base covering both theoretical concepts and practical programming approaches for creating an engaging tic tac toe game experience."
        
        return GoalResponse(goal=goal_text)

    return router
