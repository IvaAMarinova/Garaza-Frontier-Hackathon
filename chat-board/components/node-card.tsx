"use client"

import { useState } from "react"
import { Plus, X, Edit2, GripVertical, Check } from "lucide-react"
import type { Node, NodeContent } from "@/lib/types"
import { CodeBlock } from "./code-block"

interface NodeCardProps {
  node: Node
  onAddChild: (id: string) => void
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
    <button
      type="button"
      className={`group relative px-4 py-3 rounded-2xl border-2 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg ${node.color} ${
        isCenter
          ? "px-6 py-5 font-semibold text-lg min-w-[200px]"
          : "min-w-[180px]"
      } ${isDragging ? "cursor-grabbing shadow-2xl scale-105 z-50" : "cursor-grab"}`}
      onMouseDown={(e) => !isEditing && onMouseDown(e, node.id)}
      disabled={isEditing}
      aria-label={`Draggable node: ${node.content.header || node.content.text}`}
    >
      <button
        type="button"
        className="absolute -top-3 left-1/2 -translate-x-1/2 p-1 bg-white dark:bg-slate-700 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200"
        onMouseDown={(e) => onMouseDown(e, node.id)}
        title="Drag to move node"
        aria-label="Drag to move node"
      >
        <GripVertical className="w-4 h-4 text-slate-400 dark:text-slate-300" />
      </button>

      {isEditing ? (
        <form
          className="space-y-3 animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onSubmit={(e) => {
            e.preventDefault()
            saveEdit()
          }}
          aria-label="Edit node content"
        >
          <input
            type="text"
            placeholder="Header (optional)"
            value={editContent.header || ""}
            onChange={(e) =>
              setEditContent({ ...editContent, header: e.target.value })
            }
            className="w-full px-2 py-1 text-sm bg-white dark:bg-slate-900 dark:text-slate-100 rounded border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 transition-all"
          />
          <textarea
            value={editContent.text}
            onChange={(e) =>
              setEditContent({ ...editContent, text: e.target.value })
            }
            className="w-full px-2 py-1 bg-white dark:bg-slate-900 dark:text-slate-100 rounded border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 min-h-[60px] transition-all"
            autoFocus
          />
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Code language (e.g., bash)"
              value={editContent.codeBlock?.language || ""}
              onChange={(e) =>
                setEditContent({
                  ...editContent,
                  codeBlock: e.target.value
                    ? {
                        language: e.target.value,
                        code: editContent.codeBlock?.code || "",
                      }
                    : undefined,
                })
              }
              className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 dark:text-slate-100 rounded border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 transition-all"
            />
            {editContent.codeBlock && (
              <textarea
                placeholder="Code snippet"
                value={editContent.codeBlock.code}
                onChange={(e) =>
                  setEditContent({
                    ...editContent,
                    codeBlock: {
                      ...editContent.codeBlock!,
                      code: e.target.value,
                    },
                  })
                }
                className="w-full px-2 py-1 text-xs font-mono bg-white dark:bg-slate-900 dark:text-slate-100 rounded border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 min-h-[40px] transition-all"
              />
            )}
          </div>
          <button
            type="submit"
            className="px-3 py-1 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 rounded-lg text-sm hover:bg-slate-700 dark:hover:bg-slate-300 transition-all hover:scale-105 flex items-center gap-1"
          >
            <Check className="w-3 h-3" />
            Save
          </button>
        </form>
      ) : (
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
      )}

      {!isEditing && (
        <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onAddChild(node.id)
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-1 bg-white dark:bg-slate-700 rounded-full shadow-md hover:shadow-lg hover:scale-110 transition-all border border-slate-200 dark:border-slate-600"
            title="Add child node"
          >
            <Plus className="w-3 h-3 text-slate-600 dark:text-slate-300" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              startEditing()
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-1 bg-white dark:bg-slate-700 rounded-full shadow-md hover:shadow-lg hover:scale-110 transition-all border border-slate-200 dark:border-slate-600"
            title="Edit node"
          >
            <Edit2 className="w-3 h-3 text-slate-600 dark:text-slate-300" />
          </button>
          {node.parentId && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveConnection(node.id)
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="p-1 bg-white dark:bg-slate-700 rounded-full shadow-md hover:shadow-lg hover:scale-110 transition-all border border-slate-200 dark:border-slate-600"
                title="Remove connection"
              >
                <X className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(node.id)
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="p-1 bg-white dark:bg-slate-700 rounded-full shadow-md hover:shadow-lg hover:scale-110 transition-all border border-slate-200 dark:border-slate-600"
                title="Delete node"
              >
                <X className="w-3 h-3 text-red-600 dark:text-red-400" />
              </button>
            </>
          )}
        </div>
      )}
    </button>
  )
}
