"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
export default function GoalDisplay({ goal, onFinish, isDarkMode = false }) {
    const [isExpanded, setIsExpanded] = useState(false);
    if (!goal)
        return null;
    return (_jsx("div", { className: "absolute top-4 right-4 z-20 max-w-sm", children: _jsx("div", { className: `group relative px-4 py-3 rounded-xl border-2 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg select-none ${isDarkMode
                ? "border-indigo-700 bg-indigo-950/50 text-indigo-100"
                : "border-indigo-300 bg-indigo-50/80 text-indigo-900"} ${isExpanded ? 'min-h-[200px]' : 'min-h-[80px]'}`, children: _jsxs("div", { className: "relative z-10 space-y-2 select-none", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: `font-semibold text-sm select-none flex items-center gap-2 ${isDarkMode ? "opacity-80" : "opacity-70"}`, children: [_jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: _jsx("path", { d: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" }) }), "Goal"] }), _jsx("button", { onClick: () => setIsExpanded(!isExpanded), className: `p-1 rounded-full shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 border opacity-0 group-hover:opacity-100 ${isDarkMode
                                    ? "bg-slate-700 border-slate-600"
                                    : "bg-white border-slate-200"}`, "aria-label": isExpanded ? "Collapse goal" : "Expand goal", children: _jsx("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: `transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''} ${isDarkMode ? "text-slate-300" : "text-slate-600"}`, children: _jsx("path", { d: "M6 9l6 6 6-6" }) }) })] }), _jsx("div", { className: `transition-all duration-300 ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-12 opacity-75'} overflow-hidden`, children: _jsx("div", { className: "whitespace-pre-wrap leading-relaxed select-none text-sm", children: goal.goal_statement }) }), isExpanded && (_jsx("div", { className: `mt-4 pt-3 border-t ${isDarkMode ? "border-indigo-800/50" : "border-indigo-200/50"}`, children: _jsx("button", { onClick: onFinish, className: `w-full px-3 py-2 text-sm font-medium rounded-lg shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 border ${isDarkMode
                                ? "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`, children: "Finish Learning" }) }))] }) }) }));
}
