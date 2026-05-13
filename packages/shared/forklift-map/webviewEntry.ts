import { MOCK_ZONES } from '../constants/mock-zones';
import { resolveForkliftAnchors } from '../constants/forkliftAnchors';
import type { ForkliftFloorId } from '../constants/forkliftAnchors';
import { getCongestionLevel } from '../utils/report';
import type { WaitReport } from '../types/index';
import { buildForkliftZoneLayouts } from '../utils/forkliftMapLayout';
import type * as THREE from 'three';

type ForkliftMapConfig = {
  reportsByZoneId: Record<string, WaitReport | null | undefined>;
};

type ZoneMeshBundle = {
  zoneId: string;
  box: THREE.Mesh;
  sphere: THREE.Mesh;
};

type ForkliftMapRuntime = {
  setConfig: (config: ForkliftMapConfig) => void;
  setFloor: (floor: ForkliftFloorId) => void;
  dispose: () => void;
};

function getThree(): typeof THREE {
  const w = window as unknown as { THREE?: typeof THREE };
  if (!w.THREE) {
    throw new Error('THREE global missing');
  }
  return w.THREE;
}

function post(type: string, payload: Record<string, unknown> = {}) {
  const bridge = (window as Window & { ReactNativeWebView?: { postMessage: (msg: string) => void } })
    .ReactNativeWebView;
  if (!bridge) return;
  bridge.postMessage(JSON.stringify({ type, ...payload }));
}

function congestionColor(level: 'green' | 'yellow' | 'red' | 'unknown'): number {
  switch (level) {
    case 'green':
      return 0x1d9e75;
    case 'yellow':
      return 0xef9f27;
    case 'red':
      return 0xe24b4a;
    default:
      return 0xb4b2a9;
  }
}

function anchorWorldY(
  layers: readonly ForkliftFloorId[],
  floor: ForkliftFloorId,
  halfHeight: number
): number | null {
  if (!layers.includes(floor)) return null;
  if (floor === 'ground') return halfHeight;
  if (floor === 'b1') return -6 + halfHeight;
  return -12 + halfHeight;
}

export function createForkliftMapRuntime(host: HTMLElement): ForkliftMapRuntime {
  const T = getThree();
  const scene = new T.Scene();
  scene.background = new T.Color(0x1a1a2e);

  const renderer = new T.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(host.clientWidth || 1, host.clientHeight || 1);
  renderer.shadowMap.enabled = true;
  host.appendChild(renderer.domElement);

  const camera = new T.PerspectiveCamera(50, 1, 0.5, 800);
  camera.position.set(0, 80, 120);

  const ambient = new T.AmbientLight(0xffffff, 0.55);
  scene.add(ambient);
  const sun = new T.DirectionalLight(0xffffff, 0.82);
  sun.position.set(50, 80, 50);
  sun.castShadow = true;
  scene.add(sun);

  const groundGeo = new T.PlaneGeometry(520, 520);
  const groundMat = new T.MeshStandardMaterial({ color: 0x243046, roughness: 0.92 });
  const ground = new T.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  ground.name = 'forklift-ground';
  scene.add(ground);

  const layouts = buildForkliftZoneLayouts(MOCK_ZONES);
  const zoneMeshes: ZoneMeshBundle[] = [];

  for (const layout of layouts) {
    const box = new T.Mesh(
      new T.BoxGeometry(layout.halfWidth * 2, layout.halfHeight * 2, layout.halfDepth * 2),
      new T.MeshStandardMaterial({
        color: new T.Color(layout.colorHex),
        roughness: 0.55,
        metalness: 0.1,
      })
    );
    box.position.set(layout.x, layout.halfHeight, layout.z);
    box.castShadow = true;
    box.receiveShadow = true;
    box.userData.zoneId = layout.id;
    box.name = `zone-${layout.id}`;
    scene.add(box);

    const sphere = new T.Mesh(
      new T.SphereGeometry(2.5, 20, 20),
      new T.MeshStandardMaterial({
        color: 0xb4b2a9,
        roughness: 0.4,
        emissive: new T.Color(0x111111),
        emissiveIntensity: 0.2,
      })
    );
    sphere.position.set(layout.x, layout.halfHeight * 2 + 2.5, layout.z);
    sphere.castShadow = true;
    sphere.userData.zoneId = layout.id;
    scene.add(sphere);
    zoneMeshes.push({ zoneId: layout.id, box, sphere });
  }

  const anchorObjects: T.Mesh[] = [];
  const anchors = resolveForkliftAnchors();
  for (const a of anchors) {
    const mesh = new T.Mesh(
      new T.BoxGeometry(a.halfWidth * 2, a.halfHeight * 2, a.halfDepth * 2),
      new T.MeshStandardMaterial({ color: new T.Color(a.colorHex), roughness: 0.75 })
    );
    mesh.position.set(a.x, a.halfHeight, a.z);
    mesh.rotation.y = a.yawRad ?? 0;
    mesh.castShadow = true;
    mesh.userData.anchorId = a.id;
    mesh.userData.layers = a.layers;
    mesh.visible = a.layers.includes('ground');
    scene.add(mesh);
    anchorObjects.push(mesh);
  }

  let floor: ForkliftFloorId = 'ground';
  let orbitAngle = 0;
  let reportsByZoneId: ForkliftMapConfig['reportsByZoneId'] = {};

  const raycaster = new T.Raycaster();
  const pointer = new T.Vector2();

  const applyCongestion = () => {
    for (const z of zoneMeshes) {
      const report = reportsByZoneId[z.zoneId];
      const level = getCongestionLevel(report ?? null);
      const mat = z.sphere.material as T.MeshStandardMaterial;
      const c = congestionColor(level);
      mat.color.setHex(c);
      mat.emissive.setHex(c);
      mat.emissiveIntensity = 0.35;
    }
  };

  const applyFloorVisibility = () => {
    ground.visible = floor === 'ground';
    for (const z of zoneMeshes) {
      z.box.visible = floor === 'ground';
      z.sphere.visible = floor === 'ground';
    }
    for (const mesh of anchorObjects) {
      const anchor = anchors.find((a) => a.id === mesh.userData.anchorId);
      const y = anchor ? anchorWorldY(anchor.layers, floor, anchor.halfHeight) : null;
      mesh.visible = y !== null;
      if (y !== null && anchor) {
        mesh.position.set(anchor.x, y, anchor.z);
      }
    }
  };

  const onPointerDown = (ev: PointerEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(
      zoneMeshes.map((z) => z.box),
      false
    );
    const first = hits[0];
    if (first?.object.userData.zoneId) {
      post('forkliftZoneTap', { zoneId: String(first.object.userData.zoneId) });
    }
  };
  renderer.domElement.addEventListener('pointerdown', onPointerDown);

  const onResize = () => {
    const w = host.clientWidth || window.innerWidth || 1;
    const h = host.clientHeight || window.innerHeight || 1;
    renderer.setSize(w, h);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', onResize);
  onResize();

  let animId = 0;
  const loop = () => {
    animId = requestAnimationFrame(loop);
    orbitAngle += 0.003;
    const r = 135;
    camera.position.x = Math.sin(orbitAngle) * r;
    camera.position.z = Math.cos(orbitAngle) * r + 40;
    camera.position.y = 80;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  };
  loop();

  const setConfig = (config: ForkliftMapConfig) => {
    reportsByZoneId = { ...config.reportsByZoneId };
    applyCongestion();
  };

  const setFloor = (next: ForkliftFloorId) => {
    floor = next;
    applyFloorVisibility();
  };

  applyCongestion();
  applyFloorVisibility();

  return {
    setConfig,
    setFloor,
    dispose: () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.dispose();
      host.removeChild(renderer.domElement);
    },
  };
}

export function bootForkliftMap(host: HTMLElement): ForkliftMapRuntime {
  const runtime = createForkliftMapRuntime(host);
  (window as Window & { __forkliftMapRuntime?: ForkliftMapRuntime }).__forkliftMapRuntime = runtime;
  return runtime;
}
