import { AdminShell } from "@/components/AdminShell";

export default function UsersPage() {
  return (
    <AdminShell>
      <div style={{ display: "grid", gap: 12 }}>
        <h1 style={{ fontSize: 24 }}>계정 관리</h1>
        <div className="card">어드민 목록 + 추가(슈퍼어드민) + 삭제(자기 자신 삭제 방지) 영역</div>
      </div>
    </AdminShell>
  );
}
