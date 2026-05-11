"use client";

import { useEffect, useRef } from "react";
import type { ZoneWithStatus } from "@grmap/shared/types";
import { assignHyperMapSlots } from "@grmap/shared/utils/hyperMap";
import { createHyperMapEngine, type HyperMapEngine } from "./hyperMapEngine";

type Props = {
  zones: ZoneWithStatus[];
  selectedZoneId: string | null;
  onZoneTap: (zoneId: string) => void;
};

export function HyperMap3D({ zones, selectedZoneId, onZoneTap }: Props) {
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
    engineRef.current?.setZones(assignHyperMapSlots(zones), selectedZoneId);
  }, [zones, selectedZoneId]);

  return <div ref={hostRef} className="hyper-map-host" aria-hidden />;
}
