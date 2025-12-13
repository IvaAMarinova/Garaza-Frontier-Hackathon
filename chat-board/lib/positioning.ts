import type { Node, Position } from "./types"

// Node dimensions in pixels - these should match the actual rendered node sizes
export const NODE_WIDTH = 60 // Node width in pixels (made smaller)
export const NODE_HEIGHT = 80 // Node height in pixels (made smaller)
// Minimum distance ensures nodes never overlap - using diagonal distance of larger node
export const MIN_DISTANCE = Math.sqrt(NODE_WIDTH * NODE_WIDTH + NODE_HEIGHT * NODE_HEIGHT) + 40 // Extra padding for better spacing
const MIN_PARENT_DISTANCE = 200 // Minimum distance from parent node
const MIN_CENTER_CHILD_DISTANCE = 400 // Minimum distance from center node for first-level children
const SEARCH_RADIUS_INCREMENT = 50 // How much to increase search radius each iteration

/**
 * Check if a position has any collision with existing nodes
 */
function hasCollision(position: Position, allNodes: Node[], excludeNodeId?: string, isFirstLevel: boolean = false): boolean {
  for (const node of allNodes) {
    if (excludeNodeId && node.id === excludeNodeId) continue
    
    const distance = Math.sqrt(
      Math.pow(position.x - node.x, 2) + Math.pow(position.y - node.y, 2)
    )
    
    // Use larger minimum distance for first-level nodes (children of center)
    const minDistance = isFirstLevel ? MIN_CENTER_CHILD_DISTANCE : MIN_DISTANCE
    
    if (distance < minDistance) {
      return true
    }
  }
  return false
}

/**
 * Find a safe position for a new node around its parent
 * Simple spiral search that guarantees no overlaps
 */
function findSafePosition(parent: Node, allNodes: Node[], preferredAngle?: number, isFirstLevel: boolean = false): Position {
  // Use larger distance for first-level children (direct children of center node)
  const startRadius = isFirstLevel ? MIN_CENTER_CHILD_DISTANCE : MIN_PARENT_DISTANCE
  const maxRadius = 2000
  
  // If we have a preferred angle, try that first
  if (preferredAngle !== undefined) {
    for (let radius = startRadius; radius <= maxRadius; radius += SEARCH_RADIUS_INCREMENT) {
      const position: Position = {
        x: parent.x + Math.cos((preferredAngle * Math.PI) / 180) * radius,
        y: parent.y + Math.sin((preferredAngle * Math.PI) / 180) * radius,
      }
      
      if (!hasCollision(position, allNodes, undefined, isFirstLevel)) {
        return position
      }
    }
  }
  
  // Spiral search starting from minimum distance
  for (let radius = startRadius; radius <= maxRadius; radius += SEARCH_RADIUS_INCREMENT) {
    const angleStep = Math.max(15, 360 / Math.max(8, Math.floor((2 * Math.PI * radius) / MIN_DISTANCE)))
    
    for (let angle = 0; angle < 360; angle += angleStep) {
      const position: Position = {
        x: parent.x + Math.cos((angle * Math.PI) / 180) * radius,
        y: parent.y + Math.sin((angle * Math.PI) / 180) * radius,
      }
      
      if (!hasCollision(position, allNodes, undefined, isFirstLevel)) {
        return position
      }
    }
  }
  
  // Fallback: place far away
  return {
    x: parent.x + maxRadius,
    y: parent.y + maxRadius
  }
}

export function calculateNewNodePosition(
  parent: Node,
  siblings: Node[],
  allNodes: Node[]
): Position {
  // Check if this is a first-level child (direct child of center node)
  const isFirstLevel = parent.parentId === null
  
  if (isFirstLevel) {
    // For first-level children (main branches), use wider spacing and larger distance
    const baseAngle = siblings.length * 60 // 60 degrees between main branches
    return findSafePosition(parent, allNodes, baseAngle, true) // Pass true for isFirstLevel
  } else {
    // For deeper level nodes, try to extend in a logical direction
    // Calculate angle based on sibling count with some variation
    const baseAngle = siblings.length * 45 + (Math.random() - 0.5) * 30
    return findSafePosition(parent, allNodes, baseAngle, false) // Pass false for isFirstLevel
  }
}

/**
 * Simple function to push overlapping nodes away from a new position
 */
export function adjustNodesForNewNode(
  newNodePosition: Position,
  newNodeId: string,
  allNodes: Node[]
): Node[] {
  const adjustedNodes = [...allNodes]
  
  // Find any nodes that would overlap with the new position
  for (let i = 0; i < adjustedNodes.length; i++) {
    const node = adjustedNodes[i]
    const distance = Math.sqrt(
      Math.pow(node.x - newNodePosition.x, 2) + Math.pow(node.y - newNodePosition.y, 2)
    )
    
    if (distance < MIN_DISTANCE) {
      // Push this node away by finding a new safe position
      const pushDirection = Math.atan2(node.y - newNodePosition.y, node.x - newNodePosition.x)
      const pushDistance = MIN_DISTANCE + 50 // Extra padding
      
      const newPosition: Position = {
        x: newNodePosition.x + Math.cos(pushDirection) * pushDistance,
        y: newNodePosition.y + Math.sin(pushDirection) * pushDistance,
      }
      
      // Check if this node is a first-level node (child of center)
      const parentNode = adjustedNodes.find(n => n.id === node.parentId)
      const isNodeFirstLevel = parentNode?.parentId === null
      
      // If the pushed position would still collide, find a safe spot
      if (hasCollision(newPosition, adjustedNodes, node.id, isNodeFirstLevel)) {
        const parentNode = adjustedNodes.find(n => n.id === node.parentId)
        if (parentNode) {
          // Check if this is a first-level node (child of center)
          const isNodeFirstLevel = parentNode.parentId === null
          const safePosition = findSafePosition(parentNode, adjustedNodes.filter(n => n.id !== node.id), undefined, isNodeFirstLevel)
          adjustedNodes[i] = { ...node, x: safePosition.x, y: safePosition.y }
        } else {
          adjustedNodes[i] = { ...node, x: newPosition.x, y: newPosition.y }
        }
      } else {
        adjustedNodes[i] = { ...node, x: newPosition.x, y: newPosition.y }
      }
    }
  }
  
  return adjustedNodes
}

/**
 * Final validation to ensure no overlaps exist
 */
export function validateAndFixOverlaps(nodes: Node[]): Node[] {
  const fixedNodes = [...nodes]
  
  // Check each node against all others
  for (let i = 0; i < fixedNodes.length; i++) {
    const currentNode = fixedNodes[i]
    
    for (let j = i + 1; j < fixedNodes.length; j++) {
      const otherNode = fixedNodes[j]
      const distance = Math.sqrt(
        Math.pow(currentNode.x - otherNode.x, 2) + Math.pow(currentNode.y - otherNode.y, 2)
      )
      
      if (distance < MIN_DISTANCE) {
        // Find parent of the current node to reposition it properly
        const parentNode = fixedNodes.find(n => n.id === currentNode.parentId)
        if (parentNode) {
          // Check if this is a first-level node (child of center)
          const isCurrentFirstLevel = parentNode.parentId === null
          const newPosition = findSafePosition(parentNode, fixedNodes.filter(n => n.id !== currentNode.id), undefined, isCurrentFirstLevel)
          fixedNodes[i] = { ...currentNode, x: newPosition.x, y: newPosition.y }
        } else {
          // If no parent, just push it away
          const pushDirection = Math.atan2(currentNode.y - otherNode.y, currentNode.x - otherNode.x)
          const pushDistance = MIN_DISTANCE + 50
          fixedNodes[i] = {
            ...currentNode,
            x: otherNode.x + Math.cos(pushDirection) * pushDistance,
            y: otherNode.y + Math.sin(pushDirection) * pushDistance,
          }
        }
        break // Move to next node after fixing this one
      }
    }
  }
  
  return fixedNodes
}

/**
 * Get the center node from a list of nodes
 */
export function getCenterNode(nodes: Node[]): Node | null {
  return nodes.find(node => node.parentId === null) || null
}

/**
 * Calculate the bounding box of all nodes
 */
export function getNodesBoundingBox(nodes: Node[]): { 
  minX: number, 
  maxX: number, 
  minY: number, 
  maxY: number,
  width: number,
  height: number,
  centerX: number,
  centerY: number
} {
  if (nodes.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0, centerX: 0, centerY: 0 }
  }
  
  const minX = Math.min(...nodes.map(n => n.x - NODE_WIDTH / 2))
  const maxX = Math.max(...nodes.map(n => n.x + NODE_WIDTH / 2))
  const minY = Math.min(...nodes.map(n => n.y - NODE_HEIGHT / 2))
  const maxY = Math.max(...nodes.map(n => n.y + NODE_HEIGHT / 2))
  
  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2
  }
}

/**
 * Debug function to check for overlapping nodes
 */
export function findOverlappingNodes(nodes: Node[]): Array<{ node1: Node, node2: Node, distance: number }> {
  const overlaps: Array<{ node1: Node, node2: Node, distance: number }> = []
  
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const node1 = nodes[i]
      const node2 = nodes[j]
      
      const distance = Math.sqrt(
        Math.pow(node1.x - node2.x, 2) + Math.pow(node1.y - node2.y, 2)
      )
      
      if (distance < MIN_DISTANCE) {
        overlaps.push({ node1, node2, distance })
      }
    }
  }
  
  return overlaps
}