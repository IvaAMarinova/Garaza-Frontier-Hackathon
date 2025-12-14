"use client"

import { useState, useEffect, useRef } from "react"

interface UseTypewriterOptions {
  speed?: number
  delay?: number
}

export function useTypewriter(text: string = "", options: UseTypewriterOptions = {}) {
  const { speed = 50, delay = 0 } = options
  const [displayedText, setDisplayedText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const indexRef = useRef(0)

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }

    // If no text, don't start typing
    if (!text || text.length === 0) {
      setDisplayedText("")
      setIsTyping(false)
      return
    }

    // Reset state when text changes
    setDisplayedText("")
    setIsTyping(true)
    indexRef.current = 0

    const typeNextCharacter = () => {
      if (indexRef.current < text.length) {
        setDisplayedText(text.slice(0, indexRef.current + 1))
        indexRef.current++
        timeoutRef.current = setTimeout(typeNextCharacter, speed)
      } else {
        setIsTyping(false)
        timeoutRef.current = undefined
      }
    }

    // Start typing after delay
    timeoutRef.current = setTimeout(typeNextCharacter, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = undefined
      }
    }
  }, [text, speed, delay])

  return { displayedText, isTyping }
}