"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INITIAL_CENTER_NODE = exports.LAYOUT_CONSTANTS = void 0;
exports.LAYOUT_CONSTANTS = {
    NODE_MIN_WIDTH: 180,
    CENTER_NODE_MIN_WIDTH: 200,
    ANIMATION_DURATION: 300,
    COPY_FEEDBACK_DURATION: 2000,
};
// Initial center node position in pixels (will be centered on viewport initially)
// This will be set dynamically based on viewport size
exports.INITIAL_CENTER_NODE = {
    id: "1",
    content: {
        text: "",
    },
    x: 0, // Will be set to viewport center
    y: 0, // Will be set to viewport center
    parentId: null,
};
