/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Scene } from './components/Scene';
import { UI } from './components/UI';

/**
 * Composes the 3D scene with the HUD overlay.
 */
export default function App() {
  return (
    <div className="w-full h-screen bg-black overflow-hidden relative">
      {/* Full-screen WebGL scene and physics world. */}
      <Scene />
      {/* DOM-based HUD rendered over the canvas. */}
      <UI />
    </div>
  );
}
