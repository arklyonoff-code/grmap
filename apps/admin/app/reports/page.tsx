import { AdminShell } from "@/components/AdminShell";

export default function ReportsPage() {
  return (
    <AdminShell>
      <div style={{ display: "grid", gap: 12 }}>
        <h1 style={{ fontSize: 24 }}>제보 관리</h1>
        <div className="card">필터 바: 구역 / 플랫폼(전체·웹·앱) / 상태(활성·숨김·만료)</div>
        <div className="card">제보 테이블 + 숨기기/복원 + 50건 페이지네이션 + 일괄숨기기 영역</div>
      </div>
    </AdminShell>
  );
}
