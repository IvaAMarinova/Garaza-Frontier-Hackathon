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
}

export interface Position {
  x: number
  y: number
}
