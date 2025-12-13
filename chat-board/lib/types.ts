export interface NodeContent {
  header?: string
  text: string
  codeBlock?: {
    language: string
    code: string
  }
}

export interface Node {
  id: string
  content: NodeContent
  x: number
  y: number
  color: string
  parentId: string | null
  conceptId?: string
}

export interface Position {
  x: number
  y: number
}

export interface NodeBounds {
  center: Position
  topLeft: Position
  topRight: Position
  bottomLeft: Position
  bottomRight: Position
  width: number
  height: number
}

export interface Goal {
  goal_statement: string
}

export interface FullGoal {
  id: string
  goal_statement: string
  answer_markdown: string
  overlays: Array<{
    id: string
    concept_id: string
    depth: number
    content_markdown: string
    doc_links: string[]
  }>
  focus: Record<string, {
    interest_score: number
    confusion_score: number
    mastery_score: number
    unknownness: number
  }>
  meta: {
    global_answer_depth: number
    last_updated_ts: number
    last_refined_concepts: string[]
  }
}
