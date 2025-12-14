"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
export default function GoalDisplay({ goal, onFinish, isDarkMode = false, }) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [shownOverlayIds, setShownOverlayIds] = useState([]);
    const scrollContainerRef = useRef(null);
    // Track new overlays and add them to shown list
    useEffect(() => {
        if (goal?.overlays) {
            const currentOverlayIds = goal.overlays.map((overlay) => overlay.id);
            const newIds = currentOverlayIds.filter((id) => !shownOverlayIds.includes(id));
            if (newIds.length > 0) {
                console.log(`📝 New overlay(s) detected! Total overlays: ${goal.overlays.length}, New: ${newIds.length}, New IDs: [${newIds.join(", ")}]`);
                setShownOverlayIds(currentOverlayIds);
            }
        }
    }, [goal?.overlays, shownOverlayIds]);
    if (!goal)
        return null;
    return (_jsx("div", { className: "absolute top-4 right-4 z-20 w-96 max-w-[calc(100vw-2rem)] pointer-events-auto", children: _jsxs("div", { className: `group relative rounded-xl border-2 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg select-none pointer-events-auto border-indigo-700 bg-indigo-950/50 text-indigo-100 ${isExpanded ? "max-h-[70vh]" : "h-20"} flex flex-col`, onMouseDown: (e) => e.stopPropagation(), onTouchStart: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-start justify-between px-4 py-3 flex-shrink-0", children: [_jsxs("div", { className: "font-semibold text-sm select-none flex items-center gap-2 opacity-80", children: [_jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: _jsx("path", { d: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" }) }), "Goal"] }), _jsx("button", { onClick: () => setIsExpanded(!isExpanded), className: "p-1 rounded-full shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 border opacity-0 group-hover:opacity-100 bg-slate-700 border-slate-600", "aria-label": isExpanded ? "Collapse goal" : "Expand goal", children: _jsx("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: `transition-transform duration-200 ${isExpanded ? "rotate-180" : ""} text-slate-300`, children: _jsx("path", { d: "M6 9l6 6 6-6" }) }) })] }), _jsx("div", { ref: scrollContainerRef, className: `transition-all duration-300 scrollbar-thin scrollbar-track-indigo-950/20 scrollbar-thumb-indigo-600/50 hover:scrollbar-thumb-indigo-500/70 ${isExpanded
                        ? "flex-1 opacity-100 overflow-y-auto px-4 pb-3"
                        : "h-0 opacity-75 overflow-hidden"}`, style: {
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#4f46e5 transparent'
                    }, children: _jsxs("div", { className: "whitespace-pre-wrap leading-relaxed select-none text-sm", children: [goal.answer_markdown, goal?.overlays && shownOverlayIds.length > 0 && (_jsx(_Fragment, { children: goal.overlays
                                    .filter((overlay) => shownOverlayIds.includes(overlay.id))
                                    .sort((a, b) => a.depth - b.depth)
                                    .map((overlay) => (_jsx("span", { children: "\n\n" + overlay.content_markdown }, overlay.id))) }))] }) }), isExpanded && (_jsx("div", { className: "px-4 pb-3 pt-3 border-t flex-shrink-0 border-indigo-800/50", children: _jsx("button", { onClick: onFinish, className: "w-full px-3 py-2 text-sm font-medium rounded-lg shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 border bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600", children: "Finish Learning" }) }))] }) }));
}
