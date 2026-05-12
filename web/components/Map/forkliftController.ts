import * as THREE from 'three';
import type { SceneCollider } from './realisticSceneEngine';
import { PALETTE } from './realisticSceneEngine';

export const MAX_SPEED_MS = 2.78;
export const ACCELERATION = 1.5;
const STEER_RATE = 1.35;
const DECELERATION = 2.2;
const PITCH_LIMIT = (20 * Math.PI) / 180;
const MOUSE_SENSITIVITY = 0.0022;

export type CameraMode = 'first' | 'third';

export type VehicleAabb = {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
};

export function clampSpeed(speed: number): number {
  return Math.max(-MAX_SPEED_MS, Math.min(MAX_SPEED_MS, speed));
}

export function intersectsAabb(a: VehicleAabb, b: SceneCollider): boolean {
  return (
    a.min.x <= b.max.x &&
    a.max.x >= b.min.x &&
    a.min.y <= b.max.y &&
    a.max.y >= b.min.y &&
    a.min.z <= b.max.z &&
    a.max.z >= b.min.z
  );
}

export function vehicleAabbAt(position: THREE.Vector3): VehicleAabb {
  const halfX = 1.15;
  const halfY = 0.7;
  const halfZ = 0.55;
  return {
    min: {
      x: position.x - halfX,
      y: position.y - halfY,
      z: position.z - halfZ,
    },
    max: {
      x: position.x + halfX,
      y: position.y + halfY,
      z: position.z + halfZ,
    },
  };
}

export function collidesAt(position: THREE.Vector3, colliders: SceneCollider[]): boolean {
  const box = vehicleAabbAt(position);
  return colliders.some((c) => intersectsAabb(box, c));
}

export type ForkliftController = {
  camera: THREE.PerspectiveCamera;
  vehicle: THREE.Group;
  update: (delta: number) => void;
  getSpeed: () => number;
  isOverSpeedLimit: () => boolean;
  getCameraMode: () => CameraMode;
  toggleCameraMode: () => void;
  bind: (canvas: HTMLCanvasElement) => void;
  dispose: () => void;
};

export function createForkliftController(
  scene: THREE.Scene,
  colliders: SceneCollider[]
): ForkliftController {
  const resources: Array<THREE.BufferGeometry | THREE.Material> = [];
  const keys = new Set<string>();
  let cameraMode: CameraMode = 'first';
  let speed = 0;
  let heading = 0;
  let pitch = 0;
  let pointerLocked = false;

  const corridorEndZ = 58;
  const position = new THREE.Vector3(0, 0, -2);
  const vehicle = new THREE.Group();
  scene.add(vehicle);

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.3, 1.4, 1.1),
    new THREE.MeshStandardMaterial({ color: PALETTE.forklift, roughness: 0.65 })
  );
  body.position.y = 0.7;
  resources.push(body.geometry, body.material);
  vehicle.add(body);

  const forkMat = new THREE.MeshStandardMaterial({ color: 0x8a8a88, metalness: 0.4, roughness: 0.5 });
  resources.push(forkMat);
  for (const x of [-0.35, 0.35]) {
    const forkGeo = new THREE.BoxGeometry(0.12, 0.08, 1.1);
    const fork = new THREE.Mesh(forkGeo, forkMat);
    fork.position.set(x, 0.25, -1.15);
    resources.push(forkGeo);
    vehicle.add(fork);
  }

  const camera = new THREE.PerspectiveCamera(68, 1, 0.1, 120);
  scene.add(camera);

  const updateVehicleTransform = () => {
    vehicle.position.copy(position);
    vehicle.rotation.y = heading;
  };

  const updateCamera = () => {
    const lookOffset = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), heading);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), heading);

    if (cameraMode === 'first') {
      const eye = position
        .clone()
        .add(new THREE.Vector3(0, 1.5, 0))
        .add(lookOffset.clone().multiplyScalar(0.2));
      camera.position.copy(eye);
      const target = eye
        .clone()
        .add(lookOffset)
        .add(new THREE.Vector3(0, Math.sin(pitch), 0));
      camera.lookAt(target);
      return;
    }

    const back = lookOffset.clone().multiplyScalar(-4);
    const camPos = position.clone().add(new THREE.Vector3(0, 2.5, 0)).add(back);
    camera.position.copy(camPos);
    camera.lookAt(position.clone().add(new THREE.Vector3(0, 1.2, 0)));
    camera.position.add(right.multiplyScalar(0.15));
  };

  const onKeyDown = (ev: KeyboardEvent) => {
    keys.add(ev.key.toLowerCase());
    if (ev.key.toLowerCase() === 'v') {
      cameraMode = cameraMode === 'first' ? 'third' : 'first';
    }
  };
  const onKeyUp = (ev: KeyboardEvent) => {
    keys.delete(ev.key.toLowerCase());
  };

  const onMouseMove = (ev: MouseEvent) => {
    if (!pointerLocked) return;
    heading -= ev.movementX * MOUSE_SENSITIVITY;
    pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch - ev.movementY * MOUSE_SENSITIVITY));
  };

  const onPointerLockChange = () => {
    pointerLocked = document.pointerLockElement === canvasRef;
  };

  let canvasRef: HTMLCanvasElement | null = null;

  const bind = (canvas: HTMLCanvasElement) => {
    canvasRef = canvas;
    canvas.addEventListener('click', () => {
      if (document.pointerLockElement !== canvas) {
        void canvas.requestPointerLock();
      }
    });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('pointerlockchange', onPointerLockChange);
  };

  const update = (delta: number) => {
    const forward = keys.has('w');
    const backward = keys.has('s');
    const steerLeft = keys.has('a');
    const steerRight = keys.has('d');

    if (steerLeft) heading += STEER_RATE * delta;
    if (steerRight) heading -= STEER_RATE * delta;

    if (forward) speed = clampSpeed(speed + ACCELERATION * delta);
    else if (backward) speed = clampSpeed(speed - ACCELERATION * delta);
    else {
      if (speed > 0) speed = Math.max(0, speed - DECELERATION * delta);
      else if (speed < 0) speed = Math.min(0, speed + DECELERATION * delta);
    }

    const dir = new THREE.Vector3(Math.sin(heading), 0, -Math.cos(heading));
    const next = position.clone().add(dir.multiplyScalar(speed * delta));
    next.y = 0;

    if (!collidesAt(next, colliders)) {
      position.copy(next);
    } else {
      speed *= 0.35;
    }

    position.x = Math.max(-2.4, Math.min(2.4, position.x));
    position.z = Math.max(-corridorEndZ, Math.min(-0.5, position.z));

    updateVehicleTransform();
    updateCamera();
  };

  updateVehicleTransform();
  updateCamera();

  return {
    camera,
    vehicle,
    update,
    getSpeed: () => Math.abs(speed),
    isOverSpeedLimit: () => Math.abs(speed) >= MAX_SPEED_MS - 0.05,
    getCameraMode: () => cameraMode,
    toggleCameraMode: () => {
      cameraMode = cameraMode === 'first' ? 'third' : 'first';
    },
    bind,
    dispose: () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      if (document.pointerLockElement === canvasRef) {
        document.exitPointerLock();
      }
      scene.remove(vehicle);
      scene.remove(camera);
      resources.forEach((r) => r.dispose());
    },
  };
}
