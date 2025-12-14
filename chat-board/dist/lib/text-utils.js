/**
 * Processes text and creates segments for rendering with hyperlinks
 */
export function processTextWithDocLinks(text, docLinks) {
    if (!docLinks || Object.keys(docLinks).length === 0) {
        return [{ type: 'text', content: text }];
    }
    // Sort keys by length (longest first) to handle overlapping matches correctly
    const sortedKeys = Object.keys(docLinks).sort((a, b) => b.length - a.length);
    let result = [{ type: 'text', content: text }];
    sortedKeys.forEach((key) => {
        const url = docLinks[key];
        const newResult = [];
        result.forEach((segment) => {
            if (segment.type === 'text') {
                // Split the string by the key (case-insensitive)
                const regex = new RegExp(`(${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                const parts = segment.content.split(regex);
                parts.forEach((part) => {
                    if (part && part.toLowerCase() === key.toLowerCase()) {
                        // This part matches the key, create a link segment
                        newResult.push({
                            type: 'link',
                            content: part,
                            url: url
                        });
                    }
                    else if (part) {
                        // This part doesn't match, keep as text
                        newResult.push({
                            type: 'text',
                            content: part
                        });
                    }
                });
            }
            else {
                // This segment is already a link, keep it as is
                newResult.push(segment);
            }
        });
        result = newResult;
    });
    return result;
}
/**
 * Processes overlay content and applies doc_links hyperlinking
 */
export function processOverlayContent(content, docLinks) {
    return processTextWithDocLinks(content, docLinks);
}
