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
  const wireframeColor = '#39ff14';
  const { forward, backward, left, right, brake, interact } = useControls();

  const chassisBodyArgs: [number, number, number] = [2, 1, 4];
  const [chassisRef, chassisApi] = useBox(() => ({
    mass: 1500,
    position,
    linearDamping: 0.35,
    angularDamping: 0.55,
    args: chassisBodyArgs,
  }));

  const wheelInfo = {
    radius: 0.5,
    directionLocal: [0, -1, 0] as [number, number, number],
    suspensionStiffness: 38,
    suspensionRestLength: 0.26,
    maxSuspensionForce: 100000,
    maxSuspensionTravel: 0.28,
    dampingRelaxation: 3.2,
    dampingCompression: 5.1,
    frictionSlip: 4.6,
    rollInfluence: 0.08,
    axleLocal: [-1, 0, 0] as [number, number, number],
    chassisConnectionPointLocal: [1, 0, 1] as [number, number, number],
    isFrontWheel: false,
    useCustomSlidingRotationalSpeed: true,
    customSlidingRotationalSpeed: -30,
  };

  const wheelInfos = [
    { ...wheelInfo, frictionSlip: 4.2, chassisConnectionPointLocal: [-1.2, -0.5, -1.5] as [number, number, number], isFrontWheel: true },
    { ...wheelInfo, frictionSlip: 4.2, chassisConnectionPointLocal: [1.2, -0.5, -1.5] as [number, number, number], isFrontWheel: true },
    { ...wheelInfo, frictionSlip: 5.0, chassisConnectionPointLocal: [-1.2, -0.5, 1.5] as [number, number, number], isFrontWheel: false },
    { ...wheelInfo, frictionSlip: 5.0, chassisConnectionPointLocal: [1.2, -0.5, 1.5] as [number, number, number], isFrontWheel: false },
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
  const currentSteer = useRef(0);
  const currentEngineForce = useRef(0);
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
        playerPosition: [spawnPos.x, Math.max(spawnPos.y, 3), spawnPos.z],
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

      const cameraOffset = new Vector3(0, 3, 10);
      cameraOffset.applyQuaternion(carQuaternion);
      const idealCameraPosition = carPosition.clone().add(cameraOffset);
      idealCameraPosition.y = Math.max(idealCameraPosition.y, 1); // Prevent camera from going underground

      camera.position.lerp(idealCameraPosition, 5 * delta);
      
      // Look slightly ahead of the car's center
      const lookAtOffset = new Vector3(0, 1, -2);
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
      const carCameraOffset = new Vector3(0, 3, 10).applyQuaternion(carQuaternion);
      const carCameraPosition = carPosition.clone().add(carCameraOffset);
      carCameraPosition.y = Math.max(carCameraPosition.y, 1);
      const carLookAtOffset = new Vector3(0, 1, -2).applyQuaternion(carQuaternion);
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

    const speedKmh = Math.sqrt(velocity.current[0] ** 2 + velocity.current[2] ** 2) * 3.6;
    const baseEngineForce = 1800;
    const maxSteerVal = 0.58;
    const brakeForce = 52;
    const frontBrakeBias = 1.1;
    const rearBrakeBias = 0.9;

    if (mode === 'driving') {
      const steerSpeedFactor = Math.max(0.35, 1 - speedKmh / 110);
      const targetSteer = left ? maxSteerVal * steerSpeedFactor : right ? -maxSteerVal * steerSpeedFactor : 0;
      currentSteer.current += (targetSteer - currentSteer.current) * Math.min(1, delta * 8);
      vehicleApi.setSteeringValue(currentSteer.current, 0);
      vehicleApi.setSteeringValue(currentSteer.current, 1);

      const speedLimiter = forward ? Math.max(0.25, 1 - speedKmh / 180) : 1;
      const targetEngineForce = forward ? baseEngineForce * speedLimiter : backward ? -baseEngineForce * 0.75 : 0;
      const engineResponse = targetEngineForce === 0 ? 7 : 4;
      currentEngineForce.current += (targetEngineForce - currentEngineForce.current) * Math.min(1, delta * engineResponse);
      vehicleApi.applyEngineForce(currentEngineForce.current, 2);
      vehicleApi.applyEngineForce(currentEngineForce.current, 3);

      if (brake) {
        vehicleApi.setBrake(brakeForce * frontBrakeBias, 0);
        vehicleApi.setBrake(brakeForce * frontBrakeBias, 1);
        vehicleApi.setBrake(brakeForce * rearBrakeBias, 2);
        vehicleApi.setBrake(brakeForce * rearBrakeBias, 3);
      } else {
        const rollingBrake = targetEngineForce === 0 ? 6 : 0;
        vehicleApi.setBrake(rollingBrake, 0);
        vehicleApi.setBrake(rollingBrake, 1);
        vehicleApi.setBrake(rollingBrake, 2);
        vehicleApi.setBrake(rollingBrake, 3);
      }
    } else {
      // Apply brakes when not driving
      currentEngineForce.current = 0;
      currentSteer.current = 0;
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
    setSpeed(Math.round(speedKmh));
  });

  return (
    <group ref={vehicleRef as any}>
      <mesh ref={chassisRef as any} castShadow>
        <boxGeometry args={chassisBodyArgs} />
        <meshStandardMaterial color="#00bcd4" />
        {wireframe && (
          <mesh scale={[1.002, 1.002, 1.002]}>
            <boxGeometry args={chassisBodyArgs} />
            <meshBasicMaterial color={wireframeColor} wireframe transparent opacity={0.45} depthTest={false} />
          </mesh>
        )}
        <mesh position={[0, 0.45, -0.6]} castShadow>
          <boxGeometry args={[1.5, 0.5, 1.4]} />
          <meshStandardMaterial color="#263238" />
          {wireframe && (
            <mesh scale={[1.01, 1.01, 1.01]}>
              <boxGeometry args={[1.5, 0.5, 1.4]} />
              <meshBasicMaterial color={wireframeColor} wireframe transparent opacity={0.45} depthTest={false} />
            </mesh>
          )}
        </mesh>
        <mesh position={[0, 0.1, -2.05]}>
          <boxGeometry args={[1.3, 0.25, 0.1]} />
          <meshStandardMaterial color="#111" />
          {wireframe && (
            <mesh scale={[1.02, 1.02, 1.02]}>
              <boxGeometry args={[1.3, 0.25, 0.1]} />
              <meshBasicMaterial color={wireframeColor} wireframe transparent opacity={0.45} depthTest={false} />
            </mesh>
          )}
        </mesh>
        <mesh position={[-0.65, 0.05, -2.1]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#fff8c4" emissive="#ffe082" emissiveIntensity={1.5} />
          {wireframe && (
            <mesh scale={[1.08, 1.08, 1.08]}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshBasicMaterial color={wireframeColor} wireframe transparent opacity={0.45} depthTest={false} />
            </mesh>
          )}
        </mesh>
        <mesh position={[0.65, 0.05, -2.1]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#fff8c4" emissive="#ffe082" emissiveIntensity={1.5} />
          {wireframe && (
            <mesh scale={[1.08, 1.08, 1.08]}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshBasicMaterial color={wireframeColor} wireframe transparent opacity={0.45} depthTest={false} />
            </mesh>
          )}
        </mesh>
        <mesh position={[-0.6, 0.1, 2.05]}>
          <boxGeometry args={[0.35, 0.18, 0.1]} />
          <meshStandardMaterial color="#ff5252" emissive="#ff1744" emissiveIntensity={1.3} />
          {wireframe && (
            <mesh scale={[1.05, 1.05, 1.05]}>
              <boxGeometry args={[0.35, 0.18, 0.1]} />
              <meshBasicMaterial color={wireframeColor} wireframe transparent opacity={0.45} depthTest={false} />
            </mesh>
          )}
        </mesh>
        <mesh position={[0.6, 0.1, 2.05]}>
          <boxGeometry args={[0.35, 0.18, 0.1]} />
          <meshStandardMaterial color="#ff5252" emissive="#ff1744" emissiveIntensity={1.3} />
          {wireframe && (
            <mesh scale={[1.05, 1.05, 1.05]}>
              <boxGeometry args={[0.35, 0.18, 0.1]} />
              <meshBasicMaterial color={wireframeColor} wireframe transparent opacity={0.45} depthTest={false} />
            </mesh>
          )}
        </mesh>
        <mesh position={[0, 0.35, 2]}>
          <boxGeometry args={[1.2, 0.15, 0.1]} />
          <meshStandardMaterial color="#37474f" />
          {wireframe && (
            <mesh scale={[1.03, 1.03, 1.03]}>
              <boxGeometry args={[1.2, 0.15, 0.1]} />
              <meshBasicMaterial color={wireframeColor} wireframe transparent opacity={0.45} depthTest={false} />
            </mesh>
          )}
        </mesh>
      </mesh>
      <group ref={wheel1 as any}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.5, 0.5, 0.5, 16]} />
          <meshStandardMaterial color="#333" />
          {wireframe && (
            <mesh scale={[1.02, 1.02, 1.02]}>
              <cylinderGeometry args={[0.5, 0.5, 0.5, 16]} />
              <meshBasicMaterial color={wireframeColor} wireframe transparent opacity={0.45} depthTest={false} />
            </mesh>
          )}
        </mesh>
      </group>
      <group ref={wheel2 as any}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.5, 0.5, 0.5, 16]} />
          <meshStandardMaterial color="#333" />
          {wireframe && (
            <mesh scale={[1.02, 1.02, 1.02]}>
              <cylinderGeometry args={[0.5, 0.5, 0.5, 16]} />
              <meshBasicMaterial color={wireframeColor} wireframe transparent opacity={0.45} depthTest={false} />
            </mesh>
          )}
        </mesh>
      </group>
      <group ref={wheel3 as any}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.5, 0.5, 0.5, 16]} />
          <meshStandardMaterial color="#333" />
          {wireframe && (
            <mesh scale={[1.02, 1.02, 1.02]}>
              <cylinderGeometry args={[0.5, 0.5, 0.5, 16]} />
              <meshBasicMaterial color={wireframeColor} wireframe transparent opacity={0.45} depthTest={false} />
            </mesh>
          )}
        </mesh>
      </group>
      <group ref={wheel4 as any}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.5, 0.5, 0.5, 16]} />
          <meshStandardMaterial color="#333" />
          {wireframe && (
            <mesh scale={[1.02, 1.02, 1.02]}>
              <cylinderGeometry args={[0.5, 0.5, 0.5, 16]} />
              <meshBasicMaterial color={wireframeColor} wireframe transparent opacity={0.45} depthTest={false} />
            </mesh>
          )}
        </mesh>
      </group>
    </group>
  );
}
