import * as THREE from 'three';
import type { DangerZone, SafetySign } from '@grmap/shared/constants/dangerZones';

/** 1 unit = 1 meter */
export const CORRIDOR_LENGTH = 60;
export const CORRIDOR_WIDTH = 6;
export const CEILING_HEIGHT = 3.2;

export const PALETTE = {
  floor: 0x5a5a58,
  lane: 0xd9b300,
  ceiling: 0xe6e6e4,
  fluorescent: 0xffffff,
  pallet: 0xb3825a,
  hazard: 0xf1c40f,
  accidentBg: 0xffe34d,
  forklift: 0xe87a2a,
  signage: 0xc0392b,
  signFrame: 0x1c1c1c,
} as const;

export type SceneCollider = {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
};

export type DockSlot = {
  index: number;
  position: { x: number; z: number };
};

type Disposable = THREE.BufferGeometry | THREE.Material | THREE.Texture;

function hexColor(hex: number) {
  return `#${hex.toString(16).padStart(6, '0')}`;
}

function trackDisposable<T extends Disposable>(resources: Disposable[], item: T): T {
  resources.push(item);
  return item;
}

function makeConcreteTexture(resources: Disposable[]) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);
  ctx.fillStyle = hexColor(PALETTE.floor);
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const shade = 80 + Math.random() * 40;
    ctx.fillStyle = `rgb(${shade},${shade - 2},${shade - 4})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 60);
  tex.needsUpdate = true;
  resources.push(tex);
  return tex;
}

function makeAccidentStripeTexture(resources: Disposable[]) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);
  ctx.fillStyle = hexColor(PALETTE.accidentBg);
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#000000';
  const stripe = 32;
  for (let x = -256; x < 512; x += stripe * 2) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + stripe, 0);
    ctx.lineTo(x + stripe + 128, 256);
    ctx.lineTo(x + 128, 256);
    ctx.closePath();
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  tex.needsUpdate = true;
  resources.push(tex);
  return tex;
}

function makeSignTexture(
  resources: Disposable[],
  label: string,
  options?: { red?: boolean; sub?: string }
) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);
  ctx.fillStyle = hexColor(PALETTE.signFrame);
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = options?.red ? hexColor(PALETTE.signage) : '#ffffff';
  ctx.fillRect(8, 8, 240, 112);
  ctx.fillStyle = options?.red ? '#ffffff' : '#111111';
  ctx.font = 'bold 52px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 128, options?.sub ? 48 : 64);
  if (options?.sub) {
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(options.sub, 128, 92);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  resources.push(tex);
  return tex;
}

function addCollider(
  colliders: SceneCollider[],
  center: THREE.Vector3,
  size: THREE.Vector3
) {
  const half = size.clone().multiplyScalar(0.5);
  colliders.push({
    min: {
      x: center.x - half.x,
      y: center.y - half.y,
      z: center.z - half.z,
    },
    max: {
      x: center.x + half.x,
      y: center.y + half.y,
      z: center.z + half.z,
    },
  });
}

export type RealisticSceneEngine = {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  colliders: SceneCollider[];
  dockSlots: DockSlot[];
  resize: () => void;
  render: (camera: THREE.Camera) => void;
  /** dangerZones를 3D 씬에 반영. isWeatherDangerous=true 면 펄스 강화. */
  setDangerZones: (zones: DangerZone[], isWeatherDangerous: boolean) => void;
  /** 매 프레임 호출 — 펄스 애니메이션 진행 */
  update: (nowMs: number) => void;
  dispose: () => void;
};

export function createRealisticSceneEngine(host: HTMLElement): RealisticSceneEngine {
  const resources: Disposable[] = [];
  const colliders: SceneCollider[] = [];
  const dockSlots: DockSlot[] = [];

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xcfcfcf);
  scene.fog = new THREE.Fog(0xcfcfcf, 20, 70);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  if ('outputColorSpace' in renderer) {
    (renderer as THREE.WebGLRenderer & { outputColorSpace: string }).outputColorSpace =
      THREE.SRGBColorSpace;
  }
  host.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.4));

  const floorTex = makeConcreteTexture(resources);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(CORRIDOR_WIDTH, CORRIDOR_LENGTH),
    trackDisposable(
      resources,
      new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.95, metalness: 0.05 })
    )
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, -CORRIDOR_LENGTH / 2);
  scene.add(floor);

  const laneMat = trackDisposable(
    resources,
    new THREE.MeshBasicMaterial({ color: PALETTE.lane })
  );
  for (const x of [-2.5, 2.5]) {
    const lane = new THREE.Mesh(
      trackDisposable(resources, new THREE.PlaneGeometry(0.1, CORRIDOR_LENGTH)),
      laneMat
    );
    lane.rotation.x = -Math.PI / 2;
    lane.position.set(x, 0.01, -CORRIDOR_LENGTH / 2);
    scene.add(lane);
  }

  const accidentMat = trackDisposable(
    resources,
    new THREE.MeshBasicMaterial({ map: makeAccidentStripeTexture(resources) })
  );
  const accident = new THREE.Mesh(
    trackDisposable(resources, new THREE.PlaneGeometry(6, 6)),
    accidentMat
  );
  accident.rotation.x = -Math.PI / 2;
  accident.position.set(0, 0.02, -CORRIDOR_LENGTH / 2);
  scene.add(accident);

  const wallMat = trackDisposable(
    resources,
    new THREE.MeshStandardMaterial({ color: 0x6a6a68, roughness: 0.9 })
  );
  for (const x of [-CORRIDOR_WIDTH / 2, CORRIDOR_WIDTH / 2]) {
    const wall = new THREE.Mesh(
      trackDisposable(resources, new THREE.BoxGeometry(0.2, CEILING_HEIGHT, CORRIDOR_LENGTH)),
      wallMat
    );
    wall.position.set(x, CEILING_HEIGHT / 2, -CORRIDOR_LENGTH / 2);
    scene.add(wall);
    addCollider(colliders, wall.position, new THREE.Vector3(0.2, CEILING_HEIGHT, CORRIDOR_LENGTH));
  }

  const ceiling = new THREE.Mesh(
    trackDisposable(resources, new THREE.PlaneGeometry(CORRIDOR_WIDTH, CORRIDOR_LENGTH)),
    trackDisposable(
      resources,
      new THREE.MeshStandardMaterial({
        color: PALETTE.ceiling,
        roughness: 0.8,
        side: THREE.DoubleSide,
      })
    )
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, CEILING_HEIGHT, -CORRIDOR_LENGTH / 2);
  scene.add(ceiling);

  const fluorescentMat = trackDisposable(
    resources,
    new THREE.MeshStandardMaterial({
      color: PALETTE.fluorescent,
      emissive: PALETTE.fluorescent,
      emissiveIntensity: 1.2,
    })
  );
  for (let i = 0; i < 8; i++) {
    const z = -4 - i * 7;
    const lightPanel = new THREE.Mesh(
      trackDisposable(resources, new THREE.PlaneGeometry(4.5, 0.35)),
      fluorescentMat
    );
    lightPanel.rotation.x = Math.PI / 2;
    lightPanel.position.set(0, CEILING_HEIGHT - 0.05, z);
    scene.add(lightPanel);
    if (i % 2 === 0) {
      const point = new THREE.PointLight(0xffffff, 0.55, 18, 1.4);
      point.position.set(0, CEILING_HEIGHT - 0.2, z);
      scene.add(point);
    }
  }

  const palletMat = trackDisposable(
    resources,
    new THREE.MeshStandardMaterial({ color: PALETTE.pallet, roughness: 0.85 })
  );
  for (let z = -4; z > -CORRIDOR_LENGTH + 2; z -= 4) {
    for (const x of [-2.25, 2.25]) {
      const stack = new THREE.Mesh(
        trackDisposable(resources, new THREE.BoxGeometry(1.5, 1.8, 1.5)),
        palletMat
      );
      stack.position.set(x, 0.9, z);
      scene.add(stack);
      addCollider(colliders, stack.position, new THREE.Vector3(1.5, 1.8, 1.5));
    }
  }

  for (let n = 1; n <= 15; n++) {
    const z = -3 - (n - 1) * 4;
    const sign = new THREE.Mesh(
      trackDisposable(resources, new THREE.PlaneGeometry(0.9, 0.55)),
      trackDisposable(
        resources,
        new THREE.MeshBasicMaterial({
          map: makeSignTexture(resources, String(n)),
          transparent: true,
          side: THREE.DoubleSide,
        })
      )
    );
    sign.position.set(-2.8, 2.05, z);
    scene.add(sign);
    if (n <= 6) {
      dockSlots.push({ index: n, position: { x: -2.8, z: -3 - (n - 1) * 6 } });
    }
  }

  const heightSign = new THREE.Mesh(
    trackDisposable(resources, new THREE.PlaneGeometry(1.6, 0.9)),
    trackDisposable(
      resources,
      new THREE.MeshBasicMaterial({
        map: makeSignTexture(resources, '3.2M', { red: true, sub: '제한높이' }),
        transparent: true,
        side: THREE.DoubleSide,
      })
    )
  );
  heightSign.position.set(0, 2.6, -0.4);
  scene.add(heightSign);

  const speedSign = new THREE.Mesh(
    trackDisposable(resources, new THREE.PlaneGeometry(1.4, 0.8)),
    trackDisposable(
      resources,
      new THREE.MeshBasicMaterial({
        map: makeSignTexture(resources, '10', { red: true, sub: '제한속도' }),
        transparent: true,
        side: THREE.DoubleSide,
      })
    )
  );
  speedSign.position.set(2.4, 2.2, -1.2);
  scene.add(speedSign);

  const hazardSign = new THREE.Mesh(
    trackDisposable(resources, new THREE.PlaneGeometry(2.2, 0.7)),
    trackDisposable(
      resources,
      new THREE.MeshBasicMaterial({
        map: makeSignTexture(resources, '사고다발구역', { red: false }),
        transparent: true,
        side: THREE.DoubleSide,
      })
    )
  );
  hazardSign.position.set(0, 2.4, -CORRIDOR_LENGTH / 2);
  scene.add(hazardSign);

  // -------- Danger zone markers --------
  // 임시 좌표 매핑: dangerZones의 lat/lng가 아직 실측이 아니므로
  // 통로 우측(x=+2.6)에 인덱스 순서로 z를 균등 배치한다.
  type DangerMarker = {
    group: THREE.Group;
    sign: SafetySign;
    weatherPulse: boolean;
    phase: number;
    floorMesh?: THREE.Mesh; // accident_prone 바닥 데칼
  };
  const dangerMarkers: DangerMarker[] = [];

  function disposeDangerMarkers() {
    for (const m of dangerMarkers) {
      scene.remove(m.group);
      m.group.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const mat = obj.material;
          if (Array.isArray(mat)) mat.forEach((mm) => mm.dispose());
          else mat.dispose();
        }
      });
    }
    dangerMarkers.length = 0;
  }

  function makeDangerSignTexture(label: string, sub: string, accent: number) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);
    ctx.fillStyle = hexColor(PALETTE.signFrame);
    ctx.fillRect(0, 0, 256, 160);
    ctx.fillStyle = hexColor(accent);
    ctx.fillRect(8, 8, 240, 144);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sub, 128, 44);
    ctx.font = 'bold 56px sans-serif';
    ctx.fillText(label, 128, 100);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    resources.push(tex);
    return tex;
  }

  function buildHeightLimitMarker(meters: number, z: number) {
    const group = new THREE.Group();
    // 천장 가로 바 (붉은 바)
    const bar = new THREE.Mesh(
      trackDisposable(resources, new THREE.BoxGeometry(CORRIDOR_WIDTH - 0.3, 0.18, 0.18)),
      trackDisposable(
        resources,
        new THREE.MeshStandardMaterial({ color: PALETTE.signage, roughness: 0.7 })
      )
    );
    bar.position.set(0, Math.min(meters, CEILING_HEIGHT - 0.2), 0);
    group.add(bar);
    // 안내 표지판
    const plate = new THREE.Mesh(
      trackDisposable(resources, new THREE.PlaneGeometry(1.6, 1.0)),
      trackDisposable(
        resources,
        new THREE.MeshBasicMaterial({
          map: makeDangerSignTexture(`${meters.toFixed(1)}M`, '제한높이', PALETTE.signage),
          transparent: true,
          side: THREE.DoubleSide,
        })
      )
    );
    plate.position.set(0, Math.min(meters, CEILING_HEIGHT - 0.2) - 0.55, 0.05);
    group.add(plate);
    group.position.set(0, 0, z);
    return group;
  }

  function buildSpeedLimitMarker(kmh: number, z: number) {
    const group = new THREE.Group();
    const sign = new THREE.Mesh(
      trackDisposable(resources, new THREE.PlaneGeometry(1.1, 1.4)),
      trackDisposable(
        resources,
        new THREE.MeshBasicMaterial({
          map: makeDangerSignTexture(`${kmh}`, '제한속도', PALETTE.signage),
          transparent: true,
          side: THREE.DoubleSide,
        })
      )
    );
    sign.position.set(2.55, 2.0, z);
    sign.rotation.y = -Math.PI / 2;
    group.add(sign);
    return group;
  }

  function buildAccidentProneMarker(z: number) {
    const group = new THREE.Group();
    // 바닥 노랑-검정 사선 데칼
    const floorDecal = new THREE.Mesh(
      trackDisposable(resources, new THREE.PlaneGeometry(CORRIDOR_WIDTH - 0.6, 3.5)),
      trackDisposable(
        resources,
        new THREE.MeshBasicMaterial({
          map: makeAccidentStripeTexture(resources),
          transparent: true,
          opacity: 0.85,
        })
      )
    );
    floorDecal.rotation.x = -Math.PI / 2;
    floorDecal.position.set(0, 0.03, z);
    group.add(floorDecal);
    // 상부 노랑 배너
    const banner = new THREE.Mesh(
      trackDisposable(resources, new THREE.PlaneGeometry(2.8, 0.55)),
      trackDisposable(
        resources,
        new THREE.MeshBasicMaterial({
          map: makeDangerSignTexture('사고다발구역', '주의', PALETTE.hazard),
          transparent: true,
          side: THREE.DoubleSide,
        })
      )
    );
    banner.position.set(0, 2.55, z);
    group.add(banner);
    return { group, floorMesh: floorDecal };
  }

  function buildRampMarker(floorLevel: number, z: number) {
    const group = new THREE.Group();
    const plate = new THREE.Mesh(
      trackDisposable(resources, new THREE.PlaneGeometry(1.3, 1.3)),
      trackDisposable(
        resources,
        new THREE.MeshBasicMaterial({
          map: makeDangerSignTexture(`B${Math.abs(floorLevel)}`, '진입램프', PALETTE.signage),
          transparent: true,
          side: THREE.DoubleSide,
        })
      )
    );
    plate.position.set(2.55, 1.8, z);
    plate.rotation.y = -Math.PI / 2;
    group.add(plate);
    return group;
  }

  function setDangerZones(zones: DangerZone[], isWeatherDangerous: boolean) {
    disposeDangerMarkers();
    if (!zones || zones.length === 0) return;
    // 통로 길이를 인원수+1로 나눠 균등 배치 (양 끝은 살짝 비움)
    const step = CORRIDOR_LENGTH / (zones.length + 1);
    zones.forEach((dz, i) => {
      const z = -((i + 1) * step);
      let group: THREE.Group;
      let floorMesh: THREE.Mesh | undefined;
      switch (dz.sign.kind) {
        case 'height_limit':
          group = buildHeightLimitMarker(dz.sign.meters, z);
          break;
        case 'speed_limit':
          group = buildSpeedLimitMarker(dz.sign.kmh, z);
          break;
        case 'accident_prone': {
          const built = buildAccidentProneMarker(z);
          group = built.group;
          floorMesh = built.floorMesh;
          break;
        }
        case 'ramp':
          group = buildRampMarker(dz.sign.floorLevel, z);
          break;
        default:
          group = new THREE.Group();
      }
      group.userData.dangerId = dz.id;
      scene.add(group);
      dangerMarkers.push({
        group,
        sign: dz.sign,
        weatherPulse:
          isWeatherDangerous && (dz.sign.kind === 'ramp' || dz.sign.kind === 'accident_prone'),
        phase: Math.random() * Math.PI * 2,
        floorMesh,
      });
    });
  }

  function update(nowMs: number) {
    for (const m of dangerMarkers) {
      if (!m.weatherPulse) continue;
      const t = (nowMs * 0.004 + m.phase) % (Math.PI * 2);
      const scale = 1 + Math.sin(t) * 0.08;
      m.group.scale.set(scale, scale, scale);
      if (m.floorMesh && m.floorMesh.material instanceof THREE.MeshBasicMaterial) {
        m.floorMesh.material.opacity = 0.7 + Math.sin(t) * 0.25;
        m.floorMesh.material.transparent = true;
      }
    }
  }

  const measure = () => {
    const w = host.clientWidth || host.offsetWidth || window.innerWidth;
    const h = host.clientHeight || host.offsetHeight || window.innerHeight;
    return { w: Math.max(w, 320), h: Math.max(h, 400) };
  };

  const resize = () => {
    const { w, h } = measure();
    renderer.setSize(w, h, false);
  };

  resize();

  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
  ro?.observe(host);
  window.addEventListener('resize', resize);

  return {
    scene,
    renderer,
    colliders,
    dockSlots,
    resize,
    render: (cam) => {
      renderer.render(scene, cam);
    },
    setDangerZones,
    update,
    dispose: () => {
      ro?.disconnect();
      window.removeEventListener('resize', resize);
      disposeDangerMarkers();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const mat = obj.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat.dispose();
        }
      });
      resources.forEach((r) => r.dispose());
      renderer.dispose();
      if (renderer.domElement.parentElement === host) {
        host.removeChild(renderer.domElement);
      }
    },
  };
}
