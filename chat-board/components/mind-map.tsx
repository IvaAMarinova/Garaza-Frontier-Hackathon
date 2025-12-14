"use client"

import { useMindMap } from "../hooks/use-mind-map"
import { NodeCard } from "./node-card"
import GoalDisplay from "./goal-display"
import CongratulationsPage from "./congratulations-page"

interface MindMapProps {
  initialText?: string
  isDarkMode?: boolean
  containerHeight?: string
  onStartNewJourney?: () => void
}

export default function MindMap({
  initialText,
  isDarkMode = true,
  onStartNewJourney,
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
    showCongratulations,

    addNode,
    deleteNode,
    editNode,
    removeConnection,
    handleConceptExpansion,
    zoomIn,
    zoomOut,
    resetZoom,
    handleFinish,
    handleCloseCongratulations,
    handleMouseDown,
    handleBackgroundMouseDown,
    incrementNodeWeight,
  } = useMindMap(initialText, isDarkMode, onStartNewJourney)

  return (
    <div
      ref={containerRef}
      className={`mind-map-canvas relative w-full overflow-hidden bg-gradient-to-br transition-colors duration-300 ${
        containerHeight ? "" : "h-screen"
      } from-slate-950 to-slate-900 ${isPanningBackground ? "cursor-grabbing" : "cursor-grab"}`}
      style={containerHeight ? { height: containerHeight } : undefined}
      onMouseDown={handleBackgroundMouseDown}
      role="application"
      aria-label="Mind map canvas - drag nodes to move them or pan background"
    >
      {/* Cool Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-50">
          <div className="flex flex-col items-center">
            {/* Custom Cool Spinner */}
            <div className="relative w-24 h-24 mb-6">
              {/* Outer rotating ring */}
              <div 
                className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 border-r-indigo-400"
                style={{ animation: "spin 3s linear infinite" }}
              ></div>

              {/* Middle rotating ring - opposite direction */}
              <div
                className="absolute inset-2 rounded-full border-4 border-transparent border-b-purple-500 border-l-purple-400"
                style={{ animation: "spin 4s linear infinite reverse" }}
              ></div>

              {/* Inner pulsing dot */}
              <div className="absolute inset-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse"></div>

              {/* Floating particles */}
              <div
                className="absolute -top-1 left-1/2 w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                style={{ animationDelay: "0s" }}
              ></div>
              <div
                className="absolute top-1/2 -right-1 w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.5s" }}
              ></div>
              <div
                className="absolute -bottom-1 left-1/2 w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                style={{ animationDelay: "1s" }}
              ></div>
              <div
                className="absolute top-1/2 -left-1 w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                style={{ animationDelay: "1.5s" }}
              ></div>
            </div>

            <span className="text-lg font-medium text-slate-300">
              Creating your mind map...
            </span>
            <span className="text-sm mt-1 text-slate-400">
              Mapping concepts and connections
            </span>
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
          className="absolute top-4 left-4 rounded-lg px-3 py-2 text-xs backdrop-blur-sm bg-slate-800/90 text-slate-400"
        >
          Session: {sessionId.slice(0, 8)}...
        </div>
      )}

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
        <button
          onClick={zoomIn}
          className="w-10 h-10 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-200 flex items-center justify-center bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-slate-100"
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
          className="w-10 h-10 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-200 flex items-center justify-center bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-slate-100"
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
          className="w-10 h-10 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-200 flex items-center justify-center bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-slate-100"
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
        <div className="rounded-lg px-2 py-1 text-xs backdrop-blur-sm text-center bg-slate-800/90 text-slate-400">
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
                onExpandConcept={handleConceptExpansion}
                onIncrementWeight={incrementNodeWeight}
              />
            </div>
          )
        })}
      </div>

      {/* Congratulations Overlay */}
      {showCongratulations && (
        <div className="absolute inset-0 z-50">
          {/* Blurred background */}
          <div className="absolute inset-0 backdrop-blur-md bg-black/30" />

          {/* Congratulations content */}
          <CongratulationsPage
            goal={goal}
            initialText={initialText}
            onClose={handleCloseCongratulations}
            isDarkMode={isDarkMode}
          />
        </div>
      )}
    </div>
  )
}
