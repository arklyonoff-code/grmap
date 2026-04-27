"use client";

import { WaitReport, Zone } from "@grmap/shared/types";
import { getElapsedText, getWaitLevelLabel, isReportStale } from "@grmap/shared/utils/report";

export function ZoneDetailSheet({
  zone,
  reports,
  onClose,
  onOpenReport,
}: {
  zone: Zone;
  reports: WaitReport[];
  onClose: () => void;
  onOpenReport: () => void;
}) {
  const latest = reports[0] ?? null;
  const level =
    !latest ? "정보 없음" : getWaitLevelLabel(latest.waitLevel);
  const levelColor =
    !latest ? "#999" : latest.waitLevel === "under30" ? "#EF9F27" : latest.waitLevel === "over60" ? "#E24B4A" : "#1D9E75";

  return (
    <aside
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: 360,
        height: "100%",
        background: "#fff",
        borderLeft: "1px solid #eee",
        zIndex: 8,
        padding: 16,
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
      }}
    >
      <div>
        <button className="chip" onClick={onClose}>닫기</button>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>{zone.name}</h2>
        <p style={{ fontSize: 48, fontWeight: 700, color: levelColor, lineHeight: 1.1 }}>{level}</p>
        <p style={{ fontSize: 11, color: "#999", marginTop: 6 }}>
          마지막 업데이트: {latest ? getElapsedText(latest.createdAt) : "없음"}
        </p>
      </div>
      <div style={{ overflow: "auto", marginTop: 12 }}>
        <hr style={{ border: 0, borderTop: "1px solid #eee", margin: "10px 0" }} />
        <p style={{ fontSize: 15 }}>{zone.dockDescription}</p>
        {zone.entryNote ? <p style={{ fontSize: 13, color: "#555", marginTop: 6 }}>{zone.entryNote}</p> : null}
        <hr style={{ border: 0, borderTop: "1px solid #eee", margin: "10px 0" }} />
        <div style={{ display: "grid", gap: 8 }}>
          {reports.slice(0, 3).map((report) => (
            <article key={report.id} className="card" style={{ padding: 10, opacity: isReportStale(report.createdAt) ? 0.45 : 1 }}>
              <div className="row">
                <span className="chip">{report.platform === "web" ? "웹" : "앱"}</span>
                <span className="muted" style={{ fontSize: 11 }}>{getElapsedText(report.createdAt)}</span>
              </div>
              <p style={{ marginTop: 6, fontSize: 14 }}>
                {getWaitLevelLabel(report.waitLevel)} · {report.vehicleSize ?? "미선택"}
              </p>
              {report.message ? <p style={{ marginTop: 4, fontSize: 13, color: "#555" }}>{report.message}</p> : null}
            </article>
          ))}
        </div>
      </div>
      <button className="btn" style={{ width: "100%" }} onClick={onOpenReport}>
        이 구역 제보하기
      </button>
    </aside>
  );
}
