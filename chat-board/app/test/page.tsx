"use client"
import MindMapChat from "@/components/mind-map-chat"

export default function TestPage() {
  return (
    <main className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Article Header */}
        <article className="prose prose-lg max-w-none mb-8">
          <h1 className="text-4xl font-bold mb-4">Understanding React Concepts</h1>
          <p className="text-xl text-muted-foreground mb-6">
            This article explores the fundamental concepts of React, a popular JavaScript library for building user interfaces.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Introduction to React</h2>
          <p className="mb-4">
            React is a declarative, efficient, and flexible JavaScript library for building user interfaces. 
            It lets you compose complex UIs from small and isolated pieces of code called "components".
          </p>
          
          <p className="mb-4">
            React has a few different kinds of components, but we'll start with React.Component subclasses. 
            React components are small, reusable pieces of code that return a React element to be rendered to the page.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Interactive Mind Map</h2>
          <p className="mb-4">
            Below is an interactive mind map that you can use to explore React concepts. 
            Type a message to generate a mind map visualization of the concepts.
          </p>
        </article>

        {/* Mind Map Chat Component as a Box */}
        <div className="mb-8">
          <MindMapChat 
            isDarkMode={false} 
            height="600px"
            className="shadow-lg"
          />
        </div>

        {/* More Article Content */}
        <article className="prose prose-lg max-w-none">
          <h2 className="text-2xl font-semibold mt-8 mb-4">Key Features of React</h2>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>Component-Based:</strong> Build encapsulated components that manage their own state, then compose them to make complex UIs.</li>
            <li><strong>Declarative:</strong> React makes it painless to create interactive UIs. Design simple views for each state in your application.</li>
            <li><strong>Learn Once, Write Anywhere:</strong> You can develop new features in React without rewriting existing code.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Virtual DOM</h2>
          <p className="mb-4">
            React implements a virtual DOM, which is a JavaScript representation of the real DOM. 
            This allows React to optimize updates by batching them and only updating the parts of the DOM that have changed.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">State and Props</h2>
          <p className="mb-4">
            React components use props (short for properties) to receive data from parent components, 
            and state to manage data that can change over time. Understanding the difference between props and state 
            is crucial for building React applications.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Hooks</h2>
          <p className="mb-4">
            Hooks are a new addition in React 16.8. They let you use state and other React features without writing a class. 
            Common hooks include useState, useEffect, useContext, and many more.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Conclusion</h2>
          <p className="mb-4">
            React is a powerful library that has revolutionized the way we build web applications. 
            Its component-based architecture, virtual DOM, and rich ecosystem make it an excellent choice 
            for building modern user interfaces.
          </p>
        </article>
      </div>
    </main>
  )
}
