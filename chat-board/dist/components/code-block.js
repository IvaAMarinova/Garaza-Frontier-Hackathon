"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeBlock = CodeBlock;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
function CodeBlock({ language, code }) {
    const [copied, setCopied] = (0, react_1.useState)(false);
    const copyCode = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "relative mt-2 rounded-lg bg-slate-900 dark:bg-black/60 p-3 text-xs font-mono border border-slate-700 dark:border-slate-800", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mb-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-slate-400 dark:text-slate-500 text-[10px] uppercase", children: language }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: copyCode, className: "p-1 hover:bg-slate-800 dark:hover:bg-slate-700 rounded transition-all hover:scale-110", title: "Copy code", children: copied ? ((0, jsx_runtime_1.jsx)(lucide_react_1.Check, { className: "w-3 h-3 text-green-400" })) : ((0, jsx_runtime_1.jsx)(lucide_react_1.Copy, { className: "w-3 h-3 text-slate-400" })) })] }), (0, jsx_runtime_1.jsx)("pre", { className: "text-slate-300 dark:text-slate-400 overflow-x-auto", children: code })] }));
}
