"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMindMap } from "../hooks/use-mind-map";
import { NodeCard } from "./node-card";
import GoalDisplay from "./goal-display";
import CongratulationsPage from "./congratulations-page";
export default function MindMap({ initialText, isDarkMode = true, onStartNewJourney, containerHeight, }) {
    const { nodes, draggingId, containerRef, connections, backgroundOffset, isPanningBackground, newlyCreatedNodes, updatedNodes, sessionId, isLoading, zoomLevel, goal, showCongratulations, addNode, deleteNode, editNode, removeConnection, zoomIn, zoomOut, resetZoom, handleFinish, handleCloseCongratulations, handleMouseDown, handleBackgroundMouseDown, } = useMindMap(initialText, isDarkMode, onStartNewJourney);
    return (_jsxs("div", { ref: containerRef, className: `mind-map-canvas relative w-full overflow-hidden bg-gradient-to-br transition-colors duration-300 ${containerHeight ? "" : "h-screen"} ${isDarkMode
            ? "from-slate-950 to-slate-900"
            : "from-slate-50 to-slate-100"} ${isPanningBackground ? "cursor-grabbing" : "cursor-grab"}`, style: containerHeight ? { height: containerHeight } : undefined, onMouseDown: handleBackgroundMouseDown, role: "application", "aria-label": "Mind map canvas - drag nodes to move them or pan background", children: [isLoading && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-black/30 z-50", children: _jsxs("div", { className: "flex flex-col items-center", children: [_jsxs("div", { className: "relative w-24 h-24 mb-6", children: [_jsx("div", { className: "absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 border-r-indigo-400 animate-spin" }), _jsx("div", { className: "absolute inset-2 rounded-full border-4 border-transparent border-b-purple-500 border-l-purple-400", style: { animation: "spin 1.5s linear infinite reverse" } }), _jsx("div", { className: "absolute inset-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse" }), _jsx("div", { className: "absolute -top-1 left-1/2 w-2 h-2 bg-indigo-400 rounded-full animate-bounce", style: { animationDelay: "0s" } }), _jsx("div", { className: "absolute top-1/2 -right-1 w-2 h-2 bg-purple-400 rounded-full animate-bounce", style: { animationDelay: "0.5s" } }), _jsx("div", { className: "absolute -bottom-1 left-1/2 w-2 h-2 bg-indigo-400 rounded-full animate-bounce", style: { animationDelay: "1s" } }), _jsx("div", { className: "absolute top-1/2 -left-1 w-2 h-2 bg-purple-400 rounded-full animate-bounce", style: { animationDelay: "1.5s" } })] }), _jsx("span", { className: `text-lg font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`, children: "Creating your mind map..." }), _jsx("span", { className: `text-sm mt-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`, children: "Mapping concepts and connections" })] }) })), _jsx(GoalDisplay, { goal: goal, onFinish: handleFinish, isDarkMode: isDarkMode }), sessionId && !isLoading && (_jsxs("div", { className: `absolute top-4 left-4 rounded-lg px-3 py-2 text-xs backdrop-blur-sm ${isDarkMode
                    ? "bg-slate-800/90 text-slate-400"
                    : "bg-white/90 text-slate-600"}`, children: ["Session: ", sessionId.slice(0, 8), "..."] })), _jsxs("div", { className: "absolute bottom-4 right-4 flex flex-col gap-2 z-10", children: [_jsx("button", { onClick: zoomIn, className: `w-10 h-10 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-200 flex items-center justify-center ${isDarkMode
                            ? "bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-slate-100"
                            : "bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900"}`, "aria-label": "Zoom in", children: _jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("circle", { cx: "11", cy: "11", r: "8" }), _jsx("path", { d: "M21 21l-4.35-4.35" }), _jsx("line", { x1: "8", y1: "11", x2: "14", y2: "11" }), _jsx("line", { x1: "11", y1: "8", x2: "11", y2: "14" })] }) }), _jsx("button", { onClick: zoomOut, className: `w-10 h-10 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-200 flex items-center justify-center ${isDarkMode
                            ? "bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-slate-100"
                            : "bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900"}`, "aria-label": "Zoom out", children: _jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("circle", { cx: "11", cy: "11", r: "8" }), _jsx("path", { d: "M21 21l-4.35-4.35" }), _jsx("line", { x1: "8", y1: "11", x2: "14", y2: "11" })] }) }), _jsx("button", { onClick: resetZoom, className: `w-10 h-10 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-200 flex items-center justify-center ${isDarkMode
                            ? "bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-slate-100"
                            : "bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900"}`, "aria-label": "Reset zoom", children: _jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }), _jsx("path", { d: "M21 3v5h-5" }), _jsx("path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }), _jsx("path", { d: "M3 21v-5h5" })] }) }), _jsxs("div", { className: `rounded-lg px-2 py-1 text-xs backdrop-blur-sm text-center ${isDarkMode
                            ? "bg-slate-800/90 text-slate-400"
                            : "bg-white/90 text-slate-600"}`, children: [Math.round(zoomLevel * 100), "%"] })] }), _jsxs("div", { className: "absolute canvas-container", style: {
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                    transform: `translate(${backgroundOffset.x}px, ${backgroundOffset.y}px) scale(${zoomLevel})`,
                    transformOrigin: "0 0",
                    transition: isPanningBackground ? "none" : "transform 0.2s ease-out",
                }, onMouseDown: handleBackgroundMouseDown, children: [_jsx("svg", { className: `absolute pointer-events-none ${draggingId ? "dragging-active" : ""}`, style: {
                            left: "-100000px",
                            top: "-100000px",
                            width: "200000px",
                            height: "200000px",
                        }, viewBox: "-100000 -100000 200000 200000", preserveAspectRatio: "none", children: connections.map((connection) => {
                            const isNewConnection = newlyCreatedNodes.has(connection.id);
                            return (_jsx("g", { children: _jsx("path", { d: connection.path, stroke: connection.strokeColor, strokeWidth: "2", fill: "none", className: draggingId ? "" : "transition-all duration-300", style: {
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
                            }, children: _jsx(NodeCard, { node: node, onAddChild: addNode, onDelete: deleteNode, onEdit: editNode, onRemoveConnection: removeConnection, onMouseDown: handleMouseDown, isDragging: draggingId === node.id, isCenter: node.parentId === null, isNewlyCreated: isNewlyCreated, isUpdated: isUpdated, sessionId: sessionId || undefined, conceptId: node.conceptId, isDarkMode: isDarkMode }) }, node.id));
                    })] }), showCongratulations && (_jsxs("div", { className: "absolute inset-0 z-50", children: [_jsx("div", { className: "absolute inset-0 backdrop-blur-md bg-black/30" }), _jsx(CongratulationsPage, { goal: goal, initialText: initialText, onClose: handleCloseCongratulations, isDarkMode: isDarkMode })] }))] }));
}
