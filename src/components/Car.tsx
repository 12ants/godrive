import { useBox, useCylinder, useRaycastVehicle } from '@react-three/cannon';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Vector3, Quaternion } from 'three';
import { VEHICLE_TRANSITION_DURATION_MS } from '../gameConstants';
import { CarId, useGameStore } from '../store';
import { useControls } from '../useControls';

/**
 * Visual and handling presets for the available car models.
 */
type CarVariant = 'coupe' | 'sports';

/**
 * Tuning and mesh layout data for a single vehicle variant.
 */
interface CarConfig {
  chassisBodyArgs: [number, number, number];
  mass: number;
  linearDamping: number;
  angularDamping: number;
  wheelRadius: number;
  wheelWidth: number;
  wheelTrack: number;
  wheelYOffset: number;
  frontAxleZ: number;
  rearAxleZ: number;
  baseEngineForce: number;
  maxSteerVal: number;
  brakeForce: number;
  topSpeed: number;
  launchBoostSpeed: number;
  launchBoostMultiplier: number;
  rollingBrake: number;
  bodyColor: string;
  roofColor: string;
  trimColor: string;
  accentColor: string;
  headlightColor: string;
  taillightColor: string;
  roofPosition: [number, number, number];
  roofArgs: [number, number, number];
  frontTrimPosition: [number, number, number];
  frontTrimArgs: [number, number, number];
  rearTrimPosition: [number, number, number];
  rearTrimArgs: [number, number, number];
  frontLightX: number;
  frontLightY: number;
  frontLightZ: number;
  rearLightX: number;
  rearLightY: number;
  rearLightZ: number;
  cameraOffset: [number, number, number];
  lookAtOffset: [number, number, number];
  exitOffset: [number, number, number];
  spoilerPosition: [number, number, number] | null;
  spoilerArgs: [number, number, number] | null;
}

/**
 * Centralized per-vehicle tuning values so the gameplay code can stay variant-agnostic.
 */
const CAR_CONFIG: Record<CarVariant, CarConfig> = {
  coupe: {
    chassisBodyArgs: [2, 1, 4],
    mass: 1500,
    linearDamping: 0.35,
    angularDamping: 0.55,
    wheelRadius: 0.5,
    wheelWidth: 0.5,
    wheelTrack: 1.2,
    wheelYOffset: -0.5,
    frontAxleZ: -1.5,
    rearAxleZ: 1.5,
    baseEngineForce: 3800,
    maxSteerVal: 0.58,
    brakeForce: 52,
    topSpeed: 280,
    launchBoostSpeed: 40,
    launchBoostMultiplier: 1.3,
    rollingBrake: 6,
    bodyColor: '#00bcd4',
    roofColor: '#263238',
    trimColor: '#111',
    accentColor: '#37474f',
    headlightColor: '#fff8c4',
    taillightColor: '#ff5252',
    roofPosition: [0, 0.45, -0.6],
    roofArgs: [1.5, 0.5, 1.4],
    frontTrimPosition: [0, 0.1, -2.05],
    frontTrimArgs: [1.3, 0.25, 0.1],
    rearTrimPosition: [0, 0.35, 2],
    rearTrimArgs: [1.2, 0.15, 0.1],
    frontLightX: 0.65,
    frontLightY: 0.05,
    frontLightZ: -2.1,
    rearLightX: 0.6,
    rearLightY: 0.1,
    rearLightZ: 2.05,
    cameraOffset: [0, 3, 10],
    lookAtOffset: [0, 1, -2],
    exitOffset: [-2.5, 1.5, 0],
    spoilerPosition: null,
    spoilerArgs: null,
  },
  sports: {
    chassisBodyArgs: [1.9, 0.8, 4.5],
    mass: 1250,
    linearDamping: 0.28,
    angularDamping: 0.45,
    wheelRadius: 0.45,
    wheelWidth: 0.45,
    wheelTrack: 1.18,
    wheelYOffset: -0.42,
    frontAxleZ: -1.7,
    rearAxleZ: 1.55,
    baseEngineForce: 5200,
    maxSteerVal: 0.66,
    brakeForce: 62,
    topSpeed: 330,
    launchBoostSpeed: 55,
    launchBoostMultiplier: 1.45,
    rollingBrake: 4,
    bodyColor: '#ef4444',
    roofColor: '#111827',
    trimColor: '#0f172a',
    accentColor: '#1f2937',
    headlightColor: '#e0f2fe',
    taillightColor: '#fb7185',
    roofPosition: [0, 0.3, -0.2],
    roofArgs: [1.25, 0.34, 1.9],
    frontTrimPosition: [0, -0.02, -2.28],
    frontTrimArgs: [1.45, 0.14, 0.14],
    rearTrimPosition: [0, 0.2, 2.18],
    rearTrimArgs: [1.35, 0.12, 0.14],
    frontLightX: 0.72,
    frontLightY: 0.02,
    frontLightZ: -2.22,
    rearLightX: 0.68,
    rearLightY: 0.08,
    rearLightZ: 2.2,
    cameraOffset: [0, 2.6, 8.5],
    lookAtOffset: [0, 0.8, -2.4],
    exitOffset: [-2.6, 1.3, 0],
    spoilerPosition: [0, 0.62, 2.18],
    spoilerArgs: [1.3, 0.08, 0.35],
  },
};

interface CarProps {
  /**
   * Store identifier for this car instance.
   */
  carId: CarId;
  /**
   * Initial spawn position of the chassis body.
   */
  position?: [number, number, number];
  /**
   * Visual and handling preset to apply.
   */
  variant?: CarVariant;
}

/**
 * Physics vehicle with per-frame driving, camera, and enter/exit handoff logic.
 */
export function Car({
  carId,
  position = [5, 2, 0],
  variant = 'coupe',
}: CarProps) {
  const { camera } = useThree();
  const mode = useGameStore((state) => state.mode);
  const activeCarId = useGameStore((state) => state.activeCarId);
  const setMode = useGameStore((state) => state.setMode);
  const setCarPosition = useGameStore((state) => state.setCarPosition);
  const setSpeed = useGameStore((state) => state.setSpeed);
  const wireframe = useGameStore((state) => state.wireframe);
  const wireframeColor = '#39ff14';
  const { forward, backward, left, right, brake, interact } = useControls();
  const config = CAR_CONFIG[variant];
  const isActiveCar = activeCarId === carId;
  const isDrivingThisCar = isActiveCar && mode === 'driving';
  const isEnteringThisCar = isActiveCar && mode === 'entering_car';
  const isExitingThisCar = isActiveCar && mode === 'exiting_car';

  const chassisBodyArgs = config.chassisBodyArgs;
  const [chassisRef, chassisApi] = useBox(() => ({
    mass: config.mass,
    position,
    linearDamping: config.linearDamping,
    angularDamping: config.angularDamping,
    args: chassisBodyArgs,
  }));

  // Base suspension setup copied into all four wheels, with axle-specific overrides below.
  const wheelInfo = {
    radius: config.wheelRadius,
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

  // Front wheels get steering-oriented grip; rears are a little stickier for stability.
  const wheelInfos = [
    { ...wheelInfo, frictionSlip: 4.2, chassisConnectionPointLocal: [-config.wheelTrack, config.wheelYOffset, config.frontAxleZ] as [number, number, number], isFrontWheel: true },
    { ...wheelInfo, frictionSlip: 4.2, chassisConnectionPointLocal: [config.wheelTrack, config.wheelYOffset, config.frontAxleZ] as [number, number, number], isFrontWheel: true },
    { ...wheelInfo, frictionSlip: 5.0, chassisConnectionPointLocal: [-config.wheelTrack, config.wheelYOffset, config.rearAxleZ] as [number, number, number], isFrontWheel: false },
    { ...wheelInfo, frictionSlip: 5.0, chassisConnectionPointLocal: [config.wheelTrack, config.wheelYOffset, config.rearAxleZ] as [number, number, number], isFrontWheel: false },
  ];

  const wheelArgs: [number, number, number, number] = [config.wheelRadius, config.wheelRadius, config.wheelWidth, 16];
  const [wheel1] = useCylinder(() => ({ mass: 1, type: 'Kinematic', material: 'wheel', collisionFilterGroup: 0, args: wheelArgs }));
  const [wheel2] = useCylinder(() => ({ mass: 1, type: 'Kinematic', material: 'wheel', collisionFilterGroup: 0, args: wheelArgs }));
  const [wheel3] = useCylinder(() => ({ mass: 1, type: 'Kinematic', material: 'wheel', collisionFilterGroup: 0, args: wheelArgs }));
  const [wheel4] = useCylinder(() => ({ mass: 1, type: 'Kinematic', material: 'wheel', collisionFilterGroup: 0, args: wheelArgs }));

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
    // Pick up the previous shared look target when the car takes camera ownership.
    if (isDrivingThisCar || isEnteringThisCar || isExitingThisCar) {
      const lookAt = useGameStore.getState().cameraLookAt;
      currentLookAt.current.set(lookAt[0], lookAt[1], lookAt[2]);
    }
  }, [isDrivingThisCar, isEnteringThisCar, isExitingThisCar]);

  useEffect(() => {
    if (isExitingThisCar) {
      exitTransitionElapsed.current = 0;
    }
  }, [isExitingThisCar]);

  useEffect(() => {
    // Mirror physics body state into refs for frame-rate camera and driving logic.
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

    setCarPosition(carId, [pos.current[0], pos.current[1], pos.current[2]]);

    if (isDrivingThisCar && justPressedInteract) {
      // Spawn the player beside the vehicle using its current heading instead of a fixed offset.
      const carQuaternion = new Quaternion(rotation.current[0], rotation.current[1], rotation.current[2], rotation.current[3]);
      const carPosition = new Vector3(pos.current[0], pos.current[1], pos.current[2]);
      const flatForward = new Vector3(0, 0, -1).applyQuaternion(carQuaternion);
      flatForward.y = 0;
      if (flatForward.lengthSq() < 0.0001) {
        flatForward.set(0, 0, -1);
      } else {
        flatForward.normalize();
      }

      // Left-of-car spawn avoids dropping the player directly into the chassis or rear wheels.
      const flatLeft = new Vector3().crossVectors(new Vector3(0, 1, 0), flatForward).normalize();
      const lateralExitDistance = Math.abs(config.exitOffset[0]) + chassisBodyArgs[0] * 0.5 + 0.85;
      const spawnPos = carPosition
        .clone()
        .add(flatLeft.multiplyScalar(lateralExitDistance))
        .add(flatForward.multiplyScalar(config.exitOffset[2] - 0.4));
      spawnPos.y = Math.max(carPosition.y + 0.9, 2.4);
      const yaw = Math.atan2(-flatForward.x, -flatForward.z);

      useGameStore.setState({
        playerPosition: [spawnPos.x, Math.max(spawnPos.y, 2.4), spawnPos.z],
        playerYaw: yaw
      });
      setMode('exiting_car');
      setTimeout(() => {
        setMode('walking');
      }, VEHICLE_TRANSITION_DURATION_MS);
    }

    if (isDrivingThisCar || isEnteringThisCar) {
      // Standard chase camera while the car is active or the enter transition is still playing.
      const carPosition = new Vector3(pos.current[0], pos.current[1], pos.current[2]);
      const carQuaternion = new Quaternion(rotation.current[0], rotation.current[1], rotation.current[2], rotation.current[3]);

      const cameraOffset = new Vector3(...config.cameraOffset);
      cameraOffset.applyQuaternion(carQuaternion);
      const idealCameraPosition = carPosition.clone().add(cameraOffset);
      idealCameraPosition.y = Math.max(idealCameraPosition.y, 1);

      camera.position.lerp(idealCameraPosition, 5 * delta);

      const lookAtOffset = new Vector3(...config.lookAtOffset);
      lookAtOffset.applyQuaternion(carQuaternion);
      const idealLookAt = carPosition.clone().add(lookAtOffset);

      currentLookAt.current.lerp(idealLookAt, 5 * delta);
      camera.lookAt(currentLookAt.current);
      useGameStore.setState({ cameraLookAt: [currentLookAt.current.x, currentLookAt.current.y, currentLookAt.current.z] });
    } else if (isExitingThisCar) {
      // Ease toward a higher, side-biased angle so the handoff stays outside the car body
      // while still framing the player spawn point.
      exitTransitionElapsed.current = Math.min(exitTransitionElapsed.current + delta, exitTransitionDuration);
      const t = exitTransitionElapsed.current / exitTransitionDuration;
      const smoothT = t * t * (3 - 2 * t);

      const carPosition = new Vector3(pos.current[0], pos.current[1], pos.current[2]);
      const carQuaternion = new Quaternion(rotation.current[0], rotation.current[1], rotation.current[2], rotation.current[3]);
      const baseCameraOffset = new Vector3(...config.cameraOffset);
      const exitCameraOffset = new Vector3(
        config.exitOffset[0] * 1.6,
        config.cameraOffset[1] + 0.8,
        Math.max(config.cameraOffset[2] - 2, 6),
      );
      const blendedCameraOffset = baseCameraOffset.lerp(exitCameraOffset, smoothT).applyQuaternion(carQuaternion);
      const idealCameraPosition = carPosition.clone().add(blendedCameraOffset);
      idealCameraPosition.y = Math.max(idealCameraPosition.y, 1.5);
      camera.position.lerp(idealCameraPosition, 6 * delta);

      const baseLookAtOffset = new Vector3(...config.lookAtOffset).applyQuaternion(carQuaternion);
      const carLookAt = carPosition.clone().add(baseLookAtOffset);
      const { playerPosition } = useGameStore.getState();
      const playerPosVec = new Vector3(playerPosition[0], playerPosition[1] + 0.75, playerPosition[2]);
      const idealLookAt = carLookAt.lerp(playerPosVec, smoothT * 0.65);

      currentLookAt.current.lerp(idealLookAt, 6 * delta);
      camera.lookAt(currentLookAt.current);
      useGameStore.setState({ cameraLookAt: [currentLookAt.current.x, currentLookAt.current.y, currentLookAt.current.z] });
    }

    // Velocity is tracked in Cannon units, so convert to a rough km/h-style display for the HUD.
    const speedKmh = Math.sqrt(velocity.current[0] ** 2 + velocity.current[2] ** 2) * 3.6;
    const baseEngineForce = config.baseEngineForce;
    const maxSteerVal = config.maxSteerVal;
    const brakeForce = config.brakeForce;
    const frontBrakeBias = 1.1;
    const rearBrakeBias = 0.9;

    if (isDrivingThisCar) {
      // Reduce steering lock at higher speed so the car stays controllable.
      const steerSpeedFactor = Math.max(0.35, 1 - speedKmh / 110);
      const targetSteer = left ? maxSteerVal * steerSpeedFactor : right ? -maxSteerVal * steerSpeedFactor : 0;
      currentSteer.current += (targetSteer - currentSteer.current) * Math.min(1, delta * 8);
      vehicleApi.setSteeringValue(currentSteer.current, 0);
      vehicleApi.setSteeringValue(currentSteer.current, 1);

      // Taper engine force near top speed and add a stronger launch from a standstill.
      const speedLimiter = forward ? Math.max(0.45, 1 - speedKmh / config.topSpeed) : 1;
      const launchBoost = forward && speedKmh < config.launchBoostSpeed ? config.launchBoostMultiplier : 1;
      const targetEngineForce = forward ? baseEngineForce * speedLimiter * launchBoost : backward ? -baseEngineForce * 0.75 : 0;
      const engineResponse = targetEngineForce === 0 ? 7 : 6;
      currentEngineForce.current += (targetEngineForce - currentEngineForce.current) * Math.min(1, delta * engineResponse);
      vehicleApi.applyEngineForce(currentEngineForce.current, 2);
      vehicleApi.applyEngineForce(currentEngineForce.current, 3);

      if (brake) {
        // Slight front bias makes braking feel more natural and reduces spinouts.
        vehicleApi.setBrake(brakeForce * frontBrakeBias, 0);
        vehicleApi.setBrake(brakeForce * frontBrakeBias, 1);
        vehicleApi.setBrake(brakeForce * rearBrakeBias, 2);
        vehicleApi.setBrake(brakeForce * rearBrakeBias, 3);
      } else {
        // A light rolling brake keeps parked cars from creeping down slopes.
        const rollingBrake = targetEngineForce === 0 ? config.rollingBrake : 0;
        vehicleApi.setBrake(rollingBrake, 0);
        vehicleApi.setBrake(rollingBrake, 1);
        vehicleApi.setBrake(rollingBrake, 2);
        vehicleApi.setBrake(rollingBrake, 3);
      }
    } else {
      // Inactive cars stay stopped so only the selected vehicle reacts to controls.
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

    if (isActiveCar && mode !== 'walking') {
      setSpeed(Math.round(speedKmh));
    }
  });

  return (
    <group ref={vehicleRef as any}>
      {/* Chassis body doubles as the main visible shell for the car mesh. */}
      <mesh ref={chassisRef as any} castShadow>
        <boxGeometry args={chassisBodyArgs} />
        <meshStandardMaterial color={config.bodyColor} />
        {wireframe && (
          <mesh scale={[1.002, 1.002, 1.002]}>
            <boxGeometry args={chassisBodyArgs} />
            <meshBasicMaterial color={wireframeColor} wireframe transparent opacity={0.45} depthTest={false} />
          </mesh>
        )}
        <mesh position={config.roofPosition} castShadow>
          <boxGeometry args={config.roofArgs} />
          <meshStandardMaterial color={config.roofColor} />
          {wireframe && (
            <mesh scale={[1.01, 1.01, 1.01]}>
              <boxGeometry args={config.roofArgs} />
              <meshBasicMaterial color={wireframeColor} wireframe transparent opacity={0.45} depthTest={false} />
            </mesh>
          )}
        </mesh>
        <mesh position={config.frontTrimPosition}>
          <boxGeometry args={config.frontTrimArgs} />
          <meshStandardMaterial color={config.trimColor} />
          {wireframe && (
            <mesh scale={[1.02, 1.02, 1.02]}>
              <boxGeometry args={config.frontTrimArgs} />
              <meshBasicMaterial color={wireframeColor} wireframe transparent opacity={0.45} depthTest={false} />
            </mesh>
          )}
        </mesh>
        <mesh position={[-config.frontLightX, config.frontLightY, config.frontLightZ]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color={config.headlightColor} emissive={config.headlightColor} emissiveIntensity={1.5} />
          {wireframe && (
            <mesh scale={[1.08, 1.08, 1.08]}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshBasicMaterial color={wireframeColor} wireframe transparent opacity={0.45} depthTest={false} />
            </mesh>
          )}
        </mesh>
        <mesh position={[config.frontLightX, config.frontLightY, config.frontLightZ]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color={config.headlightColor} emissive={config.headlightColor} emissiveIntensity={1.5} />
          {wireframe && (
            <mesh scale={[1.08, 1.08, 1.08]}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshBasicMaterial color={wireframeColor} wireframe transparent opacity={0.45} depthTest={false} />
            </mesh>
          )}
        </mesh>
        <mesh position={[-config.rearLightX, config.rearLightY, config.rearLightZ]}>
          <boxGeometry args={[0.35, 0.18, 0.1]} />
          <meshStandardMaterial color={config.taillightColor} emissive={config.taillightColor} emissiveIntensity={1.3} />
          {wireframe && (
            <mesh scale={[1.05, 1.05, 1.05]}>
              <boxGeometry args={[0.35, 0.18, 0.1]} />
              <meshBasicMaterial color={wireframeColor} wireframe transparent opacity={0.45} depthTest={false} />
            </mesh>
          )}
        </mesh>
        <mesh position={[config.rearLightX, config.rearLightY, config.rearLightZ]}>
          <boxGeometry args={[0.35, 0.18, 0.1]} />
          <meshStandardMaterial color={config.taillightColor} emissive={config.taillightColor} emissiveIntensity={1.3} />
          {wireframe && (
            <mesh scale={[1.05, 1.05, 1.05]}>
              <boxGeometry args={[0.35, 0.18, 0.1]} />
              <meshBasicMaterial color={wireframeColor} wireframe transparent opacity={0.45} depthTest={false} />
            </mesh>
          )}
        </mesh>
        <mesh position={config.rearTrimPosition}>
          <boxGeometry args={config.rearTrimArgs} />
          <meshStandardMaterial color={config.accentColor} />
          {wireframe && (
            <mesh scale={[1.03, 1.03, 1.03]}>
              <boxGeometry args={config.rearTrimArgs} />
              <meshBasicMaterial color={wireframeColor} wireframe transparent opacity={0.45} depthTest={false} />
            </mesh>
          )}
        </mesh>
        {config.spoilerArgs && config.spoilerPosition && (
          <mesh position={config.spoilerPosition}>
            <boxGeometry args={config.spoilerArgs} />
            <meshStandardMaterial color={config.trimColor} />
            {wireframe && (
              <mesh scale={[1.03, 1.03, 1.03]}>
                <boxGeometry args={config.spoilerArgs} />
                <meshBasicMaterial color={wireframeColor} wireframe transparent opacity={0.45} depthTest={false} />
              </mesh>
            )}
          </mesh>
        )}
      </mesh>

      {/* Wheels are separate kinematic bodies driven by the raycast vehicle system. */}
      <group ref={wheel1 as any}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={wheelArgs} />
          <meshStandardMaterial color="#333" />
          {wireframe && (
            <mesh scale={[1.02, 1.02, 1.02]}>
              <cylinderGeometry args={wheelArgs} />
              <meshBasicMaterial color={wireframeColor} wireframe transparent opacity={0.45} depthTest={false} />
            </mesh>
          )}
        </mesh>
      </group>
      <group ref={wheel2 as any}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={wheelArgs} />
          <meshStandardMaterial color="#333" />
          {wireframe && (
            <mesh scale={[1.02, 1.02, 1.02]}>
              <cylinderGeometry args={wheelArgs} />
              <meshBasicMaterial color={wireframeColor} wireframe transparent opacity={0.45} depthTest={false} />
            </mesh>
          )}
        </mesh>
      </group>
      <group ref={wheel3 as any}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={wheelArgs} />
          <meshStandardMaterial color="#333" />
          {wireframe && (
            <mesh scale={[1.02, 1.02, 1.02]}>
              <cylinderGeometry args={wheelArgs} />
              <meshBasicMaterial color={wireframeColor} wireframe transparent opacity={0.45} depthTest={false} />
            </mesh>
          )}
        </mesh>
      </group>
      <group ref={wheel4 as any}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={wheelArgs} />
          <meshStandardMaterial color="#333" />
          {wireframe && (
            <mesh scale={[1.02, 1.02, 1.02]}>
              <cylinderGeometry args={wheelArgs} />
              <meshBasicMaterial color={wireframeColor} wireframe transparent opacity={0.45} depthTest={false} />
            </mesh>
          )}
        </mesh>
      </group>
    </group>
  );
}
