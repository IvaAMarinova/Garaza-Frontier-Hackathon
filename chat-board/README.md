# @garaza-frontier/chat-board

A React component library for interactive mind maps and chat interfaces.

## Installation

### From GitHub (for development)

```bash
npm install @garaza-frontier/chat-board@github:IvaAMarinova/Garaza-Frontier-Hackathon#main
```

Or add to your `package.json`:

```json
{
  "dependencies": {
    "@garaza-frontier/chat-board": "github:IvaAMarinova/Garaza-Frontier-Hackathon#main"
  }
}
```

### From npm (when published)

```bash
npm install @garaza-frontier/chat-board
```

## Usage

### Import Components

```tsx
import { MindMap, NodeCard, useMindMap } from '@garaza-frontier/chat-board';
import '@garaza-frontier/chat-board/styles.css'; // Required for animations
```

### Basic Example

```tsx
import { MindMap } from '@garaza-frontier/chat-board';
import '@garaza-frontier/chat-board/styles.css';

function App() {
  return <MindMap initialText="My mind map" />;
}
```

### Using the Hook

```tsx
import { useMindMap } from '@garaza-frontier/chat-board';

function CustomMindMap() {
  const { nodes, addNode, deleteNode } = useMindMap("Initial text");
  // Use the hook to build custom UI
}
```

## Requirements

- React 18+ or 19+
- React DOM 18+ or 19+
- Tailwind CSS (for styling - the consuming app should have Tailwind configured)

## Development

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

### Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
