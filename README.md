# Garaza Frontier Hackathon - Interactive Documentation Component

A drop-in component for technical documentation websites that helps developers quickly understand how to solve problems in specific technologies through adaptive, visual exploration.

## 🎯 Overview

This project provides an embeddable documentation component consisting of:
- **Backend**: FastAPI service that generates technology-specific answers and extracts concepts from technical conversations
- **Chat-Board**: React component library for interactive concept exploration and goal visualization

The component presents a single **Goal node** containing a complete, high-level answer framed in the target technology's mental model (e.g., React). Users explore a unified **mind map** of extracted concepts, and as they expand areas of interest, the Goal node adaptively deepens around those concepts—moving from intuition → practical structure → concrete implementation with documentation links.

This helps users quickly judge technology fit and increases adoption by showing what solving their task *feels like* in that specific technology.

## 🏗️ Architecture

### Backend (`/backend`)
- **FastAPI** server with chat session management
- **Concept Graph Service** - Extracts and organizes concepts from conversations
- **Goal Node Service** - Creates structured learning plans
- **OpenAI Integration** - Powers the conversational AI
- **In-memory storage** for chat sessions and concept graphs

### Chat-Board (`/chat-board`)
- **React component library** for mind map visualization
- **Interactive nodes** with expansion and focus capabilities
- **TypeScript** with full type safety
- **Tailwind CSS** for styling
- **Next.js** development environment

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- OpenAI API key

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
export OPENAI_API_KEY="your-api-key-here"
```

4. Run the server:
```bash
python main.py
```

The backend will be available at `http://localhost:8000`

### Documentation Component Integration

1. Install the component in your documentation site:
```bash
npm install @garaza-frontier/chat-board
```

2. Add to your documentation page:
```tsx
import { MindMapChat } from '@garaza-frontier/chat-board';
import '@garaza-frontier/chat-board/styles.css';

function DocumentationPage() {
  return (
    <div>
      {/* Your existing documentation */}
      <MindMapChat 
        backendUrl="http://localhost:8000"
        technology="React"
        contextDocs="/path/to/context.txt"
      />
    </div>
  );
}
```

3. For development, run the demo:
```bash
cd chat-board
npm install
npm run dev
```

The demo will be available at `http://localhost:3000`

## 📚 API Documentation

### Core Chat Routes (`/v1/chat`)

- `POST /sessions` - Create a new chat session
- `GET /sessions/{session_id}` - Fetch session messages
- `POST /sessions/{session_id}/generate` - Send message and get AI response
- `POST /sessions/{session_id}/end` - End session and get time spent

### Concept Graph Routes

- `POST /sessions/{session_id}/concept-graph/build` - Extract concepts from conversation
- `GET /sessions/{session_id}/concept-graph` - Get current concept graph
- `POST /sessions/{session_id}/concept-graph/{concept_id}/expand` - Expand a specific concept
- `POST /sessions/{session_id}/concept-graph/{concept_id}/declutter` - Organize concept expansions

### Goal Node Routes

- `POST /sessions/{session_id}/goal` - Create learning plan from concepts
- `GET /sessions/{session_id}/goal` - Get current learning plan with overlays

For detailed API documentation, see [`backend/API.md`](backend/API.md).

## 🧩 Documentation Component Integration

### Installation

```bash
npm install @garaza-frontier/chat-board
```

### Basic Integration

```tsx
import { MindMapChat } from '@garaza-frontier/chat-board';
import '@garaza-frontier/chat-board/styles.css';

function DocumentationPage() {
  return (
    <MindMapChat 
      backendUrl="http://localhost:8000"
      technology="React"
      contextDocs="/docs/context.txt"
    />
  );
}
```

### Available Components

- `MindMapChat` - Complete documentation assistant interface
- `MindMap` - Interactive concept mind map
- `GoalDisplay` - Adaptive goal node with technology-specific answers
- `NodeCard` - Individual concept exploration nodes

### Configuration Options

- `technology` - Target technology mental model (e.g., "React", "Vue", "Angular")
- `contextDocs` - Path to technology-specific context documentation
- `backendUrl` - URL of the FastAPI backend service
- `theme` - Visual theme customization

## 🎨 Features

### Technology-Specific Goal Generation
- Single, complete answer framed in the target technology's mental model
- Adapts depth based on user exploration patterns
- Moves from high-level intuition to concrete implementation
- Links directly to relevant documentation pages

### Interactive Concept Exploration
- Unified mind map of all extracted concepts from conversations
- User-driven expansion of areas of interest or uncertainty
- Tracks focus and curiosity to guide adaptive deepening
- Smooth visual transitions between concept levels

### Adaptive Documentation Experience
- Helps users judge technology fit quickly
- Shows what solving their task *feels like* in the specific technology
- Increases adoption by reducing cognitive load
- Embeddable in any documentation website

### Easy Integration
- Drop-in React component for documentation sites
- Configurable backend service
- Minimal setup required
- Works with existing documentation infrastructure

## 🛠️ Development

### Backend Development

```bash
cd backend
pip install -r requirements.txt
python main.py
```

### Frontend Development

```bash
cd chat-board
npm install
npm run dev
```

### Building the Library

```bash
cd chat-board
npm run build:lib
```

### Code Quality

```bash
# Frontend
npm run lint
npm run typecheck
npm run format:check

# Backend
# Add your preferred Python linting tools
```

## 📁 Project Structure

```
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── concept_graph/   # Concept extraction and graph building
│   │   ├── goal_node/       # Learning plan generation
│   │   ├── api.py          # API routes
│   │   ├── chat_service.py # Chat session management
│   │   └── ...
│   ├── main.py             # FastAPI application
│   └── requirements.txt    # Python dependencies
├── chat-board/             # React component library
│   ├── components/         # React components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and types
│   ├── app/               # Next.js demo app
│   └── package.json       # Node.js dependencies
└── react.dev/             # Documentation demo (not included in main project)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is part of the Garaza Frontier Hackathon. See individual component licenses for details.

## 🔗 Links

- [Backend API Documentation](backend/API.md)
- [Chat-Board Component Documentation](chat-board/README.md)
- [Demo Documentation](react.dev/) - Interactive documentation and examples