"use client"

import type React from "react"
import { useState } from "react"
import { Plus, X, Edit2, GripVertical, Copy, Check } from "lucide-react"
import type { Node, NodeContent } from "@/lib/types"

type NodeCardProps = {
  node: Node
  onAddChild: (parentId: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string, content: NodeContent) => void
  onRemoveConnection: (id: string) => void
  onMouseDown: (e: React.MouseEvent, nodeId: string) => void
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
  const [copied, setCopied] = useState(false)

  const saveEdit = () => {
    onEdit(node.id, editContent)
    setIsEditing(false)
  }

  const copyCode = async () => {
    if (node.content.codeBlock) {
      await navigator.clipboard.writeText(node.content.codeBlock.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div
      className={`
        group relative px-4 py-3 rounded-2xl border-2 shadow-sm backdrop-blur-sm
        transition-all duration-300 hover:shadow-lg
        ${node.color}
        ${isCenter ? "px-6 py-5 font-semibold text-lg min-w-[200px]" : "min-w-[180px]"}
        ${isDragging ? "cursor-grabbing shadow-2xl scale-105 z-50" : "cursor-grab"}
      `}
      onMouseDown={(e) => {
        if (!isEditing) {
          onMouseDown(e, node.id)
        }
      }}
    >
      <div
        className="absolute -top-3 left-1/2 -translate-x-1/2 p-1 bg-white dark:bg-slate-700 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200"
        onMouseDown={(e) => onMouseDown(e, node.id)}
      >
        <GripVertical className="w-4 h-4 text-slate-400 dark:text-slate-300" />
      </div>

      {isEditing ? (
        <div
          className="space-y-3 animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <input
            type="text"
            placeholder="Header (optional)"
            value={editContent.header || ""}
            onChange={(e) => setEditContent({ ...editContent, header: e.target.value })}
            className="w-full px-2 py-1 text-sm bg-white dark:bg-slate-900 dark:text-slate-100 rounded border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 transition-all"
          />
          <textarea
            value={editContent.text}
            onChange={(e) => setEditContent({ ...editContent, text: e.target.value })}
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
                    codeBlock: { ...editContent.codeBlock!, code: e.target.value },
                  })
                }
                className="w-full px-2 py-1 text-xs font-mono bg-white dark:bg-slate-900 dark:text-slate-100 rounded border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 min-h-[40px] transition-all"
              />
            )}
          </div>
          <button
            onClick={saveEdit}
            className="px-3 py-1 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 rounded-lg text-sm hover:bg-slate-700 dark:hover:bg-slate-300 transition-all hover:scale-105 flex items-center gap-1"
          >
            <Check className="w-3 h-3" />
            Save
          </button>
        </div>
      ) : (
        <div className="space-y-2" onMouseDown={(e) => e.stopPropagation()}>
          {node.content.header && (
            <div className="font-semibold text-sm opacity-70 dark:opacity-80">{node.content.header}</div>
          )}
          <div className="whitespace-pre-wrap leading-relaxed">{node.content.text}</div>
          {node.content.codeBlock && (
            <div className="relative mt-2 rounded-lg bg-slate-900 dark:bg-black/60 p-3 text-xs font-mono border border-slate-700 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase">
                  {node.content.codeBlock.language}
                </span>
                <button
                  onClick={copyCode}
                  className="p-1 hover:bg-slate-800 dark:hover:bg-slate-700 rounded transition-all hover:scale-110"
                  title="Copy code"
                >
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                </button>
              </div>
              <pre className="text-slate-300 dark:text-slate-400 overflow-x-auto">{node.content.codeBlock.code}</pre>
            </div>
          )}
        </div>
      )}

      {!isEditing && (
        <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <button
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
            onClick={(e) => {
              e.stopPropagation()
              setIsEditing(true)
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
    </div>
  )
}
