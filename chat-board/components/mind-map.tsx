"use client"

import { Moon, Sun } from "lucide-react"
import { useMindMap } from "@/hooks/use-mind-map"
import { NodeCard } from "./node-card"

interface MindMapProps {
  initialText?: string
}

export default function MindMap({ initialText }: MindMapProps) {
  const {
    isDarkMode,
    nodes,
    draggingId,
    containerRef,
    connections,
    backgroundOffset,
    isPanningBackground,
    toggleTheme,
    addNode,
    deleteNode,
    editNode,
    removeConnection,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleBackgroundMouseDown,
  } = useMindMap(initialText)

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 transition-colors duration-300 ${
        isPanningBackground ? "cursor-grabbing" : "cursor-grab"
      }`}
      onMouseDown={handleBackgroundMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      role="application"
      aria-label="Mind map canvas - drag nodes to move them or pan background"
    >
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 z-10 p-3 bg-white dark:bg-slate-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-slate-200 dark:border-slate-700"
        title="Toggle dark mode"
      >
        {isDarkMode ? (
          <Sun className="w-5 h-5 text-amber-500" />
        ) : (
          <Moon className="w-5 h-5 text-slate-700" />
        )}
      </button>

      {/* Canvas Container */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          transform: `translate(${backgroundOffset.x}px, ${backgroundOffset.y}px)`,
          transition: isPanningBackground ? "none" : "transform 0.2s ease-out",
        }}
      >
        {/* Connection Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {connections.map((connection) => (
            <g key={`connection-${connection!.id}`}>
              <path
                d={connection!.path}
                stroke={connection!.strokeColor}
                strokeWidth="2"
                fill="none"
                className="transition-all duration-300"
              />
            </g>
          ))}
        </svg>

        {/* Nodes */}
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
    </div>
  )
}
