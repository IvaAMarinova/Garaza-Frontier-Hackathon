"use client"

import { useState, useRef, useEffect } from "react"
import { Send } from "lucide-react"

interface ChatInputProps {
  onSend?: (message: string) => void
  isCentered?: boolean
}

export default function ChatInput({ onSend, isCentered = false }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  const handleSend = () => {
    if (message.trim()) {
      const messageToSend = message.trim()
      setMessage("")
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
      if (onSend) {
        onSend(messageToSend)
      }
    }
  }

  return (
    <div 
      className={`fixed left-0 right-0 flex justify-center px-4 z-50 transition-all duration-500 ease-in-out ${
        isCentered 
          ? "top-1/2 -translate-y-1/2 pb-0" 
          : "bottom-0 pb-4"
      }`}
    >
      <div className="w-full max-w-3xl">
        <div className="relative flex items-end gap-2 bg-card border border-border rounded-2xl shadow-lg p-2">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message..."
            className="flex-1 resize-none bg-transparent border-none outline-none px-4 py-3 text-foreground placeholder:text-muted-foreground max-h-32 overflow-y-auto"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-1"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
