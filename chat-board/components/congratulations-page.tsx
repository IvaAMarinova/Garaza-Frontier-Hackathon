"use client"

import { useEffect, useState } from "react"
import Confetti from "react-confetti"
import { GoalResponse } from "../lib/api"
import { processOverlayContent, TextSegment } from "../lib/text-utils"

interface CongratulationsPageProps {
  goal: GoalResponse | null
  initialText?: string
  onClose: () => void
  isDarkMode?: boolean
}

interface OverlayContentProps {
  content: string
  docLinks: Record<string, string>
  isDarkMode?: boolean
}

function OverlayContent({ content, docLinks, isDarkMode }: OverlayContentProps) {
  const segments = processOverlayContent(content, docLinks)
  
  return (
    <span>
      {segments.map((segment, index) => {
        if (segment.type === 'link' && segment.url) {
          return (
            <a
              key={index}
              href={segment.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`underline transition-colors ${
                isDarkMode 
                  ? "text-blue-400 hover:text-blue-300 decoration-blue-400/30 hover:decoration-blue-300/50" 
                  : "text-blue-600 hover:text-blue-800 decoration-blue-600/30 hover:decoration-blue-800/50"
              }`}
            >
              {segment.content}
            </a>
          )
        }
        return <span key={index}>{segment.content}</span>
      })}
    </span>
  )
}

export default function CongratulationsPage({ goal, initialText: _initialText, onClose, isDarkMode = false }: CongratulationsPageProps) {
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 })

  // Get full content (goal + all overlays)
  const getFullContent = () => {
    if (!goal) return ""
    
    let content = goal.answer_markdown

    if (goal.overlays && goal.overlays.length > 0) {
      const sortedOverlays = goal.overlays.sort((a, b) => a.depth - b.depth)
      sortedOverlays.forEach((overlay) => {
        content += "\n\n" + overlay.content_markdown
      })
    }

    return content
  }

  useEffect(() => {
    const updateWindowDimensions = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    updateWindowDimensions()
    window.addEventListener('resize', updateWindowDimensions)

    return () => {
      window.removeEventListener('resize', updateWindowDimensions)
    }
  }, [])

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
      <Confetti
        width={windowDimensions.width}
        height={windowDimensions.height}
        recycle={true}
        numberOfPieces={150}
        gravity={0.2}
      />
      
      <div 
        className={`relative max-w-4xl max-h-[90vh] overflow-y-auto mx-4 px-4 py-4 rounded-xl border-2 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg pointer-events-auto ${
          isDarkMode 
            ? "border-indigo-700 bg-indigo-950/50 text-indigo-100" 
            : "border-indigo-300 bg-indigo-50/80 text-indigo-900"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className={`absolute top-3 right-3 p-1 rounded-full shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 border pointer-events-auto ${
            isDarkMode 
              ? "bg-slate-700 border-slate-600 text-slate-300" 
              : "bg-white border-slate-200 text-slate-600"
          }`}
          aria-label="Close congratulations page"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>

        <div className="text-center mb-6">
          <h1 className={`text-lg font-semibold mb-2 ${isDarkMode ? "text-indigo-100" : "text-indigo-900"}`}>
            Learning Complete!
          </h1>
          <p className={`text-xs ${isDarkMode ? "text-indigo-200" : "text-indigo-700"}`}>
            Your structured learning goal
          </p>
        </div>

        {/* Full Goal Content - Gold/Yellow Theme with Scale Pulse Animation */}
        {goal && (
          <div 
            className={`p-4 rounded-lg border-2 mb-6 ${
              isDarkMode 
                ? "border-yellow-600 bg-yellow-900/40" 
                : "border-yellow-500 bg-yellow-100/60"
            }`}
            style={{
              animation: 'pulse-scale 2s ease-in-out infinite'
            }}>
            <div className={`font-semibold text-base mb-3 flex items-center gap-2 justify-center ${isDarkMode ? "text-yellow-200" : "text-yellow-800"}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              Your Complete Learning Journey
            </div>
            <div className={`text-sm leading-relaxed whitespace-pre-wrap ${isDarkMode ? "text-yellow-300" : "text-yellow-700"}`}>
              {/* Goal answer */}
              {goal.answer_markdown}
              
              {/* All overlays with hyperlinks */}
              {goal.overlays && goal.overlays.length > 0 && (
                <>
                  {goal.overlays
                    .sort((a, b) => a.depth - b.depth)
                    .map((overlay) => (
                      <span key={overlay.id}>
                        {"\n\n"}
                        <OverlayContent 
                          content={overlay.content_markdown}
                          docLinks={overlay.doc_links || {}}
                          isDarkMode={isDarkMode}
                        />
                      </span>
                    ))}
                </>
              )}
            </div>
          </div>
        )}

        {/* External Resources */}
        <div className="mb-4">
          <h3 className={`text-xs font-semibold mb-2 text-center ${isDarkMode ? "text-indigo-200" : "text-indigo-800"}`}>
            Continue Learning
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <a
              href="https://react.dev/learn"
              target="_blank"
              rel="noopener noreferrer"
              className={`block p-2 rounded-lg border transition-all duration-200 hover:scale-105 hover:shadow-md text-xs pointer-events-auto ${
                isDarkMode 
                  ? "border-indigo-800/50 bg-indigo-900/30 hover:border-indigo-600 text-indigo-200" 
                  : "border-indigo-200/50 bg-indigo-100/50 hover:border-indigo-400 text-indigo-800"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
                <span className="font-medium">React Docs</span>
              </div>
            </a>
            <a
              href="https://react.dev/learn/tutorial-tic-tac-toe"
              target="_blank"
              rel="noopener noreferrer"
              className={`block p-2 rounded-lg border transition-all duration-200 hover:scale-105 hover:shadow-md text-xs pointer-events-auto ${
                isDarkMode 
                  ? "border-indigo-800/50 bg-indigo-900/30 hover:border-indigo-600 text-indigo-200" 
                  : "border-indigo-200/50 bg-indigo-100/50 hover:border-indigo-400 text-indigo-800"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                <span className="font-medium">Tutorial</span>
              </div>
            </a>
            <a
              href="https://react.dev/learn/thinking-in-react"
              target="_blank"
              rel="noopener noreferrer"
              className={`block p-2 rounded-lg border transition-all duration-200 hover:scale-105 hover:shadow-md text-xs pointer-events-auto ${
                isDarkMode 
                  ? "border-indigo-800/50 bg-indigo-900/30 hover:border-indigo-600 text-indigo-200" 
                  : "border-indigo-200/50 bg-indigo-100/50 hover:border-indigo-400 text-indigo-800"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
                </svg>
                <span className="font-medium">Thinking</span>
              </div>
            </a>
            <a
              href="https://react.dev/reference/react"
              target="_blank"
              rel="noopener noreferrer"
              className={`block p-2 rounded-lg border transition-all duration-200 hover:scale-105 hover:shadow-md text-xs pointer-events-auto ${
                isDarkMode 
                  ? "border-indigo-800/50 bg-indigo-900/30 hover:border-indigo-600 text-indigo-200" 
                  : "border-indigo-200/50 bg-indigo-100/50 hover:border-indigo-400 text-indigo-800"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4"/>
                  <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                  <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                  <path d="M13 12h3"/>
                  <path d="M8 12H5"/>
                </svg>
                <span className="font-medium">Hooks</span>
              </div>
            </a>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-gray-400 text-gray-500 bg-transparent hover:bg-gray-400 hover:text-white pointer-events-auto"
          >
            Try it out again!
          </button>
        </div>
      </div>
    </div>
  )
}