"use client"

import { useMindMap } from "../hooks/use-mind-map"
import { NodeCard } from "./node-card"
import GoalDisplay from "./goal-display"

interface MindMapProps {
  initialText?: string
  isDarkMode?: boolean
  containerHeight?: string
}

export default function MindMap({
  initialText,
  isDarkMode = false,
  containerHeight,
}: MindMapProps) {
  const {
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
    goal,

    addNode,
    deleteNode,
    editNode,
    removeConnection,
    zoomIn,
    zoomOut,
    resetZoom,
    handleFinish,
    handleMouseDown,
    handleBackgroundMouseDown,
  } = useMindMap(initialText, isDarkMode)

  return (
    <div
      ref={containerRef}
      className={`mind-map-canvas relative w-full overflow-hidden bg-gradient-to-br transition-colors duration-300 ${
        containerHeight ? "" : "h-screen"
      } ${
        isDarkMode
          ? "from-slate-950 to-slate-900"
          : "from-slate-50 to-slate-100"
      } ${isPanningBackground ? "cursor-grabbing" : "cursor-grab"}`}
      style={containerHeight ? { height: containerHeight } : undefined}
      onMouseDown={handleBackgroundMouseDown}
      role="application"
      aria-label="Mind map canvas - drag nodes to move them or pan background"
    >
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-50">
          <div
            className={`rounded-lg p-6 shadow-lg ${isDarkMode ? "bg-slate-800" : "bg-white"}`}
          >
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span
                className={isDarkMode ? "text-slate-300" : "text-slate-700"}
              >
                Loading mind map...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Goal Display */}
      <GoalDisplay
        goal={goal}
        onFinish={handleFinish}
        isDarkMode={isDarkMode}
      />

      {/* Session info */}
      {sessionId && !isLoading && (
        <div
          className={`absolute top-4 left-4 rounded-lg px-3 py-2 text-xs backdrop-blur-sm ${
            isDarkMode
              ? "bg-slate-800/90 text-slate-400"
              : "bg-white/90 text-slate-600"
          }`}
        >
          Session: {sessionId.slice(0, 8)}...
        </div>
      )}

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
        <button
          onClick={zoomIn}
          className={`w-10 h-10 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-200 flex items-center justify-center ${
            isDarkMode
              ? "bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-slate-100"
              : "bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900"
          }`}
          aria-label="Zoom in"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
            <line x1="8" y1="11" x2="14" y2="11" />
            <line x1="11" y1="8" x2="11" y2="14" />
          </svg>
        </button>

        <button
          onClick={zoomOut}
          className={`w-10 h-10 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-200 flex items-center justify-center ${
            isDarkMode
              ? "bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-slate-100"
              : "bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900"
          }`}
          aria-label="Zoom out"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>

        <button
          onClick={resetZoom}
          className={`w-10 h-10 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-200 flex items-center justify-center ${
            isDarkMode
              ? "bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-slate-100"
              : "bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900"
          }`}
          aria-label="Reset zoom"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
        </button>

        {/* Zoom level indicator */}
        <div
          className={`rounded-lg px-2 py-1 text-xs backdrop-blur-sm text-center ${
            isDarkMode
              ? "bg-slate-800/90 text-slate-400"
              : "bg-white/90 text-slate-600"
          }`}
        >
          {Math.round(zoomLevel * 100)}%
        </div>
      </div>

      {/* Canvas Container - infinite canvas */}
      <div
        className="absolute canvas-container"
        style={{
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          transform: `translate(${backgroundOffset.x}px, ${backgroundOffset.y}px) scale(${zoomLevel})`,
          transformOrigin: "0 0",
          transition: isPanningBackground ? "none" : "transform 0.2s ease-out",
        }}
        onMouseDown={handleBackgroundMouseDown}
      >
        {/* Connection Lines - SVG covers large canvas area */}
        <svg
          className={`absolute pointer-events-none ${draggingId ? "dragging-active" : ""}`}
          style={{
            left: "-100000px",
            top: "-100000px",
            width: "200000px",
            height: "200000px",
          }}
          viewBox="-100000 -100000 200000 200000"
          preserveAspectRatio="none"
        >
          {connections.map((connection) => {
            const isNewConnection = newlyCreatedNodes.has(connection!.id)

            return (
              <g key={`connection-${connection!.id}`}>
                <path
                  d={connection!.path}
                  stroke={connection!.strokeColor}
                  strokeWidth="2"
                  fill="none"
                  className={draggingId ? "" : "transition-all duration-300"}
                  style={{
                    opacity: isNewConnection ? 0 : 1,
                    animation: isNewConnection
                      ? "fadeInConnection 0.5s ease-out forwards"
                      : "none",
                  }}
                />
              </g>
            )
          })}
        </svg>

        {/* Nodes */}
        {nodes.map((node) => {
          const isNewlyCreated = newlyCreatedNodes.has(node.id)
          const isUpdated = updatedNodes.has(node.id)

          return (
            <div
              key={node.id}
              data-node-id={node.id}
              className={`absolute ${
                draggingId === node.id ? "" : "transition-all duration-200"
              }`}
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
                transform: "translate(-50%, -50%)",
                opacity: isNewlyCreated ? 0 : 1,
                animation: isNewlyCreated
                  ? "fadeIn 0.5s ease-out forwards"
                  : "none",
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
                isNewlyCreated={isNewlyCreated}
                isUpdated={isUpdated}
                sessionId={sessionId || undefined}
                conceptId={
                  (node as unknown as { conceptId?: string }).conceptId
                }
                isDarkMode={isDarkMode}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
