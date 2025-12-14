// Constants for node sizing
const MIN_NODE_WIDTH = 60;
const BASE_PADDING = 16; // px-2 py-2 = 8px * 2
const TEXT_LINE_HEIGHT = 1.5; // leading-relaxed
const CHAR_WIDTH_ESTIMATE = 7; // Approximate character width in pixels for text-sm
const HEADER_HEIGHT = 20; // Approximate header height
const CODE_BLOCK_LINE_HEIGHT = 20; // Approximate code block line height
const MIN_DISTANCE_BETWEEN_NODES = 20; // Minimum padding between nodes
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
    }
    return { width, height };
}
/**
 * Calculate node bounds (corners + center) from node position and dimensions
 */
export function getNodeBounds(node) {
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
 * Check if two bounding boxes overlap
 */
function doBoundsOverlap(bounds1, bounds2) {
    return !(bounds1.topRight.x < bounds2.topLeft.x - MIN_DISTANCE_BETWEEN_NODES ||
        bounds1.topLeft.x > bounds2.topRight.x + MIN_DISTANCE_BETWEEN_NODES ||
        bounds1.bottomLeft.y < bounds2.topLeft.y - MIN_DISTANCE_BETWEEN_NODES ||
        bounds1.topLeft.y > bounds2.bottomLeft.y + MIN_DISTANCE_BETWEEN_NODES);
}
/**
 * Check if a position would cause a collision with existing nodes
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
                // Default to right
                direction = 0;
            }
        }
    }
    // Calculate minimum distance needed (diagonal of node + padding)
    const minDistance = Math.sqrt(nodeWidth * nodeWidth + nodeHeight * nodeHeight) / 2 +
        Math.sqrt(estimateNodeDimensions(parent).width ** 2 + estimateNodeDimensions(parent).height ** 2) / 2 +
        MIN_DISTANCE_BETWEEN_NODES;
    // Start searching close to parent and spiral outward
    const startRadius = minDistance;
    const maxRadius = 2000;
    const radiusIncrement = 50;
    const angleVariation = Math.PI / 6; // 30 degrees variation
    // Try positions in the preferred direction first
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
        for (let angleOffset = -angleVariation; angleOffset <= angleVariation; angleOffset += angleVariation / 2) {
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
    // If no position found in preferred direction, spiral search
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
    // Fallback: place far away
    return {
        x: parent.x + maxRadius,
        y: parent.y + maxRadius,
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
        // Deeper nodes - follow parent's direction
        const grandparent = allNodes.find(n => n.id === parent.parentId);
        if (grandparent) {
            preferredDirection = getNodeDirection(parent, grandparent);
        }
    }
    return findSafePosition(parent, width, height, allNodes, preferredDirection);
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
                    adjustedNodes[i] = { ...node, x: safePosition.x, y: safePosition.y };
                }
                else {
                    adjustedNodes[i] = { ...node, x: newPosition.x, y: newPosition.y };
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
                        adjustedNodes[i] = { ...node, x: safePosition.x, y: safePosition.y };
                    }
                    else {
                        adjustedNodes[i] = { ...node, x: newPosition.x, y: newPosition.y };
                    }
                }
                else {
                    adjustedNodes[i] = { ...node, x: newPosition.x, y: newPosition.y };
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
            if (doBoundsOverlap(currentBounds, otherBounds)) {
                // Find parent to reposition properly
                const parentNode = fixedNodes.find(n => n.id === currentNode.parentId);
                if (parentNode) {
                    const { width, height } = estimateNodeDimensions(currentNode);
                    const safePosition = findSafePosition(parentNode, width, height, fixedNodes.filter(n => n.id !== currentNode.id), getNodeDirection(currentNode, parentNode));
                    fixedNodes[i] = { ...currentNode, x: safePosition.x, y: safePosition.y };
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
                        fixedNodes[i] = {
                            ...currentNode,
                            x: otherNode.x + Math.cos(angle) * pushDistance,
                            y: otherNode.y + Math.sin(angle) * pushDistance,
                        };
                    }
                    else {
                        const pushDistance = Math.sqrt(currentBounds.width ** 2 + currentBounds.height ** 2) / 2 +
                            Math.sqrt(otherBounds.width ** 2 + otherBounds.height ** 2) / 2 +
                            MIN_DISTANCE_BETWEEN_NODES;
                        fixedNodes[i] = {
                            ...currentNode,
                            x: otherNode.x + (dx / distance) * pushDistance,
                            y: otherNode.y + (dy / distance) * pushDistance,
                        };
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
