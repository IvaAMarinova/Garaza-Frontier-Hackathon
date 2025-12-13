"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import type { Node, NodeContent } from "../lib/types"
import { NODE_COLORS, CENTER_COLOR } from "../lib/colors"
import { calculateNewNodePosition, adjustNodesForNewNode, MIN_DISTANCE } from "../lib/positioning"
import { INITIAL_CENTER_NODE } from "../lib/constants"
import { initializeTicTacToeSession, convertConceptGraphToNodes } from "../lib/api"
export function useMindMap(initialText?: string) {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Node state - initialize center node at viewport center
  const [nodes, setNodes] = useState<Node[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Initialize with tic tac toe concept graph
  useEffect(() => {
    if (containerRef.current && !isInitialized) {
      const rect = containerRef.current.getBoundingClientRect()
      
      const initializeWithBackend = async () => {
        setIsLoading(true)
        try {
          const { sessionId: newSessionId, conceptGraph } = await initializeTicTacToeSession()
          setSessionId(newSessionId)
          
          const { centerNode, childNodes } = convertConceptGraphToNodes(conceptGraph)
          
          // Create center node (position in unscaled coordinates)
          const centerNodeObj: Node = {
            ...INITIAL_CENTER_NODE,
            x: rect.width / 2,
            y: rect.height / 2,
            content: centerNode,
            color: CENTER_COLOR.light,
          }
          
          // Create child nodes using proper positioning logic
          const childNodeObjs: Node[] = []
          const allNodes = [centerNodeObj] // Start with just center node
          
          childNodes.forEach((content, index) => {
            const siblings = childNodeObjs // Previously created siblings
            const position = calculateNewNodePosition(centerNodeObj, siblings, allNodes)
            
            const childNode = {
              id: crypto.randomUUID(),
              content,
              x: position.x,
              y: position.y,
              color: NODE_COLORS[index % NODE_COLORS.length].light,
              parentId: centerNodeObj.id,
            }
            
            childNodeObjs.push(childNode)
            allNodes.push(childNode) // Add to all nodes for next iteration
          })
          
          // Start with just the center node
          setNodes([centerNodeObj])
          
          // Add child nodes one by one with delays
          childNodeObjs.forEach((childNode, index) => {
            setTimeout(() => {
              setNodes(prevNodes => [...prevNodes, childNode])
              // Add to newly created nodes for animation
              setNewlyCreatedNodes(prev => new Set([...prev, childNode.id]))
              
              // Remove animation after duration
              setTimeout(() => {
                setNewlyCreatedNodes(prev => {
                  const updated = new Set(prev)
                  updated.delete(childNode.id)
                  return updated
                })
              }, 500)
            }, (index + 1) * 300) // 300ms delay between each node
          })
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Failed to initialize with backend:', error)
          // Fallback to default initialization
          setNodes([
            {
              ...INITIAL_CENTER_NODE,
              x: rect.width / 2,
              y: rect.height / 2,
              content: { text: initialText || "Tic Tac Toe Game", header: "Game Concept" },
              color: CENTER_COLOR.light,
            },
          ])
        } finally {
          setIsLoading(false)
          setIsInitialized(true)
        }
      }
      
      initializeWithBackend()
    }
  }, [initialText, isInitialized])

  // Drag state
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isPanningBackground, setIsPanningBackground] = useState(false)
  const [backgroundOffset, setBackgroundOffset] = useState({ x: 0, y: 0 })
  const [panStartPos, setPanStartPos] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Zoom state
  const [zoomLevel, setZoomLevel] = useState(1)
  const MIN_ZOOM = 0.1
  const MAX_ZOOM = 3

  // Animation state
  const [newlyCreatedNodes, setNewlyCreatedNodes] = useState<Set<string>>(
    new Set()
  )
  const [updatedNodes, setUpdatedNodes] = useState<Set<string>>(new Set())

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches
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

  const toggleTheme = useCallback(
    () => setIsDarkMode(!isDarkMode),
    [isDarkMode]
  )

  // Node management
  const addNode = useCallback((parentId: string, content: NodeContent) => {
    setNodes((prevNodes) => {
      const parent = prevNodes.find((n) => n.id === parentId)
      if (!parent) return prevNodes

      const siblings = prevNodes.filter((n) => n.parentId === parentId)
      let nodeColor: string

      if (parent.parentId === null) {
        // This is a first-level child of the center node - assign a unique color
        const usedColorIndices = new Set(
          prevNodes
            .filter((n) => n.parentId === "1")
            .map((n) =>
              NODE_COLORS.findIndex((c) =>
                n.color.includes(c.light.split(" ")[0].replace("border-", ""))
              )
            )
            .filter((i) => i !== -1)
        )

        let colorIndex = 0
        while (
          usedColorIndices.has(colorIndex) &&
          colorIndex < NODE_COLORS.length
        ) {
          colorIndex++
        }
        if (colorIndex >= NODE_COLORS.length) {
          colorIndex = Math.floor(Math.random() * NODE_COLORS.length)
        }
        nodeColor = NODE_COLORS[colorIndex].light
      } else {
        // This is a deeper level node - inherit parent's color
        nodeColor = parent.color
      }

      const position = calculateNewNodePosition(parent, siblings, prevNodes)
      const newNode: Node = {
        id: crypto.randomUUID(),
        content,
        x: position.x,
        y: position.y,
        color: nodeColor,
        parentId,
      }

      // Adjust existing nodes to make room for the new node
      const adjustedNodes = adjustNodesForNewNode(position, newNode.id, prevNodes)

      // Add creation animation
      setNewlyCreatedNodes((prev) => new Set([...prev, newNode.id]))

      // Remove animation after duration
      setTimeout(() => {
        setNewlyCreatedNodes((prev) => {
          const updated = new Set(prev)
          updated.delete(newNode.id)
          return updated
        })
      }, 300)

      return [...adjustedNodes, newNode]
    })
  }, [])

  const deleteNode = useCallback(
    (id: string) => {
      const toDelete = new Set([id])
      let changed = true

      while (changed) {
        changed = false
        nodes.forEach((node) => {
          if (
            node.parentId &&
            toDelete.has(node.parentId) &&
            !toDelete.has(node.id)
          ) {
            toDelete.add(node.id)
            changed = true
          }
        })
      }

      setNodes((prev) => prev.filter((n) => !toDelete.has(n.id)))
    },
    [nodes]
  )

  const editNode = useCallback((id: string, content: NodeContent) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, content } : n)))

    // Add update animation
    setUpdatedNodes((prev) => new Set([...prev, id]))

    // Remove animation after duration
    setTimeout(() => {
      setUpdatedNodes((prev) => {
        const updated = new Set(prev)
        updated.delete(id)
        return updated
      })
    }, 400)
  }, [])

  const removeConnection = useCallback((childId: string) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === childId ? { ...n, parentId: null } : n))
    )
  }, [])

  // Drag and drop
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      // Stop propagation to prevent panning
      e.stopPropagation()
      
      const node = nodes.find((n) => n.id === nodeId)
      if (!node || !containerRef.current) return

      // Calculate node position in screen coordinates (accounting for pan offset and zoom)
      const nodeX = node.x * zoomLevel + backgroundOffset.x
      const nodeY = node.y * zoomLevel + backgroundOffset.y

      setDraggingId(nodeId)
      setDragOffset({
        x: e.clientX - nodeX,
        y: e.clientY - nodeY,
      })
    },
    [nodes, backgroundOffset, zoomLevel]
  )

  // Zoom functions
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel + delta))
    
    if (newZoom !== zoomLevel) {
      // Calculate zoom center point (mouse position)
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        const centerX = e.clientX - rect.left
        const centerY = e.clientY - rect.top
        
        // Adjust background offset to zoom towards mouse position
        const zoomRatio = newZoom / zoomLevel
        const newOffsetX = centerX - (centerX - backgroundOffset.x) * zoomRatio
        const newOffsetY = centerY - (centerY - backgroundOffset.y) * zoomRatio
        
        setBackgroundOffset({ x: newOffsetX, y: newOffsetY })
      }
      
      setZoomLevel(newZoom)
    }
  }, [zoomLevel, backgroundOffset])

  const zoomIn = useCallback(() => {
    const newZoom = Math.min(MAX_ZOOM, zoomLevel + 0.2)
    if (newZoom !== zoomLevel) {
      // Zoom towards center of viewport
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        const centerX = rect.width / 2
        const centerY = rect.height / 2
        
        const zoomRatio = newZoom / zoomLevel
        const newOffsetX = centerX - (centerX - backgroundOffset.x) * zoomRatio
        const newOffsetY = centerY - (centerY - backgroundOffset.y) * zoomRatio
        
        setBackgroundOffset({ x: newOffsetX, y: newOffsetY })
      }
      
      setZoomLevel(newZoom)
    }
  }, [zoomLevel, backgroundOffset])

  const zoomOut = useCallback(() => {
    const newZoom = Math.max(MIN_ZOOM, zoomLevel - 0.2)
    if (newZoom !== zoomLevel) {
      // Zoom towards center of viewport
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        const centerX = rect.width / 2
        const centerY = rect.height / 2
        
        const zoomRatio = newZoom / zoomLevel
        const newOffsetX = centerX - (centerX - backgroundOffset.x) * zoomRatio
        const newOffsetY = centerY - (centerY - backgroundOffset.y) * zoomRatio
        
        setBackgroundOffset({ x: newOffsetX, y: newOffsetY })
      }
      
      setZoomLevel(newZoom)
    }
  }, [zoomLevel, backgroundOffset])

  const resetZoom = useCallback(() => {
    setZoomLevel(1)
    setBackgroundOffset({ x: 0, y: 0 })
  }, [])

  // Add wheel event listener for zooming
  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false })
      return () => {
        container.removeEventListener('wheel', handleWheel)
      }
    }
  }, [handleWheel])

  // Add keyboard shortcuts for zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '=':
          case '+':
            e.preventDefault()
            zoomIn()
            break
          case '-':
            e.preventDefault()
            zoomOut()
            break
          case '0':
            e.preventDefault()
            resetZoom()
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [zoomIn, zoomOut, resetZoom])

  // Use document-level mouse events for proper panning/dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingId) {
        // Node dragging - convert screen coordinates to canvas coordinates (accounting for zoom)
        const newX = (e.clientX - dragOffset.x - backgroundOffset.x) / zoomLevel
        const newY = (e.clientY - dragOffset.y - backgroundOffset.y) / zoomLevel

        // Check for overlaps and push other nodes away if needed
        
        setNodes((prev) => {
          const draggingNode = prev.find((n) => n.id === draggingId)
          if (!draggingNode) return prev
          
          let updatedNodes = [...prev]
          
          // Check for overlaps and push other nodes away
          const overlappingNodes = prev.filter((node) => {
            if (node.id === draggingId) return false
            const distance = Math.sqrt(
              Math.pow(node.x - newX, 2) + Math.pow(node.y - newY, 2)
            )
            return distance < MIN_DISTANCE
          })

          // Push overlapping nodes away
          overlappingNodes.forEach((overlappingNode) => {
            const dx = overlappingNode.x - newX
            const dy = overlappingNode.y - newY
            const currentDistance = Math.sqrt(dx * dx + dy * dy)
            
            if (currentDistance > 0) {
              // Calculate push direction (away from dragging node)
              const pushDistance = MIN_DISTANCE - currentDistance + 10 // Extra padding
              const pushX = (dx / currentDistance) * pushDistance
              const pushY = (dy / currentDistance) * pushDistance
              
              // Update the overlapping node's position
              updatedNodes = updatedNodes.map((n) =>
                n.id === overlappingNode.id
                  ? { ...n, x: overlappingNode.x + pushX, y: overlappingNode.y + pushY }
                  : n
              )
            }
          })

          // Update the dragging node position
          updatedNodes = updatedNodes.map((n) =>
            n.id === draggingId ? { ...n, x: newX, y: newY } : n
          )
          
          return updatedNodes
        })
      } else if (isPanningBackground) {
        // Background panning
        const deltaX = e.clientX - panStartPos.x
        const deltaY = e.clientY - panStartPos.y

        setBackgroundOffset((prev) => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY,
        }))

        setPanStartPos({ x: e.clientX, y: e.clientY })
      }
    }

    const handleMouseUp = () => {
      setDraggingId(null)
      setIsPanningBackground(false)
    }

    if (draggingId || isPanningBackground) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [draggingId, dragOffset, isPanningBackground, backgroundOffset, panStartPos, zoomLevel])

  const handleBackgroundMouseDown = useCallback((e: React.MouseEvent) => {
    // Start panning if clicking on background (not on a node or its children)
    const target = e.target as HTMLElement
    
    // Don't pan if clicking on a node or its children
    if (target.closest("[data-node-id]")) {
      return
    }
    
    // Don't pan if clicking on interactive elements (buttons, inputs, etc.)
    if (
      target.tagName === "BUTTON" ||
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.closest("button") ||
      target.closest("input") ||
      target.closest("textarea")
    ) {
      return
    }
    
    // Start panning
    e.preventDefault()
    setIsPanningBackground(true)
    setPanStartPos({ x: e.clientX, y: e.clientY })
  }, [])


  // Memoized connections for performance
  const connections = useMemo(() => {
    return nodes
      .map((node) => {
        const parent = nodes.find((n) => n.id === node.parentId)
        if (!parent) return null

        // Use pixel coordinates directly
        const x1 = parent.x
        const y1 = parent.y
        const x2 = node.x
        const y2 = node.y
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
    backgroundOffset,
    isPanningBackground,
    newlyCreatedNodes,
    updatedNodes,
    sessionId,
    isLoading,
    zoomLevel,

    // Actions
    toggleTheme,
    addNode,
    deleteNode,
    editNode,
    removeConnection,
    zoomIn,
    zoomOut,
    resetZoom,

    handleMouseDown,
    handleBackgroundMouseDown,
  }
}
