"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import type { Node, NodeContent } from "@/lib/types"
import { CodeBlock } from "./code-block"

interface NodeCardProps {
  node: Node
  onAddChild: (id: string, content: NodeContent) => void
  onDelete: (id: string) => void
  onEdit: (id: string, content: NodeContent) => void
  onRemoveConnection: (id: string) => void
  onMouseDown: (e: React.MouseEvent, id: string) => void
  isDragging: boolean
  isCenter: boolean
}

export function NodeCard({
  node,
  onAddChild,
  onDelete,
  onEdit,
  onRemoveConnection,
  onMouseDown,
  isDragging,
  isCenter,
}: NodeCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState<NodeContent>(node.content)

  const saveEdit = () => {
    onEdit(node.id, editContent)
    setIsEditing(false)
  }

  const startEditing = () => {
    setEditContent(node.content)
    setIsEditing(true)
  }

  return (
    <div
      className={`group relative px-4 py-3 rounded-2xl border-2 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg ${node.color} ${
        isCenter
          ? "px-6 py-5 font-semibold text-lg min-w-[200px]"
          : "min-w-[180px]"
      } ${isDragging ? "cursor-grabbing shadow-2xl scale-105 z-50" : "cursor-grab"}`}
      onMouseDown={(e) => onMouseDown(e, node.id)}
      aria-label={`Draggable node: ${node.content.header || node.content.text}`}
    >


      <div
        className="space-y-2"
        onMouseDown={(e) => e.stopPropagation()}
        role="region"
        aria-label="Node content"
      >
        {node.content.header && (
          <div className="font-semibold text-sm opacity-70 dark:opacity-80">
            {node.content.header}
          </div>
        )}
        <div className="whitespace-pre-wrap leading-relaxed">
          {node.content.text}
        </div>
        {node.content.codeBlock && (
          <CodeBlock
            language={node.content.codeBlock.language}
            code={node.content.codeBlock.code}
          />
        )}
      </div>

      <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onAddChild(node.id, { text: "New Node" })
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="p-1 bg-white dark:bg-slate-700 rounded-full shadow-md hover:shadow-lg hover:scale-110 transition-all border border-slate-200 dark:border-slate-600"
          title="Add child node"
        >
          <Plus className="w-3 h-3 text-slate-600 dark:text-slate-300" />
        </button>
      </div>
    </div>
  )
}
