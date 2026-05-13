var GRForkliftMapRuntime = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // packages/shared/forklift-map/webviewEntry.ts
  var webviewEntry_exports = {};
  __export(webviewEntry_exports, {
    bootForkliftMap: () => bootForkliftMap,
    createForkliftMapRuntime: () => createForkliftMapRuntime
  });

  // packages/shared/constants/mock-zones.ts
  var MOCK_ZONES = [
    {
      id: "zone-01",
      name: "\uCC44\uC18C1\uB3D9",
      shortName: "\uCC44\uC18C1",
      type: "vegetable",
      lat: 37.4935,
      lng: 127.1185,
      dockDescription: "\uC815\uBB38 \uC88C\uCE21 A~D \uB3C4\uD06C, 1\uBC88 \uAC8C\uC774\uD2B8 \uC9C4\uC785",
      entryNote: "11\uD1A4 \uC774\uC0C1 \uC11C\uCE21 \uAC8C\uC774\uD2B8 \uC804\uC6A9"
    },
    {
      id: "zone-02",
      name: "\uCC44\uC18C2\uB3D9",
      shortName: "\uCC44\uC18C2",
      type: "vegetable",
      lat: 37.4942,
      lng: 127.1196,
      dockDescription: "2\uBC88 \uAC8C\uC774\uD2B8 \uC9C1\uC9C4 \uD6C4 \uC6B0\uD68C\uC804, E~H \uB3C4\uD06C"
    },
    {
      id: "zone-03",
      name: "\uACFC\uC77C\uB3D9",
      shortName: "\uACFC\uC77C",
      type: "fruit",
      lat: 37.492,
      lng: 127.12,
      dockDescription: "\uB3D9\uCE21 \uC785\uAD6C, 1~8\uBC88 \uB3C4\uD06C",
      entryNote: "\uB0C9\uC7A5 \uCC28\uB7C9 \uBCC4\uB3C4 \uAD6C\uC5ED \uC548\uB0B4 \uBC1B\uC744 \uAC83"
    },
    {
      id: "zone-04",
      name: "\uC218\uC0B0\uB3D9",
      shortName: "\uC218\uC0B0",
      type: "fish",
      lat: 37.491,
      lng: 127.1178,
      dockDescription: "\uC11C\uBB38 \uC9C4\uC785 \uD6C4 \uC88C\uCE21, \uB0C9\uB3D9 \uD558\uC5ED\uC7A5",
      entryNote: "11\uD1A4 \uC774\uC0C1 \uC0AC\uC804 \uC608\uC57D \uD544\uC218"
    },
    {
      id: "zone-05",
      name: "\uAC74\uC5B4\uBB3C\uB3D9",
      shortName: "\uAC74\uC5B4\uBB3C",
      type: "dry",
      lat: 37.4916,
      lng: 127.121,
      dockDescription: "\uB0A8\uCE21 \uC18C\uD615 \uAC8C\uC774\uD2B8, 5\uD1A4 \uC774\uD558 \uAD8C\uC7A5"
    },
    {
      id: "zone-06",
      name: "\uC77C\uBC18\uB3D9",
      shortName: "\uC77C\uBC18",
      type: "general",
      lat: 37.495,
      lng: 127.1174,
      dockDescription: "\uBD81\uBB38 \uC9C4\uC785, \uC11C/\uB3D9\uCE21 \uD558\uC5ED\uC7A5 \uAD6C\uBD84"
    }
  ];

  // packages/shared/utils/hyperMap.ts
  var GARAK_MAP_CENTER = { lat: 37.4929, lng: 127.119 };
  var MAP_X_SCALE = 920;
  var MAP_Z_SCALE = -1050;
  function projectLatLngToHyperMap(lat, lng) {
    return {
      mapX: (lng - GARAK_MAP_CENTER.lng) * MAP_X_SCALE,
      mapZ: (lat - GARAK_MAP_CENTER.lat) * MAP_Z_SCALE
    };
  }

  // packages/shared/utils/forkliftMapLayout.ts
  var FORKLIFT_HYPER_PLANE_TO_SCENE = 48;
  function hyperMapToForkliftSceneXZ(mapX, mapZ) {
    return {
      x: mapX * FORKLIFT_HYPER_PLANE_TO_SCENE,
      z: mapZ * FORKLIFT_HYPER_PLANE_TO_SCENE
    };
  }
  function zoneLatLngToForkliftSceneXZ(lat, lng) {
    const { mapX, mapZ } = projectLatLngToHyperMap(lat, lng);
    return hyperMapToForkliftSceneXZ(mapX, mapZ);
  }
  var FORKLIFT_ZONE_BOX_BY_TYPE = {
    vegetable: { halfWidth: 14, halfHeight: 2, halfDepth: 10 },
    fruit: { halfWidth: 14, halfHeight: 2, halfDepth: 10 },
    fish: { halfWidth: 12, halfHeight: 2, halfDepth: 9 },
    dry: { halfWidth: 11, halfHeight: 2, halfDepth: 9 },
    general: { halfWidth: 11, halfHeight: 2, halfDepth: 9 }
  };
  var FORKLIFT_ZONE_COLOR_HEX = {
    vegetable: "#4B7BEC",
    fruit: "#F7B731",
    fish: "#2BCBBA",
    dry: "#A55EEA",
    general: "#778CA3"
  };
  function buildForkliftZoneLayouts(zones = MOCK_ZONES) {
    return zones.map((zone) => {
      const { x, z } = zoneLatLngToForkliftSceneXZ(zone.lat, zone.lng);
      const box = FORKLIFT_ZONE_BOX_BY_TYPE[zone.type];
      return {
        ...zone,
        x,
        z,
        halfWidth: box.halfWidth,
        halfHeight: box.halfHeight,
        halfDepth: box.halfDepth,
        colorHex: FORKLIFT_ZONE_COLOR_HEX[zone.type]
      };
    });
  }

  // packages/shared/constants/forkliftAnchors.ts
  var FORKLIFT_STRUCTURE_ANCHORS = [
    {
      id: "cold-dock-b1",
      lat: 37.4928,
      lng: 127.1183,
      halfWidth: 30,
      halfHeight: 1.75,
      halfDepth: 20,
      colorHex: "#0984e3",
      layers: ["b1"]
    },
    {
      id: "general-dock-b1",
      lat: 37.4932,
      lng: 127.1195,
      halfWidth: 25,
      halfHeight: 1.75,
      halfDepth: 17,
      colorHex: "#636e72",
      layers: ["b1"]
    },
    {
      id: "ramp-a",
      lat: 37.4944,
      lng: 127.1171,
      halfWidth: 8,
      halfHeight: 1.2,
      halfDepth: 14,
      colorHex: "#636e72",
      layers: ["ground", "b1"],
      isDanger: true,
      yawRad: 0.35
    },
    {
      id: "ramp-b",
      lat: 37.4913,
      lng: 127.1204,
      halfWidth: 8,
      halfHeight: 1.2,
      halfDepth: 14,
      colorHex: "#636e72",
      layers: ["ground", "b1", "b2"],
      isDanger: true,
      yawRad: -0.45
    },
    {
      id: "b2-slab",
      lat: 37.49295,
      lng: 127.119,
      halfWidth: 38,
      halfHeight: 0.6,
      halfDepth: 28,
      colorHex: "#2d3436",
      layers: ["b2"]
    }
  ];
  function resolveForkliftAnchors() {
    return FORKLIFT_STRUCTURE_ANCHORS.map((a) => {
      const { x, z } = zoneLatLngToForkliftSceneXZ(a.lat, a.lng);
      return { ...a, x, z };
    });
  }

  // packages/shared/utils/report.ts
  function getCongestionLevel(report) {
    if (!report) return "unknown";
    if (report.waitLevel === "none" || report.waitLevel === "under10") return "green";
    if (report.waitLevel === "under30") return "yellow";
    return "red";
  }

  // packages/shared/forklift-map/webviewEntry.ts
  function getThree() {
    const w = window;
    if (!w.THREE) {
      throw new Error("THREE global missing");
    }
    return w.THREE;
  }
  function post(type, payload = {}) {
    const bridge = window.ReactNativeWebView;
    if (!bridge) return;
    bridge.postMessage(JSON.stringify({ type, ...payload }));
  }
  function congestionColor(level) {
    switch (level) {
      case "green":
        return 1941109;
      case "yellow":
        return 15703847;
      case "red":
        return 14830410;
      default:
        return 11842217;
    }
  }
  function anchorWorldY(layers, floor, halfHeight) {
    if (!layers.includes(floor)) return null;
    if (floor === "ground") return halfHeight;
    if (floor === "b1") return -6 + halfHeight;
    return -12 + halfHeight;
  }
  function createForkliftMapRuntime(host) {
    var _a;
    const T = getThree();
    const scene = new T.Scene();
    scene.background = new T.Color(1710638);
    const renderer = new T.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(host.clientWidth || 1, host.clientHeight || 1);
    renderer.shadowMap.enabled = true;
    host.appendChild(renderer.domElement);
    const camera = new T.PerspectiveCamera(50, 1, 0.5, 800);
    camera.position.set(0, 80, 120);
    const ambient = new T.AmbientLight(16777215, 0.55);
    scene.add(ambient);
    const sun = new T.DirectionalLight(16777215, 0.82);
    sun.position.set(50, 80, 50);
    sun.castShadow = true;
    scene.add(sun);
    const groundGeo = new T.PlaneGeometry(520, 520);
    const groundMat = new T.MeshStandardMaterial({ color: 2371654, roughness: 0.92 });
    const ground = new T.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.name = "forklift-ground";
    scene.add(ground);
    const layouts = buildForkliftZoneLayouts(MOCK_ZONES);
    const zoneMeshes = [];
    for (const layout of layouts) {
      const box = new T.Mesh(
        new T.BoxGeometry(layout.halfWidth * 2, layout.halfHeight * 2, layout.halfDepth * 2),
        new T.MeshStandardMaterial({
          color: new T.Color(layout.colorHex),
          roughness: 0.55,
          metalness: 0.1
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
          color: 11842217,
          roughness: 0.4,
          emissive: new T.Color(1118481),
          emissiveIntensity: 0.2
        })
      );
      sphere.position.set(layout.x, layout.halfHeight * 2 + 2.5, layout.z);
      sphere.castShadow = true;
      sphere.userData.zoneId = layout.id;
      scene.add(sphere);
      zoneMeshes.push({ zoneId: layout.id, box, sphere });
    }
    const anchorObjects = [];
    const anchors = resolveForkliftAnchors();
    for (const a of anchors) {
      const mesh = new T.Mesh(
        new T.BoxGeometry(a.halfWidth * 2, a.halfHeight * 2, a.halfDepth * 2),
        new T.MeshStandardMaterial({ color: new T.Color(a.colorHex), roughness: 0.75 })
      );
      mesh.position.set(a.x, a.halfHeight, a.z);
      mesh.rotation.y = (_a = a.yawRad) != null ? _a : 0;
      mesh.castShadow = true;
      mesh.userData.anchorId = a.id;
      mesh.userData.layers = a.layers;
      mesh.visible = a.layers.includes("ground");
      scene.add(mesh);
      anchorObjects.push(mesh);
    }
    let floor = "ground";
    let orbitAngle = 0;
    let reportsByZoneId = {};
    const raycaster = new T.Raycaster();
    const pointer = new T.Vector2();
    const applyCongestion = () => {
      for (const z of zoneMeshes) {
        const report = reportsByZoneId[z.zoneId];
        const level = getCongestionLevel(report != null ? report : null);
        const mat = z.sphere.material;
        const c = congestionColor(level);
        mat.color.setHex(c);
        mat.emissive.setHex(c);
        mat.emissiveIntensity = 0.35;
      }
    };
    const applyFloorVisibility = () => {
      ground.visible = floor === "ground";
      for (const z of zoneMeshes) {
        z.box.visible = floor === "ground";
        z.sphere.visible = floor === "ground";
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
    const onPointerDown = (ev) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = (ev.clientX - rect.left) / rect.width * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(
        zoneMeshes.map((z) => z.box),
        false
      );
      const first = hits[0];
      if (first == null ? void 0 : first.object.userData.zoneId) {
        post("forkliftZoneTap", { zoneId: String(first.object.userData.zoneId) });
      }
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    const onResize = () => {
      const w = host.clientWidth || window.innerWidth || 1;
      const h = host.clientHeight || window.innerHeight || 1;
      renderer.setSize(w, h);
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);
    onResize();
    let animId = 0;
    const loop = () => {
      animId = requestAnimationFrame(loop);
      orbitAngle += 3e-3;
      const r = 135;
      camera.position.x = Math.sin(orbitAngle) * r;
      camera.position.z = Math.cos(orbitAngle) * r + 40;
      camera.position.y = 80;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    loop();
    const setConfig = (config) => {
      reportsByZoneId = { ...config.reportsByZoneId };
      applyCongestion();
    };
    const setFloor = (next) => {
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
        window.removeEventListener("resize", onResize);
        renderer.domElement.removeEventListener("pointerdown", onPointerDown);
        renderer.dispose();
        host.removeChild(renderer.domElement);
      }
    };
  }
  function bootForkliftMap(host) {
    const runtime = createForkliftMapRuntime(host);
    window.__forkliftMapRuntime = runtime;
    return runtime;
  }
  return __toCommonJS(webviewEntry_exports);
})();
