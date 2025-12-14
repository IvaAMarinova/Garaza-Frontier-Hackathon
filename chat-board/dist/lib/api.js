const API_BASE_URL = 'http://localhost:8000/v1/chat';
export async function createSession() {
    const url = `${API_BASE_URL}/sessions`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`);
    }
    return response.json();
}
export async function getSessionState(sessionId) {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to get session state: ${response.statusText}`);
    }
    return response.json();
}
export async function generateContent(sessionId, request) {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });
    if (!response.ok) {
        throw new Error(`Failed to generate content: ${response.statusText}`);
    }
    return response.json();
}
export async function buildConceptGraph(sessionId, mode = 'incremental') {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/concept-graph/build`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode }),
    });
    if (!response.ok) {
        throw new Error(`Failed to build concept graph: ${response.statusText}`);
    }
    return response.json();
}
export async function getConceptGraph(sessionId) {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/concept-graph`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to get concept graph: ${response.statusText}`);
    }
    return response.json();
}
export async function getGoal(sessionId, createIfMissing = false) {
    const url = createIfMissing
        ? `${API_BASE_URL}/sessions/${sessionId}/goal?create_if_missing=true`
        : `${API_BASE_URL}/sessions/${sessionId}/goal`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to get goal: ${response.statusText}`);
    }
    return response.json();
}
export async function createGoal(sessionId, request = {}) {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/goal`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });
    if (!response.ok) {
        throw new Error(`Failed to create goal: ${response.statusText}`);
    }
    return response.json();
}
export async function expandConcept(sessionId, conceptId, request) {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/concept-graph/${conceptId}/expand`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });
    if (!response.ok) {
        throw new Error(`Failed to expand concept: ${response.statusText}`);
    }
    return response.json();
}
export async function recordGoalInteractions(sessionId, request) {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/goal/interactions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });
    if (!response.ok) {
        throw new Error(`Failed to record goal interactions: ${response.statusText}`);
    }
    return response.json();
}
export async function initializeTicTacToeSession(prompt) {
    // Create a new session
    const { session_id } = await createSession();
    // Use provided prompt or default tic tac toe prompt
    const ticTacToePrompt = prompt || `Let's create a tic tac toe game. I want to understand the game mechanics, rules, strategies, and implementation details. 
  
  Key concepts to explore:
  - Game rules and winning conditions
  - Player strategies (offensive and defensive)
  - Game state representation
  - AI algorithms for computer players
  - User interface design
  - Game flow and turn management`;
    await generateContent(session_id, {
        content: ticTacToePrompt,
        system_prompt: "You are a helpful assistant that explains game concepts and programming topics in detail.",
        persist: true,
        model: "gpt-4o-mini"
    });
    // Build the concept graph
    const conceptGraph = await buildConceptGraph(session_id, 'full');
    return { sessionId: session_id, conceptGraph };
}
export function convertConceptGraphToNodes(conceptGraph) {
    const { concepts, edges } = conceptGraph;
    if (concepts.length === 0) {
        return {
            centerNode: { text: "Tic Tac Toe Game", header: "Game Concept", conceptId: "fallback" },
            childNodes: []
        };
    }
    // Find the most central concept (one with most connections)
    const connectionCounts = new Map();
    edges.forEach(edge => {
        connectionCounts.set(edge.from_concept_id, (connectionCounts.get(edge.from_concept_id) || 0) + 1);
        connectionCounts.set(edge.to_concept_id, (connectionCounts.get(edge.to_concept_id) || 0) + 1);
    });
    // Sort concepts by connection count and relevance
    const sortedConcepts = concepts.sort((a, b) => {
        const aConnections = connectionCounts.get(a.id) || 0;
        const bConnections = connectionCounts.get(b.id) || 0;
        return bConnections - aConnections;
    });
    const centerConcept = sortedConcepts[0];
    const centerNode = {
        text: centerConcept.summary,
        header: centerConcept.label,
        conceptId: centerConcept.id
    };
    // Simple approach: show all other concepts as children of the center
    // This works better for complex interconnected graphs
    const allChildIds = concepts
        .filter(concept => concept.id !== centerConcept.id)
        .map(concept => concept.id);
    const childNodes = allChildIds
        .map(id => concepts.find(c => c.id === id))
        .filter(Boolean)
        .slice(0, 8) // Show up to 8 connected nodes
        .map(concept => ({
        text: concept.summary,
        header: concept.label,
        conceptId: concept.id
    }));
    return { centerNode, childNodes };
}
