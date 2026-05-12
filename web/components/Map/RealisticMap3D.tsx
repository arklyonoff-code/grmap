"use client";

import { useEffect, useRef, useState } from "react";
import type { DangerZone } from "@grmap/shared/constants/dangerZones";
import type { ZoneWithStatus } from "@grmap/shared/types";
import { createForkliftController } from "./forkliftController";
import { createRealisticSceneEngine } from "./realisticSceneEngine";

type Props = {
  zones: ZoneWithStatus[];
  selectedZoneId: string | null;
  onZoneTap: (zoneId: string) => void;
  dangerZones?: DangerZone[];
  isWeatherDangerous?: boolean;
  /** R 키 또는 외부 트리거 시 대기시간 공유 흐름 시작 */
  onShareRequest?: () => void;
};

const DOCK_TRIGGER_RADIUS = 2;
const DOCK_COOLDOWN_MS = 1000;

export function RealisticMap3D({
  zones,
  onZoneTap,
  dangerZones = [],
  isWeatherDangerous = false,
  onShareRequest,
}: Props) {
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const onZoneTapRef = useRef(onZoneTap);
  const onShareRef = useRef(onShareRequest);
  const zonesRef = useRef(zones);
  const lastDockTapRef = useRef(0);
  const engineRef = useRef<ReturnType<typeof createRealisticSceneEngine> | null>(null);
  const [cameraMode, setCameraMode] = useState<"1인칭" | "3인칭">("1인칭");
  const [speedWarning, setSpeedWarning] = useState(false);

  onZoneTapRef.current = onZoneTap;
  onShareRef.current = onShareRequest;
  zonesRef.current = zones;

  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host) return;

    const sceneEngine = createRealisticSceneEngine(host);
    engineRef.current = sceneEngine;
    const forklift = createForkliftController(sceneEngine.scene, sceneEngine.colliders);
    forklift.bind(sceneEngine.renderer.domElement);

    let animId = 0;
    let last = performance.now();
    let lastMode: "1인칭" | "3인칭" = "1인칭";
    let lastWarn = false;

    const loop = (now: number) => {
      animId = requestAnimationFrame(loop);
      const delta = Math.min(0.05, (now - last) / 1000);
      last = now;

      forklift.update(delta);
      sceneEngine.update(now);
      forklift.camera.aspect =
        sceneEngine.renderer.domElement.clientWidth /
        Math.max(sceneEngine.renderer.domElement.clientHeight, 1);
      forklift.camera.updateProjectionMatrix();

      const dockTargets = zonesRef.current.slice(0, sceneEngine.dockSlots.length);
      const vehiclePos = forklift.vehicle.position;
      for (let i = 0; i < dockTargets.length; i++) {
        const slot = sceneEngine.dockSlots[i];
        const dx = vehiclePos.x - slot.position.x;
        const dz = vehiclePos.z - slot.position.z;
        if (Math.hypot(dx, dz) <= DOCK_TRIGGER_RADIUS) {
          const elapsed = now - lastDockTapRef.current;
          if (elapsed >= DOCK_COOLDOWN_MS) {
            lastDockTapRef.current = now;
            onZoneTapRef.current(dockTargets[i].id);
          }
          break;
        }
      }

      const mode = forklift.getCameraMode() === "first" ? "1인칭" : "3인칭";
      const warn = forklift.isOverSpeedLimit();
      if (mode !== lastMode) {
        lastMode = mode;
        setCameraMode(mode);
      }
      if (warn !== lastWarn) {
        lastWarn = warn;
        setSpeedWarning(warn);
      }
      sceneEngine.render(forklift.camera);
    };

    animId = requestAnimationFrame(loop);

    const onKeyDown = (ev: KeyboardEvent) => {
      const k = ev.key.toLowerCase();
      if (k === "v") {
        setCameraMode(forklift.getCameraMode() === "first" ? "1인칭" : "3인칭");
      } else if (k === "r") {
        onShareRef.current?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", onKeyDown);
      forklift.dispose();
      sceneEngine.dispose();
      engineRef.current = null;
    };
  }, []);

  // dangerZones / isWeatherDangerous 변경 시 3D 마커 갱신
  useEffect(() => {
    engineRef.current?.setDangerZones(dangerZones, isWeatherDangerous);
  }, [dangerZones, isWeatherDangerous]);

  return (
    <div className="realistic-map-host">
      <div className="realistic-map-canvas-host" ref={canvasHostRef} />
      <div className="realistic-map-hud" aria-live="polite">
        <span>{cameraMode}</span>
        <span>V 시점 전환 · R 대기시간 공유 · 클릭 후 마우스 시선</span>
      </div>
      {speedWarning ? <div className="realistic-map-vignette" aria-hidden /> : null}
    </div>
  );
}
