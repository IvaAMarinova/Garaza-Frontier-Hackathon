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
}
export declare function NodeCard({ node, onAddChild, onDelete: _onDelete, onEdit: _onEdit, onRemoveConnection: _onRemoveConnection, onMouseDown, isDragging, isCenter, isNewlyCreated, isUpdated, }: NodeCardProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=node-card.d.ts.map