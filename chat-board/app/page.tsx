"use client"
import MindMapChat from "@/components/mind-map-chat"

export default function Home() {
  return (
    <main className="min-h-screen">
      <MindMapChat isDarkMode={true} height="100vh" />
    </main>
  )
}
