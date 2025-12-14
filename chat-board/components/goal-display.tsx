"use client"

import { useState } from "react"
import { Goal } from "../lib/types"

interface GoalDisplayProps {
  goal: Goal | null
  onFinish: () => void
  isDarkMode?: boolean
}

export default function GoalDisplay({ goal, onFinish, isDarkMode = false }: GoalDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!goal) return null

  return (
    <div className="absolute top-4 right-4 z-20 max-w-sm">
      <div 
        className={`group relative px-4 py-3 rounded-xl border-2 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg select-none ${
          isDarkMode 
            ? "border-indigo-700 bg-indigo-950/50 text-indigo-100" 
            : "border-indigo-300 bg-indigo-50/80 text-indigo-900"
        } ${isExpanded ? 'min-h-[200px]' : 'min-h-[80px]'}`}
      >
        <div className="relative z-10 space-y-2 select-none">
          <div className="flex items-start justify-between">
            <div className={`font-semibold text-sm select-none flex items-center gap-2 ${isDarkMode ? "opacity-80" : "opacity-70"}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
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
                className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''} ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
              >
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
          </div>
          
          <div className={`transition-all duration-300 ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-12 opacity-75'} overflow-hidden`}>
            <div className="whitespace-pre-wrap leading-relaxed select-none text-sm">
              {goal.goal_statement}
            </div>
          </div>
          
          {isExpanded && (
             <div className={`mt-4 pt-3 border-t ${isDarkMode ? "border-indigo-800/50" : "border-indigo-200/50"}`}>
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
             </div>          )}
        </div>
      </div>
    </div>
  )
}