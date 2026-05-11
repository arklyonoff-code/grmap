"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { MOCK_ZONES } from "@grmap/shared/constants/mock-zones";
import type { WaitLevel, WaitReport, ZoneWithStatus } from "@grmap/shared/types";
import { getCongestionLevel } from "@grmap/shared/utils/report";
import { MOCK_FEED } from "@/constants/mock-data";
import { BestZoneBanner } from "@/components/Map/BestZoneBanner";

const HyperMap3D = dynamic(
  () => import("@/components/Map/HyperMap3D").then((m) => m.HyperMap3D),
  { ssr: false }
);

function toWaitReport(item: (typeof MOCK_FEED)[number]): WaitReport {
  return {
    id: item.id,
    zoneId: item.zoneId,
    waitLevel: item.waitLevel as WaitLevel,
    vehicleSize: null,
    deviceId: "web-demo",
    platform: "web",
    status: "active",
    createdAt: item.createdAt,
    expiresAt: item.createdAt + 45 * 60_000,
    upvotes: 0,
  };
}

export default function Home() {
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  const zonesWithStatus = useMemo<ZoneWithStatus[]>(() => {
    const reportMap = new Map<string, WaitReport>();
    MOCK_FEED.forEach((report) => {
      const prev = reportMap.get(report.zoneId);
      const next = toWaitReport(report);
      if (!prev || next.createdAt > prev.createdAt) {
        reportMap.set(report.zoneId, next);
      }
    });
    return MOCK_ZONES.map((zone) => {
      const latestReport = reportMap.get(zone.id) ?? null;
      return {
        ...zone,
        latestReport,
        congestionLevel: getCongestionLevel(latestReport),
      };
    });
  }, []);

  const selectedZone = zonesWithStatus.find((z) => z.id === selectedZoneId) ?? null;

  return (
    <main className="map-page">
      <section className="map-container" aria-label="가락시장 상하차 3D 맵">
        <HyperMap3D
          zones={zonesWithStatus}
          selectedZoneId={selectedZoneId}
          onZoneTap={setSelectedZoneId}
        />

        <div className="top-overlay">
          <div className="top-pill">GRmap</div>
          <BestZoneBanner zones={zonesWithStatus} onPress={(zone) => setSelectedZoneId(zone.id)} />
        </div>

        {selectedZone ? (
          <div className="zone-sheet" role="dialog" aria-label={`${selectedZone.name} 상세`}>
            <div className="zone-sheet__header">
              <h2>{selectedZone.name}</h2>
              <button type="button" className="zone-sheet__close" onClick={() => setSelectedZoneId(null)}>
                닫기
              </button>
            </div>
            <p className="zone-sheet__desc">{selectedZone.dockDescription}</p>
            {selectedZone.entryNote ? <p className="zone-sheet__note">{selectedZone.entryNote}</p> : null}
          </div>
        ) : null}

        <div className="bottom-overlay">
          <button type="button" className="primary-cta">
            대기시간 공유하기
          </button>
        </div>
      </section>
    </main>
  );
}
