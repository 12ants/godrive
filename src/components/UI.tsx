import { useGameStore } from '../store';

export function UI() {
  const { mode, setMode, devMode, toggleDevMode, wireframe, toggleWireframe, showPerf, togglePerf, speed } = useGameStore();

  return (
    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between font-mono text-xs text-white z-10">
      <div className="flex justify-between items-start w-full">
        <div className="pointer-events-auto mt-16">
          <h1 className="text-xl font-bold mb-2 text-emerald-400">DRIVENGO</h1>
          <div className="bg-black/50 p-2 rounded border border-white/10 backdrop-blur-sm">
            <p className="text-emerald-300 mb-1">CONTROLS</p>
            <p>WASD / Arrows : Move / Drive</p>
            <p>Space : Jump / Brake</p>
            <p>E / Enter : Interact (Future)</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <button
            onClick={toggleDevMode}
            className={`px-3 py-1 rounded border ${devMode ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-black/50 border-white/10'}`}
          >
            DEV MODE: {devMode ? 'ON' : 'OFF'}
          </button>

          {devMode && (
            <div className="flex flex-col gap-2 items-end bg-black/50 p-2 rounded border border-white/10 backdrop-blur-sm">
              <button
                onClick={toggleWireframe}
                className={`px-2 py-1 rounded border text-left w-full ${wireframe ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'border-white/10'}`}
              >
                WIREFRAME: {wireframe ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={togglePerf}
                className={`px-2 py-1 rounded border text-left w-full ${showPerf ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'border-white/10'}`}
              >
                PERF: {showPerf ? 'ON' : 'OFF'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-end w-full">
        <div className="bg-black/50 p-2 rounded border border-white/10 backdrop-blur-sm pointer-events-auto flex gap-2">
          <button
            onClick={() => setMode('walking')}
            className={`px-4 py-2 rounded ${mode === 'walking' ? 'bg-emerald-500 text-black font-bold' : 'bg-white/10 hover:bg-white/20'}`}
          >
            WALK
          </button>
          <button
            onClick={() => setMode('driving')}
            className={`px-4 py-2 rounded ${mode === 'driving' ? 'bg-emerald-500 text-black font-bold' : 'bg-white/10 hover:bg-white/20'}`}
          >
            DRIVE
          </button>
        </div>

        <div className="bg-black/80 p-4 rounded-full border border-emerald-500/30 w-24 h-24 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-emerald-400">{speed}</span>
          <span className="text-[10px] text-emerald-500/70">{mode === 'driving' ? 'KM/H' : 'SPEED'}</span>
        </div>
      </div>
    </div>
  );
}
