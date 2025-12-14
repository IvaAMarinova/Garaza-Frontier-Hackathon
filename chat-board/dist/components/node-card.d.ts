import type { Node, NodeContent } from "../lib/types";
interface NodeCardProps {
    node: Node;
    onAddChild: (id: string, content: NodeContent) => void;
    onDelete: (id: string) => void;
    onEdit: (id: string, content: NodeContent) => void;
    onRemoveConnection: (id: string) => void;
    onMouseDown: (e: React.MouseEvent, id: string) => void;
    isDragging: boolean;
    isCenter: boolean;
    isNewlyCreated?: boolean;
    isUpdated?: boolean;
    sessionId?: string;
    conceptId?: string;
    isDarkMode?: boolean;
    onExpandConcept?: (conceptId: string, updatedConcept: any, newChildren: any[], newEdges: any[]) => void;
    onIncrementWeight?: (conceptId: string, increment?: number) => void;
}
export declare function NodeCard({ node, onAddChild, onDelete: _onDelete, onEdit: _onEdit, onRemoveConnection: _onRemoveConnection, onMouseDown, isDragging, isCenter, isNewlyCreated, isUpdated, sessionId, conceptId, isDarkMode, onExpandConcept, onIncrementWeight, }: NodeCardProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=node-card.d.ts.map