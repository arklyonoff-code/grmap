import { CONGESTION_COLORS } from "@/constants/design";
import { getCongestionLevel, getElapsedText, isReportStale, WAIT_LABELS } from "@/constants/mock-data";

interface FeedReport {
  id: string;
  zoneId: string;
  waitLevel: string;
  vehicleSize?: string;
  message?: string;
  platform: "web" | "app";
  createdAt: number;
}

interface FeedZone {
  id: string;
  name: string;
}

function PlatformBadge({ platform }: { platform: "web" | "app" }) {
  return (
    <span className={`platform-badge ${platform}`}>
      {platform === "web" ? "웹" : "앱"}
    </span>
  );
}

export function FeedItem({ report, zones }: { report: FeedReport; zones: readonly FeedZone[] }) {
  const zone = zones.find((z) => z.id === report.zoneId);
  const level = getCongestionLevel(report.waitLevel);
  const stale = isReportStale(report.createdAt);

  return (
    <article className={`feed-item ${stale ? "stale" : ""}`}>
      <div className="feed-item-top">
        <div className="feed-item-zone">
          <span className="status-dot" style={{ backgroundColor: CONGESTION_COLORS[level] }} />
          <span className="feed-zone-name">{zone?.name ?? "알 수 없음"}</span>
          <PlatformBadge platform={report.platform} />
        </div>
        <span className="feed-time">{getElapsedText(report.createdAt)}</span>
      </div>
      <span className="feed-wait">
        {WAIT_LABELS[report.waitLevel] ?? "정보 없음"}
        {report.vehicleSize ? ` · ${report.vehicleSize}` : ""}
        {report.message ? ` — ${report.message}` : ""}
      </span>
    </article>
  );
}
