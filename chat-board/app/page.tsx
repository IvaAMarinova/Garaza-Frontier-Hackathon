"use client"
import MindMap from "@/components/mind-map"
import ChatInput from "@/components/chat-input"

export default function Home() {
  return (
    <main className="min-h-screen">
      <MindMap initialText="So basically what I mean is.." />
      <ChatInput />
    </main>
  )
}
