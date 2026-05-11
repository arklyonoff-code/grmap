"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { MOCK_ZONES } from "@grmap/shared/constants/mock-zones";
import type { WaitLevel, WaitReport, ZoneWithStatus } from "@grmap/shared/types";
import { getCongestionLevel } from "@grmap/shared/utils/report";
import { MOCK_FEED } from "@/constants/mock-data";
import { BestZoneBanner } from "@/components/Map/BestZoneBanner";
import { ZoneDetailSheet } from "@/components/Map/ZoneDetailSheet";
import { WeatherWarningBanner } from "@/components/Map/WeatherWarningBanner";
import { getCurrentWeather, type WeatherInfo } from "@/services/weather";

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
  const [weather, setWeather] = useState<WeatherInfo>({
    status: "unknown",
    description: "",
    isDangerous: false,
  });

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      void getCurrentWeather().then((next) => {
        if (!cancelled) setWeather(next);
      });
    };
    refresh();
    const interval = setInterval(refresh, 15 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

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
          <WeatherWarningBanner weather={weather} />
          <BestZoneBanner zones={zonesWithStatus} onPress={(zone) => setSelectedZoneId(zone.id)} />
        </div>

        {selectedZone ? (
          <ZoneDetailSheet zone={selectedZone} onClose={() => setSelectedZoneId(null)} />
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
