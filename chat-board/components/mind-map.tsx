"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Moon, Sun } from "lucide-react"
import type { NodeData, NodeContent } from "@/lib/types"
import { NODE_COLORS, CENTER_COLOR } from "@/lib/colors"
import { calculateNewNodePosition } from "@/lib/positioning"
import { ConnectionLines } from "./connection-lines"
import { NodeCard } from "./node-card"

type Node = NodeData

export default function MindMap() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [nodes, setNodes] = useState<Node[]>([
    {
      id: "1",
      content: {
        text: "Central Idea",
      },
      x: 50,
      y: 50,
      color: CENTER_COLOR.light,
      parentId: null,
    },
  ])
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDarkMode])

  const addNode = (parentId: string) => {
    const parent = nodes.find((n) => n.id === parentId)
    if (!parent) return

    const siblings = nodes.filter((n) => n.parentId === parentId)

    let nodeColor: string
    if (parent.parentId === null) {
      if (siblings.length > 0) {
        nodeColor = siblings[0].color
      } else {
        const usedColorIndices = new Set(
          nodes
            .filter((n) => n.parentId === "1")
            .map((n) => {
              return NODE_COLORS.findIndex((c) => n.color.includes(c.light.split(" ")[0].replace("border-", "")))
            })
            .filter((i) => i !== -1),
        )

        let colorIndex = 0
        while (usedColorIndices.has(colorIndex) && colorIndex < NODE_COLORS.length) {
          colorIndex++
        }
        if (colorIndex >= NODE_COLORS.length) colorIndex = Math.floor(Math.random() * NODE_COLORS.length)

        nodeColor = NODE_COLORS[colorIndex].light
      }
    } else {
      nodeColor = parent.color
    }

    const position = calculateNewNodePosition(parent, siblings, nodes)

    const newNode: Node = {
      id: Date.now().toString(),
      content: {
        text: "New Node",
      },
      x: position.x,
      y: position.y,
      color: nodeColor,
      parentId,
    }

    setNodes([...nodes, newNode])
  }

  const deleteNode = (id: string) => {
    const toDelete = new Set([id])
    let changed = true

    while (changed) {
      changed = false
      nodes.forEach((node) => {
        if (node.parentId && toDelete.has(node.parentId) && !toDelete.has(node.id)) {
          toDelete.add(node.id)
          changed = true
        }
      })
    }

    setNodes(nodes.filter((n) => !toDelete.has(n.id)))
  }

  const editNode = (id: string, content: NodeContent) => {
    setNodes(nodes.map((n) => (n.id === id ? { ...n, content } : n)))
  }

  const removeConnection = (childId: string) => {
    setNodes(nodes.map((n) => (n.id === childId ? { ...n, parentId: null } : n)))
  }

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId)
    if (!node || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const nodeX = (node.x * rect.width) / 100
    const nodeY = (node.y * rect.height) / 100

    setDraggingId(nodeId)
    setDragOffset({
      x: e.clientX - nodeX,
      y: e.clientY - nodeY,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !containerRef.current) return

    e.preventDefault()

    const rect = containerRef.current.getBoundingClientRect()
    const newX = ((e.clientX - dragOffset.x) / rect.width) * 100
    const newY = ((e.clientY - dragOffset.y) / rect.height) * 100

    setNodes(
      nodes.map((n) =>
        n.id === draggingId ? { ...n, x: Math.max(5, Math.min(95, newX)), y: Math.max(5, Math.min(95, newY)) } : n,
      ),
    )
  }

  const handleMouseUp = () => {
    setDraggingId(null)
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 transition-colors duration-300"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="absolute top-4 right-4 z-10 p-3 bg-white dark:bg-slate-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-slate-200 dark:border-slate-700"
        title="Toggle dark mode"
      >
        {isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-700" />}
      </button>

      <ConnectionLines nodes={nodes} isDarkMode={isDarkMode} />

      {nodes.map((node) => (
        <div
          key={node.id}
          className={`absolute ${draggingId === node.id ? "" : "transition-all duration-200"}`}
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <NodeCard
            node={node}
            onAddChild={addNode}
            onDelete={deleteNode}
            onEdit={editNode}
            onRemoveConnection={removeConnection}
            onMouseDown={handleMouseDown}
            isDragging={draggingId === node.id}
            isCenter={node.parentId === null}
          />
        </div>
      ))}
    </div>
  )
}
