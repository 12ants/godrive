import { useSphere } from '@react-three/cannon';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Vector3, Quaternion, Group } from 'three';
import { useGameStore } from '../store';
import { useControls } from '../useControls';

const SPEED = 10;
const JUMP_FORCE = 8;

export function Player({ position = [0, 2, 0] }: { position?: [number, number, number] }) {
  const { camera } = useThree();
  const [ref, api] = useSphere(() => ({
    mass: 1,
    type: 'Dynamic',
    position,
    args: [0.5],
    fixedRotation: true,
  }));

  const velocity = useRef([0, 0, 0]);
  const pos = useRef([0, 0, 0]);
  const yaw = useRef(0);
  const groupRef = useRef<Group>(null);
  const currentLookAt = useRef(new Vector3(0, 2.5, -2));
  
  const { forward, backward, left, right, jump, interact } = useControls();
  const mode = useGameStore((state) => state.mode);
  const setMode = useGameStore((state) => state.setMode);
  const setSpeed = useGameStore((state) => state.setSpeed);
  const wireframe = useGameStore((state) => state.wireframe);

  useEffect(() => {
    if (mode === 'walking' || mode === 'exiting_car') {
      const lookAt = useGameStore.getState().cameraLookAt;
      currentLookAt.current.set(lookAt[0], lookAt[1], lookAt[2]);
    }
  }, [mode]);

  useEffect(() => {
    const unsubV = api.velocity.subscribe((v) => (velocity.current = v));
    const unsubP = api.position.subscribe((p) => (pos.current = p));
    return () => {
      unsubV();
      unsubP();
    };
  }, [api.velocity, api.position]);

  const prevMode = useRef(mode);
  useEffect(() => {
    const isNowWalking = mode === 'walking' || mode === 'exiting_car';
    const wasWalking = prevMode.current === 'walking' || prevMode.current === 'exiting_car';

    if (!wasWalking && isNowWalking) {
      const pPos = useGameStore.getState().playerPosition;
      const pYaw = useGameStore.getState().playerYaw;
      // Ensure we spawn high enough to not clip into the ground
      const spawnY = Math.max(pPos[1], 2);
      api.position.set(pPos[0], spawnY, pPos[2]);
      pos.current = [pPos[0], spawnY, pPos[2]]; // Update ref immediately to prevent camera glitch
      api.velocity.set(0, 0, 0);
      api.angularVelocity.set(0, 0, 0);
      yaw.current = pYaw;
      api.wakeUp();
    } else if (wasWalking && !isNowWalking) {
      // Move player far away but not falling infinitely
      api.position.set(0, 100, 0);
      pos.current = [0, 100, 0];
      api.velocity.set(0, 0, 0);
      api.sleep();
    }
    prevMode.current = mode;
  }, [mode, api.position, api.velocity, api.angularVelocity, api.wakeUp, api.sleep]);

  const prevInteract = useRef(false);

  useFrame((_, delta) => {
    const currentInteract = interact;
    const justPressedInteract = currentInteract && !prevInteract.current;
    prevInteract.current = currentInteract;

    // Always update player position in store
    useGameStore.setState({ playerPosition: [pos.current[0], pos.current[1], pos.current[2]] });

    if (mode === 'walking' && justPressedInteract) {
      const carPos = useGameStore.getState().carPosition;
      const dist = Math.sqrt(
        Math.pow(pos.current[0] - carPos[0], 2) +
        Math.pow(pos.current[1] - carPos[1], 2) +
        Math.pow(pos.current[2] - carPos[2], 2)
      );
      if (dist < 5) {
        setMode('entering_car');
        setTimeout(() => {
          setMode('driving');
        }, 500);
      }
    }

    if (mode === 'walking') {
      // Tank controls for player
      if (left) yaw.current += 3 * delta;
      if (right) yaw.current -= 3 * delta;

      const direction = new Vector3(0, 0, (backward ? 1 : 0) - (forward ? 1 : 0));
      direction.applyAxisAngle(new Vector3(0, 1, 0), yaw.current);
      direction.normalize().multiplyScalar(SPEED);

      api.velocity.set(direction.x, velocity.current[1], direction.z);
      
      // Calculate speed for UI
      const currentSpeed = Math.sqrt(direction.x ** 2 + direction.z ** 2);
      setSpeed(Math.round(currentSpeed));

      if (jump && Math.abs(velocity.current[1]) < 0.05) {
        api.velocity.set(velocity.current[0], JUMP_FORCE, velocity.current[2]);
      }
    } else if (mode === 'exiting_car') {
      // Stop moving while exiting
      api.velocity.set(0, velocity.current[1], 0);
    }

    // Update visual mesh
    if (groupRef.current) {
      groupRef.current.position.set(pos.current[0], pos.current[1], pos.current[2]);
      groupRef.current.rotation.y = yaw.current;
    }

    if (mode === 'walking' || mode === 'exiting_car') {
      // Chase camera
      const playerPosition = new Vector3(pos.current[0], pos.current[1], pos.current[2]);
      const playerQuaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yaw.current);

      const cameraOffset = new Vector3(0, 1.5, 4); // Behind and slightly up
      cameraOffset.applyQuaternion(playerQuaternion);
      const idealCameraPosition = playerPosition.clone().add(cameraOffset);
      idealCameraPosition.y = Math.max(idealCameraPosition.y, 1);

      camera.position.lerp(idealCameraPosition, 5 * delta);
      
      const lookAtOffset = new Vector3(0, 0.5, -2); // Look slightly ahead
      lookAtOffset.applyQuaternion(playerQuaternion);
      const idealLookAt = playerPosition.clone().add(lookAtOffset);
      
      currentLookAt.current.lerp(idealLookAt, 5 * delta);
      camera.lookAt(currentLookAt.current);
      useGameStore.setState({ cameraLookAt: [currentLookAt.current.x, currentLookAt.current.y, currentLookAt.current.z] });
    }
  });

  return (
    <>
      <mesh ref={ref as any} visible={false}>
        <sphereGeometry args={[0.5, 32, 32]} />
      </mesh>
      <group ref={groupRef} visible={mode === 'walking' || mode === 'exiting_car'}>
        <mesh castShadow>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color="#ff4081" wireframe={wireframe} />
        </mesh>
        {/* Visor/Eyes to indicate front */}
        <mesh position={[0, 0.2, -0.4]} castShadow>
          <boxGeometry args={[0.6, 0.2, 0.2]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      </group>
    </>
  );
}
