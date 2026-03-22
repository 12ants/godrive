import { create } from 'zustand';

interface GameState {
  mode: 'walking' | 'driving' | 'entering_car' | 'exiting_car';
  setMode: (mode: 'walking' | 'driving' | 'entering_car' | 'exiting_car') => void;
  devMode: boolean;
  toggleDevMode: () => void;
  wireframe: boolean;
  toggleWireframe: () => void;
  showPerf: boolean;
  togglePerf: () => void;
  speed: number;
  setSpeed: (speed: number) => void;
  carPosition: [number, number, number];
  setCarPosition: (pos: [number, number, number]) => void;
  playerPosition: [number, number, number];
  setPlayerPosition: (pos: [number, number, number]) => void;
  playerYaw: number;
  setPlayerYaw: (yaw: number) => void;
  cameraLookAt: [number, number, number];
  setCameraLookAt: (pos: [number, number, number]) => void;
}

export const useGameStore = create<GameState>((set) => ({
  mode: 'walking',
  setMode: (mode) => set({ mode }),
  devMode: true,
  toggleDevMode: () => set((state) => ({ devMode: !state.devMode })),
  wireframe: false,
  toggleWireframe: () => set((state) => ({ wireframe: !state.wireframe })),
  showPerf: true,
  togglePerf: () => set((state) => ({ showPerf: !state.showPerf })),
  speed: 0,
  setSpeed: (speed) => set({ speed }),
  carPosition: [5, 2, 0],
  setCarPosition: (pos) => set({ carPosition: pos }),
  playerPosition: [0, 2, 0],
  setPlayerPosition: (pos) => set({ playerPosition: pos }),
  playerYaw: 0,
  setPlayerYaw: (yaw) => set({ playerYaw: yaw }),
  cameraLookAt: [0, 2.5, -2],
  setCameraLookAt: (pos) => set({ cameraLookAt: pos }),
}));
