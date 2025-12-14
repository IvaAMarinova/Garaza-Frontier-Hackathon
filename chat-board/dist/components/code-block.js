"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
export function CodeBlock({ language, code, isDarkMode = false }) {
    const [copied, setCopied] = useState(false);
    const copyCode = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (_jsxs("div", { className: `relative mt-2 rounded-lg p-3 text-xs font-mono border ${isDarkMode
            ? "bg-black/60 border-slate-800"
            : "bg-slate-900 border-slate-700"}`, children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: `text-[10px] uppercase ${isDarkMode ? "text-slate-500" : "text-slate-400"}`, children: language }), _jsx("button", { type: "button", onClick: copyCode, className: `p-1 rounded transition-all hover:scale-110 ${isDarkMode ? "hover:bg-slate-700" : "hover:bg-slate-800"}`, title: "Copy code", children: copied ? (_jsx(Check, { className: "w-3 h-3 text-green-400" })) : (_jsx(Copy, { className: "w-3 h-3 text-slate-400" })) })] }), _jsx("pre", { className: `overflow-x-auto ${isDarkMode ? "text-slate-400" : "text-slate-300"}`, children: code })] }));
}
