import { usePlane, useBox } from '@react-three/cannon';
import { useGameStore } from '../store';

const treeClusters = [
  { position: [-24, 0, -26], scale: 1.2 },
  { position: [-18, 0, -18], scale: 0.95 },
  { position: [-30, 0, -8], scale: 1.1 },
  { position: [26, 0, -28], scale: 1.3 },
  { position: [32, 0, -18], scale: 0.9 },
  { position: [24, 0, 16], scale: 1.15 },
  { position: [-28, 0, 22], scale: 1.05 },
  { position: [-18, 0, 30], scale: 1.25 },
];

const lampPosts = [
  [-8, 0, -3],
  [0, 0, -8],
  [9, 0, -13],
  [18, 0, -18],
];

const rockGroups = [
  { position: [-10, 0.45, 12] as [number, number, number], scale: [1.6, 1, 1.3] as [number, number, number], color: '#473f66' },
  { position: [14, 0.35, 8] as [number, number, number], scale: [1.2, 0.8, 1] as [number, number, number], color: '#574769' },
  { position: [21, 0.5, 22] as [number, number, number], scale: [1.8, 1.1, 1.4] as [number, number, number], color: '#4e4567' },
];

function PineTree({ position, scale }: { position: [number, number, number]; scale: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.2, 0.35, 2.4, 10]} />
        <meshStandardMaterial color="#37281f" />
      </mesh>
      <mesh castShadow position={[0, 2.7, 0]}>
        <coneGeometry args={[1.4, 2.8, 12]} />
        <meshStandardMaterial color="#1d3b3c" />
      </mesh>
      <mesh castShadow position={[0, 3.8, 0]}>
        <coneGeometry args={[1.05, 2.2, 12]} />
        <meshStandardMaterial color="#25494b" />
      </mesh>
      <mesh castShadow position={[0, 4.7, 0]}>
        <coneGeometry args={[0.72, 1.6, 12]} />
        <meshStandardMaterial color="#2f5d60" />
      </mesh>
    </group>
  );
}

function LampPost({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 2.2, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 4.4, 10]} />
        <meshStandardMaterial color="#252033" metalness={0.25} roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 4.5, 0]}>
        <boxGeometry args={[0.45, 0.22, 0.45]} />
        <meshStandardMaterial color="#1f172a" metalness={0.15} roughness={0.65} />
      </mesh>
      <mesh position={[0, 4.1, 0]}>
        <sphereGeometry args={[0.24, 16, 16]} />
        <meshStandardMaterial color="#ffd7ab" emissive="#ffb56b" emissiveIntensity={1.8} />
      </mesh>
      <pointLight position={[0, 4.1, 0]} color="#ffb56b" intensity={1.6} distance={11} decay={2} />
    </group>
  );
}

/**
 * Renders the static world geometry and a single dynamic obstacle for physics tests.
 */
export function Environment() {
  const wireframe = useGameStore((state) => state.wireframe);
  const wireframeColor = '#39ff14';

  // Large ground plane that everything else rests on.
  const [groundRef] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    material: 'ground',
  }));

  // Movable box that can be bumped by the player or vehicles.
  const [boxRef] = useBox(() => ({
    mass: 10,
    position: [0, 5, -10],
    args: [2, 2, 2],
  }));

  // Static ramp used to test suspension, jumping, and collision response.
  const [rampRef] = useBox(() => ({
    type: 'Static',
    position: [10, 1, -15],
    rotation: [0.3, 0, 0],
    args: [10, 0.5, 10],
  }));

  return (
    <>
      <mesh ref={groundRef as any} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#1f3040" roughness={0.94} metalness={0.02} />
        {/* Wireframe overlays mirror the solid mesh so debug geometry lines up exactly. */}
        {wireframe && (
          <mesh>
            <planeGeometry args={[200, 200]} />
            <meshBasicMaterial color={wireframeColor} wireframe transparent opacity={0.4} depthTest={false} />
          </mesh>
        )}
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <circleGeometry args={[46, 64]} />
        <meshStandardMaterial color="#24364b" transparent opacity={0.92} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0.24, 0]} position={[2, 0.03, -4]} receiveShadow>
        <planeGeometry args={[14, 40]} />
        <meshStandardMaterial color="#2a2636" roughness={0.96} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0.24, 0]} position={[2, 0.031, -4]}>
        <planeGeometry args={[0.18, 34]} />
        <meshStandardMaterial color="#ffd17f" emissive="#ffb86b" emissiveIntensity={0.55} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-16, 0.015, 18]}>
        <circleGeometry args={[9.5, 48]} />
        <meshStandardMaterial color="#16273a" metalness={0.14} roughness={0.18} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-16, 0.03, 18]}>
        <ringGeometry args={[7.6, 9.7, 48]} />
        <meshStandardMaterial color="#4fd5ff" transparent opacity={0.18} emissive="#39b8ff" emissiveIntensity={0.5} />
      </mesh>

      <mesh ref={boxRef as any} castShadow receiveShadow>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#d98a44" roughness={0.82} />
        {wireframe && (
          <mesh scale={[1.002, 1.002, 1.002]}>
            <boxGeometry args={[2, 2, 2]} />
            <meshBasicMaterial color={wireframeColor} wireframe transparent opacity={0.4} depthTest={false} />
          </mesh>
        )}
      </mesh>

      <mesh ref={rampRef as any} castShadow receiveShadow>
        <boxGeometry args={[10, 0.5, 10]} />
        <meshStandardMaterial color="#6d647d" roughness={0.9} />
        {wireframe && (
          <mesh scale={[1.002, 1.002, 1.002]}>
            <boxGeometry args={[10, 0.5, 10]} />
            <meshBasicMaterial color={wireframeColor} wireframe transparent opacity={0.4} depthTest={false} />
          </mesh>
        )}
      </mesh>

      {treeClusters.map((tree) => (
        <PineTree key={tree.position.join(',')} position={tree.position as [number, number, number]} scale={tree.scale} />
      ))}

      {lampPosts.map((position) => (
        <LampPost key={position.join(',')} position={position as [number, number, number]} />
      ))}

      {rockGroups.map((rock) => (
        <mesh key={rock.position.join(',')} castShadow receiveShadow position={rock.position} scale={rock.scale}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={rock.color} roughness={0.95} />
        </mesh>
      ))}

      <mesh position={[0, 13, -64]} scale={[90, 18, 22]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#17172a" roughness={1} />
      </mesh>
      <mesh position={[-46, 15, -54]} scale={[42, 16, 18]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#211a35" roughness={1} />
      </mesh>
      <mesh position={[52, 16, -48]} scale={[44, 15, 20]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#201934" roughness={1} />
      </mesh>

      {/* Ground grid gives players orientation cues while driving around the sandbox. */}
      <gridHelper args={[200, 80, '#2d3650', '#20263c']} position={[0, 0.01, 0]} />
    </>
  );
}
