"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
export function CodeBlock({ language, code }) {
    const [copied, setCopied] = useState(false);
    const copyCode = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (_jsxs("div", { className: "relative mt-2 rounded-lg bg-slate-900 dark:bg-black/60 p-3 text-xs font-mono border border-slate-700 dark:border-slate-800", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-slate-400 dark:text-slate-500 text-[10px] uppercase", children: language }), _jsx("button", { type: "button", onClick: copyCode, className: "p-1 hover:bg-slate-800 dark:hover:bg-slate-700 rounded transition-all hover:scale-110", title: "Copy code", children: copied ? (_jsx(Check, { className: "w-3 h-3 text-green-400" })) : (_jsx(Copy, { className: "w-3 h-3 text-slate-400" })) })] }), _jsx("pre", { className: "text-slate-300 dark:text-slate-400 overflow-x-auto", children: code })] }));
}
