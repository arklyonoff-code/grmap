"use client";

import { useEffect, useRef } from "react";
import type { DangerZone } from "@grmap/shared/constants/dangerZones";
import type { ZoneWithStatus } from "@grmap/shared/types";
import { assignHyperMapSlots, projectLatLngToHyperMap } from "@grmap/shared/utils/hyperMap";
import { createHyperMapEngine, type HyperMapEngine } from "./hyperMapEngine";

type Props = {
  zones: ZoneWithStatus[];
  selectedZoneId: string | null;
  onZoneTap: (zoneId: string) => void;
  dangerZones?: DangerZone[];
  isWeatherDangerous?: boolean;
};

export function HyperMap3D({
  zones,
  selectedZoneId,
  onZoneTap,
  dangerZones = [],
  isWeatherDangerous = false,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<HyperMapEngine | null>(null);
  const onZoneTapRef = useRef(onZoneTap);
  onZoneTapRef.current = onZoneTap;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const engine = createHyperMapEngine(host, (zoneId) => onZoneTapRef.current(zoneId));
    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const danger = dangerZones.map((dz) => {
      const { mapX, mapZ } = projectLatLngToHyperMap(dz.lat, dz.lng);
      return {
        id: dz.id,
        name: dz.name,
        description: dz.description,
        floorLevel:
          dz.floorLevel ?? (dz.sign.kind === 'ramp' ? dz.sign.floorLevel : 0),
        mapX,
        mapZ,
      };
    });
    engineRef.current?.setZones(assignHyperMapSlots(zones), selectedZoneId, danger, isWeatherDangerous);
  }, [zones, selectedZoneId, dangerZones, isWeatherDangerous]);

  return <div ref={hostRef} className="hyper-map-host" aria-hidden />;
}
