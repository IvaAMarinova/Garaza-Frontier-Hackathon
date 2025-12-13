"use client"
import { useState } from "react"
import MindMap from "@/components/mind-map"
import ChatInput from "@/components/chat-input"

export default function Home() {
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [userInput, setUserInput] = useState("")
  const [isDarkMode] = useState(false)

  const handleChatSubmit = (message: string) => {
    setUserInput(message)
    setHasSubmitted(true)
  }

  return (
    <main className="min-h-screen relative">
      {hasSubmitted && <MindMap initialText={userInput} isDarkMode={isDarkMode} />}
      <ChatInput 
        onSend={handleChatSubmit} 
        isCentered={!hasSubmitted}
        isDarkMode={isDarkMode}
      />
    </main>
  )
}
