const reports = [
  { id: "r1", zone: "채소1동", wait: "1시간 이상", vehicle: "11톤+", elapsed: "12분 전", color: "#E24B4A" },
  { id: "r2", zone: "과일동", wait: "바로 진입 가능", vehicle: "5톤", elapsed: "5분 전", color: "#1D9E75" },
  { id: "r3", zone: "수산동", wait: "30분 이내", vehicle: "1톤", elapsed: "20분 전", color: "#EF9F27" },
];

export default function FeedPage() {
  return (
    <main className="page-wrap">
      <div className="filter-row">
        <span className="filter-chip">전체</span>
        <span className="filter-chip">채소1동</span>
        <span className="filter-chip">채소2동</span>
        <span className="filter-chip">과일동</span>
        <span className="filter-chip">수산동</span>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {reports.map((item) => (
          <article key={item.id} className="feed-item">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="status-dot" style={{ background: item.color }} />
                <strong>{item.zone}</strong>
              </div>
              <span style={{ fontSize: 12, color: "#999999" }}>{item.elapsed}</span>
            </div>
            <p style={{ marginTop: 6, color: "#555555" }}>
              {item.wait} · {item.vehicle}
            </p>
          </article>
        ))}
      </div>
    </main>
  );
}
