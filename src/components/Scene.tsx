import { Physics } from '@react-three/cannon';
import { Sky, Stars } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Perf } from 'r3f-perf';
import { useGameStore } from '../store';
import { Car } from './Car';
import { Environment } from './Environment';
import { Player } from './Player';

/**
 * Bootstraps the full 3D experience, including rendering, lighting, and physics.
 */
export function Scene() {
  const showPerf = useGameStore((state) => state.showPerf);
  const devMode = useGameStore((state) => state.devMode);

  return (
    <Canvas shadows camera={{ position: [0, 3.5, 4], fov: 50 }}>
      {/* Perf overlay is only shown when both developer toggles are enabled. */}
      {devMode && showPerf && <Perf position="top-left" />}

      {/* Background color and fog keep the scene readable at long distances. */}
      <color attach="background" args={['#120f25']} />
      <fog attach="fog" args={['#1a1630', 18, 95]} />

      {/* Base ambient and directional lighting for the world and shadows. */}
      <ambientLight intensity={0.3} color="#5a4f7d" />
      <hemisphereLight intensity={0.85} color="#8f7dff" groundColor="#0d1322" />
      <directionalLight
        castShadow
        position={[-18, 16, -12]}
        color="#ffb37a"
        intensity={2.1}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={90}
        shadow-camera-left={-35}
        shadow-camera-right={35}
        shadow-camera-top={35}
        shadow-camera-bottom={-35}
      />
      <directionalLight
        position={[20, 10, 18]}
        color="#6ea8ff"
        intensity={0.6}
      />
      <pointLight position={[0, 10, 0]} intensity={0.35} distance={45} color="#8bc5ff" />

      {/* Sky dome and stars provide lightweight atmosphere without scene geometry. */}
      <Sky
        distance={450000}
        sunPosition={[-120, 18, -80]}
        turbidity={8}
        rayleigh={1.8}
        mieCoefficient={0.018}
        mieDirectionalG={0.92}
      />
      <Stars radius={160} depth={90} count={3500} factor={3.8} saturation={0.15} fade speed={0.5} />

      {/* Physics owns the shared simulation for environment, player, and vehicles. */}
      <Physics broadphase="SAP" gravity={[0, -9.81, 0]}>
        <Environment />
        <Player />
        <Car carId="coupe" position={[5, 2, 0]} />
        <Car carId="sports" variant="sports" position={[-12, 2, -4]} />
      </Physics>
    </Canvas>
  );
}
