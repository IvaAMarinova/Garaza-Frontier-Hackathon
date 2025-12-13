import type { Node, Position } from "./types";
export declare const NODE_WIDTH = 60;
export declare const NODE_HEIGHT = 80;
export declare const MIN_DISTANCE: number;
export declare function calculateNewNodePosition(parent: Node, siblings: Node[], allNodes: Node[]): Position;
/**
 * Simple function to push overlapping nodes away from a new position
 */
export declare function adjustNodesForNewNode(newNodePosition: Position, newNodeId: string, allNodes: Node[]): Node[];
/**
 * Final validation to ensure no overlaps exist
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
    distance: number;
}>;
//# sourceMappingURL=positioning.d.ts.map