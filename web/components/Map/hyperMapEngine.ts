import * as THREE from 'three';
import type { ZoneWithStatus } from '@grmap/shared/types';
import type { ZoneHyperSlot } from '@grmap/shared/utils/hyperMap';

type Congestion = ZoneWithStatus['congestionLevel'];

const PALETTE = {
  sky: 0xe8e6e1,
  board: 0xd9d5cc,
  boardDark: 0xc8c4bb,
  line: 0xb8b4ac,
  ink: 0x4a4a48,
  inkMuted: 0x7a7874,
};

function accentForCongestion(c: Congestion): number {
  if (c === 'green') return 0x7a9a8c;
  if (c === 'yellow') return 0xa89a72;
  if (c === 'red') return 0xa07a78;
  return 0x9a9894;
}

function boardMaterial(color: number, opacity = 1) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: opacity < 1,
    opacity,
    side: THREE.DoubleSide,
  });
}

function addBoard(
  scene: THREE.Scene,
  w: number,
  h: number,
  x: number,
  y: number,
  z: number,
  rx: number,
  ry: number,
  rz: number,
  color: number,
  opacity = 1
) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), boardMaterial(color, opacity));
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  scene.add(mesh);
  return mesh;
}

function makeGridTexture(): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(c);
  ctx.fillStyle = '#e8e6e1';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#c8c4bb';
  ctx.lineWidth = 1;
  const step = 32;
  for (let i = 0; i <= size; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 28);
  tex.needsUpdate = true;
  return tex;
}

function makeLabelTexture(text: string, accent: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(c);
  ctx.fillStyle = '#e4e1da';
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = `#${accent.toString(16).padStart(6, '0')}`;
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 248, 120);
  ctx.fillStyle = '#4a4a48';
  ctx.font = 'bold 40px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 64);
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
  scene.background = new THREE.Color(PALETTE.sky);
  scene.fog = new THREE.Fog(PALETTE.sky, 18, 58);

  const zoneMeshes: Record<string, THREE.Group> = {};

  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 120);
  camera.position.set(0, 7.5, 14);
  camera.lookAt(0, 0, -8);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  if ('outputColorSpace' in renderer) {
    (renderer as THREE.WebGLRenderer & { outputColorSpace: string }).outputColorSpace =
      THREE.SRGBColorSpace;
  }
  host.appendChild(renderer.domElement);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  scene.add(new THREE.AmbientLight(0xffffff, 0.92));
  const sun = new THREE.DirectionalLight(0xffffff, 0.28);
  sun.position.set(2, 10, 8);
  scene.add(sun);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(11, 56),
    new THREE.MeshBasicMaterial({ map: makeGridTexture(), side: THREE.DoubleSide })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, -10);
  scene.add(floor);

  addBoard(scene, 0.06, 5.5, -4.2, 2.75, -10, 0, Math.PI / 2, 0, PALETTE.boardDark);
  addBoard(scene, 0.06, 5.5, 4.2, 2.75, -10, 0, -Math.PI / 2, 0, PALETTE.boardDark);
  addBoard(scene, 9, 0.06, 0, 5.6, -10, Math.PI / 2, 0, 0, PALETTE.board);
  addBoard(scene, 5.5, 0.55, 0, 3.2, -2.2, 0, 0, 0, PALETTE.boardDark);
  addBoard(scene, 3.2, 0.45, 0, 2.6, -2.2, 0, 0, 0, PALETTE.board);

  for (let i = 0; i < 12; i++) {
    const z = 4 - i * 2.5;
    addBoard(scene, 0.9, 0.04, -3.2, 0.12, z, -Math.PI / 2, 0, 0, PALETTE.board, 0.85);
    addBoard(scene, 0.9, 0.04, 3.2, 0.12, z, -Math.PI / 2, 0, 0, PALETTE.board, 0.85);
  }

  const buildZoneMarker = (z: ZoneHyperSlot) => {
    const g = new THREE.Group();
    g.userData.zoneId = z.id;
    const accent = accentForCongestion(z.congestionLevel);

    const footprint = new THREE.Mesh(
      new THREE.PlaneGeometry(1.35, 1.35),
      boardMaterial(accent, 0.22)
    );
    footprint.rotation.x = -Math.PI / 2;
    footprint.position.y = 0.03;
    g.add(footprint);

    const frame = new THREE.Mesh(
      new THREE.PlaneGeometry(1.45, 1.45),
      boardMaterial(PALETTE.line, 0.35)
    );
    frame.rotation.x = -Math.PI / 2;
    frame.position.y = 0.02;
    g.add(frame);

    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 0.72),
      new THREE.MeshBasicMaterial({
        map: makeLabelTexture(z.shortName || z.name, accent),
        transparent: true,
        side: THREE.DoubleSide,
      })
    );
    label.position.set(0, 0.78, 0);
    g.add(label);

    const pin = new THREE.Mesh(
      new THREE.PlaneGeometry(0.08, 0.78),
      boardMaterial(PALETTE.line, 0.5)
    );
    pin.position.set(0, 0.39, 0);
    g.add(pin);

    const ring = new THREE.Mesh(
      new THREE.PlaneGeometry(1.65, 1.65),
      boardMaterial(PALETTE.ink, 0.45)
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.04;
    ring.visible = false;
    g.add(ring);
    g.userData.ring = ring;

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
      const marker = buildZoneMarker(z);
      zoneMeshes[z.id] = marker;
      scene.add(marker);
      if (selectedId === z.id && marker.userData.ring instanceof THREE.Mesh) {
        marker.userData.ring.visible = true;
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
