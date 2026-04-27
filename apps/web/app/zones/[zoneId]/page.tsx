import Link from "next/link";
import { TopNav } from "@/components/top-nav";
import { elapsedText, NOW_TS, reports, waitLabel, zones } from "@/lib/mock-data";

export function generateStaticParams() {
  return zones.map((zone) => ({ zoneId: zone.id }));
}

export default async function ZoneDetailPage({
  params,
}: {
  params: Promise<{ zoneId: string }>;
}) {
  const { zoneId } = await params;
  const zone = zones.find((z) => z.id === zoneId);
  const zoneReports = reports.filter((r) => r.zoneId === zoneId).sort((a, b) => b.createdAt - a.createdAt);
  const latest = zoneReports[0];

  if (!zone) {
    return (
      <main className="page-wrap">
        <TopNav />
        <p>구역을 찾을 수 없습니다.</p>
      </main>
    );
  }

  return (
    <main className="page-wrap">
      <TopNav />
      <section className="card">
        <h1 className="section-title">{zone.name}</h1>
        <p style={{ fontSize: 34, fontWeight: 700 }}>{latest ? waitLabel(latest.waitLevel) : "정보 없음"}</p>
        <p className="muted" style={{ marginTop: 6 }}>
          마지막 업데이트: {latest ? elapsedText(latest.createdAt, NOW_TS) : "없음"}
        </p>
        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <button className="btn">차량 경로 안내</button>
          <Link href="/report/new" className="chip" style={{ height: 48 }}>
            대기시간 직접 알려주기
          </Link>
        </div>
      </section>
    </main>
  );
}
