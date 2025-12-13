import type { Node, Position } from "./types"

export function calculateNewNodePosition(parent: Node, siblings: Node[], allNodes: Node[]): Position {
  const MIN_DISTANCE = 20
  const RADIUS = 25

  // Try positions in a circle around parent
  const attempts = 12
  for (let i = 0; i < attempts; i++) {
    const angle = (360 / attempts) * i + ((siblings.length * 30) % 360)
    const rad = (angle * Math.PI) / 180

    const candidate: Position = {
      x: parent.x + Math.cos(rad) * RADIUS,
      y: parent.y + Math.sin(rad) * RADIUS,
    }

    // Check if position overlaps with existing nodes
    const hasOverlap = allNodes.some((node) => {
      const distance = Math.sqrt(Math.pow(node.x - candidate.x, 2) + Math.pow(node.y - candidate.y, 2))
      return distance < MIN_DISTANCE
    })

    if (!hasOverlap) {
      return candidate
    }
  }

  // Fallback: place further away
  const angle = (siblings.length * 60) % 360
  const rad = (angle * Math.PI) / 180

  return {
    x: parent.x + Math.cos(rad) * (RADIUS + 10),
    y: parent.y + Math.sin(rad) * (RADIUS + 10),
  }
}

export function getNodeFamily(nodeId: string, nodes: Node[]): string[] {
  const node = nodes.find((n) => n.id === nodeId)
  if (!node) return []

  // Get all siblings (nodes with same parent)
  return nodes.filter((n) => n.parentId === node.parentId).map((n) => n.id)
}
