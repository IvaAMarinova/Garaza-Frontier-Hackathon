"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { CodeBlock } from "./code-block";
import { expandConcept, recordGoalInteractions } from "../lib/api";
export function NodeCard({ node, onAddChild, onDelete: _onDelete, onEdit: _onEdit, onRemoveConnection: _onRemoveConnection, onMouseDown, isDragging, isCenter, isNewlyCreated = false, isUpdated = false, sessionId, conceptId, isDarkMode = false, }) {
    const [showTextInput, setShowTextInput] = useState(false);
    const [inputText, setInputText] = useState("");
    const [isExpanding, setIsExpanding] = useState(false);
    const handleTextSubmit = async () => {
        if (inputText.trim() && sessionId && conceptId) {
            setIsExpanding(true);
            try {
                // Expand the concept using the API
                await expandConcept(sessionId, conceptId, {
                    expansion: inputText.trim(),
                    weight: 0.8,
                    strength: 1.0,
                    auto_refine: true
                });
                // Record the interaction
                await recordGoalInteractions(sessionId, {
                    events: [
                        { concept_id: conceptId, event: 'expand', strength: 1.0 }
                    ],
                    auto_refine: true
                });
                // Create child nodes locally
                onAddChild(node.id, { text: inputText.trim() });
                setInputText("");
                setShowTextInput(false);
            }
            catch {
                // Fallback to local creation
                onAddChild(node.id, { text: inputText.trim() });
                setInputText("");
                setShowTextInput(false);
            }
            finally {
                setIsExpanding(false);
            }
        }
        else if (inputText.trim()) {
            // Fallback when no sessionId/conceptId
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
    return (_jsxs("div", { className: `group relative px-2 py-2 rounded-xl border-2 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg select-none ${node.color} ${isCenter
            ? "px-4 py-3 font-semibold text-base min-w-[80px]"
            : "min-w-[60px] text-sm"} ${isDragging ? "cursor-grabbing shadow-2xl scale-105 z-50 node-dragging" : "cursor-grab"} ${isUpdated ? "ring-1 ring-green-400/30" : ""}`, onMouseDown: (e) => onMouseDown(e, node.id), "aria-label": `Draggable node: ${node.content.header || node.content.text}`, children: [_jsx("div", { className: "absolute inset-0 z-0", onMouseDown: (e) => onMouseDown(e, node.id), "aria-hidden": "true" }), _jsxs("div", { className: "relative z-10 space-y-2 select-none", role: "region", "aria-label": "Node content", children: [node.content.header && (_jsx("div", { className: `font-semibold text-sm select-none ${isDarkMode ? "opacity-80" : "opacity-70"}`, children: node.content.header })), _jsx("div", { className: "whitespace-pre-wrap leading-relaxed select-none", children: node.content.text }), node.content.codeBlock && (_jsx(CodeBlock, { language: node.content.codeBlock.language, code: node.content.codeBlock.code, isDarkMode: isDarkMode }))] }), _jsxs("div", { className: "absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-20", style: {
                    opacity: isNewlyCreated ? 0 : undefined,
                    animation: isNewlyCreated
                        ? "fadeInConnection 0.5s ease-out forwards"
                        : "none",
                }, children: [_jsx("button", { type: "button", onClick: (e) => {
                            e.stopPropagation();
                            onAddChild(node.id, { text: "New Node" });
                        }, onMouseDown: (e) => e.stopPropagation(), className: `p-1 rounded-full shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 border ${isDarkMode
                            ? "bg-slate-700 border-slate-600"
                            : "bg-white border-slate-200"}`, title: "Add child node", children: _jsx(Plus, { className: `w-3 h-3 transition-colors ${isDarkMode ? "text-slate-300" : "text-slate-600"}` }) }), _jsx("button", { type: "button", onClick: (e) => {
                            e.stopPropagation();
                            setShowTextInput(true);
                        }, onMouseDown: (e) => e.stopPropagation(), className: `p-1 rounded-full shadow-md hover:shadow-lg hover:scale-110 transition-all border ${isDarkMode
                            ? "bg-slate-700 border-slate-600"
                            : "bg-white border-slate-200"}`, title: "Generate nodes from text", children: _jsx(Sparkles, { className: `w-3 h-3 ${isDarkMode ? "text-slate-300" : "text-slate-600"}` }) })] }), showTextInput && (_jsxs("div", { className: `absolute top-full left-0 mt-2 z-50 rounded-lg shadow-xl border p-3 min-w-[250px] ${isDarkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-white border-slate-200"}`, onMouseDown: (e) => e.stopPropagation(), onClick: (e) => e.stopPropagation(), children: [_jsx("input", { type: "text", value: inputText, onChange: (e) => setInputText(e.target.value), onKeyDown: handleKeyDown, placeholder: "Enter text...", className: `w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 ${isDarkMode
                            ? "border-slate-600 bg-slate-700 text-slate-100 focus:ring-blue-400"
                            : "border-slate-300 bg-white text-slate-900 focus:ring-blue-500"}`, autoFocus: true }), _jsxs("div", { className: "flex gap-2 mt-2", children: [_jsxs("button", { type: "button", onClick: handleTextSubmit, disabled: isExpanding, className: "flex-1 px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-md transition-colors flex items-center justify-center gap-1", children: [isExpanding && (_jsx("div", { className: "animate-spin rounded-full h-3 w-3 border border-white border-t-transparent" })), isExpanding ? 'Expanding...' : 'Submit'] }), _jsx("button", { type: "button", onClick: () => {
                                    setShowTextInput(false);
                                    setInputText("");
                                }, className: `px-3 py-1.5 text-xs rounded-md transition-colors ${isDarkMode
                                    ? "bg-slate-600 hover:bg-slate-500 text-slate-200"
                                    : "bg-slate-200 hover:bg-slate-300 text-slate-700"}`, children: "Cancel" })] })] }))] }));
}
