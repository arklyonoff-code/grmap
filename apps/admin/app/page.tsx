import { AdminShell } from "@/components/AdminShell";

export default function DashboardPage() {
  return (
    <AdminShell>
      <div style={{ display: "grid", gap: 16 }}>
        <h1 style={{ fontSize: 24 }}>대시보드</h1>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12 }}>
          <article className="card"><p>오늘 제보</p><strong style={{ fontSize: 28 }}>247건</strong></article>
          <article className="card"><p>활성 제보</p><strong style={{ fontSize: 28 }}>38건</strong></article>
          <article className="card"><p>웹 제보</p><strong style={{ fontSize: 28 }}>61%</strong></article>
          <article className="card"><p>앱 제보</p><strong style={{ fontSize: 28 }}>39%</strong></article>
        </div>
      </div>
    </AdminShell>
  );
}
