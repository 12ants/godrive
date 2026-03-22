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
      <color attach="background" args={['#171720']} />
      <fog attach="fog" args={['#171720', 10, 50]} />

      {/* Base ambient and directional lighting for the world and shadows. */}
      <ambientLight intensity={0.5} />
      <directionalLight
        castShadow
        position={[10, 20, 10]}
        intensity={1.5}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      {/* Sky dome and stars provide lightweight atmosphere without scene geometry. */}
      <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.5} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

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
