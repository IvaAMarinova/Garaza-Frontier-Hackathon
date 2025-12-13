"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import type { Node, NodeContent } from "@/lib/types"
import { NODE_COLORS, CENTER_COLOR } from "@/lib/colors"
import { calculateNewNodePosition } from "@/lib/positioning"
import { LAYOUT_CONSTANTS, INITIAL_CENTER_NODE } from "@/lib/constants"

export function useMindMap() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Node state
  const [nodes, setNodes] = useState<Node[]>([
    { ...INITIAL_CENTER_NODE, color: CENTER_COLOR.light },
  ])

  // Drag state
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    setIsDarkMode(savedTheme === "dark" || (!savedTheme && prefersDark))
  }, [])

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }, [isDarkMode])

  const toggleTheme = useCallback(() => setIsDarkMode(!isDarkMode), [isDarkMode])

  // Node management
  const addNode = useCallback((parentId: string) => {
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
            .map((n) => NODE_COLORS.findIndex((c) => 
              n.color.includes(c.light.split(" ")[0].replace("border-", ""))
            ))
            .filter((i) => i !== -1)
        )

        let colorIndex = 0
        while (usedColorIndices.has(colorIndex) && colorIndex < NODE_COLORS.length) {
          colorIndex++
        }
        if (colorIndex >= NODE_COLORS.length) {
          colorIndex = Math.floor(Math.random() * NODE_COLORS.length)
        }
        nodeColor = NODE_COLORS[colorIndex].light
      }
    } else {
      nodeColor = parent.color
    }

    const position = calculateNewNodePosition(parent, siblings, nodes)
    const newNode: Node = {
      id: Date.now().toString(),
      content: { text: "New Node" },
      x: position.x,
      y: position.y,
      color: nodeColor,
      parentId,
    }

    setNodes(prev => [...prev, newNode])
  }, [nodes])

  const deleteNode = useCallback((id: string) => {
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

    setNodes(prev => prev.filter((n) => !toDelete.has(n.id)))
  }, [nodes])

  const editNode = useCallback((id: string, content: NodeContent) => {
    setNodes(prev => prev.map((n) => (n.id === id ? { ...n, content } : n)))
  }, [])

  const removeConnection = useCallback((childId: string) => {
    setNodes(prev => prev.map((n) => (n.id === childId ? { ...n, parentId: null } : n)))
  }, [])

  // Drag and drop
  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
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
  }, [nodes])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggingId || !containerRef.current) return

    e.preventDefault()
    const rect = containerRef.current.getBoundingClientRect()
    const newX = ((e.clientX - dragOffset.x) / rect.width) * 100
    const newY = ((e.clientY - dragOffset.y) / rect.height) * 100

    const clampedX = Math.max(LAYOUT_CONSTANTS.DRAG_BOUNDARY.MIN, Math.min(LAYOUT_CONSTANTS.DRAG_BOUNDARY.MAX, newX))
    const clampedY = Math.max(LAYOUT_CONSTANTS.DRAG_BOUNDARY.MIN, Math.min(LAYOUT_CONSTANTS.DRAG_BOUNDARY.MAX, newY))

    setNodes(prev => prev.map((n) =>
      n.id === draggingId ? { ...n, x: clampedX, y: clampedY } : n
    ))
  }, [draggingId, dragOffset, nodes])

  const handleMouseUp = useCallback(() => {
    setDraggingId(null)
  }, [])

  // Memoized connections for performance
  const connections = useMemo(() => {
    return nodes
      .map((node) => {
        const parent = nodes.find((n) => n.id === node.parentId)
        if (!parent) return null

        const x1 = (parent.x * window.innerWidth) / 100
        const y1 = (parent.y * window.innerHeight) / 100
        const x2 = (node.x * window.innerWidth) / 100
        const y2 = (node.y * window.innerHeight) / 100
        const midX = (x1 + x2) / 2
        const midY = (y1 + y2) / 2

        const colorData = NODE_COLORS.find((c) => 
          node.color.includes(c.light.split(" ")[0].replace("border-", ""))
        )
        const strokeColor = isDarkMode
          ? colorData?.darkConnection || CENTER_COLOR.darkConnection
          : colorData?.connection || CENTER_COLOR.connection

        return {
          id: node.id,
          path: `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`,
          strokeColor,
        }
      })
      .filter(Boolean)
  }, [nodes, isDarkMode])

  return {
    // State
    isDarkMode,
    nodes,
    draggingId,
    containerRef,
    connections,
    
    // Actions
    toggleTheme,
    addNode,
    deleteNode,
    editNode,
    removeConnection,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  }
}