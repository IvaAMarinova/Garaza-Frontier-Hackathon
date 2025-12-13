import type { Node, NodeContent } from "../lib/types";
export declare function useMindMap(initialText?: string): {
    isDarkMode: boolean;
    nodes: Node[];
    draggingId: string;
    containerRef: import("react").RefObject<HTMLDivElement>;
    connections: {
        id: string;
        path: string;
        strokeColor: string;
    }[];
    backgroundOffset: {
        x: number;
        y: number;
    };
    isPanningBackground: boolean;
    newlyCreatedNodes: Set<string>;
    updatedNodes: Set<string>;
    toggleTheme: () => void;
    addNode: (parentId: string, content: NodeContent) => void;
    deleteNode: (id: string) => void;
    editNode: (id: string, content: NodeContent) => void;
    removeConnection: (childId: string) => void;
    handleMouseDown: (e: React.MouseEvent, nodeId: string) => void;
    handleMouseMove: (e: React.MouseEvent) => void;
    handleMouseUp: () => void;
    handleBackgroundMouseDown: (e: React.MouseEvent) => void;
};
//# sourceMappingURL=use-mind-map.d.ts.map