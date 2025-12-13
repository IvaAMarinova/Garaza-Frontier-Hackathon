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
