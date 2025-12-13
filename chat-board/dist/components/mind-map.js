"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MindMap;
const jsx_runtime_1 = require("react/jsx-runtime");
const use_mind_map_1 = require("@/hooks/use-mind-map");
const node_card_1 = require("./node-card");
function MindMap({ initialText }) {
    const { isDarkMode, nodes, draggingId, containerRef, connections, backgroundOffset, isPanningBackground, newlyCreatedNodes, updatedNodes, addNode, deleteNode, editNode, removeConnection, handleMouseDown, handleMouseMove, handleMouseUp, handleBackgroundMouseDown, } = (0, use_mind_map_1.useMindMap)(initialText);
    return ((0, jsx_runtime_1.jsx)("div", { ref: containerRef, className: `relative w-full h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 transition-colors duration-300 ${isPanningBackground ? "cursor-grabbing" : "cursor-grab"}`, onMouseDown: handleBackgroundMouseDown, onMouseMove: handleMouseMove, onMouseUp: handleMouseUp, onMouseLeave: handleMouseUp, role: "application", "aria-label": "Mind map canvas - drag nodes to move them or pan background", children: (0, jsx_runtime_1.jsxs)("div", { className: "absolute inset-0 w-full h-full", style: {
                transform: `translate(${backgroundOffset.x}px, ${backgroundOffset.y}px)`,
                transition: isPanningBackground ? "none" : "transform 0.2s ease-out",
            }, children: [(0, jsx_runtime_1.jsx)("svg", { className: "absolute inset-0 w-full h-full pointer-events-none", children: connections.map((connection) => {
                        const isNewConnection = newlyCreatedNodes.has(connection.id);
                        return ((0, jsx_runtime_1.jsx)("g", { children: (0, jsx_runtime_1.jsx)("path", { d: connection.path, stroke: connection.strokeColor, strokeWidth: "2", fill: "none", className: "transition-all duration-300", style: {
                                    opacity: isNewConnection ? 0 : 1,
                                    animation: isNewConnection
                                        ? "fadeInConnection 0.5s ease-out forwards"
                                        : "none",
                                } }) }, `connection-${connection.id}`));
                    }) }), nodes.map((node) => {
                    const isNewlyCreated = newlyCreatedNodes.has(node.id);
                    const isUpdated = updatedNodes.has(node.id);
                    return ((0, jsx_runtime_1.jsx)("div", { className: `absolute ${draggingId === node.id ? "" : "transition-all duration-200"}`, style: {
                            left: `${node.x}%`,
                            top: `${node.y}%`,
                            transform: "translate(-50%, -50%)",
                            opacity: isNewlyCreated ? 0 : 1,
                            animation: isNewlyCreated
                                ? "fadeIn 0.5s ease-out forwards"
                                : "none",
                        }, children: (0, jsx_runtime_1.jsx)(node_card_1.NodeCard, { node: node, onAddChild: addNode, onDelete: deleteNode, onEdit: editNode, onRemoveConnection: removeConnection, onMouseDown: handleMouseDown, isDragging: draggingId === node.id, isCenter: node.parentId === null, isNewlyCreated: isNewlyCreated, isUpdated: isUpdated }) }, node.id));
                })] }) }));
}
