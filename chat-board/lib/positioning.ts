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

  // Check if this is a first-level child (direct child of center node)
  const isFirstLevel = parent.parentId === null

  if (isFirstLevel) {
    // For first-level children, use wider spacing to create distinct branches
    const BRANCH_RADIUS = 25 // Larger radius for main branches
    const BRANCH_ANGLE_SPACING = 60 // Degrees between main branches
    const MIN_BRANCH_DISTANCE = 20 // Minimum distance between first-level nodes

    // Calculate angle for this branch based on existing siblings
    const baseAngle = siblings.length * BRANCH_ANGLE_SPACING
    const maxAttempts = 12

    // Try multiple radius levels for first-level nodes
    for (let radiusLevel = 0; radiusLevel < 3; radiusLevel++) {
      const currentRadius = BRANCH_RADIUS + radiusLevel * 8

      for (let i = 0; i < maxAttempts; i++) {
        const angle = baseAngle + i * 30 // Try different angles
        const rad = (angle * Math.PI) / 180

        const candidate: Position = {
          x: Math.max(
            8,
            Math.min(92, parent.x + Math.cos(rad) * currentRadius)
          ),
          y: Math.max(
            8,
            Math.min(92, parent.y + Math.sin(rad) * currentRadius)
          ),
        }

        // Check overlap with stricter distance for first-level nodes
        const hasOverlap = allNodes.some((node) => {
          const distance = Math.sqrt(
            Math.pow(node.x - candidate.x, 2) +
              Math.pow(node.y - candidate.y, 2)
          )
          // Use larger minimum distance for first-level nodes
          const minDist =
            node.parentId === parent.id ? MIN_BRANCH_DISTANCE : MIN_DISTANCE
          return distance < minDist
        })

        if (!hasOverlap) {
          return candidate
        }
      }
    }

    // Fallback for first-level: ensure wide spacing
    const fallbackAngle =
      siblings.length * BRANCH_ANGLE_SPACING + Math.random() * 30
    const rad = (fallbackAngle * Math.PI) / 180
    const fallbackRadius = BRANCH_RADIUS + 15

    return {
      x: Math.max(8, Math.min(92, parent.x + Math.cos(rad) * fallbackRadius)),
      y: Math.max(8, Math.min(92, parent.y + Math.sin(rad) * fallbackRadius)),
    }
  } else {
    // For deeper level nodes, use tighter spacing and stay close to parent
    const baseRadius = 15 // Closer to parent for sub-branches
    const maxAttempts = 24

    // Try multiple radius levels if needed
    for (let radiusLevel = 0; radiusLevel < 3; radiusLevel++) {
      const currentRadius = baseRadius + radiusLevel * 10

      // Try positions in a circle around parent at current radius
      for (let i = 0; i < maxAttempts; i++) {
        const angle = (360 / maxAttempts) * i + ((siblings.length * 15) % 360)
        const rad = (angle * Math.PI) / 180

        const candidate: Position = {
          x: Math.max(
            8,
            Math.min(92, parent.x + Math.cos(rad) * currentRadius)
          ),
          y: Math.max(
            8,
            Math.min(92, parent.y + Math.sin(rad) * currentRadius)
          ),
        }

        // Check if position overlaps with existing nodes
        const hasOverlap = allNodes.some((node) => {
          const distance = Math.sqrt(
            Math.pow(node.x - candidate.x, 2) +
              Math.pow(node.y - candidate.y, 2)
          )
          return distance < MIN_DISTANCE
        })

        if (!hasOverlap) {
          return candidate
        }
      }
    }

    // Final fallback for deeper levels
    const fallbackAngle = (siblings.length * 45 + Math.random() * 90) % 360
    const rad = (fallbackAngle * Math.PI) / 180
    const fallbackRadius = baseRadius + 15

    return {
      x: Math.max(8, Math.min(92, parent.x + Math.cos(rad) * fallbackRadius)),
      y: Math.max(8, Math.min(92, parent.y + Math.sin(rad) * fallbackRadius)),
    }
  }
}

export function getNodeFamily(nodeId: string, nodes: Node[]): string[] {
  const node = nodes.find((n) => n.id === nodeId)
  if (!node) return []

  // Get all siblings (nodes with same parent)
  return nodes.filter((n) => n.parentId === node.parentId).map((n) => n.id)
}
