import type { Node, Position } from "./types"

// Node dimensions in pixels - these should match the actual rendered node sizes
export const NODE_WIDTH = 180 // Node width in pixels
export const NODE_HEIGHT = 120 // Node height in pixels
// Minimum distance ensures nodes never overlap - using diagonal distance of larger node
export const MIN_DISTANCE = Math.sqrt(NODE_WIDTH * NODE_WIDTH + NODE_HEIGHT * NODE_HEIGHT) + 30 // Extra padding for better spacing
const MIN_TOPIC_DISTANCE = 400 // Minimum distance between different topics in pixels
// const TOPIC_CLUSTER_RADIUS = 300 // Maximum distance nodes in same topic should be from topic root in pixels

/**
 * Find the topic root (first-level node) for a given node
 * A topic is identified by the first-level ancestor (direct child of center)
 */
function getTopicRoot(node: Node, allNodes: Node[]): Node | null {
  if (node.parentId === null) {
    // This is the center node, it has no topic
    return null
  }

  // If the node's parent is the center node, then this node IS the topic root
  const parent = allNodes.find((n) => n.id === node.parentId)
  if (parent?.parentId === null) {
    return node
  }

  // Otherwise, traverse up to find the first-level ancestor
  let current: Node | undefined = node
  while (current) {
    const currentParent = allNodes.find((n) => n.id === current!.parentId)
    if (!currentParent) break
    
    if (currentParent.parentId === null) {
      // currentParent is the center node, so current is the topic root
      return current
    }
    current = currentParent
  }
  return null
}

/**
 * Get all nodes that belong to the same topic
 */
function getTopicNodes(topicRoot: Node | null, allNodes: Node[]): Node[] {
  if (!topicRoot) {
    // Center node has no topic
    return []
  }
  // Get all descendants of the topic root
  const topicNodes: Node[] = [topicRoot]
  const queue = [topicRoot.id]

  while (queue.length > 0) {
    const currentId = queue.shift()!
    const children = allNodes.filter((n) => n.parentId === currentId)
    topicNodes.push(...children)
    queue.push(...children.map((n) => n.id))
  }

  return topicNodes
}

/**
 * Calculate the centroid of a topic (average position of all nodes in the topic)
 */
function getTopicCentroid(topicNodes: Node[]): Position | null {
  if (topicNodes.length === 0) return null

  const sumX = topicNodes.reduce((sum, node) => sum + node.x, 0)
  const sumY = topicNodes.reduce((sum, node) => sum + node.y, 0)

  return {
    x: sumX / topicNodes.length,
    y: sumY / topicNodes.length,
  }
}

/**
 * Check if a position overlaps with any existing node
 */
function hasOverlapWithAnyNode(
  candidate: Position,
  excludeNodeId: string | null,
  allNodes: Node[],
  minDistance: number
): boolean {
  return allNodes.some((node) => {
    if (excludeNodeId && node.id === excludeNodeId) return false
    
    const distance = Math.sqrt(
      Math.pow(node.x - candidate.x, 2) + Math.pow(node.y - candidate.y, 2)
    )
    return distance < minDistance
  })
}

/**
 * Check if a position is too close to nodes from other topics
 */
function isTooCloseToOtherTopics(
  candidate: Position,
  currentTopicRoot: Node | null,
  allNodes: Node[],
  minDistance: number
): boolean {
  // Group all nodes by topic
  const topics = new Map<Node | null, Node[]>()
  allNodes.forEach((node) => {
    const root = getTopicRoot(node, allNodes)
    if (!topics.has(root)) {
      topics.set(root, [])
    }
    topics.get(root)!.push(node)
  })

  // Check distance to other topics
  for (const [topicRoot, topicNodes] of topics.entries()) {
    // Skip if it's the same topic
    if (topicRoot === currentTopicRoot) continue

    // Check if candidate is too close to any node in this topic
    for (const node of topicNodes) {
      const distance = Math.sqrt(
        Math.pow(node.x - candidate.x, 2) + Math.pow(node.y - candidate.y, 2)
      )
      if (distance < minDistance) {
        return true
      }
    }
  }

  return false
}

/**
 * Find a non-overlapping position by systematically searching around a center point
 */
function findNonOverlappingPosition(
  center: Position,
  excludeNodeId: string | null,
  allNodes: Node[],
  minDistance: number,
  maxRadius: number = 2000
): Position | null {
  // Try increasingly larger radii
  for (let radius = MIN_DISTANCE; radius <= maxRadius; radius += MIN_DISTANCE) {
    // Try positions in a spiral pattern
    const attemptsPerRadius = Math.max(8, Math.floor((2 * Math.PI * radius) / MIN_DISTANCE))
    
    for (let i = 0; i < attemptsPerRadius; i++) {
      const angle = (360 / attemptsPerRadius) * i
      const rad = (angle * Math.PI) / 180
      
      const candidate: Position = {
        x: center.x + Math.cos(rad) * radius,
        y: center.y + Math.sin(rad) * radius,
      }
      
      if (!hasOverlapWithAnyNode(candidate, excludeNodeId, allNodes, minDistance)) {
        return candidate
      }
    }
  }
  
  return null
}

export function calculateNewNodePosition(
  parent: Node,
  siblings: Node[],
  allNodes: Node[]
): Position {
  // Check if this is a first-level child (direct child of center node)
  const isFirstLevel = parent.parentId === null

  // Get the topic root for the new node
  const topicRoot = isFirstLevel ? null : getTopicRoot(parent, allNodes)
  const topicNodes = getTopicNodes(topicRoot, allNodes)
  const topicCentroid = topicNodes.length > 0 ? getTopicCentroid(topicNodes) : null

  if (isFirstLevel) {
    // For first-level children, use wider spacing to create distinct branches
    // These are topic roots, so they should be far apart
    const BRANCH_RADIUS = 350 // Larger radius for main branches in pixels
    const BRANCH_ANGLE_SPACING = 60 // Degrees between main branches
    const MIN_BRANCH_DISTANCE = MIN_TOPIC_DISTANCE // Minimum distance between topics

    // Calculate angle for this branch based on existing siblings
    const baseAngle = siblings.length * BRANCH_ANGLE_SPACING
    const maxAttempts = 12

    // Try multiple radius levels for first-level nodes
    for (let radiusLevel = 0; radiusLevel < 3; radiusLevel++) {
      const currentRadius = BRANCH_RADIUS + radiusLevel * 100

      for (let i = 0; i < maxAttempts; i++) {
        const angle = baseAngle + i * 30 // Try different angles
        const rad = (angle * Math.PI) / 180

        const candidate: Position = {
          x: parent.x + Math.cos(rad) * currentRadius,
          y: parent.y + Math.sin(rad) * currentRadius,
        }

        // Check overlap with ALL nodes - never allow overlaps
        let hasOverlap = false
        
        // Check against all nodes
        for (const node of allNodes) {
          if (node.id === parent.id) continue // Skip parent
          
          const distance = Math.sqrt(
            Math.pow(node.x - candidate.x, 2) +
              Math.pow(node.y - candidate.y, 2)
          )
          
          // Use larger distance for other first-level nodes (topics)
          if (node.parentId === parent.id) {
            if (distance < MIN_BRANCH_DISTANCE) {
              hasOverlap = true
              break
            }
          } else {
            // Use standard minimum distance for all other nodes
            if (distance < MIN_DISTANCE) {
              hasOverlap = true
              break
            }
          }
        }

        if (!hasOverlap) {
          return candidate
        }
      }
    }

    // Fallback for first-level: try to find a non-overlapping position
    const fallbackAngle =
      siblings.length * BRANCH_ANGLE_SPACING + Math.random() * 30
    const rad = (fallbackAngle * Math.PI) / 180
    const fallbackRadius = BRANCH_RADIUS + 150

    const fallback: Position = {
      x: parent.x + Math.cos(rad) * fallbackRadius,
      y: parent.y + Math.sin(rad) * fallbackRadius,
    }
    
    // Check if fallback overlaps - if so, find a non-overlapping position
    if (hasOverlapWithAnyNode(fallback, parent.id, allNodes, MIN_BRANCH_DISTANCE)) {
      const nonOverlapping = findNonOverlappingPosition(
        parent,
        parent.id,
        allNodes,
        MIN_BRANCH_DISTANCE,
        3000
      )
      if (nonOverlapping) {
        return nonOverlapping
      }
    }
    
    // Final fallback - try increasing radius systematically
    for (let radius = fallbackRadius + MIN_BRANCH_DISTANCE; radius <= 5000; radius += MIN_BRANCH_DISTANCE) {
      for (let angleOffset = 0; angleOffset < 360; angleOffset += 30) {
        const testAngle = (fallbackAngle + angleOffset) % 360
        const testRad = (testAngle * Math.PI) / 180
        const testPosition: Position = {
          x: parent.x + Math.cos(testRad) * radius,
          y: parent.y + Math.sin(testRad) * radius,
        }
        
        if (!hasOverlapWithAnyNode(testPosition, parent.id, allNodes, MIN_BRANCH_DISTANCE)) {
          return testPosition
        }
      }
    }
    
    // Ultimate fallback - return fallback position (should rarely happen)
    return fallback
  } else {
    // For deeper level nodes, position them close to their topic
    // Extend in the same direction as the topic root (relative to center)
    const baseRadius = 150 // Closer to parent for sub-branches in pixels
    const maxAttempts = 24

    // Find center node to calculate direction
    const centerNode = allNodes.find((n) => n.parentId === null)
    
    // Calculate preferred direction: from center towards topic root
    let preferredDirectionAngle: number | null = null
    if (topicRoot && centerNode) {
      const dx = topicRoot.x - centerNode.x
      const dy = topicRoot.y - centerNode.y
      preferredDirectionAngle = (Math.atan2(dy, dx) * 180) / Math.PI
    }

    // Prefer positions that keep the node within the topic cluster
    const preferredRadius = topicCentroid
      ? Math.min(
          baseRadius,
          Math.sqrt(
            Math.pow(parent.x - topicCentroid.x, 2) +
              Math.pow(parent.y - topicCentroid.y, 2)
          ) + baseRadius
        )
      : baseRadius

    // Try multiple radius levels if needed
    for (let radiusLevel = 0; radiusLevel < 3; radiusLevel++) {
      const currentRadius = preferredRadius + radiusLevel * 100

      // Generate candidate angles, prioritizing the preferred direction
      const candidateAngles: number[] = []
      
      if (preferredDirectionAngle !== null && topicRoot) {
        // Calculate direction from parent towards topic root (extends the branch)
        const parentDx = topicRoot.x - parent.x
        const parentDy = topicRoot.y - parent.y
        const parentDirectionAngle = (Math.atan2(parentDy, parentDx) * 180) / Math.PI
        
        // Also consider the general direction from center (for consistency)
        const centerDirectionAngle = preferredDirectionAngle
        
        // Prefer angles that extend in the direction of the topic root
        // Try angles from parent towards topic root (±45 degrees)
        for (let offset = -45; offset <= 45; offset += 15) {
          candidateAngles.push((parentDirectionAngle + offset + 360) % 360)
        }
        
        // Also try angles in the general direction from center (±60 degrees)
        // This helps maintain the overall branch direction
        for (let offset = -60; offset <= 60; offset += 30) {
          const angle = (centerDirectionAngle + offset + 360) % 360
          if (!candidateAngles.includes(angle)) {
            candidateAngles.push(angle)
          }
        }
      }
      
      // Fill remaining attempts with evenly spaced angles
      for (let i = candidateAngles.length; i < maxAttempts; i++) {
        candidateAngles.push((360 / maxAttempts) * i + ((siblings.length * 15) % 360))
      }

      // Try positions in order of preference
      for (const angle of candidateAngles) {
        const rad = (angle * Math.PI) / 180

        const candidate: Position = {
          x: parent.x + Math.cos(rad) * currentRadius,
          y: parent.y + Math.sin(rad) * currentRadius,
        }

        // Check if position overlaps with ANY existing nodes - NEVER allow overlaps
        const hasOverlap = hasOverlapWithAnyNode(
          candidate,
          parent.id,
          allNodes,
          MIN_DISTANCE
        )

        // Check if position is too close to other topics
        const tooCloseToOtherTopics = isTooCloseToOtherTopics(
          candidate,
          topicRoot,
          allNodes,
          MIN_TOPIC_DISTANCE
        )

        if (!hasOverlap && !tooCloseToOtherTopics) {
          return candidate
        }
      }
    }

    // Fallback: try to position near parent but away from other topics
    // Prefer extending in the direction of the topic root
    let fallbackAngle: number
    if (preferredDirectionAngle !== null) {
      // Use the preferred direction with some variation
      fallbackAngle = (preferredDirectionAngle + (siblings.length * 20) % 60) % 360
    } else {
      fallbackAngle = (siblings.length * 45 + Math.random() * 90) % 360
    }
    const rad = (fallbackAngle * Math.PI) / 180
    const fallbackRadius = preferredRadius + 100

    const fallback: Position = {
      x: parent.x + Math.cos(rad) * fallbackRadius,
      y: parent.y + Math.sin(rad) * fallbackRadius,
    }
    
    // Check if fallback overlaps with any nodes - NEVER allow overlaps
    if (hasOverlapWithAnyNode(fallback, parent.id, allNodes, MIN_DISTANCE)) {
      // Try systematic search for non-overlapping position
      const nonOverlapping = findNonOverlappingPosition(
        parent,
        parent.id,
        allNodes,
        MIN_DISTANCE,
        2000
      )
      if (nonOverlapping) {
        // Check if it's too close to other topics
        if (!isTooCloseToOtherTopics(nonOverlapping, topicRoot, allNodes, MIN_TOPIC_DISTANCE)) {
          return nonOverlapping
        }
      }
      
      // Try increasing radius with different angles
      for (let radius = fallbackRadius + MIN_DISTANCE; radius <= 3000; radius += MIN_DISTANCE) {
        for (let angleOffset = 0; angleOffset < 360; angleOffset += 30) {
          const testAngle = (fallbackAngle + angleOffset) % 360
          const testRad = (testAngle * Math.PI) / 180
          const testPosition: Position = {
            x: parent.x + Math.cos(testRad) * radius,
            y: parent.y + Math.sin(testRad) * radius,
          }
          
          if (
            !hasOverlapWithAnyNode(testPosition, parent.id, allNodes, MIN_DISTANCE) &&
            !isTooCloseToOtherTopics(testPosition, topicRoot, allNodes, MIN_TOPIC_DISTANCE)
          ) {
            return testPosition
          }
        }
      }
    }

    // If fallback is too close to other topics, try to move it towards topic centroid
    if (isTooCloseToOtherTopics(fallback, topicRoot, allNodes, MIN_TOPIC_DISTANCE)) {
      // Move towards topic centroid if available to keep it within the topic cluster
      if (topicCentroid) {
        const directionX = topicCentroid.x - fallback.x
        const directionY = topicCentroid.y - fallback.y
        const distance = Math.sqrt(
          directionX * directionX + directionY * directionY
        )
        if (distance > 0) {
          // Try moving closer to topic centroid, but check for overlaps
          for (let moveDistance = 50; moveDistance <= 200; moveDistance += 50) {
            const adjustedPosition: Position = {
              x: fallback.x + (directionX / distance) * moveDistance,
              y: fallback.y + (directionY / distance) * moveDistance,
            }
            
            if (
              !hasOverlapWithAnyNode(adjustedPosition, parent.id, allNodes, MIN_DISTANCE) &&
              !isTooCloseToOtherTopics(adjustedPosition, topicRoot, allNodes, MIN_TOPIC_DISTANCE)
            ) {
              return adjustedPosition
            }
          }
        }
      }
    }

    // Final check - if fallback still overlaps, use systematic search
    if (hasOverlapWithAnyNode(fallback, parent.id, allNodes, MIN_DISTANCE)) {
      const finalPosition = findNonOverlappingPosition(
        parent,
        parent.id,
        allNodes,
        MIN_DISTANCE,
        5000
      )
      if (finalPosition) {
        return finalPosition
      }
    }

    return fallback
  }
}

export function getNodeFamily(nodeId: string, nodes: Node[]): string[] {
  const node = nodes.find((n) => n.id === nodeId)
  if (!node) return []

  // Get all siblings (nodes with same parent)
  return nodes.filter((n) => n.parentId === node.parentId).map((n) => n.id)
}

/**
 * Adjust positions of existing nodes to make room for a new node
 * This function pushes overlapping nodes away from the new node position
 */
export function adjustNodesForNewNode(
  newNodePosition: Position,
  newNodeId: string,
  allNodes: Node[]
): Node[] {
  const adjustedNodes = [...allNodes]
  
  // Find nodes that would overlap with the new position
  const overlappingNodes = allNodes.filter((node) => {
    const distance = Math.sqrt(
      Math.pow(node.x - newNodePosition.x, 2) + Math.pow(node.y - newNodePosition.y, 2)
    )
    return distance < MIN_DISTANCE
  })

  // Push overlapping nodes away
  overlappingNodes.forEach((overlappingNode) => {
    const dx = overlappingNode.x - newNodePosition.x
    const dy = overlappingNode.y - newNodePosition.y
    const currentDistance = Math.sqrt(dx * dx + dy * dy)
    
    if (currentDistance > 0) {
      // Calculate push direction (away from new node)
      const pushDistance = MIN_DISTANCE - currentDistance + 20 // Extra padding
      const pushX = (dx / currentDistance) * pushDistance
      const pushY = (dy / currentDistance) * pushDistance
      
      // Update the overlapping node's position
      const nodeIndex = adjustedNodes.findIndex((n) => n.id === overlappingNode.id)
      if (nodeIndex !== -1) {
        adjustedNodes[nodeIndex] = {
          ...adjustedNodes[nodeIndex],
          x: overlappingNode.x + pushX,
          y: overlappingNode.y + pushY,
        }
      }
    }
  })

  return adjustedNodes
}
