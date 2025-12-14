"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { Plus, Sparkles, ChevronDown } from "lucide-react";
import { CodeBlock } from "./code-block";
import { expandConcept } from "../lib/api";
export function NodeCard({ node, onAddChild, onDelete: _onDelete, onEdit: _onEdit, onRemoveConnection: _onRemoveConnection, onMouseDown, isDragging, isCenter, isNewlyCreated = false, isUpdated = false, sessionId, conceptId, isDarkMode = false, onExpandConcept, onIncrementWeight, }) {
    const [showTextInput, setShowTextInput] = useState(false);
    const [inputText, setInputText] = useState("");
    const [isExpanding, setIsExpanding] = useState(false);
    const [isConceptExpanding, setIsConceptExpanding] = useState(false);
    const [typewriterText, setTypewriterText] = useState(node.content.text);
    const [isTyping, setIsTyping] = useState(false);
    const [lastProcessedText, setLastProcessedText] = useState(node.content.text);
    const typewriterTimerRef = useRef(null);
    const handleTextSubmit = async () => {
        if (inputText.trim() && sessionId && conceptId && onExpandConcept) {
            setIsExpanding(true);
            try {
                // Increment weight on interaction
                if (onIncrementWeight && conceptId) {
                    onIncrementWeight(conceptId, 1);
                }
                // Expand the concept using the API
                const response = await expandConcept(sessionId, conceptId, {
                    expansion: inputText.trim(),
                    auto_refine: true,
                });
                // Update the current node with expanded content and create new children
                onExpandConcept(conceptId, response.concept, response.new_children, response.new_edges);
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
    useEffect(() => {
        // Only process if the text has actually changed from what we last processed
        if (node.content.text !== lastProcessedText) {
            if (isUpdated) {
                // Node was updated, start typewriter effect
                typewriterEffect(node.content.text);
            }
            else {
                // Initial load or normal update, set text immediately
                setTypewriterText(node.content.text);
            }
            setLastProcessedText(node.content.text);
        }
    }, [node.content.text, isUpdated, lastProcessedText]);
    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (typewriterTimerRef.current) {
                clearInterval(typewriterTimerRef.current);
            }
        };
    }, []);
    const typewriterEffect = (text) => {
        // Clear any existing timer
        if (typewriterTimerRef.current) {
            clearInterval(typewriterTimerRef.current);
        }
        setIsTyping(true);
        setTypewriterText("");
        let index = 0;
        typewriterTimerRef.current = setInterval(() => {
            if (index < text.length) {
                setTypewriterText(text.substring(0, index + 1));
                index++;
            }
            else {
                clearInterval(typewriterTimerRef.current);
                typewriterTimerRef.current = null;
                setIsTyping(false);
            }
        }, 15); // Adjust speed here (lower = faster)
    };
    const handleConceptExpansion = async () => {
        if (!sessionId || !conceptId || !onExpandConcept)
            return;
        setIsConceptExpanding(true);
        try {
            // Increment weight on concept expansion
            if (onIncrementWeight && conceptId) {
                onIncrementWeight(conceptId, 1);
            }
            const response = await expandConcept(sessionId, conceptId, {
                auto_refine: true,
            });
            // Call the callback to update the mind map - this will trigger the typewriter effect
            // through the useEffect that watches for node.content.text changes
            onExpandConcept(conceptId, response.concept, response.new_children, response.new_edges);
        }
        catch (error) {
            console.error("Failed to expand concept:", error);
        }
        finally {
            setIsConceptExpanding(false);
        }
    };
    const handleNodeClick = async (e) => {
        // Only increment weight on actual clicks, not drags
        if (e.detail === 1 && onIncrementWeight && conceptId) {
            onIncrementWeight(conceptId, 1);
        }
    };
    return (_jsxs("div", { className: `group relative px-2 py-2 rounded-xl border-2 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg select-none ${node.color} ${isCenter
            ? "px-4 py-3 font-semibold text-base min-w-[80px] max-w-[300px]"
            : "min-w-[60px] max-w-[250px] text-sm"} ${isDragging ? "cursor-grabbing shadow-2xl scale-105 z-50 node-dragging" : "cursor-grab"} ${isUpdated ? "ring-1 ring-green-400/30" : ""}`, onMouseDown: (e) => onMouseDown(e, node.id), onClick: handleNodeClick, "aria-label": `Draggable node: ${node.content.header || node.content.text}`, children: [_jsx("div", { className: "absolute inset-0 z-0", onMouseDown: (e) => onMouseDown(e, node.id), "aria-hidden": "true" }), _jsxs("div", { className: "relative z-10 space-y-2 select-none", role: "region", "aria-label": "Node content", children: [node.content.header && (_jsx("div", { className: "font-semibold text-sm select-none opacity-80", children: node.content.header })), _jsxs("div", { className: "whitespace-pre-wrap break-words leading-relaxed select-none", children: [typewriterText, isTyping && (_jsx("span", { className: "animate-pulse text-blue-500 ml-0.5", children: "|" }))] }), node.content.codeBlock && (_jsx(CodeBlock, { language: node.content.codeBlock.language, code: node.content.codeBlock.code, isDarkMode: isDarkMode })), sessionId && conceptId && onExpandConcept && (_jsx("div", { className: "flex justify-center mt-3", children: _jsxs("button", { type: "button", onClick: (e) => {
                                e.stopPropagation();
                                handleConceptExpansion();
                            }, onMouseDown: (e) => e.stopPropagation(), disabled: isConceptExpanding, className: `group flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full transition-all duration-300 transform hover:scale-105 bg-transparent hover:bg-slate-700/20 text-slate-400 hover:text-slate-200 ${isConceptExpanding ? "opacity-60 cursor-not-allowed scale-95 animate-pulse" : "cursor-pointer"}`, title: "Expand this concept for more details", children: [isConceptExpanding ? (_jsx("div", { className: "animate-spin rounded-full h-3 w-3 border border-current border-t-transparent" })) : (_jsx(ChevronDown, { className: "w-3 h-3 transition-transform duration-300 group-hover:translate-y-0.5" })), _jsx("span", { className: "text-xs font-medium", children: isConceptExpanding ? "expanding..." : "explain more" })] }) }))] }), _jsxs("div", { className: "absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-20", style: {
                    opacity: isNewlyCreated ? 0 : undefined,
                    animation: isNewlyCreated
                        ? "fadeInConnection 0.5s ease-out forwards"
                        : "none",
                }, children: [_jsx("button", { type: "button", onClick: (e) => {
                            e.stopPropagation();
                            onAddChild(node.id, { text: "New Node" });
                        }, onMouseDown: (e) => e.stopPropagation(), className: "p-1 rounded-full shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 border bg-slate-700 border-slate-600", title: "Add child node", children: _jsx(Plus, { className: "w-3 h-3 transition-colors text-slate-300" }) }), _jsx("button", { type: "button", onClick: (e) => {
                            e.stopPropagation();
                            setShowTextInput(true);
                        }, onMouseDown: (e) => e.stopPropagation(), className: "p-1 rounded-full shadow-md hover:shadow-lg hover:scale-110 transition-all border bg-slate-700 border-slate-600", title: "Generate nodes from text", children: _jsx(Sparkles, { className: "w-3 h-3 text-slate-300" }) })] }), showTextInput && (_jsxs("div", { className: "absolute top-full left-0 mt-2 z-50 rounded-lg shadow-xl border p-3 min-w-[250px] bg-slate-800 border-slate-700", onMouseDown: (e) => e.stopPropagation(), onClick: (e) => e.stopPropagation(), children: [_jsx("input", { type: "text", value: inputText, onChange: (e) => setInputText(e.target.value), onKeyDown: handleKeyDown, placeholder: "Enter text...", className: "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 border-slate-600 bg-slate-700 text-slate-100 focus:ring-blue-400", autoFocus: true }), _jsxs("div", { className: "flex gap-2 mt-2", children: [_jsxs("button", { type: "button", onClick: handleTextSubmit, disabled: isExpanding, className: "flex-1 px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-md transition-colors flex items-center justify-center gap-1", children: [isExpanding && (_jsx("div", { className: "animate-spin rounded-full h-3 w-3 border border-white border-t-transparent" })), isExpanding ? "Expanding..." : "Submit"] }), _jsx("button", { type: "button", onClick: () => {
                                    setShowTextInput(false);
                                    setInputText("");
                                }, className: "px-3 py-1.5 text-xs rounded-md transition-colors bg-slate-600 hover:bg-slate-500 text-slate-200", children: "Cancel" })] })] }))] }));
}
