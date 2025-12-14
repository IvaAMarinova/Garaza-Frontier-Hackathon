export const LAYOUT_CONSTANTS = {
    NODE_MIN_WIDTH: 180,
    CENTER_NODE_MIN_WIDTH: 200,
    ANIMATION_DURATION: 300,
    COPY_FEEDBACK_DURATION: 2000,
};
// Initial center node position in pixels (will be centered on viewport initially)
// This will be set dynamically based on viewport size
export const INITIAL_CENTER_NODE = {
    id: "1",
    content: {
        text: "",
    },
    x: 0, // Will be set to viewport center
    y: 0, // Will be set to viewport center
    parentId: null,
};
