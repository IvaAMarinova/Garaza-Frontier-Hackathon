"use client"

import { useState, useEffect } from "react"
import { GoalResponse } from "../lib/api"
import { useTypewriter } from "../hooks/use-typewriter"

interface GoalDisplayProps {
  goal: GoalResponse | null
  onFinish: () => void
  isDarkMode?: boolean
}

export default function GoalDisplay({
  goal,
  onFinish,
  isDarkMode = false,
}: GoalDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [previousGoalText, setPreviousGoalText] = useState("")
  const [shownOverlayIds, setShownOverlayIds] = useState<string[]>([])
  const [shouldTypewriteGoal, setShouldTypewriteGoal] = useState(false)
  const [newOverlayText, setNewOverlayText] = useState("")

  // Get static content (goal + already shown overlays)
  const getStaticContent = () => {
    let content = goal?.goal_statement || ""

    if (goal?.overlays && shownOverlayIds.length > 0) {
      const shownOverlays = goal.overlays
        .filter((overlay) => shownOverlayIds.includes(overlay.id))
        .sort((a, b) => a.depth - b.depth)

      shownOverlays.forEach((overlay) => {
        content += "\n\n" + overlay.content_markdown
      })
    }

    return content
  }

  // Track when goal statement changes
  useEffect(() => {
    if (goal && goal.goal_statement !== previousGoalText) {
      if (previousGoalText !== "") {
        setShouldTypewriteGoal(true)
      }
      setPreviousGoalText(goal.goal_statement)
    }
  }, [goal?.goal_statement, previousGoalText])

  // Create stable overlay IDs string for dependency
  const overlayIdsString = goal?.overlays?.map((o) => o.id).join(",") || ""

  // Track new overlays and prepare them for typewriting
  useEffect(() => {
    if (goal?.overlays) {
      const currentOverlayIds = goal.overlays.map((overlay) => overlay.id)
      const newIds = currentOverlayIds.filter(
        (id) => !shownOverlayIds.includes(id)
      )

      if (newIds.length > 0) {
        console.log(
          `📝 New overlay(s) detected! Total overlays: ${goal.overlays.length}, New: ${newIds.length}`
        )

        // Get new overlay content
        const newOverlays = goal.overlays
          .filter((overlay) => newIds.includes(overlay.id))
          .sort((a, b) => a.depth - b.depth)

        const newContent = newOverlays
          .map((overlay) => overlay.content_markdown)
          .join("\n\n")
        setNewOverlayText(newContent)
      }
    }
  }, [overlayIdsString])

  // Typewriter for goal statement changes
  const { displayedText: displayedGoalText, isTyping: isTypingGoal } =
    useTypewriter(goal?.goal_statement || "", {
      speed: 30,
      delay: shouldTypewriteGoal ? 200 : 0,
    })

  // Typewriter for new overlay content
  const { displayedText: displayedNewOverlay, isTyping: isTypingOverlay } =
    useTypewriter(newOverlayText, {
      speed: 25,
      delay: newOverlayText ? 500 : 0,
    })

  // Reset typewriter flags
  useEffect(() => {
    if (!isTypingGoal && shouldTypewriteGoal) {
      setShouldTypewriteGoal(false)
    }
  }, [isTypingGoal, shouldTypewriteGoal])

  useEffect(() => {
    if (!isTypingOverlay && newOverlayText) {
      // Update shown overlay IDs and clear new overlay text after typing is complete
      if (goal?.overlays) {
        const currentOverlayIds = goal.overlays.map((overlay) => overlay.id)
        setShownOverlayIds(currentOverlayIds)
        console.log(
          `✅ Typewriter completed! Total shown overlays: ${currentOverlayIds.length}`
        )
      }
      setNewOverlayText("")
    }
  }, [isTypingOverlay, newOverlayText, goal?.overlays])

  if (!goal) return null

  const goalTextToShow =
    shouldTypewriteGoal || isTypingGoal
      ? displayedGoalText
      : goal.goal_statement

  return (
    <div className="absolute top-4 right-4 z-20 max-w-sm">
      <div
        className={`group relative px-4 py-3 rounded-xl border-2 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg select-none ${
          isDarkMode
            ? "border-indigo-700 bg-indigo-950/50 text-indigo-100"
            : "border-indigo-300 bg-indigo-50/80 text-indigo-900"
        } ${isExpanded ? "min-h-[200px] max-h-[600px]" : "min-h-[80px]"}`}
      >
        <div className="relative z-10 space-y-2 select-none">
          <div className="flex items-start justify-between">
            <div
              className={`font-semibold text-sm select-none flex items-center gap-2 ${isDarkMode ? "opacity-80" : "opacity-70"}`}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Goal
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-1 rounded-full shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 border opacity-0 group-hover:opacity-100 ${
                isDarkMode
                  ? "bg-slate-700 border-slate-600"
                  : "bg-white border-slate-200"
              }`}
              aria-label={isExpanded ? "Collapse goal" : "Expand goal"}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""} ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>

          <div
            className={`transition-all duration-300 ${isExpanded ? "max-h-96 opacity-100" : "max-h-12 opacity-75"} overflow-hidden`}
          >
            <div className="whitespace-pre-wrap leading-relaxed select-none text-sm">
              {/* Goal statement (with typewriter if changed) */}
              {goalTextToShow}
              {isTypingGoal && (
                <span
                  className={`inline-block w-0.5 h-4 ml-1 animate-pulse ${isDarkMode ? "bg-indigo-300" : "bg-indigo-600"}`}
                />
              )}

              {/* Already shown overlays (static, no animation) */}
              {goal?.overlays && shownOverlayIds.length > 0 && (
                <>
                  {goal.overlays
                    .filter((overlay) => shownOverlayIds.includes(overlay.id))
                    .sort((a, b) => a.depth - b.depth)
                    .map((overlay) => (
                      <span key={overlay.id}>
                        {"\n\n" + overlay.content_markdown}
                      </span>
                    ))}
                </>
              )}

              {/* New overlay content (with typewriter) */}
              {newOverlayText && (
                <>
                  {"\n\n" + displayedNewOverlay}
                  {isTypingOverlay && (
                    <span
                      className={`inline-block w-0.5 h-4 ml-1 animate-pulse ${isDarkMode ? "bg-indigo-300" : "bg-indigo-600"}`}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          {isExpanded && (
            <div
              className={`mt-4 pt-3 border-t ${isDarkMode ? "border-indigo-800/50" : "border-indigo-200/50"}`}
            >
              <button
                onClick={onFinish}
                className={`w-full px-3 py-2 text-sm font-medium rounded-lg shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 border ${
                  isDarkMode
                    ? "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Finish Learning
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
