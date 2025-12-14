"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"

interface CodeBlockProps {
  language: string
  code: string
  isDarkMode?: boolean
}

export function CodeBlock({ language, code, isDarkMode = false }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const copyCode = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`relative mt-2 rounded-lg p-3 text-xs font-mono border ${
      isDarkMode 
        ? "bg-black/60 border-slate-800" 
        : "bg-slate-900 border-slate-700"
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] uppercase ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
          {language}
        </span>
        <button
          type="button"
          onClick={copyCode}
          className={`p-1 rounded transition-all hover:scale-110 ${
            isDarkMode ? "hover:bg-slate-700" : "hover:bg-slate-800"
          }`}
          title="Copy code"
        >
          {copied ? (
            <Check className="w-3 h-3 text-green-400" />
          ) : (
            <Copy className="w-3 h-3 text-slate-400" />
          )}
        </button>
      </div>
      <pre className={`overflow-x-auto ${isDarkMode ? "text-slate-400" : "text-slate-300"}`}>
        {code}
      </pre>
    </div>
  )
}
