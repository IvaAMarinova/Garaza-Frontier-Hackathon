export interface TextSegment {
    type: 'text' | 'link';
    content: string;
    url?: string;
}
/**
 * Processes text and creates segments for rendering with hyperlinks
 */
export declare function processTextWithDocLinks(text: string, docLinks: Record<string, string>): TextSegment[];
/**
 * Processes overlay content and applies doc_links hyperlinking
 */
export declare function processOverlayContent(content: string, docLinks: Record<string, string>): TextSegment[];
//# sourceMappingURL=text-utils.d.ts.map