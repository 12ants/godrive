import { useGameStore } from '../store';

/**
 * Heads-up display for controls, developer toggles, mode shortcuts, and speed.
 */
export function UI() {
  const { mode, setMode, devMode, toggleDevMode, wireframe, toggleWireframe, showPerf, togglePerf, speed } = useGameStore();

  return (
    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between font-mono text-xs text-white z-10">
      <div className="flex justify-between items-start w-full">
        {/* Left panel keeps the controls reference available without taking permanent space. */}
        <div className="pointer-events-auto mt-16 flex flex-col gap-2">
          <h1 className="text-xl font-bold text-emerald-400">GODRIVE</h1>
          <details className="group rounded border border-white/10 bg-black/50 backdrop-blur-sm">
            <summary className="cursor-pointer list-none px-3 py-2 text-emerald-300">
              CONTROLS
            </summary>
            <div className="border-t border-white/10 px-3 py-2 space-y-1 text-white/90">
              <p>WASD / Arrows : Move / Drive</p>
              <p>Space : Jump / Brake</p>
              <p>E / Enter : Interact</p>
            </div>
          </details>
        </div>

        {/* Right panel moves scene toggles into dropdown menus and keeps perf separate. */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <details className="rounded border border-white/10 bg-black/50 backdrop-blur-sm min-w-48">
            <summary className="cursor-pointer list-none px-3 py-2">
              DEV MENU
            </summary>
            <div className="border-t border-white/10 p-2 flex flex-col gap-2">
              <button
                onClick={(e) => {
                  toggleDevMode();
                  e.currentTarget.blur();
                }}
                className={`px-2 py-1 rounded border text-left w-full ${devMode ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'border-white/10'}`}
              >
                DEV MODE: {devMode ? 'ON' : 'OFF'}
              </button>

              {devMode && (
                <details className="rounded border border-white/10 bg-black/30">
                  <summary className="cursor-pointer list-none px-2 py-1 text-left">
                    RENDER OPTIONS
                  </summary>
                  <div className="border-t border-white/10 p-2">
                    <button
                      onClick={(e) => {
                        toggleWireframe();
                        e.currentTarget.blur();
                      }}
                      className={`px-2 py-1 rounded border text-left w-full ${wireframe ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'border-white/10'}`}
                    >
                      WIREFRAME: {wireframe ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </details>
              )}
            </div>
          </details>

          <button
            onClick={(e) => {
              togglePerf();
              e.currentTarget.blur();
            }}
            className={`px-3 py-1 rounded border ${showPerf ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-black/50 border-white/10'}`}
          >
            PERF: {showPerf ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div className="flex justify-between items-end w-full">
        {/* Manual mode switching now lives in a compact dropdown instead of separate buttons. */}
        <details className="bg-black/50 rounded border border-white/10 backdrop-blur-sm pointer-events-auto min-w-40">
          <summary className="cursor-pointer list-none px-3 py-2">
            MODE: {mode.replace('_', ' ').toUpperCase()}
          </summary>
          <div className="border-t border-white/10 p-2 flex flex-col gap-2">
            <button
              onClick={(e) => {
                setMode('walking');
                e.currentTarget.blur();
              }}
              className={`px-3 py-2 rounded text-left ${mode === 'walking' ? 'bg-emerald-500 text-black font-bold' : 'bg-white/10 hover:bg-white/20'}`}
            >
              WALK
            </button>
            <button
              onClick={(e) => {
                setMode('driving');
                e.currentTarget.blur();
              }}
              className={`px-3 py-2 rounded text-left ${mode === 'driving' ? 'bg-emerald-500 text-black font-bold' : 'bg-white/10 hover:bg-white/20'}`}
            >
              DRIVE
            </button>
          </div>
        </details>

        {/* Speed indicator reflects player speed on foot and km/h-like speed while driving. */}
        <div className="bg-black/80 p-4 rounded-full border border-emerald-500/30 w-24 h-24 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-emerald-400">{speed}</span>
          <span className="text-[10px] text-emerald-500/70">{mode === 'driving' ? 'KM/H' : 'SPEED'}</span>
        </div>
      </div>
    </div>
  );
}
