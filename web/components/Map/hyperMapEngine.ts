import * as THREE from 'three';
import type { ZoneWithStatus } from '@grmap/shared/types';
import type { ZoneHyperSlot } from '@grmap/shared/utils/hyperMap';

type Congestion = ZoneWithStatus['congestionLevel'];

function emissiveForCongestion(c: Congestion): number {
  if (c === 'green') return 0x1d9e75;
  if (c === 'yellow') return 0xef9f27;
  if (c === 'red') return 0xe24b4a;
  return 0x6b7280;
}

function pillarColor(type: ZoneWithStatus['type']): number {
  if (type === 'vegetable') return 0x22c55e;
  if (type === 'fruit') return 0xf97316;
  if (type === 'fish') return 0x3b82f6;
  if (type === 'dry') return 0xa78bfa;
  return 0x64748b;
}

function makeSignCanvas(text: string, bg: string, fg: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(c);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 508, 124);
  ctx.fillStyle = fg;
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

export type HyperMapEngine = {
  setZones: (zones: ZoneHyperSlot[], selectedId: string | null) => void;
  resize: () => void;
  dispose: () => void;
};

export function createHyperMapEngine(
  host: HTMLElement,
  onZoneTap: (zoneId: string) => void
): HyperMapEngine {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x252830);
  scene.fog = new THREE.Fog(0x252830, 12, 52);

  const clock = new THREE.Clock();
  const zoneMeshes: Record<string, THREE.Group> = {};

  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 120);
  camera.position.set(0, 2.35, 12.5);
  camera.lookAt(0, 1.15, -10);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  if ('outputColorSpace' in renderer) {
    (renderer as THREE.WebGLRenderer & { outputColorSpace: string }).outputColorSpace =
      THREE.SRGBColorSpace;
  }
  host.appendChild(renderer.domElement);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  scene.add(new THREE.AmbientLight(0xb8c0d0, 0.45));
  const sun = new THREE.DirectionalLight(0xffffff, 0.55);
  sun.position.set(4, 14, 10);
  scene.add(sun);
  const fill = new THREE.PointLight(0x9ae6ff, 0.25, 40);
  fill.position.set(-3, 3, 2);
  scene.add(fill);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 56),
    new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.92, metalness: 0.05 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, -10);
  scene.add(floor);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x3d4451, roughness: 0.88 });
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5.5, 56), wallMat);
  leftWall.position.set(-4.2, 2.75, -10);
  scene.add(leftWall);
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5.5, 56), wallMat);
  rightWall.position.set(4.2, 2.75, -10);
  scene.add(rightWall);

  const ceil = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 56),
    new THREE.MeshStandardMaterial({ color: 0x1e232b, roughness: 0.95 })
  );
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(0, 5.6, -10);
  scene.add(ceil);

  for (let li = 0; li < 14; li++) {
    const tube = new THREE.Mesh(
      new THREE.BoxGeometry(5.5, 0.08, 0.35),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffee, emissiveIntensity: 0.35 })
    );
    tube.position.set(0, 5.35, 4 - li * 2.8);
    scene.add(tube);
  }

  const gate = new THREE.Group();
  for (let i = 0; i < 18; i++) {
    const mat = new THREE.MeshStandardMaterial({
      color: i % 2 === 0 ? 0xfacc15 : 0x111111,
      roughness: 0.6,
      metalness: 0.1,
    });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.55, 3.8), mat);
    mesh.position.set(-2 + i * 0.22 * 1.02, 3.1, -2.2);
    gate.add(mesh);
  }
  scene.add(gate);

  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(5.5, 1.1),
    new THREE.MeshBasicMaterial({
      map: makeSignCanvas('사고다발구역', '#facc15', '#111111'),
      transparent: true,
    })
  );
  banner.position.set(0, 4.25, -1.5);
  scene.add(banner);

  const hSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 0.75),
    new THREE.MeshBasicMaterial({
      map: makeSignCanvas('제한높이 3.2M', '#ffffff', '#b91c1c'),
      transparent: true,
    })
  );
  hSign.position.set(0, 3.55, -2.25);
  scene.add(hSign);

  const addForklift = (x: number, z: number, rot = 0) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.85, 1.6),
      new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.45, metalness: 0.35 })
    );
    body.position.y = 0.55;
    g.add(body);
    const cab = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.7, 0.85),
      new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.5 })
    );
    cab.position.set(0, 1.05, -0.35);
    g.add(cab);
    const mast = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 1.8, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.6, roughness: 0.3 })
    );
    mast.position.set(0, 1.1, 0.55);
    g.add(mast);
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    scene.add(g);
  };

  addForklift(-0.8, 1.2, 0.15);
  addForklift(0.9, -7, -0.2);
  addForklift(-0.6, -16, 0.1);

  const palletCols = [0x92400e, 0x166534, 0xca8a04];
  for (let pi = 0; pi < 16; pi++) {
    const g = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.85 + (pi % 3) * 0.05, 0.35, 0.7),
        new THREE.MeshStandardMaterial({ color: palletCols[i % 3], roughness: 0.85 })
      );
      mesh.position.set(0, 0.2 + i * 0.36, 0);
      g.add(mesh);
    }
    const side = pi % 2 === 0 ? -3.15 : 3.15;
    g.position.set(side, 0, 5 - pi * 2.4);
    scene.add(g);
  }

  const colGeo = new THREE.CylinderGeometry(0.28, 0.32, 4.2, 10);
  for (let ci = 0; ci < 10; ci++) {
    const hue = ci % 3 === 0 ? 0x22c55e : ci % 3 === 1 ? 0x38bdf8 : 0x4ade80;
    const col = new THREE.Mesh(colGeo, new THREE.MeshStandardMaterial({ color: hue, roughness: 0.55 }));
    col.position.set(ci % 2 === 0 ? -3.5 : 3.5, 2.1, 3 - ci * 2.6);
    scene.add(col);
  }

  const buildZoneMarker = (z: ZoneHyperSlot) => {
    const g = new THREE.Group();
    g.userData.zoneId = z.id;
    g.userData.phase = Math.random() * 6.28;

    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.48, 2.8, 16),
      new THREE.MeshStandardMaterial({
        color: pillarColor(z.type),
        roughness: 0.45,
        metalness: 0.2,
        emissive: emissiveForCongestion(z.congestionLevel),
        emissiveIntensity: 0.55,
      })
    );
    pillar.position.y = 1.45;
    g.add(pillar);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.72, 0.06, 10, 32),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.15,
        transparent: true,
        opacity: 0.85,
      })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.05;
    ring.visible = false;
    g.add(ring);
    g.userData.ring = ring;

    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 128;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(0, 0, 256, 128);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 52px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(z.shortName || z.name, 128, 64);
    }
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true })
    );
    sprite.position.set(0, 3.1, 0);
    sprite.scale.set(2.2, 1.1, 1);
    g.add(sprite);

    const pulse = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.95, 32),
      new THREE.MeshBasicMaterial({
        color: emissiveForCongestion(z.congestionLevel),
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      })
    );
    pulse.rotation.x = -Math.PI / 2;
    pulse.position.y = 0.02;
    g.add(pulse);
    g.userData.pulse = pulse;

    g.position.set(z.mapX, 0, z.mapZ);
    return g;
  };

  const clearZoneMeshes = () => {
    Object.keys(zoneMeshes).forEach((id) => {
      scene.remove(zoneMeshes[id]);
      delete zoneMeshes[id];
    });
  };

  const setZones = (zones: ZoneHyperSlot[], selectedId: string | null) => {
    clearZoneMeshes();
    zones.forEach((z) => {
      const g = buildZoneMarker(z);
      zoneMeshes[z.id] = g;
      scene.add(g);
      if (selectedId === z.id && g.userData.ring instanceof THREE.Mesh) {
        g.userData.ring.visible = true;
      }
    });
  };

  const measure = () => {
    const w = host.clientWidth || host.offsetWidth || window.innerWidth;
    const h = host.clientHeight || host.offsetHeight || window.innerHeight;
    return { w: Math.max(w, 320), h: Math.max(h, 400) };
  };

  const resize = () => {
    const { w, h } = measure();
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };

  resize();

  const pick = (clientX: number, clientY: number) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    for (const id of Object.keys(zoneMeshes)) {
      const hit = raycaster.intersectObject(zoneMeshes[id], true);
      if (hit.length) {
        onZoneTap(id);
        break;
      }
    }
  };

  const onClick = (ev: MouseEvent) => pick(ev.clientX, ev.clientY);
  const onTouchEnd = (ev: TouchEvent) => {
    const t = ev.changedTouches[0];
    if (t) pick(t.clientX, t.clientY);
  };

  renderer.domElement.addEventListener('click', onClick);
  renderer.domElement.addEventListener('touchend', onTouchEnd);

  let animId = 0;
  const tick = () => {
    animId = requestAnimationFrame(tick);
    const t = clock.getElapsedTime();
    Object.values(zoneMeshes).forEach((grp) => {
      const pulse = grp.userData.pulse as THREE.Mesh | undefined;
      if (!pulse) return;
      const s = 1 + 0.04 * Math.sin(t * 3 + (grp.userData.phase as number));
      pulse.scale.set(s, s, 1);
    });
    renderer.render(scene, camera);
  };
  tick();

  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
  ro?.observe(host);
  window.addEventListener('resize', resize);

  return {
    setZones,
    resize,
    dispose: () => {
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener('click', onClick);
      renderer.domElement.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', resize);
      ro?.disconnect();
      clearZoneMeshes();
      renderer.dispose();
      if (renderer.domElement.parentElement === host) {
        host.removeChild(renderer.domElement);
      }
    },
  };
}
