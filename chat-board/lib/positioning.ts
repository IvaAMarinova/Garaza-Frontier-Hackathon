import type { Node, Position } from "./types"

export function calculateNewNodePosition(
  parent: Node,
  siblings: Node[],
  allNodes: Node[]
): Position {
  // Node dimensions (approximate visual size in percentage units)
  const NODE_WIDTH = 12 // ~180px at typical screen size
  const NODE_HEIGHT = 8 // ~120px at typical screen size
  const MIN_DISTANCE = Math.max(NODE_WIDTH, NODE_HEIGHT) + 3 // Extra padding

  const baseRadius = 15 // Start closer to parent
  const maxAttempts = 24 // More attempts for better placement

  // Try multiple radius levels if needed
  for (let radiusLevel = 0; radiusLevel < 3; radiusLevel++) {
    const currentRadius = baseRadius + radiusLevel * 12

    // Try positions in a circle around parent at current radius
    for (let i = 0; i < maxAttempts; i++) {
      const angle = (360 / maxAttempts) * i + ((siblings.length * 15) % 360)
      const rad = (angle * Math.PI) / 180

      const candidate: Position = {
        x: Math.max(8, Math.min(92, parent.x + Math.cos(rad) * currentRadius)),
        y: Math.max(8, Math.min(92, parent.y + Math.sin(rad) * currentRadius)),
      }

      // Check if position overlaps with existing nodes
      const hasOverlap = allNodes.some((node) => {
        const distance = Math.sqrt(
          Math.pow(node.x - candidate.x, 2) + Math.pow(node.y - candidate.y, 2)
        )
        return distance < MIN_DISTANCE
      })

      if (!hasOverlap) {
        return candidate
      }
    }
  }

  // Final fallback: place at a safe distance with random offset
  const fallbackAngle = (siblings.length * 45 + Math.random() * 90) % 360
  const rad = (fallbackAngle * Math.PI) / 180
  const fallbackRadius = baseRadius + 20

  return {
    x: Math.max(8, Math.min(92, parent.x + Math.cos(rad) * fallbackRadius)),
    y: Math.max(8, Math.min(92, parent.y + Math.sin(rad) * fallbackRadius)),
  }
}

export function getNodeFamily(nodeId: string, nodes: Node[]): string[] {
  const node = nodes.find((n) => n.id === nodeId)
  if (!node) return []

  // Get all siblings (nodes with same parent)
  return nodes.filter((n) => n.parentId === node.parentId).map((n) => n.id)
}
