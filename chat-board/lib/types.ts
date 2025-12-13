export type NodeContent = {
  header?: string
  text: string
  codeBlock?: {
    language: string
    code: string
  }
}

export type Node = {
  id: string
  content: NodeContent
  x: number
  y: number
  color: string
  parentId: string | null
}

export type Position = {
  x: number
  y: number
}
