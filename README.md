# Dealia - Deal Tracking & Pipeline Management App

Electron-based desktop application for managing sales deals and pipeline tracking for Zendesk Sales.

## Development Setup

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

```bash
npm install
```

### Running in Development

Due to a known issue with electron-forge's Vite plugin not reliably starting the dev server, we run Vite manually:

**Terminal 1 - Start Vite Dev Server:**
```bash
npx vite --config vite.renderer.config.mts --port 5173
```

Wait for the message "ready in X ms" before proceeding.

**Terminal 2 - Start Electron:**
```bash
npm start
```

The app will automatically connect to the running Vite dev server.

### Building for Production

```bash
npm run package
```

### Making Distributables

```bash
npm run make
```

## Project Structure

- `src/main/` - Main process code (Node.js/Electron)
- `src/renderer/` - Renderer process code (React/TypeScript)
- `src/preload.ts` - Preload script for IPC communication
- `src/shared/` - Shared types and utilities

## Technologies

- **Electron** - Desktop application framework
- **React** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **better-sqlite3** - SQLite database

## License

MIT
