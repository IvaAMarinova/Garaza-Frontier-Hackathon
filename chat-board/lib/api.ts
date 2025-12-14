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
    weight: number
    expansions: string[]
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
    weight: number
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
  doc_links: Record<string, string>
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

export interface SimpleGoalResponse {
  goal: string
}

export interface ConceptExpandRequest {
  expansion?: string
  weight?: number
  strength?: number
  auto_refine?: boolean
}

export interface ConceptExpandResponse {
  concept: {
    id: string
    label: string
    type: string
    aliases: string[]
    summary: string
    first_seen_index: number
    last_seen_index: number
    weight: number
    expansions: string[]
  }
  new_children: Array<{
    id: string
    label: string
    type: string
    aliases: string[]
    summary: string
    first_seen_index: number
    last_seen_index: number
    weight: number
    expansions: string[]
  }>
  new_edges: Array<{
    id: string
    from_concept_id: string
    to_concept_id: string
    relation: string
    introduced_index: number
    evidence_msg_id?: string
    evidence_snippet?: string
    last_referenced_index?: number
  }>
}

export interface CreateGoalRequest {
  force?: boolean
}

export interface GoalInteractionEvent {
  concept_id: string
  event: 'expand' | 'revisit'
  strength: number
}

export interface GoalInteractionsRequest {
  events: GoalInteractionEvent[]
  auto_refine?: boolean
}

export async function createSession(): Promise<CreateSessionResponse> {
  const url = `${API_BASE_URL}/sessions`
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

export async function getGoal(sessionId: string, createIfMissing: boolean = false): Promise<GoalResponse> {
  const url = createIfMissing 
    ? `${API_BASE_URL}/sessions/${sessionId}/goal?create_if_missing=true`
    : `${API_BASE_URL}/sessions/${sessionId}/goal`
    
  const response = await fetch(url, {
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

export async function createGoal(sessionId: string, request: CreateGoalRequest = {}): Promise<GoalResponse> {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/goal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(`Failed to create goal: ${response.statusText}`)
  }

  return response.json()
}

export async function expandConcept(sessionId: string, conceptId: string, request: ConceptExpandRequest): Promise<ConceptExpandResponse> {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/concept-graph/${conceptId}/expand`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(`Failed to expand concept: ${response.statusText}`)
  }

  return response.json()
}



export async function initializeTicTacToeSession(prompt?: string): Promise<{ sessionId: string; conceptGraph: ConceptGraphResponse }> {
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
}

export interface ConceptGraphNode extends NodeContent {
  conceptId: string
  level: number
  parentConceptId?: string
  weight?: number
  completed?: boolean
}

export function convertConceptGraphToNodes(conceptGraph: ConceptGraphResponse): { 
  centerNode: ConceptGraphNode; 
  childNodes: Array<ConceptGraphNode> 
} {
  const { concepts, edges } = conceptGraph
  
  if (concepts.length === 0) {
    return {
      centerNode: { text: "Your future project", header: "Project Overview", conceptId: "fallback", level: 0 },
      childNodes: []
    }
  }

  // Find the intent node (central node with id starting with "intent")
  const intentConcept = concepts.find(concept => concept.id.startsWith("intent"))
  
  if (!intentConcept) {
    // Fallback to most connected concept if no intent node found
    const connectionCounts = new Map<string, number>()
    
    edges.forEach(edge => {
      connectionCounts.set(edge.from_concept_id, (connectionCounts.get(edge.from_concept_id) || 0) + 1)
      connectionCounts.set(edge.to_concept_id, (connectionCounts.get(edge.to_concept_id) || 0) + 1)
    })

    const sortedConcepts = concepts.sort((a, b) => {
      const aConnections = connectionCounts.get(a.id) || 0
      const bConnections = connectionCounts.get(b.id) || 0
      return bConnections - aConnections
    })

    const centerConcept = sortedConcepts[0]
    const centerNode: ConceptGraphNode = {
      text: centerConcept.summary,
      header: centerConcept.label,
      conceptId: centerConcept.id,
      level: 0,
      weight: centerConcept.weight,
      completed: centerConcept.weight >= 10
    }

    const childNodes: Array<ConceptGraphNode> = concepts
      .filter(concept => concept.id !== centerConcept.id)
      .slice(0, 8)
      .map(concept => ({
        text: concept.summary,
        header: concept.label,
        conceptId: concept.id,
        level: 1,
        weight: concept.weight,
        completed: concept.weight >= 10
      }))

    return { centerNode, childNodes }
  }

  const centerNode: ConceptGraphNode = {
    text: intentConcept.summary,
    header: intentConcept.label,
    conceptId: intentConcept.id,
    level: 0,
    weight: intentConcept.weight,
    completed: intentConcept.weight >= 10
  }

  const parentChildMap = new Map<string, string>()
  
  edges.forEach(edge => {
    parentChildMap.set(edge.to_concept_id, edge.from_concept_id)
  })

  const resultNodes: Array<ConceptGraphNode> = []
  
  function addNodeAndChildren(conceptId: string, level: number, parentConceptId?: string): void {
    const concept = concepts.find(c => c.id === conceptId)
    if (!concept) return
    
    if (conceptId !== intentConcept!.id) {
      resultNodes.push({
        text: concept.summary,
        header: concept.label,
        conceptId: concept.id,
        level,
        parentConceptId,
        weight: concept.weight,
        completed: concept.weight >= 10
      })
    }
    
    const children: string[] = []
    parentChildMap.forEach((parentId, childId) => {
      if (parentId === conceptId) {
        children.push(childId)
      }
    })
    
    children.forEach(childId => {
      addNodeAndChildren(childId, level + 1, conceptId)
    })
  }
  
  addNodeAndChildren(intentConcept!.id, 0)
  const childNodes = resultNodes.slice(0, 8)

  return { centerNode, childNodes }
}