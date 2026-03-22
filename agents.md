# Project Knowledge Base

## 1. Project Overview
- **Project name:** `Drivengo` (from `metadata.json`).
- **What it does:** A browser-based 3D driving and walking prototype/template built with React Three Fiber and Cannon physics. The user can move a character on foot, enter a car when nearby, drive it, and exit back to walking mode.
- **Purpose:** Serves as a lightweight game/app template focused on performance, robustness, and simplicity for a 3D scene with physics.
- **Target audience:** Developers extending a 3D interactive web app or gameplay prototype; potentially AI Studio users based on the repository scaffolding.
- **Key features observed:**
  - Full-screen 3D scene rendered in WebGL
  - Physics-enabled environment with ground, obstacle box, and ramp
  - Walking controller with jump and chase camera
  - Raycast vehicle controller with steering, throttle, brake, and chase camera
  - Enter/exit car interaction with shared mode state
  - HUD overlay with controls, speed display, dev toggles, and simple mode buttons
  - Debug/perf tooling via wireframe mode and `r3f-perf`

## 2. Architecture Overview
### High-level system architecture
This is a **client-only single-page application**.

Main layers:
1. **React shell**
   - `src/main.tsx` mounts the app.
   - `src/App.tsx` composes the 3D scene and DOM HUD overlay.
2. **3D scene layer**
   - `src/components/Scene.tsx` sets up the `Canvas`, lights, sky, fog, stars, and the physics world.
3. **Gameplay entities**
   - `Environment` provides world geometry and collision surfaces.
   - `Player` manages on-foot movement and camera.
   - `Car` manages vehicle physics, controls, and camera.
4. **Shared state and input**
   - `src/store.ts` uses Zustand as the coordination bus.
   - `src/useControls.ts` captures keyboard state.
5. **UI overlay**
   - `src/components/UI.tsx` renders controls/help, dev toggles, mode buttons, and speed HUD.

### Key components and responsibilities
- **`App`**: Renders `<Scene />` and `<UI />` together.
- **`Scene`**: Owns scene bootstrap, physics context, scene lighting, and dev perf overlay.
- **`Environment`**: Static/dynamic physics test geometry.
- **`Player`**:
  - Physics sphere body for the avatar
  - Tank-style walking controls
  - Jump logic
  - Detects proximity to car for enter flow
  - Owns camera in walking/exiting modes
- **`Car`**:
  - Box chassis + 4 wheels via `useRaycastVehicle`
  - Steering/throttle/brake logic
  - Computes player spawn position/yaw on exit
  - Owns camera in driving/entering modes
- **`UI`**:
  - Reads store state
  - Lets users toggle dev features
  - Displays speed and basic controls
  - Can directly force walking/driving mode
- **`useGameStore`**:
  - Central mode state machine and handoff data
  - Stores debug toggles and HUD values

### Data flow between components
Primary loop:
1. `useControls()` listens to browser keyboard events.
2. `Player` and `Car` each consume those key flags.
3. In `useFrame()` loops, they translate input into physics API calls.
4. They push selected runtime state into Zustand:
   - `playerPosition`
   - `carPosition`
   - `playerYaw`
   - `cameraLookAt`
   - `speed`
   - `mode`
5. `UI` reads the store to display state and trigger toggles.
6. Camera handoff is coordinated through shared `cameraLookAt` state to reduce snapping.

### External dependencies and integrations
- Rendering: `three`, `@react-three/fiber`, `@react-three/drei`
- Physics: `@react-three/cannon`, `cannon-es`
- State: `zustand`
- Perf/debug: `r3f-perf`
- Styling: Tailwind CSS v4 via `@tailwindcss/vite`
- Template/runtime scaffolding references AI Studio and Gemini env configuration, but there is **no active Gemini/API integration in source code**.

## 3. Tech Stack
### Languages
- TypeScript
- CSS (minimal global import only)
- HTML entry file

### Versions identifiable
- React `^18.3.1`
- TypeScript `~5.8.2` (`package.json`)
- Vite `^6.2.0`
- Three `^0.183.2`
- Zustand `^5.0.12`
- Lockfile observations from exploration indicate resolved versions such as Vite `6.4.1`, plugin-react `5.2.0`, TypeScript `5.8.3`.

### Frameworks and libraries
- React
- Vite
- React Three Fiber
- Drei
- React Three Cannon / Cannon ES
- Zustand
- Tailwind CSS v4
- `r3f-perf`
- `lucide-react` and `motion` are installed but not used in the checked-in source files reviewed.

### Build tools and package managers
- Package manager: **npm** (presence of `package-lock.json`)
- Bundler/dev server: **Vite**
- Type checking: `tsc --noEmit` via `npm run lint`

### Testing frameworks
- None found.
- No test files, test directories, or test runner configuration were observed.

### Database/storage technologies
- None found.
- No backend persistence, ORM, migrations, or local storage usage were observed.

## 4. Directory Structure
```text
.
├── README.md
├── index.html
├── metadata.json
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
├── .env.example
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── store.ts
    ├── useControls.ts
    └── components/
        ├── Scene.tsx
        ├── Environment.tsx
        ├── Player.tsx
        ├── Car.tsx
        └── UI.tsx
```

### Purpose of each major directory/file
- **`src/`**: All application source code.
- **`src/components/`**: Main scene/game/UI components.
- **`src/main.tsx`**: React entrypoint.
- **`src/App.tsx`**: Top-level composition.
- **`src/store.ts`**: Zustand global store.
- **`src/useControls.ts`**: Keyboard input hook.
- **`index.html`**: Vite SPA HTML shell.
- **`vite.config.ts`**: Build and dev-server config.
- **`metadata.json`**: App metadata for the surrounding platform/template.

### Naming conventions used
- React components are PascalCase files and exports.
- Shared hooks/utilities use camelCase (`useControls`).
- Store file is a simple singular module (`store.ts`).
- Component names align closely with game concepts: `Player`, `Car`, `Environment`, `Scene`, `UI`.

## 5. Key Entry Points
### Main application entry points
- **`index.html`** loads `/src/main.tsx` into `#root`.
- **`src/main.tsx`** creates the React root and renders `<App />` inside `StrictMode`.
- **`src/App.tsx`** renders the scene and UI overlay.

### Runtime scene entry
- **`src/components/Scene.tsx`** is the effective root of the 3D runtime:
  - Creates `<Canvas>`
  - Adds lighting/background/atmosphere
  - Wraps content in `<Physics>`
  - Mounts `Environment`, `Player`, and `Car`

### CLI commands
Defined in `package.json`:
- `npm run dev` — start Vite dev server on port `3000`, host `0.0.0.0`
- `npm run build` — production bundle
- `npm run preview` — preview built app
- `npm run clean` — remove `dist`
- `npm run lint` — TypeScript type-check only

### API endpoints overview
- None found.
- No Express server or API route implementation exists in the reviewed codebase.

### Background jobs/workers
- None found.

## 6. Core Concepts
### Domain-specific terminology
- **Walking**: On-foot player mode.
- **Driving**: Vehicle control mode.
- **Entering car / exiting car**: Transitional gameplay states.
- **Chase camera**: Third-person camera following player or car.
- **Raycast vehicle**: Cannon vehicle model using raycast-based wheels.

### Key abstractions and patterns
#### Global mode state machine
`mode` can be:
- `walking`
- `driving`
- `entering_car`
- `exiting_car`

This drives controller ownership, visibility, movement rules, and camera control.

#### Shared handoff bus via Zustand
The store coordinates transitions using:
- `carPosition`
- `playerPosition`
- `playerYaw`
- `cameraLookAt`

#### Always-mounted controllers
Both `Player` and `Car` stay mounted at all times.
- Player is effectively disabled by moving it away and sleeping physics when not active.
- Car remains present but is braked when not driving.

#### Camera handoff smoothing
Both `Player` and `Car` read/write `cameraLookAt` so the view transitions more smoothly between control modes.

### Important interfaces/types
`GameState` in `src/store.ts` contains:
- mode and setter
- dev toggles and setters
- speed and setter
- car/player position state
- player yaw state
- camera look-at state

### State management approach
- Zustand store for shared state.
- Physics state is kept mostly in refs subscribed from Cannon APIs.
- Per-frame updates use `useGameStore.setState()` / `getState()` directly to avoid unnecessary rerenders.
- UI reads the store directly via the hook.

## 7. Development Patterns
### Code organization patterns
- Very flat, small app structure.
- Components are separated by scene/game responsibility rather than by generic UI folders.
- Scene logic is colocated inside components instead of extracted into many helpers.

### Error handling conventions
- No explicit error handling patterns were observed.
- No `try/catch`, custom error helpers, or runtime logging paths were found in the app source.

### Logging practices
- No structured logging or console logging was observed.

### Configuration management
- Vite config uses `loadEnv(mode, '.', '')`.
- `vite.config.ts` defines `process.env.GEMINI_API_KEY` at build time.
- `.env.example` documents:
  - `GEMINI_API_KEY`
  - `APP_URL`
- `.gitignore` ignores `.env*` except `.env.example`.
- Important caveat: environment variables appear mostly template-related; no active source usage of Gemini or `APP_URL` was found.

### Authentication/authorization patterns
- None found.

### Input handling conventions
- `useControls()` maps:
  - `W`/`ArrowUp` → `forward`
  - `S`/`ArrowDown` → `backward`
  - `A`/`ArrowLeft` → `left`
  - `D`/`ArrowRight` → `right`
  - `Space` → `jump` and `brake`
  - `E`/`Enter` → `interact`
- `Player` and `Car` each instantiate the hook separately, so keyboard listeners are duplicated.

### Physics/rendering conventions
- Render meshes are usually attached to physics refs directly.
- Player visually decouples the rendered avatar from the invisible collision sphere.
- Per-frame camera and movement logic live inside `useFrame()`.

### Mode transition behavior
- Entering/exiting the car uses `setTimeout(..., 500)` to advance between transitional and active modes.
- `UI` also allows direct mode switching via buttons, bypassing proximity checks and transitional timing.

## 8. Testing Strategy
### Current state
- No automated tests were found.
- No `__tests__`, no test runner config, and no CI workflow directory were observed.

### Practical implication
Validation currently appears to rely on:
- manual local runs with `npm run dev`
- visual inspection of gameplay behavior
- TypeScript checks via `npm run lint`

### Mocking/stubbing patterns
- None found.

### Test data management
- None found.

## 9. Getting Started
### Prerequisites
- Node.js
- Practically, a modern Node version is safest. Exploration of the lockfile indicated the installed Vite/plugin toolchain is most compatible with **Node 20.19+ or Node 22.12+**.
- A browser with WebGL support.

### Setup instructions
1. Install dependencies:
   - `npm install`
2. Optionally create `.env.local`.
3. If following the template README, set:
   - `GEMINI_API_KEY=...`
4. Start development server:
   - `npm run dev`
5. Open the app on port `3000`.

### Common development tasks
- Start dev server: `npm run dev`
- Type-check: `npm run lint`
- Build production bundle: `npm run build`
- Preview build: `npm run preview`
- Clean output: `npm run clean`

### Useful commands
```bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

### Gameplay controls
- `WASD` / arrow keys: move or drive
- `Space`: jump on foot / brake in car
- `E` or `Enter`: interact
  - enter car when near it
  - exit car while driving

## 10. Areas of Complexity
### 1. Mode-driven ownership and transitions
The most important subsystem is the shared mode machine connecting walking, entering, driving, and exiting. Changes here affect:
- camera ownership
- player visibility
- vehicle controls
- spawn positioning
- UI behavior

### 2. Cross-component camera smoothing
`cameraLookAt` is a real coordination mechanism, not just UI/debug state. Breaking it can cause abrupt camera snaps during mode changes.

### 3. Dual meaning of shared speed state
Both `Player` and `Car` write to the same `speed` store field:
- Player writes raw movement magnitude
- Car writes km/h-like velocity
This works for the current HUD, but it is semantically mixed state.

### 4. Duplicated input listeners
`Player` and `Car` each call `useControls()`, creating separate window listeners and duplicated key state. Functional, but something future agents should notice before refactoring controls.

### 5. Direct UI mode overrides
The UI's `WALK` and `DRIVE` buttons bypass the natural transition flow. Future work that assumes all transitions happen through proximity/interact logic may be surprised.

### 6. Template leftovers / potential technical debt
Observed inconsistencies worth keeping in mind:
- `metadata.json` says `Drivengo`
- `package.json` is still named `react-example`
- `index.html` title is `My Google AI Studio App`
- `express`, `dotenv`, `tsx`, `@google/genai`, and `@types/express` are installed but not used in the reviewed source
- `.env.example` and Vite env wiring imply AI/Gemini/platform usage that is not currently implemented in app code
- `npm run lint` is a type-check, not a lint pass
- `npm run clean` uses `rm -rf`, which is POSIX-specific

### 7. Performance-sensitive areas
Most performance-sensitive logic is in per-frame loops:
- `Player.useFrame()`
- `Car.useFrame()`
- camera interpolation
- continuous store synchronization
- physics vehicle behavior
Future agents should be careful when adding React state updates or expensive allocations in frame callbacks.

---

## Additional Notes for Future Agents
- This codebase is small enough that most behavior is concentrated in five component files.
- If making gameplay changes, inspect **both** `Player.tsx` and `Car.tsx`, because store fields and cameras are shared across them.
- If changing setup/docs, verify whether you are preserving AI Studio-specific scaffolding versus the actual frontend-only behavior currently implemented.
