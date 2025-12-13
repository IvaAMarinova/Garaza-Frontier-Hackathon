"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { LAYOUT_CONSTANTS } from "@/lib/constants"

interface CodeBlockProps {
  language: string
  code: string
}

export function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const copyCode = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), LAYOUT_CONSTANTS.COPY_FEEDBACK_DURATION)
  }

  return (
    <div className="relative mt-2 rounded-lg bg-slate-900 dark:bg-black/60 p-3 text-xs font-mono border border-slate-700 dark:border-slate-800">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase">
          {language}
        </span>
        <button
          type="button"
          onClick={copyCode}
          className="p-1 hover:bg-slate-800 dark:hover:bg-slate-700 rounded transition-all hover:scale-110"
          title="Copy code"
        >
          {copied ? (
            <Check className="w-3 h-3 text-green-400" />
          ) : (
            <Copy className="w-3 h-3 text-slate-400" />
          )}
        </button>
      </div>
      <pre className="text-slate-300 dark:text-slate-400 overflow-x-auto">
        {code}
      </pre>
    </div>
  )
}
