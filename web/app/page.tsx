import { CONGESTION_COLORS } from "@/constants/design";
import { getCongestionLevel, MOCK_FEED, MOCK_ZONES } from "@/constants/mock-data";

export default function Home() {
  const reportByZone = new Map<string, (typeof MOCK_FEED)[number]>();
  for (const report of MOCK_FEED) {
    const prev = reportByZone.get(report.zoneId);
    if (!prev || report.createdAt > prev.createdAt) {
      reportByZone.set(report.zoneId, report);
    }
  }

  return (
    <main className="map-page">
      <section className="map-container" aria-label="가락시장 지도 영역">
        <div className="top-overlay">
          <div className="top-pill">GRmap</div>
        </div>

        <div className="bottom-overlay">
          <button className="primary-cta">대기시간 공유하기</button>
        </div>

        {MOCK_ZONES.map((zone) => {
          const report = reportByZone.get(zone.id);
          const level = getCongestionLevel(report?.waitLevel ?? "unknown");
          return (
            <div
              key={zone.id}
              className="marker"
              style={{
                top: zone.top,
                left: zone.left,
                backgroundColor: CONGESTION_COLORS[level],
              }}
            >
              {zone.shortName}
            </div>
          );
        })}
      </section>
    </main>
  );
}
