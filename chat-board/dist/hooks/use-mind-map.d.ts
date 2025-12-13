import type { Node, NodeContent } from "../lib/types";
import type { Goal } from "../lib/types";
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
    sessionId: string;
    isLoading: boolean;
    zoomLevel: number;
    goal: Goal;
    toggleTheme: () => void;
    handleFinish: () => void;
    addNode: (parentId: string, content: NodeContent) => void;
    deleteNode: (id: string) => void;
    editNode: (id: string, content: NodeContent) => void;
    removeConnection: (childId: string) => void;
    zoomIn: () => void;
    zoomOut: () => void;
    resetZoom: () => void;
    handleMouseDown: (e: React.MouseEvent, nodeId: string) => void;
    handleBackgroundMouseDown: (e: React.MouseEvent) => void;
};
//# sourceMappingURL=use-mind-map.d.ts.map