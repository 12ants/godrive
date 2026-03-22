import { useBox, useCylinder, useRaycastVehicle } from '@react-three/cannon';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Vector3, Quaternion } from 'three';
import { useGameStore } from '../store';
import { useControls } from '../useControls';

export function Car({ position = [5, 2, 0] }: { position?: [number, number, number] }) {
  const { camera } = useThree();
  const mode = useGameStore((state) => state.mode);
  const setMode = useGameStore((state) => state.setMode);
  const setSpeed = useGameStore((state) => state.setSpeed);
  const wireframe = useGameStore((state) => state.wireframe);
  const { forward, backward, left, right, brake, interact } = useControls();

  const chassisBodyArgs: [number, number, number] = [2, 1, 4];
  const [chassisRef, chassisApi] = useBox(() => ({
    mass: 1500,
    position,
    args: chassisBodyArgs,
  }));

  const wheelInfo = {
    radius: 0.5,
    directionLocal: [0, -1, 0] as [number, number, number],
    suspensionStiffness: 30,
    suspensionRestLength: 0.3,
    maxSuspensionForce: 100000,
    maxSuspensionTravel: 0.3,
    dampingRelaxation: 2.3,
    dampingCompression: 4.4,
    frictionSlip: 5,
    rollInfluence: 0.01,
    axleLocal: [-1, 0, 0] as [number, number, number],
    chassisConnectionPointLocal: [1, 0, 1] as [number, number, number],
    isFrontWheel: false,
    useCustomSlidingRotationalSpeed: true,
    customSlidingRotationalSpeed: -30,
  };

  const wheelInfos = [
    { ...wheelInfo, chassisConnectionPointLocal: [-1.2, -0.5, 1.5] as [number, number, number], isFrontWheel: true },
    { ...wheelInfo, chassisConnectionPointLocal: [1.2, -0.5, 1.5] as [number, number, number], isFrontWheel: true },
    { ...wheelInfo, chassisConnectionPointLocal: [-1.2, -0.5, -1.5] as [number, number, number], isFrontWheel: false },
    { ...wheelInfo, chassisConnectionPointLocal: [1.2, -0.5, -1.5] as [number, number, number], isFrontWheel: false },
  ];

  const [wheel1] = useCylinder(() => ({ mass: 1, type: 'Kinematic', material: 'wheel', collisionFilterGroup: 0, args: [0.5, 0.5, 0.5, 16] }));
  const [wheel2] = useCylinder(() => ({ mass: 1, type: 'Kinematic', material: 'wheel', collisionFilterGroup: 0, args: [0.5, 0.5, 0.5, 16] }));
  const [wheel3] = useCylinder(() => ({ mass: 1, type: 'Kinematic', material: 'wheel', collisionFilterGroup: 0, args: [0.5, 0.5, 0.5, 16] }));
  const [wheel4] = useCylinder(() => ({ mass: 1, type: 'Kinematic', material: 'wheel', collisionFilterGroup: 0, args: [0.5, 0.5, 0.5, 16] }));

  const [vehicleRef, vehicleApi] = useRaycastVehicle(() => ({
    chassisBody: chassisRef,
    wheels: [wheel1, wheel2, wheel3, wheel4],
    wheelInfos,
    indexForwardAxis: 2,
    indexRightAxis: 0,
    indexUpAxis: 1,
  }));

  const velocity = useRef([0, 0, 0]);
  const pos = useRef([0, 0, 0]);
  const rotation = useRef([0, 0, 0, 1] as [number, number, number, number]);
  const currentLookAt = useRef(new Vector3(0, 0, 0));
  const exitTransitionElapsed = useRef(0);
  const exitTransitionDuration = 0.5;

  useEffect(() => {
    if (mode === 'driving' || mode === 'entering_car') {
      const lookAt = useGameStore.getState().cameraLookAt;
      currentLookAt.current.set(lookAt[0], lookAt[1], lookAt[2]);
    }
  }, [mode]);

  useEffect(() => {
    if (mode === 'exiting_car') {
      exitTransitionElapsed.current = 0;
    }
  }, [mode]);

  useEffect(() => {
    const unsubV = chassisApi.velocity.subscribe((v) => (velocity.current = v));
    const unsubP = chassisApi.position.subscribe((p) => (pos.current = p));
    const unsubR = chassisApi.quaternion.subscribe((q) => (rotation.current = q));
    return () => {
      unsubV();
      unsubP();
      unsubR();
    };
  }, [chassisApi.velocity, chassisApi.position, chassisApi.quaternion]);

  const prevInteract = useRef(false);

  useFrame((_, delta) => {
    const currentInteract = interact;
    const justPressedInteract = currentInteract && !prevInteract.current;
    prevInteract.current = currentInteract;

    // Always update car position in store
    useGameStore.setState({ carPosition: [pos.current[0], pos.current[1], pos.current[2]] });

    if (mode === 'driving' && justPressedInteract) {
      const carQuaternion = new Quaternion(rotation.current[0], rotation.current[1], rotation.current[2], rotation.current[3]);
      
      // Calculate left side of the car (-X is left when facing -Z)
      const leftOffset = new Vector3(-2.5, 1.5, 0); // Increased Y offset to prevent falling through ground
      leftOffset.applyQuaternion(carQuaternion);
      const spawnPos = new Vector3(pos.current[0], pos.current[1], pos.current[2]).add(leftOffset);
      
      // Calculate forward yaw for the player (car's forward is -Z)
      const carForward = new Vector3(0, 0, -1).applyQuaternion(carQuaternion);
      const yaw = Math.atan2(-carForward.x, -carForward.z);

      useGameStore.setState({ 
        playerPosition: [spawnPos.x, Math.max(spawnPos.y, 2), spawnPos.z],
        playerYaw: yaw
      });
      setMode('exiting_car');
      setTimeout(() => {
        setMode('walking');
      }, 500);
    }

    if (mode === 'driving' || mode === 'entering_car') {
      // Chase camera
      const carPosition = new Vector3(pos.current[0], pos.current[1], pos.current[2]);
      const carQuaternion = new Quaternion(rotation.current[0], rotation.current[1], rotation.current[2], rotation.current[3]);

      const cameraOffset = new Vector3(0, 3, -10);
      cameraOffset.applyQuaternion(carQuaternion);
      const idealCameraPosition = carPosition.clone().add(cameraOffset);
      idealCameraPosition.y = Math.max(idealCameraPosition.y, 1); // Prevent camera from going underground

      camera.position.lerp(idealCameraPosition, 5 * delta);
      
      // Look slightly ahead of the car's center
      const lookAtOffset = new Vector3(0, 1, 2);
      lookAtOffset.applyQuaternion(carQuaternion);
      const idealLookAt = carPosition.clone().add(lookAtOffset);
      
      currentLookAt.current.lerp(idealLookAt, 5 * delta);
      camera.lookAt(currentLookAt.current);
      useGameStore.setState({ cameraLookAt: [currentLookAt.current.x, currentLookAt.current.y, currentLookAt.current.z] });
    } else if (mode === 'exiting_car') {
      exitTransitionElapsed.current = Math.min(exitTransitionElapsed.current + delta, exitTransitionDuration);
      const t = exitTransitionElapsed.current / exitTransitionDuration;
      const smoothT = t * t * (3 - 2 * t);

      const carPosition = new Vector3(pos.current[0], pos.current[1], pos.current[2]);
      const carQuaternion = new Quaternion(rotation.current[0], rotation.current[1], rotation.current[2], rotation.current[3]);
      const carCameraOffset = new Vector3(0, 3, -10).applyQuaternion(carQuaternion);
      const carCameraPosition = carPosition.clone().add(carCameraOffset);
      carCameraPosition.y = Math.max(carCameraPosition.y, 1);
      const carLookAtOffset = new Vector3(0, 1, 2).applyQuaternion(carQuaternion);
      const carLookAt = carPosition.clone().add(carLookAtOffset);

      const { playerPosition, playerYaw } = useGameStore.getState();
      const playerPosVec = new Vector3(playerPosition[0], playerPosition[1], playerPosition[2]);
      const playerQuaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), playerYaw);
      const playerCameraOffset = new Vector3(0, 1.5, 4).applyQuaternion(playerQuaternion);
      const playerCameraPosition = playerPosVec.clone().add(playerCameraOffset);
      playerCameraPosition.y = Math.max(playerCameraPosition.y, 1);
      const playerLookAtOffset = new Vector3(0, 0.5, -2).applyQuaternion(playerQuaternion);
      const playerLookAt = playerPosVec.clone().add(playerLookAtOffset);

      const blendedCameraPosition = carCameraPosition.lerp(playerCameraPosition, smoothT);
      const blendedLookAt = carLookAt.lerp(playerLookAt, smoothT);
      camera.position.copy(blendedCameraPosition);
      currentLookAt.current.lerp(blendedLookAt, 5 * delta);
      camera.lookAt(currentLookAt.current);
      useGameStore.setState({ cameraLookAt: [currentLookAt.current.x, currentLookAt.current.y, currentLookAt.current.z] });
    }

    const engineForce = 1500;
    const maxSteerVal = 0.5;
    const brakeForce = 50;

    if (mode === 'driving') {
      if (forward) {
        vehicleApi.applyEngineForce(-engineForce, 2);
        vehicleApi.applyEngineForce(-engineForce, 3);
      } else if (backward) {
        vehicleApi.applyEngineForce(engineForce, 2);
        vehicleApi.applyEngineForce(engineForce, 3);
      } else {
        vehicleApi.applyEngineForce(0, 2);
        vehicleApi.applyEngineForce(0, 3);
      }

      if (left) {
        vehicleApi.setSteeringValue(maxSteerVal, 0);
        vehicleApi.setSteeringValue(maxSteerVal, 1);
      } else if (right) {
        vehicleApi.setSteeringValue(-maxSteerVal, 0);
        vehicleApi.setSteeringValue(-maxSteerVal, 1);
      } else {
        vehicleApi.setSteeringValue(0, 0);
        vehicleApi.setSteeringValue(0, 1);
      }

      if (brake) {
        vehicleApi.setBrake(brakeForce, 0);
        vehicleApi.setBrake(brakeForce, 1);
        vehicleApi.setBrake(brakeForce, 2);
        vehicleApi.setBrake(brakeForce, 3);
      } else {
        vehicleApi.setBrake(0, 0);
        vehicleApi.setBrake(0, 1);
        vehicleApi.setBrake(0, 2);
        vehicleApi.setBrake(0, 3);
      }
    } else {
      // Apply brakes when not driving
      vehicleApi.applyEngineForce(0, 2);
      vehicleApi.applyEngineForce(0, 3);
      vehicleApi.setSteeringValue(0, 0);
      vehicleApi.setSteeringValue(0, 1);
      vehicleApi.setBrake(brakeForce, 0);
      vehicleApi.setBrake(brakeForce, 1);
      vehicleApi.setBrake(brakeForce, 2);
      vehicleApi.setBrake(brakeForce, 3);
    }

    // Calculate speed for UI (km/h)
    const currentSpeed = Math.sqrt(velocity.current[0] ** 2 + velocity.current[2] ** 2) * 3.6;
    setSpeed(Math.round(currentSpeed));
  });

  return (
    <group ref={vehicleRef as any}>
      <mesh ref={chassisRef as any} castShadow>
        <boxGeometry args={chassisBodyArgs} />
        <meshStandardMaterial color="#00bcd4" wireframe={wireframe} />
      </mesh>
      <group ref={wheel1 as any}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.5, 0.5, 0.5, 16]} />
          <meshStandardMaterial color="#333" wireframe={wireframe} />
        </mesh>
      </group>
      <group ref={wheel2 as any}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.5, 0.5, 0.5, 16]} />
          <meshStandardMaterial color="#333" wireframe={wireframe} />
        </mesh>
      </group>
      <group ref={wheel3 as any}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.5, 0.5, 0.5, 16]} />
          <meshStandardMaterial color="#333" wireframe={wireframe} />
        </mesh>
      </group>
      <group ref={wheel4 as any}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.5, 0.5, 0.5, 16]} />
          <meshStandardMaterial color="#333" wireframe={wireframe} />
        </mesh>
      </group>
    </group>
  );
}
