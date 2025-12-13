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
 */
export declare function getNodeBounds(node: Node): NodeBounds;
/**
 * Calculate position for a new node
 */
export declare function calculateNewNodePosition(parent: Node, siblings: Node[], allNodes: Node[], newNodeContent?: Node["content"]): Position;
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