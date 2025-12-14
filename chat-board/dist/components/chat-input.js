"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
export default function ChatInput({ onSend, isCentered = false, isDarkMode: _isDarkMode = false }) {
    const [message, setMessage] = useState("");
    const textareaRef = useRef(null);
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
            setMessage("");
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
            }
            if (onSend) {
                onSend(messageToSend);
            }
        }
    };
    return (_jsx("div", { className: "fixed left-0 right-0 flex justify-center px-4 z-50 transition-all duration-700 ease-in-out", style: {
            bottom: isCentered ? '50%' : '0',
            transform: isCentered ? 'translateY(-50%)' : 'translateY(0)',
            paddingBottom: isCentered ? '0' : '1rem'
        }, children: _jsx("div", { className: "w-full max-w-3xl", children: _jsxs("div", { className: "relative flex items-end gap-2 bg-card border border-border rounded-2xl shadow-lg p-2", children: [_jsx("textarea", { ref: textareaRef, value: message, onChange: (e) => setMessage(e.target.value), placeholder: "Message...", className: "flex-1 resize-none bg-transparent border-none outline-none px-4 py-3 text-foreground placeholder:text-muted-foreground max-h-32 overflow-y-auto", rows: 1, onKeyDown: (e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        } }), _jsx("button", { onClick: handleSend, disabled: !message.trim(), className: "flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-1", "aria-label": "Send message", children: _jsx(Send, { className: "w-4 h-4" }) })] }) }) }));
}
