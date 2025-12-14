// Constants for node sizing
const MIN_NODE_WIDTH = 60;
const MAX_NODE_WIDTH = 250; // Maximum width for regular nodes
const MAX_CENTER_NODE_WIDTH = 300; // Maximum width for center nodes
const BASE_PADDING = 16; // px-2 py-2 = 8px * 2
const TEXT_LINE_HEIGHT = 1.5; // leading-relaxed
const CHAR_WIDTH_ESTIMATE = 7; // Approximate character width in pixels for text-sm
const HEADER_HEIGHT = 28; // Approximate header height (increased to account for font-semibold text-sm + spacing)
const CODE_BLOCK_LINE_HEIGHT = 20; // Approximate code block line height
const MIN_DISTANCE_BETWEEN_NODES = 40; // Minimum padding between nodes (increased for better spacing)
/**
 * Estimate node dimensions based on content
 */
export function estimateNodeDimensions(node) {
    let width = MIN_NODE_WIDTH;
    let height = BASE_PADDING;
    // Add header height if present
    if (node.content.header) {
        height += HEADER_HEIGHT + 8; // 8px spacing (space-y-2)
    }
    // Calculate text width and height
    const textLines = node.content.text.split('\n');
    const maxTextWidth = Math.max(...textLines.map(line => line.length * CHAR_WIDTH_ESTIMATE), MIN_NODE_WIDTH - BASE_PADDING);
    width = Math.max(width, maxTextWidth + BASE_PADDING);
    height += textLines.length * (14 * TEXT_LINE_HEIGHT); // text-sm = 14px
    // Add code block dimensions if present
    if (node.content.codeBlock) {
        const codeLines = node.content.codeBlock.code.split('\n');
        const maxCodeWidth = Math.max(...codeLines.map(line => line.length * CHAR_WIDTH_ESTIMATE), 200 // Minimum code block width
        );
        width = Math.max(width, maxCodeWidth + BASE_PADDING);
        height += 8 + (codeLines.length * CODE_BLOCK_LINE_HEIGHT); // 8px spacing + code lines
    }
    // Center nodes are larger
    if (node.parentId === null) {
        width = Math.max(width, 80);
        height = Math.max(height, 60);
        // Cap center node width at maximum
        width = Math.min(width, MAX_CENTER_NODE_WIDTH);
    }
    else {
        // Cap regular node width at maximum
        width = Math.min(width, MAX_NODE_WIDTH);
    }
    return { width, height };
}
/**
 * Calculate node bounds (corners + center) from node position and dimensions
 * If node already has stored bounds, use them; otherwise calculate and return
 */
export function getNodeBounds(node) {
    // If node already has stored bounds, use them
    if (node.bounds) {
        return node.bounds;
    }
    // Otherwise calculate bounds
    const { width, height } = estimateNodeDimensions(node);
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    return {
        center: { x: node.x, y: node.y },
        topLeft: { x: node.x - halfWidth, y: node.y - halfHeight },
        topRight: { x: node.x + halfWidth, y: node.y - halfHeight },
        bottomLeft: { x: node.x - halfWidth, y: node.y + halfHeight },
        bottomRight: { x: node.x + halfWidth, y: node.y + halfHeight },
        width,
        height,
    };
}
/**
 * Calculate and store bounds for a node based on its position and content
 * This ensures we always have exact coordinates stored
 */
export function calculateAndStoreBounds(node) {
    const { width, height } = estimateNodeDimensions(node);
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const bounds = {
        center: { x: node.x, y: node.y },
        topLeft: { x: node.x - halfWidth, y: node.y - halfHeight },
        topRight: { x: node.x + halfWidth, y: node.y - halfHeight },
        bottomLeft: { x: node.x - halfWidth, y: node.y + halfHeight },
        bottomRight: { x: node.x + halfWidth, y: node.y + halfHeight },
        width,
        height,
    };
    return { ...node, bounds };
}
/**
 * Check if two bounding boxes overlap or are too close (within minimum distance)
 */
function doBoundsOverlap(bounds1, bounds2) {
    // Check if boxes are separated by at least MIN_DISTANCE_BETWEEN_NODES
    // If not, they overlap or are too close
    return !(bounds1.topRight.x < bounds2.topLeft.x - MIN_DISTANCE_BETWEEN_NODES ||
        bounds1.topLeft.x > bounds2.topRight.x + MIN_DISTANCE_BETWEEN_NODES ||
        bounds1.bottomLeft.y < bounds2.topLeft.y - MIN_DISTANCE_BETWEEN_NODES ||
        bounds1.topLeft.y > bounds2.bottomLeft.y + MIN_DISTANCE_BETWEEN_NODES);
}
/**
 * Check if two nodes are too close (within minimum distance)
 * This is more strict than overlap - it checks the actual distance between centers
 */
export function areNodesTooClose(bounds1, bounds2) {
    const dx = bounds1.center.x - bounds2.center.x;
    const dy = bounds1.center.y - bounds2.center.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    // Calculate minimum required distance (half diagonals of both nodes + margin)
    const minRequiredDistance = (Math.sqrt(bounds1.width ** 2 + bounds1.height ** 2) / 2) +
        (Math.sqrt(bounds2.width ** 2 + bounds2.height ** 2) / 2) +
        MIN_DISTANCE_BETWEEN_NODES;
    return distance < minRequiredDistance;
}
/**
 * Check if a position would cause a collision with existing nodes
 * Uses stored bounds for accurate collision detection
 */
function hasCollision(position, nodeWidth, nodeHeight, allNodes, excludeNodeId) {
    const testBounds = {
        center: position,
        topLeft: { x: position.x - nodeWidth / 2, y: position.y - nodeHeight / 2 },
        topRight: { x: position.x + nodeWidth / 2, y: position.y - nodeHeight / 2 },
        bottomLeft: { x: position.x - nodeWidth / 2, y: position.y + nodeHeight / 2 },
        bottomRight: { x: position.x + nodeWidth / 2, y: position.y + nodeHeight / 2 },
        width: nodeWidth,
        height: nodeHeight,
    };
    for (const node of allNodes) {
        if (excludeNodeId && node.id === excludeNodeId)
            continue;
        // Use stored bounds if available, otherwise calculate
        const nodeBounds = getNodeBounds(node);
        if (doBoundsOverlap(testBounds, nodeBounds)) {
            return true;
        }
    }
    return false;
}
/**
 * Determine the direction of a node relative to its parent or center
 * Returns angle in radians (0 = right, π/2 = down, π = left, 3π/2 = up)
 */
function getNodeDirection(node, referenceNode) {
    const dx = node.x - referenceNode.x;
    const dy = node.y - referenceNode.y;
    return Math.atan2(dy, dx);
}
/**
 * Find a safe position for a new node in the direction of its parent
 */
function findSafePosition(parent, nodeWidth, nodeHeight, allNodes, preferredDirection) {
    // Determine preferred direction
    let direction = preferredDirection;
    // If no preferred direction, determine based on parent's direction
    if (direction === undefined) {
        if (parent.parentId === null) {
            // Center node - distribute children evenly around
            const siblings = allNodes.filter(n => n.parentId === parent.id);
            const angleStep = (2 * Math.PI) / Math.max(1, siblings.length + 1);
            direction = siblings.length * angleStep;
        }
        else {
            // Find parent's direction relative to its parent or center
            const grandparent = allNodes.find(n => n.id === parent.parentId);
            if (grandparent) {
                direction = getNodeDirection(parent, grandparent);
            }
            else {
                // If no grandparent found, find center node and use direction from center to parent
                const centerNode = allNodes.find(n => n.parentId === null);
                if (centerNode) {
                    direction = getNodeDirection(parent, centerNode);
                }
                else {
                    // Last resort: distribute siblings around parent
                    const siblings = allNodes.filter(n => n.parentId === parent.id);
                    const angleStep = (2 * Math.PI) / Math.max(1, siblings.length + 1);
                    direction = siblings.length * angleStep;
                }
            }
        }
    }
    // Calculate minimum distance needed (diagonal of node + padding)
    // Use stored bounds for parent if available
    const parentBounds = getNodeBounds(parent);
    const minDistance = Math.sqrt(nodeWidth * nodeWidth + nodeHeight * nodeHeight) / 2 +
        Math.sqrt(parentBounds.width ** 2 + parentBounds.height ** 2) / 2 +
        MIN_DISTANCE_BETWEEN_NODES;
    // Use reasonable distances for mindmap - closer to parent
    const baseDistance = parent.parentId === null ? 220 : 150; // Level 1: 220px, deeper: 150px
    const startRadius = Math.max(minDistance, baseDistance);
    const maxRadius = 500; // Reduced from 2000 to keep nodes closer
    const radiusIncrement = 20; // Reduced from 50 for finer positioning
    const angleVariation = Math.PI / 6; // 30 degrees variation
    // Try positions in the preferred direction first, starting at base distance
    for (let radius = startRadius; radius <= maxRadius; radius += radiusIncrement) {
        // Try exact direction
        const position = {
            x: parent.x + Math.cos(direction) * radius,
            y: parent.y + Math.sin(direction) * radius,
        };
        if (!hasCollision(position, nodeWidth, nodeHeight, allNodes)) {
            return position;
        }
        // Try slight variations around the preferred direction
        for (let angleOffset = -angleVariation; angleOffset <= angleVariation; angleOffset += angleVariation / 3) {
            const adjustedDirection = direction + angleOffset;
            const position = {
                x: parent.x + Math.cos(adjustedDirection) * radius,
                y: parent.y + Math.sin(adjustedDirection) * radius,
            };
            if (!hasCollision(position, nodeWidth, nodeHeight, allNodes)) {
                return position;
            }
        }
    }
    // If no position found in preferred direction, spiral search with smaller increments
    for (let radius = startRadius; radius <= maxRadius; radius += radiusIncrement) {
        const angleStep = Math.max(Math.PI / 12, (2 * Math.PI) / Math.max(8, Math.floor((2 * Math.PI * radius) / minDistance)));
        for (let angle = 0; angle < 2 * Math.PI; angle += angleStep) {
            const position = {
                x: parent.x + Math.cos(angle) * radius,
                y: parent.y + Math.sin(angle) * radius,
            };
            if (!hasCollision(position, nodeWidth, nodeHeight, allNodes)) {
                return position;
            }
        }
    }
    // Fallback: place at reasonable distance in preferred direction
    return {
        x: parent.x + Math.cos(direction) * startRadius,
        y: parent.y + Math.sin(direction) * startRadius,
    };
}
/**
 * Calculate position for a new node
 */
export function calculateNewNodePosition(parent, siblings, allNodes, newNodeContent) {
    // Create a temporary node to estimate dimensions
    const tempNode = {
        id: "temp",
        content: newNodeContent || { text: "New Node" },
        x: 0,
        y: 0,
        color: "",
        parentId: parent.id,
    };
    const { width, height } = estimateNodeDimensions(tempNode);
    // Determine preferred direction based on parent's direction
    let preferredDirection;
    if (parent.parentId === null) {
        // First-level children - distribute evenly around center
        const angleStep = (2 * Math.PI) / Math.max(1, siblings.length + 1);
        preferredDirection = siblings.length * angleStep;
    }
    else {
        // Deeper nodes - follow parent's direction, but spread siblings around parent
        const grandparent = allNodes.find(n => n.id === parent.parentId);
        if (grandparent) {
            // Get parent's direction from grandparent
            const parentDirection = getNodeDirection(parent, grandparent);
            // Spread siblings in a fan around the parent's direction
            const siblingCount = siblings.length;
            const spreadAngle = Math.PI / 3; // 60 degrees spread
            const angleOffset = siblingCount === 0
                ? 0
                : (siblingCount - (siblingCount) / 2) * (spreadAngle / Math.max(1, siblingCount + 1));
            preferredDirection = parentDirection + angleOffset;
        }
        else {
            // If no grandparent, find center and use direction from center to parent
            const centerNode = allNodes.find(n => n.parentId === null);
            if (centerNode) {
                const parentDirection = getNodeDirection(parent, centerNode);
                // Spread siblings around parent
                const siblingCount = siblings.length;
                const spreadAngle = Math.PI / 3;
                const angleOffset = siblingCount === 0
                    ? 0
                    : (siblingCount - (siblingCount) / 2) * (spreadAngle / Math.max(1, siblingCount + 1));
                preferredDirection = parentDirection + angleOffset;
            }
        }
    }
    return findSafePosition(parent, width, height, allNodes, preferredDirection);
}
/**
 * Push nodes away from a dragged node to maintain minimum distance
 * This is used during dragging to keep other nodes at a safe distance
 */
export function pushNodesAwayFromDragged(draggedNodeBounds, allNodes, excludeNodeId) {
    const adjustedNodes = [...allNodes];
    for (let i = 0; i < adjustedNodes.length; i++) {
        const node = adjustedNodes[i];
        if (node.id === excludeNodeId)
            continue;
        const nodeBounds = getNodeBounds(node);
        // Check if nodes are too close (overlapping or within minimum distance)
        if (areNodesTooClose(draggedNodeBounds, nodeBounds)) {
            // Calculate direction from dragged node to this node
            const dx = node.x - draggedNodeBounds.center.x;
            const dy = node.y - draggedNodeBounds.center.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            // Calculate required distance (half of both nodes' diagonals + minimum margin)
            const requiredDistance = (Math.sqrt(draggedNodeBounds.width ** 2 + draggedNodeBounds.height ** 2) / 2) +
                (Math.sqrt(nodeBounds.width ** 2 + nodeBounds.height ** 2) / 2) +
                MIN_DISTANCE_BETWEEN_NODES;
            // Always push if too close (distance check is already done by areNodesTooClose)
            const pushDirection = distance === 0 || distance < 1
                ? Math.random() * 2 * Math.PI // Random direction if same position or very close
                : Math.atan2(dy, dx); // Direction away from dragged node
            const newX = draggedNodeBounds.center.x + Math.cos(pushDirection) * requiredDistance;
            const newY = draggedNodeBounds.center.y + Math.sin(pushDirection) * requiredDistance;
            // Try to find a safe position near the node's parent if it has one
            const parentNode = adjustedNodes.find(n => n.id === node.parentId);
            if (parentNode && node.parentId !== null) {
                // Try to maintain relationship with parent while avoiding collision
                const { width, height } = estimateNodeDimensions(node);
                // First try the pushed position
                const testBounds = {
                    center: { x: newX, y: newY },
                    topLeft: { x: newX - width / 2, y: newY - height / 2 },
                    topRight: { x: newX + width / 2, y: newY - height / 2 },
                    bottomLeft: { x: newX - width / 2, y: newY + height / 2 },
                    bottomRight: { x: newX + width / 2, y: newY + height / 2 },
                    width,
                    height,
                };
                // Check if pushed position conflicts with dragged node
                if (!areNodesTooClose(draggedNodeBounds, testBounds)) {
                    adjustedNodes[i] = calculateAndStoreBounds({ ...node, x: newX, y: newY });
                }
                else {
                    // Find a safe position near parent
                    const safePosition = findSafePosition(parentNode, width, height, adjustedNodes.filter(n => n.id !== node.id && n.id !== excludeNodeId).concat([{
                            id: excludeNodeId,
                            x: draggedNodeBounds.center.x,
                            y: draggedNodeBounds.center.y,
                            bounds: draggedNodeBounds
                        }]), getNodeDirection(node, parentNode));
                    adjustedNodes[i] = calculateAndStoreBounds({ ...node, x: safePosition.x, y: safePosition.y });
                }
            }
            else {
                // No parent, just push away
                adjustedNodes[i] = calculateAndStoreBounds({ ...node, x: newX, y: newY });
            }
        }
    }
    return adjustedNodes;
}
/**
 * Adjust existing nodes to make room for a new node
 */
export function adjustNodesForNewNode(newNodePosition, newNodeId, newNodeWidth, newNodeHeight, allNodes) {
    const adjustedNodes = [...allNodes];
    const newNodeBounds = {
        center: newNodePosition,
        topLeft: { x: newNodePosition.x - newNodeWidth / 2, y: newNodePosition.y - newNodeHeight / 2 },
        topRight: { x: newNodePosition.x + newNodeWidth / 2, y: newNodePosition.y - newNodeHeight / 2 },
        bottomLeft: { x: newNodePosition.x - newNodeWidth / 2, y: newNodePosition.y + newNodeHeight / 2 },
        bottomRight: { x: newNodePosition.x + newNodeWidth / 2, y: newNodePosition.y + newNodeHeight / 2 },
        width: newNodeWidth,
        height: newNodeHeight,
    };
    // Find nodes that overlap with the new node
    for (let i = 0; i < adjustedNodes.length; i++) {
        const node = adjustedNodes[i];
        const nodeBounds = getNodeBounds(node);
        if (doBoundsOverlap(newNodeBounds, nodeBounds)) {
            // Calculate push direction (away from new node)
            const dx = node.x - newNodePosition.x;
            const dy = node.y - newNodePosition.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance === 0) {
                // Nodes are at same position, push in a random direction
                const angle = Math.random() * 2 * Math.PI;
                const pushDistance = Math.sqrt(newNodeWidth ** 2 + newNodeHeight ** 2) / 2 +
                    Math.sqrt(nodeBounds.width ** 2 + nodeBounds.height ** 2) / 2 +
                    MIN_DISTANCE_BETWEEN_NODES;
                const newPosition = {
                    x: newNodePosition.x + Math.cos(angle) * pushDistance,
                    y: newNodePosition.y + Math.sin(angle) * pushDistance,
                };
                // Try to find a safe position near the node's parent
                const parentNode = adjustedNodes.find(n => n.id === node.parentId);
                if (parentNode) {
                    const { width, height } = estimateNodeDimensions(node);
                    const safePosition = findSafePosition(parentNode, width, height, adjustedNodes.filter(n => n.id !== node.id), getNodeDirection(node, parentNode));
                    // Update node with new position and recalculate bounds
                    adjustedNodes[i] = calculateAndStoreBounds({ ...node, x: safePosition.x, y: safePosition.y });
                }
                else {
                    adjustedNodes[i] = calculateAndStoreBounds({ ...node, x: newPosition.x, y: newPosition.y });
                }
            }
            else {
                // Push away from new node
                const pushDistance = Math.sqrt(newNodeWidth ** 2 + newNodeHeight ** 2) / 2 +
                    Math.sqrt(nodeBounds.width ** 2 + nodeBounds.height ** 2) / 2 +
                    MIN_DISTANCE_BETWEEN_NODES;
                const newPosition = {
                    x: newNodePosition.x + (dx / distance) * pushDistance,
                    y: newNodePosition.y + (dy / distance) * pushDistance,
                };
                // Check if pushed position still collides
                const { width, height } = estimateNodeDimensions(node);
                if (hasCollision(newPosition, width, height, adjustedNodes.filter(n => n.id !== node.id), node.id)) {
                    // Find a safe position near the node's parent
                    const parentNode = adjustedNodes.find(n => n.id === node.parentId);
                    if (parentNode) {
                        const safePosition = findSafePosition(parentNode, width, height, adjustedNodes.filter(n => n.id !== node.id), getNodeDirection(node, parentNode));
                        adjustedNodes[i] = calculateAndStoreBounds({ ...node, x: safePosition.x, y: safePosition.y });
                    }
                    else {
                        adjustedNodes[i] = calculateAndStoreBounds({ ...node, x: newPosition.x, y: newPosition.y });
                    }
                }
                else {
                    adjustedNodes[i] = calculateAndStoreBounds({ ...node, x: newPosition.x, y: newPosition.y });
                }
            }
        }
    }
    return adjustedNodes;
}
/**
 * Validate and fix any overlapping nodes
 */
export function validateAndFixOverlaps(nodes) {
    const fixedNodes = [...nodes];
    // Check each node against all others
    for (let i = 0; i < fixedNodes.length; i++) {
        const currentNode = fixedNodes[i];
        const currentBounds = getNodeBounds(currentNode);
        for (let j = i + 1; j < fixedNodes.length; j++) {
            const otherNode = fixedNodes[j];
            const otherBounds = getNodeBounds(otherNode);
            // Use stricter check - nodes must maintain minimum distance
            if (areNodesTooClose(currentBounds, otherBounds)) {
                // Find parent to reposition properly
                const parentNode = fixedNodes.find(n => n.id === currentNode.parentId);
                if (parentNode) {
                    const { width, height } = estimateNodeDimensions(currentNode);
                    const safePosition = findSafePosition(parentNode, width, height, fixedNodes.filter(n => n.id !== currentNode.id), getNodeDirection(currentNode, parentNode));
                    // Update node with new position and recalculate bounds
                    fixedNodes[i] = calculateAndStoreBounds({ ...currentNode, x: safePosition.x, y: safePosition.y });
                }
                else {
                    // If no parent, push away from other node
                    const dx = currentNode.x - otherNode.x;
                    const dy = currentNode.y - otherNode.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance === 0) {
                        // Same position, push in random direction
                        const angle = Math.random() * 2 * Math.PI;
                        const pushDistance = Math.sqrt(currentBounds.width ** 2 + currentBounds.height ** 2) / 2 +
                            Math.sqrt(otherBounds.width ** 2 + otherBounds.height ** 2) / 2 +
                            MIN_DISTANCE_BETWEEN_NODES;
                        fixedNodes[i] = calculateAndStoreBounds({
                            ...currentNode,
                            x: otherNode.x + Math.cos(angle) * pushDistance,
                            y: otherNode.y + Math.sin(angle) * pushDistance,
                        });
                    }
                    else {
                        const pushDistance = Math.sqrt(currentBounds.width ** 2 + currentBounds.height ** 2) / 2 +
                            Math.sqrt(otherBounds.width ** 2 + otherBounds.height ** 2) / 2 +
                            MIN_DISTANCE_BETWEEN_NODES;
                        fixedNodes[i] = calculateAndStoreBounds({
                            ...currentNode,
                            x: otherNode.x + (dx / distance) * pushDistance,
                            y: otherNode.y + (dy / distance) * pushDistance,
                        });
                    }
                }
                break; // Move to next node after fixing this one
            }
        }
    }
    return fixedNodes;
}
/**
 * Get the center node from a list of nodes
 */
export function getCenterNode(nodes) {
    return nodes.find(node => node.parentId === null) || null;
}
/**
 * Calculate the bounding box of all nodes
 */
export function getNodesBoundingBox(nodes) {
    if (nodes.length === 0) {
        return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0, centerX: 0, centerY: 0 };
    }
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const node of nodes) {
        const bounds = getNodeBounds(node);
        minX = Math.min(minX, bounds.topLeft.x);
        maxX = Math.max(maxX, bounds.topRight.x);
        minY = Math.min(minY, bounds.topLeft.y);
        maxY = Math.max(maxY, bounds.bottomLeft.y);
    }
    return {
        minX,
        maxX,
        minY,
        maxY,
        width: maxX - minX,
        height: maxY - minY,
        centerX: (minX + maxX) / 2,
        centerY: (minY + maxY) / 2,
    };
}
/**
 * Debug function to check for overlapping nodes
 */
export function findOverlappingNodes(nodes) {
    const overlaps = [];
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const node1 = nodes[i];
            const node2 = nodes[j];
            const bounds1 = getNodeBounds(node1);
            const bounds2 = getNodeBounds(node2);
            if (doBoundsOverlap(bounds1, bounds2)) {
                overlaps.push({ node1, node2, overlap: true });
            }
        }
    }
    return overlaps;
}
