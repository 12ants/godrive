# GoDrive

GoDrive is a 3D driving and walking game template built with React, Vite, Three.js, and Cannon physics.

## Prerequisites

- Node.js 18+ (or newer LTS)
- npm

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open the app at `http://localhost:3000`.

## Available Scripts

- `npm run dev` — start the local dev server on port 3000
- `npm run build` — create a production build
- `npm run preview` — preview the production build locally
- `npm run lint` — run TypeScript checks

## Project Structure

- `src/components/` — scene, player, car, environment, and UI components
- `src/store.ts` — game state management
- `src/useControls.ts` — input/control mapping

## Notes

- The app currently runs as a frontend-only project with no required environment variables.
