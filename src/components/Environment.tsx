import { usePlane, useBox } from '@react-three/cannon';
import { useGameStore } from '../store';

export function Environment() {
  const wireframe = useGameStore((state) => state.wireframe);
  const wireframeColor = '#39ff14';

  const [groundRef] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    material: 'ground',
  }));

  const [boxRef] = useBox(() => ({
    mass: 10,
    position: [0, 5, -10],
    args: [2, 2, 2],
  }));

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
        <meshStandardMaterial color="#4caf50" />
        {wireframe && (
          <mesh>
            <planeGeometry args={[200, 200]} />
            <meshBasicMaterial color={wireframeColor} wireframe transparent opacity={0.4} depthTest={false} />
          </mesh>
        )}
      </mesh>

      <mesh ref={boxRef as any} castShadow receiveShadow>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#ff9800" />
        {wireframe && (
          <mesh scale={[1.002, 1.002, 1.002]}>
            <boxGeometry args={[2, 2, 2]} />
            <meshBasicMaterial color={wireframeColor} wireframe transparent opacity={0.4} depthTest={false} />
          </mesh>
        )}
      </mesh>

      <mesh ref={rampRef as any} castShadow receiveShadow>
        <boxGeometry args={[10, 0.5, 10]} />
        <meshStandardMaterial color="#9e9e9e" />
        {wireframe && (
          <mesh scale={[1.002, 1.002, 1.002]}>
            <boxGeometry args={[10, 0.5, 10]} />
            <meshBasicMaterial color={wireframeColor} wireframe transparent opacity={0.4} depthTest={false} />
          </mesh>
        )}
      </mesh>
      
      {/* Add a grid to the ground */}
      <gridHelper args={[200, 200, '#222222', '#444444']} position={[0, 0.01, 0]} />
    </>
  );
}
