export default function ReportPage() {
  return (
    <main className="page-wrap">
      <section className="card" style={{ display: "grid", gap: 14 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>대기시간 공유</h1>

        <div style={{ display: "grid", gap: 8 }}>
          <p style={{ fontWeight: 600 }}>어느 구역이에요?</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["채소1동", "채소2동", "과일동", "수산동", "건어물동", "일반동"].map((name) => (
              <button key={name} className="filter-chip" type="button">
                {name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <p style={{ fontWeight: 600 }}>지금 대기 얼마나 돼요?</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 8 }}>
            {["없음", "10분↓", "30분↓", "1시간↑"].map((label) => (
              <button
                key={label}
                className="filter-chip"
                type="button"
                style={{ justifyContent: "center", minHeight: 52, borderRadius: 12 }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          style={{
            width: "100%",
            height: 56,
            border: "none",
            borderRadius: 16,
            background: "#111111",
            color: "#ffffff",
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          공유하기
        </button>
      </section>
    </main>
  );
}
