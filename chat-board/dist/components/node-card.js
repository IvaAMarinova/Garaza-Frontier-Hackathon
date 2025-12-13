"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeCard = NodeCard;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const code_block_1 = require("./code-block");
function NodeCard({ node, onAddChild, onDelete: _onDelete, onEdit: _onEdit, onRemoveConnection: _onRemoveConnection, onMouseDown, isDragging, isCenter, isNewlyCreated = false, isUpdated = false, }) {
    const [showTextInput, setShowTextInput] = (0, react_1.useState)(false);
    const [inputText, setInputText] = (0, react_1.useState)("");
    const handleTextSubmit = () => {
        if (inputText.trim()) {
            // For now, create two child nodes with the input text
            // TODO: Send to API and create nodes based on API response
            onAddChild(node.id, { text: inputText.trim() });
            onAddChild(node.id, { text: inputText.trim() });
            setInputText("");
            setShowTextInput(false);
        }
    };
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleTextSubmit();
        }
        else if (e.key === "Escape") {
            setShowTextInput(false);
            setInputText("");
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: `group relative px-4 py-3 rounded-2xl border-2 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg ${node.color} ${isCenter
            ? "px-6 py-5 font-semibold text-lg min-w-[200px]"
            : "min-w-[180px]"} ${isDragging ? "cursor-grabbing shadow-2xl scale-105 z-50" : "cursor-grab"} ${isUpdated ? "ring-1 ring-green-400/30" : ""}`, onMouseDown: (e) => onMouseDown(e, node.id), "aria-label": `Draggable node: ${node.content.header || node.content.text}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", onMouseDown: (e) => e.stopPropagation(), role: "region", "aria-label": "Node content", children: [node.content.header && ((0, jsx_runtime_1.jsx)("div", { className: "font-semibold text-sm opacity-70 dark:opacity-80", children: node.content.header })), (0, jsx_runtime_1.jsx)("div", { className: "whitespace-pre-wrap leading-relaxed", children: node.content.text }), node.content.codeBlock && ((0, jsx_runtime_1.jsx)(code_block_1.CodeBlock, { language: node.content.codeBlock.language, code: node.content.codeBlock.code }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200", style: {
                    opacity: isNewlyCreated ? 0 : undefined,
                    animation: isNewlyCreated
                        ? "fadeInConnection 0.5s ease-out forwards"
                        : "none",
                }, children: [(0, jsx_runtime_1.jsx)("button", { type: "button", onClick: (e) => {
                            e.stopPropagation();
                            onAddChild(node.id, { text: "New Node" });
                        }, onMouseDown: (e) => e.stopPropagation(), className: "p-1 bg-white dark:bg-slate-700 rounded-full shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 border border-slate-200 dark:border-slate-600", title: "Add child node", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { className: "w-3 h-3 text-slate-600 dark:text-slate-300 transition-colors" }) }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: (e) => {
                            e.stopPropagation();
                            setShowTextInput(true);
                        }, onMouseDown: (e) => e.stopPropagation(), className: "p-1 bg-white dark:bg-slate-700 rounded-full shadow-md hover:shadow-lg hover:scale-110 transition-all border border-slate-200 dark:border-slate-600", title: "Generate nodes from text", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Sparkles, { className: "w-3 h-3 text-slate-600 dark:text-slate-300" }) })] }), showTextInput && ((0, jsx_runtime_1.jsxs)("div", { className: "absolute top-full left-0 mt-2 z-50 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-3 min-w-[250px]", onMouseDown: (e) => e.stopPropagation(), children: [(0, jsx_runtime_1.jsx)("input", { type: "text", value: inputText, onChange: (e) => setInputText(e.target.value), onKeyDown: handleKeyDown, placeholder: "Enter text...", className: "w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400", autoFocus: true }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-2 mt-2", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", onClick: handleTextSubmit, className: "flex-1 px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors", children: "Submit" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => {
                                    setShowTextInput(false);
                                    setInputText("");
                                }, className: "px-3 py-1.5 text-xs bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 rounded-md transition-colors", children: "Cancel" })] })] }))] }));
}
