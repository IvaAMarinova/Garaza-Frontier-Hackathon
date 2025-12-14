"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { processOverlayContent } from "../lib/text-utils";
function OverlayContent({ content, docLinks }) {
    const segments = processOverlayContent(content, docLinks);
    return (_jsx("span", { children: segments.map((segment, index) => {
            if (segment.type === "link" && segment.url) {
                return (_jsx("a", { href: segment.url, target: "_blank", rel: "noopener noreferrer", className: "underline transition-colors text-blue-400 hover:text-blue-300 decoration-blue-400/30 hover:decoration-blue-300/50", children: segment.content }, index));
            }
            return _jsx("span", { children: segment.content }, index);
        }) }));
}
export default function CongratulationsPage({ goal, initialText: _initialText, onClose, isDarkMode = false, }) {
    const [windowDimensions, setWindowDimensions] = useState({
        width: 0,
        height: 0,
    });
    // Get full content (goal + all overlays)
    const getFullContent = () => {
        if (!goal)
            return "";
        let content = goal.answer_markdown;
        if (goal.overlays && goal.overlays.length > 0) {
            const sortedOverlays = goal.overlays.sort((a, b) => a.depth - b.depth);
            sortedOverlays.forEach((overlay) => {
                content += "\n\n" + overlay.content_markdown;
            });
        }
        return content;
    };
    useEffect(() => {
        const updateWindowDimensions = () => {
            setWindowDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };
        updateWindowDimensions();
        window.addEventListener("resize", updateWindowDimensions);
        return () => {
            window.removeEventListener("resize", updateWindowDimensions);
        };
    }, []);
    return (_jsxs("div", { className: "absolute inset-0 flex items-center justify-center pointer-events-auto", children: [_jsx(Confetti, { width: windowDimensions.width, height: windowDimensions.height, recycle: true, numberOfPieces: 150, gravity: 0.2 }), _jsxs("div", { className: "relative max-w-5xl max-h-[90vh] overflow-y-auto mx-4 px-6 py-6 rounded-xl border-2 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg pointer-events-auto border-indigo-700 bg-indigo-950/50 text-indigo-100", onClick: (e) => e.stopPropagation(), children: [_jsx("button", { onClick: onClose, className: "absolute top-3 right-3 p-1 rounded-full shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 border pointer-events-auto bg-slate-700 border-slate-600 text-slate-300", "aria-label": "Close congratulations page", children: _jsx("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: _jsx("path", { d: "M18 6L6 18M6 6l12 12" }) }) }), _jsx("div", { className: "text-center mb-6", children: _jsx("h1", { className: "text-lg font-semibold mb-2 text-indigo-100", children: "Showcase Complete!" }) }), goal && (_jsxs("div", { className: "p-4 rounded-lg border-2 mb-6 border-yellow-600 bg-yellow-900/40", style: {
                            animation: "pulse-scale 2s ease-in-out infinite",
                        }, children: [_jsxs("div", { className: "font-semibold text-base mb-3 flex items-center gap-2 justify-center text-yellow-200", children: [_jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: _jsx("path", { d: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" }) }), "Your Complete Learning Journey"] }), _jsxs("div", { className: "text-sm leading-relaxed whitespace-pre-wrap text-yellow-300", children: [goal.answer_markdown, goal.overlays && goal.overlays.length > 0 && (_jsx(_Fragment, { children: goal.overlays
                                            .sort((a, b) => a.depth - b.depth)
                                            .map((overlay) => (_jsxs("span", { children: ["\n\n", _jsx(OverlayContent, { content: overlay.content_markdown, docLinks: overlay.doc_links || {}, isDarkMode: isDarkMode })] }, overlay.id))) }))] })] })), _jsxs("div", { className: "mb-4", children: [_jsx("p", { className: "text-xs text-slate-400/70 mb-3 text-center italic font-light", children: "Not convinced yet?" }), _jsx("h3", { className: "text-xs font-semibold mb-2 text-center text-indigo-200", children: "Continue Learning" }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsx("a", { href: "https://react.dev/learn", target: "_blank", rel: "noopener noreferrer", className: "block p-2 rounded-lg border transition-all duration-200 hover:scale-105 hover:shadow-md text-xs pointer-events-auto border-indigo-800/50 bg-indigo-900/30 hover:border-indigo-600 text-indigo-200", onClick: (e) => e.stopPropagation(), children: _jsxs("div", { className: "flex items-center gap-1", children: [_jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }), _jsx("polyline", { points: "14,2 14,8 20,8" }), _jsx("line", { x1: "16", y1: "13", x2: "8", y2: "13" }), _jsx("line", { x1: "16", y1: "17", x2: "8", y2: "17" }), _jsx("polyline", { points: "10,9 9,9 8,9" })] }), _jsx("span", { className: "font-medium", children: "React Docs" })] }) }), _jsx("a", { href: "https://react.dev/learn/tutorial-tic-tac-toe", target: "_blank", rel: "noopener noreferrer", className: "block p-2 rounded-lg border transition-all duration-200 hover:scale-105 hover:shadow-md text-xs pointer-events-auto border-indigo-800/50 bg-indigo-900/30 hover:border-indigo-600 text-indigo-200", onClick: (e) => e.stopPropagation(), children: _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: _jsx("polygon", { points: "13 2 3 14 12 14 11 22 21 10 12 10 13 2" }) }), _jsx("span", { className: "font-medium", children: "Tutorial" })] }) }), _jsx("a", { href: "https://react.dev/learn/thinking-in-react", target: "_blank", rel: "noopener noreferrer", className: "block p-2 rounded-lg border transition-all duration-200 hover:scale-105 hover:shadow-md text-xs pointer-events-auto border-indigo-800/50 bg-indigo-900/30 hover:border-indigo-600 text-indigo-200", onClick: (e) => e.stopPropagation(), children: _jsxs("div", { className: "flex items-center gap-1", children: [_jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("circle", { cx: "12", cy: "12", r: "3" }), _jsx("path", { d: "M12 1v6m0 6v6m11-7h-6m-6 0H1" })] }), _jsx("span", { className: "font-medium", children: "Thinking" })] }) }), _jsx("a", { href: "https://react.dev/reference/react", target: "_blank", rel: "noopener noreferrer", className: "block p-2 rounded-lg border transition-all duration-200 hover:scale-105 hover:shadow-md text-xs pointer-events-auto border-indigo-800/50 bg-indigo-900/30 hover:border-indigo-600 text-indigo-200", onClick: (e) => e.stopPropagation(), children: _jsxs("div", { className: "flex items-center gap-1", children: [_jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("path", { d: "M9 12l2 2 4-4" }), _jsx("path", { d: "M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3" }), _jsx("path", { d: "M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3" }), _jsx("path", { d: "M13 12h3" }), _jsx("path", { d: "M8 12H5" })] }), _jsx("span", { className: "font-medium", children: "Hooks" })] }) })] })] }), _jsx("div", { className: "text-center", children: _jsx("button", { onClick: onClose, className: "px-4 py-2 text-xs font-medium rounded-lg shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-blue-600 text-blue-400 bg-transparent hover:bg-blue-600 hover:text-white pointer-events-auto", children: "Try it out again!" }) })] })] }));
}
