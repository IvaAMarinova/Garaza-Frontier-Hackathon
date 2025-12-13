"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ChatInput;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
function ChatInput() {
    const [message, setMessage] = (0, react_1.useState)("");
    const textareaRef = (0, react_1.useRef)(null);
    // Auto-resize textarea
    (0, react_1.useEffect)(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [message]);
    const handleSend = () => {
        if (message.trim()) {
            setMessage("");
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
            }
        }
    };
    return ((0, jsx_runtime_1.jsx)("div", { className: "fixed bottom-0 left-0 right-0 flex justify-center pb-4 px-4 z-50", children: (0, jsx_runtime_1.jsx)("div", { className: "w-full max-w-3xl", children: (0, jsx_runtime_1.jsxs)("div", { className: "relative flex items-end gap-2 bg-card border border-border rounded-2xl shadow-lg p-2", children: [(0, jsx_runtime_1.jsx)("textarea", { ref: textareaRef, value: message, onChange: (e) => setMessage(e.target.value), placeholder: "Message...", className: "flex-1 resize-none bg-transparent border-none outline-none px-4 py-3 text-foreground placeholder:text-muted-foreground max-h-32 overflow-y-auto", rows: 1, onKeyDown: (e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        } }), (0, jsx_runtime_1.jsx)("button", { onClick: handleSend, disabled: !message.trim(), className: "flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-1", "aria-label": "Send message", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Send, { className: "w-4 h-4" }) })] }) }) }));
}
