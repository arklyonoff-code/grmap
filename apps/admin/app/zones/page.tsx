import { AdminShell } from "@/components/AdminShell";

export default function ZonesPage() {
  return (
    <AdminShell>
      <div style={{ display: "grid", gap: 12 }}>
        <h1 style={{ fontSize: 24 }}>구역 관리</h1>
        <div className="card">구역 카드 목록 + dockDescription/entryNote 인라인 편집 저장 영역</div>
      </div>
    </AdminShell>
  );
}
