export function MapLegend() {
  return (
    <div
      style={{
        position: "absolute",
        left: 16,
        bottom: 16,
        background: "#fff",
        border: "1px solid #eee",
        borderRadius: 12,
        padding: "10px 12px",
        display: "grid",
        gap: 6,
        zIndex: 3,
      }}
    >
      <LegendItem color="#1D9E75" label="원활" />
      <LegendItem color="#EF9F27" label="보통" />
      <LegendItem color="#E24B4A" label="혼잡" />
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: 10, height: 10, borderRadius: 10, background: color }} />
      <span style={{ fontSize: 12 }}>{label}</span>
    </div>
  );
}
