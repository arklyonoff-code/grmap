"use client";

import dynamic from "next/dynamic";
import { MOCK_FEED, MOCK_ZONES } from "@/constants/mock-data";

const MapCanvas = dynamic(() => import("@/components/Map/MapCanvas").then((m) => m.MapCanvas), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="map-page">
      <section className="map-container" aria-label="가락시장 지도 영역">
        <MapCanvas zones={MOCK_ZONES} reports={MOCK_FEED} />

        <div className="top-overlay">
          <div className="top-pill">GRmap</div>
        </div>

        <div className="bottom-overlay">
          <button className="primary-cta">대기시간 공유하기</button>
        </div>
      </section>
    </main>
  );
}
