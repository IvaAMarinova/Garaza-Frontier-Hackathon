import type { Node, NodeContent } from "../lib/types";
import { type GoalResponse } from "../lib/api";
export declare function useMindMap(initialText?: string, isDarkMode?: boolean, onStartNewJourney?: () => void): {
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
    goal: GoalResponse;
    showCongratulations: boolean;
    handleFinish: () => void;
    handleCloseCongratulations: () => void;
    addNode: (parentId: string, content: NodeContent) => void;
    deleteNode: (id: string) => void;
    editNode: (id: string, content: NodeContent) => void;
    removeConnection: (childId: string) => void;
    handleConceptExpansion: (conceptId: string, updatedConcept: any, newChildren: any[], newEdges: any[]) => Promise<void>;
    zoomIn: () => void;
    zoomOut: () => void;
    resetZoom: () => void;
    handleMouseDown: (e: React.MouseEvent, nodeId: string) => void;
    handleBackgroundMouseDown: (e: React.MouseEvent) => void;
    incrementNodeWeight: (conceptId: string, increment?: number) => void;
    getNodeWeight: (conceptId: string) => number;
    checkCompletions: () => boolean;
    totalWeight: number;
};
//# sourceMappingURL=use-mind-map.d.ts.map