import { create } from 'zustand';

/**
 * Identifiers for the selectable vehicles that exist in the scene.
 */
export type CarId = 'coupe' | 'sports';

/**
 * Central game state shared by UI, camera, player, and car systems.
 */
interface GameState {
  // Runtime mode controls who owns movement and camera logic.
  mode: 'walking' | 'driving' | 'entering_car' | 'exiting_car';
  setMode: (mode: 'walking' | 'driving' | 'entering_car' | 'exiting_car') => void;

  // Debug/visual toggles exposed in the in-game UI.
  devMode: boolean;
  toggleDevMode: () => void;
  wireframe: boolean;
  toggleWireframe: () => void;
  showPerf: boolean;
  togglePerf: () => void;

  // Current speed shown in the lower-right speed indicator.
  speed: number;
  setSpeed: (speed: number) => void;

  // Car/player transforms used for enter/exit flow and camera handoff.
  activeCarId: CarId;
  setActiveCarId: (carId: CarId) => void;
  carPositions: Record<CarId, [number, number, number]>;
  setCarPosition: (carId: CarId, pos: [number, number, number]) => void;
  playerPosition: [number, number, number];
  setPlayerPosition: (pos: [number, number, number]) => void;
  playerYaw: number;
  setPlayerYaw: (yaw: number) => void;

  // Last camera target so transitions start from the current view direction.
  cameraLookAt: [number, number, number];
  setCameraLookAt: (pos: [number, number, number]) => void;
}

/**
 * Shared Zustand store for gameplay mode, camera handoff data, and HUD state.
 */
export const useGameStore = create<GameState>((set) => ({
  // Start in walking mode so the user can approach and enter the car.
  mode: 'walking',
  setMode: (mode) => set({ mode }),

  // Dev helpers are enabled by default in this sandbox-style project.
  devMode: true,
  toggleDevMode: () => set((state) => ({ devMode: !state.devMode })),
  wireframe: false,
  toggleWireframe: () => set((state) => ({ wireframe: !state.wireframe })),
  showPerf: true,
  togglePerf: () => set((state) => ({ showPerf: !state.showPerf })),

  // Dynamic speed value; both player and car update this depending on mode.
  speed: 0,
  setSpeed: (speed) => set({ speed }),

  // Spawn defaults for both cars, the player, and camera orientation.
  activeCarId: 'coupe',
  setActiveCarId: (activeCarId) => set({ activeCarId }),
  carPositions: {
    coupe: [5, 2, 0],
    sports: [-12, 2, -4],
  },
  setCarPosition: (carId, pos) =>
    set((state) => ({
      carPositions: {
        ...state.carPositions,
        [carId]: pos,
      },
    })),
  playerPosition: [0, 3, 0],
  setPlayerPosition: (pos) => set({ playerPosition: pos }),
  playerYaw: 0,
  setPlayerYaw: (yaw) => set({ playerYaw: yaw }),
  cameraLookAt: [0, 2.5, -2],
  setCameraLookAt: (pos) => set({ cameraLookAt: pos }),
}));
