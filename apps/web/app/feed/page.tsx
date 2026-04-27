"use client";

import { useEffect, useMemo, useState } from "react";
import { TopNav } from "@/components/top-nav";
import { elapsedText, NOW_TS, reports as mockReports, waitLabel, waitStatus, zones as mockZones } from "@/lib/mock-data";
import {
  fetchActiveReportsFromFirebase,
  fetchZonesFromFirebase,
  subscribeActiveReports,
} from "@/lib/firebase";
import { WaitReport, Zone } from "@grmap/shared/types";
import { isReportStale } from "@grmap/shared/utils/report";

export default function FeedPage() {
  const [reports, setReports] = useState<WaitReport[]>(mockReports);
  const [zones, setZones] = useState<Zone[]>(mockZones);

  useEffect(() => {
    void fetchZonesFromFirebase().then((firebaseZones) => {
      if (firebaseZones.length) {
        setZones(firebaseZones);
      }
    });
    void fetchActiveReportsFromFirebase().then((firebaseReports) => {
      setReports(firebaseReports);
    });
    const unsub = subscribeActiveReports((nextReports) => {
      setReports(nextReports);
    });
    return unsub;
  }, []);

  const sorted = useMemo(
    () => [...reports].sort((a, b) => b.createdAt - a.createdAt),
    [reports]
  );

  return (
    <main className="page-wrap">
      <TopNav />
      <h1 className="section-title">제보 피드</h1>
      <section className="list">
        {sorted.map((report) => {
          const zone = zones.find((z) => z.id === report.zoneId);
          const stale = isReportStale(report.createdAt);
          const status = waitStatus(report.waitLevel);
          return (
            <article key={report.id} className="list-item" style={{ opacity: stale ? 0.45 : 1 }}>
              <div className="row">
                <div className="row" style={{ justifyContent: "flex-start" }}>
                  <span className={`status-dot status-${status}`} />
                  <strong>{zone?.name ?? report.zoneId}</strong>
                </div>
                <span className="chip">{status === "clear" ? "원활" : status === "caution" ? "보통" : "혼잡"}</span>
              </div>
              <div className="row" style={{ marginTop: 6 }}>
                <span>{waitLabel(report.waitLevel)}</span>
                <span className="muted">{elapsedText(report.createdAt, NOW_TS)}</span>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
