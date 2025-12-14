import type { Node, Position, NodeBounds } from "./types";
/**
 * Estimate node dimensions based on content
 */
export declare function estimateNodeDimensions(node: Node): {
    width: number;
    height: number;
};
/**
 * Calculate node bounds (corners + center) from node position and dimensions
 * If node already has stored bounds, use them; otherwise calculate and return
 */
export declare function getNodeBounds(node: Node): NodeBounds;
/**
 * Calculate and store bounds for a node based on its position and content
 * This ensures we always have exact coordinates stored
 */
export declare function calculateAndStoreBounds(node: Node): Node;
/**
 * Check if two nodes are too close (within minimum distance)
 * This is more strict than overlap - it checks the actual distance between centers
 */
export declare function areNodesTooClose(bounds1: NodeBounds, bounds2: NodeBounds): boolean;
/**
 * Calculate position for a new node
 */
export declare function calculateNewNodePosition(parent: Node, siblings: Node[], allNodes: Node[], newNodeContent?: Node["content"]): Position;
/**
 * Push nodes away from a dragged node to maintain minimum distance
 * This is used during dragging to keep other nodes at a safe distance
 */
export declare function pushNodesAwayFromDragged(draggedNodeBounds: NodeBounds, allNodes: Node[], excludeNodeId: string): Node[];
/**
 * Adjust existing nodes to make room for a new node
 */
export declare function adjustNodesForNewNode(newNodePosition: Position, newNodeId: string, newNodeWidth: number, newNodeHeight: number, allNodes: Node[]): Node[];
/**
 * Validate and fix any overlapping nodes
 */
export declare function validateAndFixOverlaps(nodes: Node[]): Node[];
/**
 * Get the center node from a list of nodes
 */
export declare function getCenterNode(nodes: Node[]): Node | null;
/**
 * Calculate the bounding box of all nodes
 */
export declare function getNodesBoundingBox(nodes: Node[]): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
};
/**
 * Debug function to check for overlapping nodes
 */
export declare function findOverlappingNodes(nodes: Node[]): Array<{
    node1: Node;
    node2: Node;
    overlap: boolean;
}>;
//# sourceMappingURL=positioning.d.ts.map