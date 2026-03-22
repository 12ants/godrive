import { useEffect, useState } from 'react';
import { useGameStore } from '../store';

/**
 * Heads-up display for controls, developer toggles, mode shortcuts, and speed.
 */
export function UI() {
  const {
    mode,
    setMode,
    devMode,
    toggleDevMode,
    wireframe,
    toggleWireframe,
    showPerf,
    togglePerf,
    speed,
    canEnterCar,
    setTouchControl,
    resetTouchControls,
  } = useGameStore();
  const [showTouchControls, setShowTouchControls] = useState(false);

  useEffect(() => {
    const detectTouch = () => {
      const hasTouchPoints = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;
      const coarsePointer = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
      const noHover = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;
      setShowTouchControls(hasTouchPoints || coarsePointer || noHover);
    };

    detectTouch();

    if (typeof window === 'undefined') {
      return;
    }

    const coarsePointerQuery = window.matchMedia('(pointer: coarse)');
    const noHoverQuery = window.matchMedia('(hover: none)');
    coarsePointerQuery.addEventListener('change', detectTouch);
    noHoverQuery.addEventListener('change', detectTouch);
    window.addEventListener('blur', resetTouchControls);

    return () => {
      coarsePointerQuery.removeEventListener('change', detectTouch);
      noHoverQuery.removeEventListener('change', detectTouch);
      window.removeEventListener('blur', resetTouchControls);
      resetTouchControls();
    };
  }, [resetTouchControls]);

  const handleTouchControl = (control: 'forward' | 'backward' | 'left' | 'right' | 'interact' | 'brake', pressed: boolean) => {
    setTouchControl(control, pressed);
  };

  return (
    <div className={`absolute inset-0 pointer-events-none p-4 ${showTouchControls ? 'pb-44' : ''} flex flex-col justify-between font-mono text-xs text-white z-10`}>
      <div className="flex justify-between items-start w-full">
        {/* Left panel keeps the controls reference available without taking permanent space. */}
        <div className="pointer-events-auto mt-16 flex flex-col gap-2">
          <h1 className="text-xl font-bold text-emerald-400">GODRIVE</h1>
          {canEnterCar && (
            <div className="self-start rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[10px] tracking-[0.2em] text-emerald-300/90 backdrop-blur-sm">
              {showTouchControls ? 'CAR NEARBY · TAP ACTION TO ENTER' : 'CAR NEARBY · PRESS E TO ENTER'}
            </div>
          )}
          <details className="group rounded border border-white/10 bg-black/50 backdrop-blur-sm">
            <summary className="cursor-pointer list-none px-3 py-2 text-emerald-300">
              CONTROLS
            </summary>
            <div className="border-t border-white/10 px-3 py-2 space-y-1 text-white/90">
              <p>WASD / Arrows : Move / Drive</p>
              <p>Space : Jump / Brake</p>
              <p>E / Enter : Interact</p>
              {showTouchControls && <p>Touch Overlay : Drive / Walk / Interact</p>}
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

      {showTouchControls && (
        <>
          <div className="pointer-events-auto absolute left-4 bottom-24 flex flex-col items-center gap-2 select-none touch-none">
            <button
              type="button"
              aria-label="Accelerate or move forward"
              onPointerDown={(e) => {
                e.preventDefault();
                handleTouchControl('forward', true);
              }}
              onPointerUp={() => handleTouchControl('forward', false)}
              onPointerCancel={() => handleTouchControl('forward', false)}
              onPointerLeave={() => handleTouchControl('forward', false)}
              className="w-16 h-16 rounded-2xl border border-white/15 bg-black/65 backdrop-blur-md text-lg font-bold text-emerald-300 active:bg-emerald-500/25"
            >
              ▲
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Steer or turn left"
                onPointerDown={(e) => {
                  e.preventDefault();
                  handleTouchControl('left', true);
                }}
                onPointerUp={() => handleTouchControl('left', false)}
                onPointerCancel={() => handleTouchControl('left', false)}
                onPointerLeave={() => handleTouchControl('left', false)}
                className="w-16 h-16 rounded-2xl border border-white/15 bg-black/65 backdrop-blur-md text-lg font-bold text-emerald-300 active:bg-emerald-500/25"
              >
                ◀
              </button>

              <button
                type="button"
                aria-label="Reverse or move backward"
                onPointerDown={(e) => {
                  e.preventDefault();
                  handleTouchControl('backward', true);
                }}
                onPointerUp={() => handleTouchControl('backward', false)}
                onPointerCancel={() => handleTouchControl('backward', false)}
                onPointerLeave={() => handleTouchControl('backward', false)}
                className="w-16 h-16 rounded-2xl border border-white/15 bg-black/65 backdrop-blur-md text-lg font-bold text-emerald-300 active:bg-emerald-500/25"
              >
                ▼
              </button>

              <button
                type="button"
                aria-label="Steer or turn right"
                onPointerDown={(e) => {
                  e.preventDefault();
                  handleTouchControl('right', true);
                }}
                onPointerUp={() => handleTouchControl('right', false)}
                onPointerCancel={() => handleTouchControl('right', false)}
                onPointerLeave={() => handleTouchControl('right', false)}
                className="w-16 h-16 rounded-2xl border border-white/15 bg-black/65 backdrop-blur-md text-lg font-bold text-emerald-300 active:bg-emerald-500/25"
              >
                ▶
              </button>
            </div>
          </div>

          <div className="pointer-events-auto absolute right-4 bottom-24 flex flex-col items-end gap-3 select-none touch-none">
            <button
              type="button"
              aria-label={mode === 'driving' ? 'Exit the active car' : canEnterCar ? 'Enter the nearby car' : 'Interact'}
              onPointerDown={(e) => {
                e.preventDefault();
                handleTouchControl('interact', true);
              }}
              onPointerUp={() => handleTouchControl('interact', false)}
              onPointerCancel={() => handleTouchControl('interact', false)}
              onPointerLeave={() => handleTouchControl('interact', false)}
              className="min-w-28 rounded-2xl border border-emerald-500/30 bg-black/70 px-4 py-3 text-left backdrop-blur-md active:bg-emerald-500/25"
            >
              <span className="block text-[10px] text-emerald-500/70">ACTION</span>
              <span className="block text-sm font-bold text-emerald-300">
                {mode === 'driving' ? 'EXIT CAR' : canEnterCar ? 'ENTER CAR' : 'INTERACT'}
              </span>
            </button>

            <button
              type="button"
              aria-label="Brake"
              onPointerDown={(e) => {
                e.preventDefault();
                handleTouchControl('brake', true);
              }}
              onPointerUp={() => handleTouchControl('brake', false)}
              onPointerCancel={() => handleTouchControl('brake', false)}
              onPointerLeave={() => handleTouchControl('brake', false)}
              className="min-w-28 rounded-2xl border border-white/15 bg-black/70 px-4 py-3 text-left backdrop-blur-md active:bg-white/15"
            >
              <span className="block text-[10px] text-white/60">VEHICLE</span>
              <span className="block text-sm font-bold text-white">BRAKE</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
