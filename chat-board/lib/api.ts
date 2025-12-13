import type { NodeContent } from './types'

const API_BASE_URL = 'http://localhost:8000/v1/chat'

export interface CreateSessionResponse {
  session_id: string
}

export interface SessionState {
  session_id: string
  created_ts: number
  messages: Array<{
    id: string
    role: 'system' | 'user' | 'assistant'
    content: string
    ts: number
  }>
}

export interface GenerateRequest {
  content: string
  system_prompt?: string
  persist?: boolean
  model?: string
}

export interface GenerateResponse {
  content: string
}

export interface ConceptGraphResponse {
  concepts: Array<{
    id: string
    label: string
    type: string
    aliases: string[]
    summary: string
    first_seen_index: number
    last_seen_index: number
  }>
  edges: Array<{
    id: string
    from_concept_id: string
    to_concept_id: string
    relation: string
    introduced_index: number
    evidence_msg_id?: string
    evidence_snippet?: string
    last_referenced_index?: number
  }>
  meta: {
    last_processed_index: number
    graph_version: string
    updated_ts: number
  }
}

export interface OverlayModel {
  id: string
  concept_id: string
  depth: number
  content_markdown: string
  doc_links: string[]
}

export interface FocusModel {
  interest_score: number
  confusion_score: number
  mastery_score: number
  unknownness: number
}

export interface GoalMetaModel {
  global_answer_depth: number
  last_updated_ts: number
  last_refined_concepts: string[]
}

export interface GoalResponse {
  id: string
  goal_statement: string
  answer_markdown: string
  overlays: OverlayModel[]
  focus: Record<string, FocusModel>
  meta: GoalMetaModel
}



export async function createSession(): Promise<CreateSessionResponse> {
  const url = `${API_BASE_URL}/sessions`
  console.log('Creating session at', url)
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to create session: ${response.statusText}`)
  }

  return response.json()
}

export async function getSessionState(sessionId: string): Promise<SessionState> {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to get session state: ${response.statusText}`)
  }

  return response.json()
}

export async function generateContent(sessionId: string, request: GenerateRequest): Promise<GenerateResponse> {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(`Failed to generate content: ${response.statusText}`)
  }

  return response.json()
}

export async function buildConceptGraph(sessionId: string, mode: 'full' | 'incremental' = 'incremental'): Promise<ConceptGraphResponse> {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/concept-graph/build`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mode }),
  })

  if (!response.ok) {
    throw new Error(`Failed to build concept graph: ${response.statusText}`)
  }

  return response.json()
}

export async function getConceptGraph(sessionId: string): Promise<ConceptGraphResponse> {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/concept-graph`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to get concept graph: ${response.statusText}`)
  }

  return response.json()
}

export async function getGoal(sessionId: string): Promise<GoalResponse> {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/goal`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to get goal: ${response.statusText}`)
  }

  return response.json()
}

export async function initializeTicTacToeSession(prompt?: string): Promise<{ sessionId: string; conceptGraph: ConceptGraphResponse }> {
  try {
    // Create a new session
    const { session_id } = await createSession()
    
    // Use provided prompt or default tic tac toe prompt
    const ticTacToePrompt = prompt || `Let's create a tic tac toe game. I want to understand the game mechanics, rules, strategies, and implementation details. 
    
    Key concepts to explore:
    - Game rules and winning conditions
    - Player strategies (offensive and defensive)
    - Game state representation
    - AI algorithms for computer players
    - User interface design
    - Game flow and turn management`

    await generateContent(session_id, {
      content: ticTacToePrompt,
      system_prompt: "You are a helpful assistant that explains game concepts and programming topics in detail.",
      persist: true,
      model: "gpt-4o-mini"
    })

    // Build the concept graph
    const conceptGraph = await buildConceptGraph(session_id, 'full')
    
    return { sessionId: session_id, conceptGraph }
  } catch (error) {
    console.error('Failed to initialize tic tac toe session:', error)
    throw error
  }
}

export function convertConceptGraphToNodes(conceptGraph: ConceptGraphResponse): { 
  centerNode: NodeContent & { conceptId: string }; 
  childNodes: Array<NodeContent & { conceptId: string }> 
} {
  const { concepts, edges } = conceptGraph
  
  if (concepts.length === 0) {
    return {
      centerNode: { text: "Tic Tac Toe Game", header: "Game Concept", conceptId: "fallback" },
      childNodes: []
    }
  }

  // Find the most central concept (one with most connections)
  const connectionCounts = new Map<string, number>()
  
  edges.forEach(edge => {
    connectionCounts.set(edge.from_concept_id, (connectionCounts.get(edge.from_concept_id) || 0) + 1)
    connectionCounts.set(edge.to_concept_id, (connectionCounts.get(edge.to_concept_id) || 0) + 1)
  })

  // Sort concepts by connection count and relevance
  const sortedConcepts = concepts.sort((a, b) => {
    const aConnections = connectionCounts.get(a.id) || 0
    const bConnections = connectionCounts.get(b.id) || 0
    return bConnections - aConnections
  })

  const centerConcept = sortedConcepts[0]
  const centerNode: NodeContent & { conceptId: string } = {
    text: centerConcept.summary,
    header: centerConcept.label,
    conceptId: centerConcept.id
  }

  // Find direct children of the center concept
  const childConceptIds = edges
    .filter(edge => edge.from_concept_id === centerConcept.id)
    .map(edge => edge.to_concept_id)

  const childNodes: Array<NodeContent & { conceptId: string }> = childConceptIds
    .map(id => concepts.find(c => c.id === id))
    .filter(Boolean)
    .slice(0, 5) // Limit to first 5 children
    .map(concept => ({
      text: concept!.summary,
      header: concept!.label,
      conceptId: concept!.id
    }))

  return { centerNode, childNodes }
}