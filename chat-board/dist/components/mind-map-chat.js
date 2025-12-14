"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import MindMap from "./mind-map";
export default function MindMapChat({ isDarkMode = false, className = "", height = "600px", }) {
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [userInput, setUserInput] = useState("");
    const [message, setMessage] = useState("");
    const [showCongratulations, setShowCongratulations] = useState(false);
    const [showWhisper, setShowWhisper] = useState(false);
    const [showMainText, setShowMainText] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const textareaRef = useRef(null);
    // Smooth fade-in sequence
    useEffect(() => {
        const timer1 = setTimeout(() => setShowWhisper(true), 300);
        const timer2 = setTimeout(() => setShowMainText(true), 1200);
        const timer3 = setTimeout(() => setShowChat(true), 2000);
        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, []);
    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [message]);
    const handleSend = () => {
        if (message.trim()) {
            const messageToSend = message.trim();
            setUserInput(messageToSend);
            setMessage("");
            setHasSubmitted(true);
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
            }
        }
    };
    return (_jsx("div", { className: `relative border border-border rounded-lg overflow-hidden bg-card ${className}`, style: { height }, children: _jsxs("div", { className: "relative w-full h-full overflow-hidden", children: [hasSubmitted && (_jsx("div", { className: "absolute inset-0", children: _jsx(MindMap, { initialText: userInput, isDarkMode: isDarkMode, containerHeight: "100%", onCongratulationsChange: setShowCongratulations }) })), !showCongratulations && (_jsx("div", { className: `absolute left-0 right-0 flex justify-center px-4 z-50 transition-all duration-1000 ease-in-out ${showChat ? 'opacity-100' : 'opacity-0'}`, style: {
                        bottom: hasSubmitted ? '1rem' : '50%',
                        transform: hasSubmitted ? 'translateY(0)' : 'translateY(50%)',
                    }, children: _jsxs("div", { className: "w-full max-w-3xl", children: [!hasSubmitted && (_jsxs("div", { className: "text-center mb-6", children: [_jsx("p", { className: `text-xs text-slate-400/60 mb-3 italic font-light tracking-wide transition-opacity duration-1000 ${showWhisper ? 'opacity-100' : 'opacity-0'}`, children: "let us convince you why you should use React JS..." }), _jsx("h1", { className: `text-2xl font-semibold text-slate-100 transition-opacity duration-1000 ${showMainText ? 'opacity-100' : 'opacity-0'}`, children: "What are you building today?" })] })), _jsxs("div", { className: "relative flex items-end gap-2 border-2 border-blue-700 bg-blue-950/50 backdrop-blur-sm rounded-2xl shadow-lg p-2", children: [_jsx("textarea", { ref: textareaRef, value: message, onChange: (e) => setMessage(e.target.value), placeholder: "Message...", className: "flex-1 resize-none bg-transparent border-none outline-none px-4 py-3 text-blue-100 placeholder:text-blue-400/60 max-h-32 overflow-y-auto", rows: 1, onKeyDown: (e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSend();
                                            }
                                        } }), _jsx("button", { onClick: handleSend, disabled: !message.trim(), className: "flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-1", "aria-label": "Send message", children: _jsx(Send, { className: "w-4 h-4" }) })] })] }) }))] }) }));
}
