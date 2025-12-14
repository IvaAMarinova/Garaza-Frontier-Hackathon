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
        weight: number;
        expansions: string[];
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
        weight: number;
    }>;
    meta: {
        last_processed_index: number;
        graph_version: string;
        updated_ts: number;
    };
}
export interface OverlayModel {
    id: string;
    concept_id: string;
    depth: number;
    content_markdown: string;
    doc_links: Record<string, string>;
}
export interface FocusModel {
    interest_score: number;
    confusion_score: number;
    mastery_score: number;
    unknownness: number;
}
export interface GoalMetaModel {
    global_answer_depth: number;
    last_updated_ts: number;
    last_refined_concepts: string[];
}
export interface GoalResponse {
    id: string;
    goal_statement: string;
    answer_markdown: string;
    overlays: OverlayModel[];
    focus: Record<string, FocusModel>;
    meta: GoalMetaModel;
}
export interface SimpleGoalResponse {
    goal: string;
}
export interface ConceptExpandRequest {
    expansion?: string;
    weight?: number;
    strength?: number;
    auto_refine?: boolean;
}
export interface ConceptExpandResponse {
    concept: {
        id: string;
        label: string;
        type: string;
        aliases: string[];
        summary: string;
        first_seen_index: number;
        last_seen_index: number;
        weight: number;
        expansions: string[];
    };
    new_children: Array<{
        id: string;
        label: string;
        type: string;
        aliases: string[];
        summary: string;
        first_seen_index: number;
        last_seen_index: number;
        weight: number;
        expansions: string[];
    }>;
    new_edges: Array<{
        id: string;
        from_concept_id: string;
        to_concept_id: string;
        relation: string;
        introduced_index: number;
        evidence_msg_id?: string;
        evidence_snippet?: string;
        last_referenced_index?: number;
    }>;
}
export interface CreateGoalRequest {
    force?: boolean;
}
export interface GoalInteractionEvent {
    concept_id: string;
    event: 'expand' | 'revisit';
    strength: number;
}
export interface GoalInteractionsRequest {
    events: GoalInteractionEvent[];
    auto_refine?: boolean;
}
export declare function createSession(): Promise<CreateSessionResponse>;
export declare function getSessionState(sessionId: string): Promise<SessionState>;
export declare function generateContent(sessionId: string, request: GenerateRequest): Promise<GenerateResponse>;
export declare function buildConceptGraph(sessionId: string, mode?: 'full' | 'incremental'): Promise<ConceptGraphResponse>;
export declare function getConceptGraph(sessionId: string): Promise<ConceptGraphResponse>;
export declare function getGoal(sessionId: string, createIfMissing?: boolean): Promise<GoalResponse>;
export declare function createGoal(sessionId: string, request?: CreateGoalRequest): Promise<GoalResponse>;
export declare function expandConcept(sessionId: string, conceptId: string, request: ConceptExpandRequest): Promise<ConceptExpandResponse>;
export declare function initializeTicTacToeSession(prompt?: string): Promise<{
    sessionId: string;
    conceptGraph: ConceptGraphResponse;
}>;
export interface ConceptGraphNode extends NodeContent {
    conceptId: string;
    level: number;
    parentConceptId?: string;
    weight?: number;
    completed?: boolean;
}
export declare function convertConceptGraphToNodes(conceptGraph: ConceptGraphResponse): {
    centerNode: ConceptGraphNode;
    childNodes: Array<ConceptGraphNode>;
};
//# sourceMappingURL=api.d.ts.map