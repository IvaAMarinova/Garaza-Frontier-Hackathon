"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMindMap } from "@/hooks/use-mind-map";
import { NodeCard } from "./node-card";
export default function MindMap({ initialText }) {
    const { isDarkMode, nodes, draggingId, containerRef, connections, backgroundOffset, isPanningBackground, newlyCreatedNodes, updatedNodes, addNode, deleteNode, editNode, removeConnection, handleMouseDown, handleMouseMove, handleMouseUp, handleBackgroundMouseDown, } = useMindMap(initialText);
    return (_jsx("div", { ref: containerRef, className: `relative w-full h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 transition-colors duration-300 ${isPanningBackground ? "cursor-grabbing" : "cursor-grab"}`, onMouseDown: handleBackgroundMouseDown, onMouseMove: handleMouseMove, onMouseUp: handleMouseUp, onMouseLeave: handleMouseUp, role: "application", "aria-label": "Mind map canvas - drag nodes to move them or pan background", children: _jsxs("div", { className: "absolute inset-0 w-full h-full", style: {
                transform: `translate(${backgroundOffset.x}px, ${backgroundOffset.y}px)`,
                transition: isPanningBackground ? "none" : "transform 0.2s ease-out",
            }, children: [_jsx("svg", { className: "absolute inset-0 w-full h-full pointer-events-none", children: connections.map((connection) => {
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
                    return (_jsx("div", { className: `absolute ${draggingId === node.id ? "" : "transition-all duration-200"}`, style: {
                            left: `${node.x}%`,
                            top: `${node.y}%`,
                            transform: "translate(-50%, -50%)",
                            opacity: isNewlyCreated ? 0 : 1,
                            animation: isNewlyCreated
                                ? "fadeIn 0.5s ease-out forwards"
                                : "none",
                        }, children: _jsx(NodeCard, { node: node, onAddChild: addNode, onDelete: deleteNode, onEdit: editNode, onRemoveConnection: removeConnection, onMouseDown: handleMouseDown, isDragging: draggingId === node.id, isCenter: node.parentId === null, isNewlyCreated: isNewlyCreated, isUpdated: isUpdated }) }, node.id));
                })] }) }));
}
