import type { NodeContent } from './types';
export interface CreateSessionResponse {
    session_id: string;
}
export interface SessionState {
    session_id: string;
    created_ts: number;
    messages: Array<{
        id: string;
        role: 'system' | 'user' | 'assistant';
        content: string;
        ts: number;
    }>;
}
export interface GenerateRequest {
    content: string;
    system_prompt?: string;
    persist?: boolean;
    model?: string;
}
export interface GenerateResponse {
    content: string;
}
export interface ConceptGraphResponse {
    concepts: Array<{
        id: string;
        label: string;
        type: string;
        aliases: string[];
        summary: string;
        first_seen_index: number;
        last_seen_index: number;
    }>;
    edges: Array<{
        id: string;
        from_concept_id: string;
        to_concept_id: string;
        relation: string;
        introduced_index: number;
        evidence_msg_id?: string;
        evidence_snippet?: string;
        last_referenced_index?: number;
    }>;
    meta: {
        last_processed_index: number;
        graph_version: string;
        updated_ts: number;
    };
}
export interface GoalResponse {
    goal: string;
}
export declare function createSession(): Promise<CreateSessionResponse>;
export declare function getSessionState(sessionId: string): Promise<SessionState>;
export declare function generateContent(sessionId: string, request: GenerateRequest): Promise<GenerateResponse>;
export declare function buildConceptGraph(sessionId: string, mode?: 'full' | 'incremental'): Promise<ConceptGraphResponse>;
export declare function getConceptGraph(sessionId: string): Promise<ConceptGraphResponse>;
export declare function getGoal(sessionId: string): Promise<GoalResponse>;
export declare function initializeTicTacToeSession(): Promise<{
    sessionId: string;
    conceptGraph: ConceptGraphResponse;
}>;
export declare function convertConceptGraphToNodes(conceptGraph: ConceptGraphResponse): {
    centerNode: NodeContent;
    childNodes: NodeContent[];
};
//# sourceMappingURL=api.d.ts.map