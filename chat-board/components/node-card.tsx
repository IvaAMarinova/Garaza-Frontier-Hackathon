"use client"

import { useState } from "react"
import { Plus, Sparkles } from "lucide-react"
import type { Node, NodeContent } from "../lib/types"
import { CodeBlock } from "./code-block"
import { LAYOUT_CONSTANTS } from "../lib/constants"

interface NodeCardProps {
  node: Node
  onAddChild: (id: string, content: NodeContent) => void
  onDelete: (id: string) => void
  onEdit: (id: string, content: NodeContent) => void
  onRemoveConnection: (id: string) => void
  onMouseDown: (e: React.MouseEvent, id: string) => void
  isDragging: boolean
  isCenter: boolean
  isNewlyCreated?: boolean
  isUpdated?: boolean
}

export function NodeCard({
  node,
  onAddChild,
  onDelete: _onDelete,
  onEdit: _onEdit,
  onRemoveConnection: _onRemoveConnection,
  onMouseDown,
  isDragging,
  isCenter,
  isNewlyCreated = false,
  isUpdated = false,
}: NodeCardProps) {
  const [showTextInput, setShowTextInput] = useState(false)
  const [inputText, setInputText] = useState("")

  const handleTextSubmit = () => {
    if (inputText.trim()) {
      // For now, create two child nodes with the input text
      // TODO: Send to API and create nodes based on API response
      onAddChild(node.id, { text: inputText.trim() })
      onAddChild(node.id, { text: inputText.trim() })
      setInputText("")
      setShowTextInput(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleTextSubmit()
    } else if (e.key === "Escape") {
      setShowTextInput(false)
      setInputText("")
    }
  }

  return (
    <div
      className={`group relative px-2 py-2 rounded-xl border-2 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg select-none ${node.color} ${
        isCenter
          ? "px-4 py-3 font-semibold text-base min-w-[80px]"
          : "min-w-[60px] text-sm"
      } ${isDragging ? "cursor-grabbing shadow-2xl scale-105 z-50 node-dragging" : "cursor-grab"} ${
        isUpdated ? "ring-1 ring-green-400/30" : ""
      }`}
      onMouseDown={(e) => onMouseDown(e, node.id)}
      aria-label={`Draggable node: ${node.content.header || node.content.text}`}
    >
      {/* Invisible drag overlay to ensure entire node is draggable */}
      <div
        className="absolute inset-0 z-0"
        onMouseDown={(e) => onMouseDown(e, node.id)}
        aria-hidden="true"
      />
      
      <div
        className="relative z-10 space-y-2 select-none"
        role="region"
        aria-label="Node content"
      >
        {node.content.header && (
          <div className="font-semibold text-sm opacity-70 dark:opacity-80 select-none">
            {node.content.header}
          </div>
        )}
        <div className="whitespace-pre-wrap leading-relaxed select-none">
          {node.content.text}
        </div>
        {node.content.codeBlock && (
          <CodeBlock
            language={node.content.codeBlock.language}
            code={node.content.codeBlock.code}
          />
        )}
      </div>

      <div
        className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-20"
        style={{
          opacity: isNewlyCreated ? 0 : undefined,
          animation: isNewlyCreated
            ? "fadeInConnection 0.5s ease-out forwards"
            : "none",
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onAddChild(node.id, { text: "New Node" })
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="p-1 bg-white dark:bg-slate-700 rounded-full shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 border border-slate-200 dark:border-slate-600"
          title="Add child node"
        >
          <Plus className="w-3 h-3 text-slate-600 dark:text-slate-300 transition-colors" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setShowTextInput(true)
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="p-1 bg-white dark:bg-slate-700 rounded-full shadow-md hover:shadow-lg hover:scale-110 transition-all border border-slate-200 dark:border-slate-600"
          title="Generate nodes from text"
        >
          <Sparkles className="w-3 h-3 text-slate-600 dark:text-slate-300" />
        </button>
      </div>

      {showTextInput && (
        <div
          className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-3 min-w-[250px]"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter text..."
            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={handleTextSubmit}
              className="flex-1 px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={() => {
                setShowTextInput(false)
                setInputText("")
              }}
              className="px-3 py-1.5 text-xs bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
