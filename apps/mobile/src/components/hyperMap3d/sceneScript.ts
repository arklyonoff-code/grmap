/**
 * Three.js r128 — WebView 내부에서 실행. RN은 injectJavaScript로 __hyperMapSetZones 호출.
 */
export const HYPER_MAP_SCENE_SCRIPT = `
var scene, camera, renderer, raycaster, pointer, animId, clock;
var zoneMeshes = {};

function emissiveForCongestion(c) {
  if (c === 'green') return 0x1d9e75;
  if (c === 'yellow') return 0xef9f27;
  if (c === 'red') return 0xe24b4a;
  return 0x6b7280;
}

function pillarColor(type) {
  if (type === 'vegetable') return 0x22c55e;
  if (type === 'fruit') return 0xf97316;
  if (type === 'fish') return 0x3b82f6;
  if (type === 'dry') return 0xa78bfa;
  return 0x64748b;
}

function makeSignCanvas(text, bg, fg) {
  var c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  var ctx = c.getContext('2d');
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
  var tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function addStripedGate(z) {
  var g = new THREE.Group();
  var w = 0.22;
  for (var i = 0; i < 18; i++) {
    var mat = new THREE.MeshStandardMaterial({
      color: i % 2 === 0 ? 0xfacc15 : 0x111111,
      roughness: 0.6,
      metalness: 0.1
    });
    var mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.55, 3.8), mat);
    mesh.position.set(-2 + i * w * 1.02, 3.1, z);
    g.add(mesh);
  }
  scene.add(g);
}

function addForklift(x, z, rot) {
  var g = new THREE.Group();
  var body = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.85, 1.6),
    new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.45, metalness: 0.35 })
  );
  body.position.y = 0.55;
  g.add(body);
  var cab = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.7, 0.85),
    new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.5 })
  );
  cab.position.set(0, 1.05, -0.35);
  g.add(cab);
  var mast = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 1.8, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.6, roughness: 0.3 })
  );
  mast.position.set(0, 1.1, 0.55);
  g.add(mast);
  g.position.set(x, 0, z);
  g.rotation.y = rot || 0;
  scene.add(g);
}

function addPalletStack(x, z) {
  var g = new THREE.Group();
  var cols = [0x92400e, 0x166534, 0xca8a04];
  for (var i = 0; i < 4; i++) {
    var mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.85 + Math.random() * 0.2, 0.35, 0.7),
      new THREE.MeshStandardMaterial({ color: cols[i % 3], roughness: 0.85 })
    );
    mesh.position.set(0, 0.2 + i * 0.36, 0);
    g.add(mesh);
  }
  g.position.set(x, 0, z);
  scene.add(g);
}

function viewportWH() {
  var w = window.innerWidth || document.documentElement.clientWidth || 0;
  var h = window.innerHeight || document.documentElement.clientHeight || 0;
  if (window.visualViewport && window.visualViewport.width > 0) {
    w = Math.max(w, window.visualViewport.width);
    h = Math.max(h, window.visualViewport.height);
  }
  if (w < 48 || h < 48) {
    w = Math.max(w, 390);
    h = Math.max(h, 720);
  }
  return { w: w, h: h };
}

function buildBaseScene() {
  clock = new THREE.Clock();
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x252830);
  scene.fog = new THREE.Fog(0x252830, 12, 52);

  var vp = viewportWH();
  var w = vp.w;
  var h = vp.h;
  camera = new THREE.PerspectiveCamera(52, w / h, 0.1, 120);
  camera.position.set(0, 2.35, 12.5);
  camera.lookAt(0, 1.15, -10);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h);
  renderer.outputEncoding = THREE.sRGBEncoding;
  document.body.appendChild(renderer.domElement);

  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();

  scene.add(new THREE.AmbientLight(0xb8c0d0, 0.45));
  var sun = new THREE.DirectionalLight(0xffffff, 0.55);
  sun.position.set(4, 14, 10);
  scene.add(sun);
  var fill = new THREE.PointLight(0x9ae6ff, 0.25, 40);
  fill.position.set(-3, 3, 2);
  scene.add(fill);

  var floor = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 56),
    new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.92, metalness: 0.05 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, -10);
  scene.add(floor);

  var wallMat = new THREE.MeshStandardMaterial({ color: 0x3d4451, roughness: 0.88 });
  var leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5.5, 56), wallMat);
  leftWall.position.set(-4.2, 2.75, -10);
  scene.add(leftWall);
  var rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5.5, 56), wallMat);
  rightWall.position.set(4.2, 2.75, -10);
  scene.add(rightWall);

  var ceil = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 56),
    new THREE.MeshStandardMaterial({ color: 0x1e232b, roughness: 0.95 })
  );
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(0, 5.6, -10);
  scene.add(ceil);

  for (var li = 0; li < 14; li++) {
    var tube = new THREE.Mesh(
      new THREE.BoxGeometry(5.5, 0.08, 0.35),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffee, emissiveIntensity: 0.35 })
    );
    tube.position.set(0, 5.35, 4 - li * 2.8);
    scene.add(tube);
  }

  addStripedGate(-2.2);

  var bannerGeo = new THREE.PlaneGeometry(5.5, 1.1);
  var bannerMat = new THREE.MeshBasicMaterial({
    map: makeSignCanvas('사고다발구역', '#facc15', '#111111'),
    transparent: true
  });
  var banner = new THREE.Mesh(bannerGeo, bannerMat);
  banner.position.set(0, 4.25, -1.5);
  scene.add(banner);

  var hSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 0.75),
    new THREE.MeshBasicMaterial({
      map: makeSignCanvas('제한높이 3.2M', '#ffffff', '#b91c1c'),
      transparent: true
    })
  );
  hSign.position.set(0, 3.55, -2.25);
  scene.add(hSign);

  addForklift(-0.8, 1.2, 0.15);
  addForklift(0.9, -7, -0.2);
  addForklift(-0.6, -16, 0.1);

  for (var pi = 0; pi < 16; pi++) {
    var side = pi % 2 === 0 ? -3.15 : 3.15;
    addPalletStack(side + (Math.random() - 0.5) * 0.3, 5 - pi * 2.4);
  }

  var colGeo = new THREE.CylinderGeometry(0.28, 0.32, 4.2, 10);
  for (var ci = 0; ci < 10; ci++) {
    var hue = ci % 3 === 0 ? 0x22c55e : ci % 3 === 1 ? 0x38bdf8 : 0x4ade80;
    var col = new THREE.Mesh(colGeo, new THREE.MeshStandardMaterial({ color: hue, roughness: 0.55 }));
    col.position.set(ci % 2 === 0 ? -3.5 : 3.5, 2.1, 3 - ci * 2.6);
    scene.add(col);
  }

  function onResize() {
    var nw = viewportWH().w;
    var nh = viewportWH().h;
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
    renderer.setSize(nw, nh);
  }
  window.addEventListener('resize', onResize);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', onResize);
  }

  function pick(ev) {
    var rect = renderer.domElement.getBoundingClientRect();
    var cx = (ev.clientX !== undefined ? ev.clientX : ev.touches && ev.touches[0].clientX) - rect.left;
    var cy = (ev.clientY !== undefined ? ev.clientY : ev.touches && ev.touches[0].clientY) - rect.top;
    pointer.x = (cx / rect.width) * 2 - 1;
    pointer.y = -(cy / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    var keys = Object.keys(zoneMeshes);
    for (var i = 0; i < keys.length; i++) {
      var hit = raycaster.intersectObject(zoneMeshes[keys[i]], true);
      if (hit.length) {
        var id = keys[i];
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'zoneTap', zoneId: id }));
        }
        break;
      }
    }
  }
  renderer.domElement.addEventListener('click', pick);
  renderer.domElement.addEventListener('touchend', function (e) {
    if (e.changedTouches && e.changedTouches[0]) pick(e.changedTouches[0]);
  });

  function tick() {
    animId = requestAnimationFrame(tick);
    var t = clock.getElapsedTime();
    Object.keys(zoneMeshes).forEach(function (id) {
      var grp = zoneMeshes[id];
      if (!grp || !grp.userData.pulse) return;
      var s = 1 + 0.04 * Math.sin(t * 3 + grp.userData.phase);
      grp.userData.pulse.scale.set(s, 1, s);
    });
    renderer.render(scene, camera);
  }
  tick();
}

function clearZoneMeshes() {
  Object.keys(zoneMeshes).forEach(function (id) {
    var g = zoneMeshes[id];
    if (g && scene) scene.remove(g);
    delete zoneMeshes[id];
  });
}

function buildZoneMarker(z) {
  var g = new THREE.Group();
  g.userData.zoneId = z.id;
  g.userData.phase = Math.random() * 6.28;

  var pillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.48, 2.8, 16),
    new THREE.MeshStandardMaterial({
      color: pillarColor(z.type),
      roughness: 0.45,
      metalness: 0.2,
      emissive: emissiveForCongestion(z.congestionLevel),
      emissiveIntensity: 0.55
    })
  );
  pillar.position.y = 1.45;
  g.add(pillar);

  var ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.72, 0.06, 10, 32),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.15,
      transparent: true,
      opacity: 0.85
    })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.05;
  ring.visible = false;
  g.add(ring);
  g.userData.ring = ring;

  var c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  var ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 52px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(z.shortName || z.name, 128, 64);
  var lt = new THREE.CanvasTexture(c);
  var spriteMat = new THREE.SpriteMaterial({ map: lt, transparent: true });
  var sprite = new THREE.Sprite(spriteMat);
  sprite.position.set(0, 3.1, 0);
  sprite.scale.set(2.2, 1.1, 1);
  g.add(sprite);

  var pulse = new THREE.Mesh(
    new THREE.RingGeometry(0.55, 0.95, 32),
    new THREE.MeshBasicMaterial({ color: emissiveForCongestion(z.congestionLevel), transparent: true, opacity: 0.35, side: THREE.DoubleSide })
  );
  pulse.rotation.x = -Math.PI / 2;
  pulse.position.y = 0.02;
  g.add(pulse);
  g.userData.pulse = pulse;

  g.position.set(z.mapX, 0, z.mapZ);
  return g;
}

window.__hyperMapSetZones = function (payload) {
  if (!scene) {
    window.__pendingZones = payload;
    return;
  }
  var zones = payload.zones || [];
  var selectedId = payload.selectedId || null;
  clearZoneMeshes();
  for (var i = 0; i < zones.length; i++) {
    var z = zones[i];
    var g = buildZoneMarker(z);
    zoneMeshes[z.id] = g;
    scene.add(g);
    if (selectedId === z.id) {
      g.userData.ring.visible = true;
    }
  }
};

window.__hyperMapInit = function () {
  if (typeof THREE === 'undefined') return;
  if (scene) return;
  buildBaseScene();
  if (window.__pendingZones) {
    window.__hyperMapSetZones(window.__pendingZones);
    window.__pendingZones = null;
  }
};
`.trim();
