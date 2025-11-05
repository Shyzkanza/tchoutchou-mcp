# TchouTchou Journeys UI Component

React component to visually display train routes in France within ChatGPT via the Apps SDK.

## 📦 Installation

```bash
npm install
```

## 🛠️ Build

```bash
npm run build
```

The `dist/component.js` file will be generated.

## 🚀 Development

```bash
npm run dev
```

Watch mode to automatically rebuild on changes.

## 📝 Structure

- `src/component.tsx` - Entry point
- `src/JourneyViewer.tsx` - Main display component
- `src/hooks.ts` - React hooks for `window.openai`
- `src/types.ts` - TypeScript types
- `src/utils.ts` - Formatting utilities

## 🔗 Integration with MCP server

The component reads data from `window.openai.toolOutput` which contains the JSON response from the `get_journeys` tool of the TchouTchou MCP server (Node.js/TypeScript).


