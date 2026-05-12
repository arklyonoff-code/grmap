/**
 * Three.js r128 — WebView 내부. 보드(평면) 기반·저채도 GPS 배치 맵.
 */
export const HYPER_MAP_SCENE_SCRIPT = `
var scene, camera, renderer, raycaster, pointer, animId;
var zoneMeshes = {};
var dangerMeshes = {};

var PALETTE = { sky: 0xe8e6e1, board: 0xd9d5cc, boardDark: 0xc8c4bb, line: 0xb8b4ac, ink: 0x4a4a48 };

function accentForCongestion(c) {
  if (c === 'green') return 0x7a9a8c;
  if (c === 'yellow') return 0xa89a72;
  if (c === 'red') return 0xa07a78;
  return 0x9a9894;
}

function boardMat(color, opacity) {
  opacity = opacity === undefined ? 1 : opacity;
  return new THREE.MeshBasicMaterial({
    color: color,
    transparent: opacity < 1,
    opacity: opacity,
    side: THREE.DoubleSide
  });
}

function addBoard(w, h, x, y, z, rx, ry, rz, color, opacity) {
  var mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), boardMat(color, opacity));
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  scene.add(mesh);
  return mesh;
}

function makeGridTexture() {
  var size = 512;
  var c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  var ctx = c.getContext('2d');
  ctx.fillStyle = '#e8e6e1';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#c8c4bb';
  ctx.lineWidth = 1;
  var step = 32;
  for (var i = 0; i <= size; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }
  var tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 28);
  tex.needsUpdate = true;
  return tex;
}

function makeLabelTexture(text, accent) {
  var c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  var ctx = c.getContext('2d');
  ctx.fillStyle = '#e4e1da';
  ctx.fillRect(0, 0, 256, 128);
  var hex = accent.toString(16);
  while (hex.length < 6) hex = '0' + hex;
  ctx.strokeStyle = '#' + hex;
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 248, 120);
  ctx.fillStyle = '#4a4a48';
  ctx.font = 'bold 40px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 64);
  var tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
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
  scene = new THREE.Scene();
  scene.background = new THREE.Color(PALETTE.sky);
  scene.fog = new THREE.Fog(PALETTE.sky, 18, 58);

  var vp = viewportWH();
  camera = new THREE.PerspectiveCamera(48, vp.w / vp.h, 0.1, 120);
  camera.position.set(0, 7.5, 14);
  camera.lookAt(0, 0, -8);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(vp.w, vp.h);
  if (renderer.outputEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;
  document.body.appendChild(renderer.domElement);

  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();

  scene.add(new THREE.AmbientLight(0xffffff, 0.92));
  var sun = new THREE.DirectionalLight(0xffffff, 0.28);
  sun.position.set(2, 10, 8);
  scene.add(sun);

  var floor = new THREE.Mesh(
    new THREE.PlaneGeometry(11, 56),
    new THREE.MeshBasicMaterial({ map: makeGridTexture(), side: THREE.DoubleSide })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, -10);
  scene.add(floor);

  addBoard(0.06, 5.5, -4.2, 2.75, -10, 0, Math.PI / 2, 0, PALETTE.boardDark);
  addBoard(0.06, 5.5, 4.2, 2.75, -10, 0, -Math.PI / 2, 0, PALETTE.boardDark);
  addBoard(9, 0.06, 0, 5.6, -10, Math.PI / 2, 0, 0, PALETTE.board);
  addBoard(5.5, 0.55, 0, 3.2, -2.2, 0, 0, 0, PALETTE.boardDark);
  addBoard(3.2, 0.45, 0, 2.6, -2.2, 0, 0, 0, PALETTE.board);

  for (var i = 0; i < 12; i++) {
    var z = 4 - i * 2.5;
    addBoard(0.9, 0.04, -3.2, 0.12, z, -Math.PI / 2, 0, 0, PALETTE.board, 0.85);
    addBoard(0.9, 0.04, 3.2, 0.12, z, -Math.PI / 2, 0, 0, PALETTE.board, 0.85);
  }

  function onResize() {
    var nw = viewportWH().w;
    var nh = viewportWH().h;
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
    renderer.setSize(nw, nh);
  }
  window.addEventListener('resize', onResize);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', onResize);

  function pick(ev) {
    var rect = renderer.domElement.getBoundingClientRect();
    var cx = (ev.clientX !== undefined ? ev.clientX : ev.touches && ev.touches[0].clientX) - rect.left;
    var cy = (ev.clientY !== undefined ? ev.clientY : ev.touches && ev.touches[0].clientY) - rect.top;
    pointer.x = (cx / rect.width) * 2 - 1;
    pointer.y = -(cy / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    var keys = Object.keys(zoneMeshes);
    for (var ki = 0; ki < keys.length; ki++) {
      var hit = raycaster.intersectObject(zoneMeshes[keys[ki]], true);
      if (hit.length) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'zoneTap', zoneId: keys[ki] }));
        }
        break;
      }
    }
  }
  renderer.domElement.addEventListener('click', pick);
  renderer.domElement.addEventListener('touchend', function (e) {
    if (e.changedTouches && e.changedTouches[0]) pick(e.changedTouches[0]);
  });

  function tick(now) {
    animId = requestAnimationFrame(tick);
    var pulseT = now !== undefined ? now : performance.now();
    var dkeys = Object.keys(dangerMeshes);
    for (var di = 0; di < dkeys.length; di++) {
      var dg = dangerMeshes[dkeys[di]];
      if (dg && dg.userData.weatherDanger && dg.userData.badge) {
        var phase = (dg.userData.phase || 0) + pulseT * 0.004;
        var scale = 1 + Math.sin(phase) * 0.1;
        dg.userData.badge.scale.set(scale, scale, 1);
      }
    }
    renderer.render(scene, camera);
  }
  tick();
}

function clearZoneMeshes() {
  Object.keys(zoneMeshes).forEach(function (id) {
    if (zoneMeshes[id] && scene) scene.remove(zoneMeshes[id]);
    delete zoneMeshes[id];
  });
}

function clearDangerMeshes() {
  Object.keys(dangerMeshes).forEach(function (id) {
    if (dangerMeshes[id] && scene) scene.remove(dangerMeshes[id]);
    delete dangerMeshes[id];
  });
}

function makeWarningTexture(isDangerous) {
  var size = isDangerous ? 128 : 96;
  var c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  var ctx = c.getContext('2d');
  ctx.fillStyle = isDangerous ? '#E24B4A' : '#EF9F27';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.font = (isDangerous ? '56px' : '44px') + ' sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚠️', size / 2, size / 2 + 2);
  var tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function buildDangerMarker(d, isWeatherDangerous) {
  var g = new THREE.Group();
  g.userData.dangerId = d.id;
  g.userData.weatherDanger = isWeatherDangerous;
  g.userData.phase = Math.random() * Math.PI * 2;
  var size = isWeatherDangerous ? 0.95 : 0.72;
  var badge = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({
      map: makeWarningTexture(isWeatherDangerous),
      transparent: true,
      side: THREE.DoubleSide
    })
  );
  badge.position.y = 0.55;
  g.add(badge);
  g.userData.badge = badge;
  g.position.set(d.mapX, 0, d.mapZ);
  return g;
}

function buildZoneMarker(z) {
  var g = new THREE.Group();
  g.userData.zoneId = z.id;
  var accent = accentForCongestion(z.congestionLevel);

  var footprint = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 1.35), boardMat(accent, 0.22));
  footprint.rotation.x = -Math.PI / 2;
  footprint.position.y = 0.03;
  g.add(footprint);

  var frame = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 1.45), boardMat(PALETTE.line, 0.35));
  frame.rotation.x = -Math.PI / 2;
  frame.position.y = 0.02;
  g.add(frame);

  var label = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 0.72),
    new THREE.MeshBasicMaterial({
      map: makeLabelTexture(z.shortName || z.name, accent),
      transparent: true,
      side: THREE.DoubleSide
    })
  );
  label.position.set(0, 0.78, 0);
  g.add(label);

  var pin = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.78), boardMat(PALETTE.line, 0.5));
  pin.position.set(0, 0.39, 0);
  g.add(pin);

  var ring = new THREE.Mesh(new THREE.PlaneGeometry(1.65, 1.65), boardMat(PALETTE.ink, 0.45));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.04;
  ring.visible = false;
  g.add(ring);
  g.userData.ring = ring;

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
  var dangerZones = payload.dangerZones || [];
  var isWeatherDangerous = !!payload.isWeatherDangerous;
  clearZoneMeshes();
  clearDangerMeshes();
  for (var i = 0; i < zones.length; i++) {
    var z = zones[i];
    var marker = buildZoneMarker(z);
    zoneMeshes[z.id] = marker;
    scene.add(marker);
    if (selectedId === z.id) marker.userData.ring.visible = true;
  }
  for (var j = 0; j < dangerZones.length; j++) {
    var d = dangerZones[j];
    var dm = buildDangerMarker(d, isWeatherDangerous);
    dangerMeshes[d.id] = dm;
    scene.add(dm);
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
