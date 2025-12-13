export const LAYOUT_CONSTANTS = {
  NODE_MIN_WIDTH: 180,
  CENTER_NODE_MIN_WIDTH: 200,
  DRAG_BOUNDARY: {
    MIN: 5,
    MAX: 95,
  },
  ANIMATION_DURATION: 300,
  COPY_FEEDBACK_DURATION: 2000,
} as const

export const INITIAL_CENTER_NODE = {
  id: "1",
  content: {
    text: "",
  },
  x: 50,
  y: 50,
  parentId: null,
} as const
