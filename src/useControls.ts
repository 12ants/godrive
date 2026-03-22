import { useEffect, useState } from 'react';
import { ControlState, useGameStore } from './store';

/**
 * Tracks the keyboard state used by both the walking and driving controllers.
 */
export function useControls() {
  // Unified input state consumed by both player and car.
  const [keys, setKeys] = useState<ControlState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    interact: false,
    brake: false,
  });
  const touchControls = useGameStore((state) => state.touchControls);

  useEffect(() => {
    // Keyboard state is tracked as keydown/keyup booleans so frame loops can poll
    // current intent without waiting for React event handlers every frame.
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        // Movement axis (W/S and arrows).
        case 'KeyW':
        case 'ArrowUp':
          setKeys((k) => ({ ...k, forward: true }));
          break;
        case 'KeyS':
        case 'ArrowDown':
          setKeys((k) => ({ ...k, backward: true }));
          break;
        case 'KeyA':
        case 'ArrowLeft':
          setKeys((k) => ({ ...k, left: true }));
          break;
        case 'KeyD':
        case 'ArrowRight':
          setKeys((k) => ({ ...k, right: true }));
          break;

        // Space does double duty:
        // - jump while walking
        // - brake while driving
        case 'Space':
          setKeys((k) => ({ ...k, jump: true, brake: true }));
          break;

        // Interaction key:
        // - enter car while near it
        // - exit car while driving
        case 'KeyE':
        case 'Enter':
          setKeys((k) => ({ ...k, interact: true }));
          break;
      }
    };

    // Mirror keyup handlers to clear pressed state immediately.
    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setKeys((k) => ({ ...k, forward: false }));
          break;
        case 'KeyS':
        case 'ArrowDown':
          setKeys((k) => ({ ...k, backward: false }));
          break;
        case 'KeyA':
        case 'ArrowLeft':
          setKeys((k) => ({ ...k, left: false }));
          break;
        case 'KeyD':
        case 'ArrowRight':
          setKeys((k) => ({ ...k, right: false }));
          break;
        case 'Space':
          setKeys((k) => ({ ...k, jump: false, brake: false }));
          break;
        case 'KeyE':
        case 'Enter':
          setKeys((k) => ({ ...k, interact: false }));
          break;
      }
    };

    // Window-level listeners keep controls active regardless of focused UI element.
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return {
    forward: keys.forward || touchControls.forward,
    backward: keys.backward || touchControls.backward,
    left: keys.left || touchControls.left,
    right: keys.right || touchControls.right,
    jump: keys.jump || touchControls.jump,
    interact: keys.interact || touchControls.interact,
    brake: keys.brake || touchControls.brake,
  };
}
