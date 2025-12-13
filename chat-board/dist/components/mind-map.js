"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMindMap } from "../hooks/use-mind-map";
import { NodeCard } from "./node-card";
export default function MindMap({ initialText }) {
    const { isDarkMode, nodes, draggingId, containerRef, connections, backgroundOffset, isPanningBackground, newlyCreatedNodes, updatedNodes, addNode, deleteNode, editNode, removeConnection, handleMouseDown, handleMouseMove, handleMouseUp, handleBackgroundMouseDown, } = useMindMap(initialText);
    return (_jsx("div", { ref: containerRef, className: `relative w-full h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 transition-colors duration-300 ${isPanningBackground ? "cursor-grabbing" : "cursor-grab"}`, onMouseDown: handleBackgroundMouseDown, role: "application", "aria-label": "Mind map canvas - drag nodes to move them or pan background", children: _jsxs("div", { className: "absolute canvas-container", style: {
                left: 0,
                top: 0,
                width: "100%",
                height: "100%",
                transform: `translate(${backgroundOffset.x}px, ${backgroundOffset.y}px)`,
                transition: isPanningBackground ? "none" : "transform 0.2s ease-out",
            }, onMouseDown: handleBackgroundMouseDown, children: [_jsx("svg", { className: "absolute pointer-events-none", style: {
                        left: "-100000px",
                        top: "-100000px",
                        width: "200000px",
                        height: "200000px",
                    }, viewBox: "-100000 -100000 200000 200000", preserveAspectRatio: "none", children: connections.map((connection) => {
                        const isNewConnection = newlyCreatedNodes.has(connection.id);
                        return (_jsx("g", { children: _jsx("path", { d: connection.path, stroke: connection.strokeColor, strokeWidth: "2", fill: "none", className: "transition-all duration-300", style: {
                                    opacity: isNewConnection ? 0 : 1,
                                    animation: isNewConnection
                                        ? "fadeInConnection 0.5s ease-out forwards"
                                        : "none",
                                } }) }, `connection-${connection.id}`));
                    }) }), nodes.map((node) => {
                    const isNewlyCreated = newlyCreatedNodes.has(node.id);
                    const isUpdated = updatedNodes.has(node.id);
                    return (_jsx("div", { "data-node-id": node.id, className: `absolute ${draggingId === node.id ? "" : "transition-all duration-200"}`, style: {
                            left: `${node.x}px`,
                            top: `${node.y}px`,
                            transform: "translate(-50%, -50%)",
                            opacity: isNewlyCreated ? 0 : 1,
                            animation: isNewlyCreated
                                ? "fadeIn 0.5s ease-out forwards"
                                : "none",
                        }, children: _jsx(NodeCard, { node: node, onAddChild: addNode, onDelete: deleteNode, onEdit: editNode, onRemoveConnection: removeConnection, onMouseDown: handleMouseDown, isDragging: draggingId === node.id, isCenter: node.parentId === null, isNewlyCreated: isNewlyCreated, isUpdated: isUpdated }) }, node.id));
                })] }) }));
}
