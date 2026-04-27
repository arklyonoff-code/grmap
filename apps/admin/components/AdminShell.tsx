"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const menus = [
    { href: "/", label: "대시보드" },
    { href: "/reports", label: "제보관리" },
    { href: "/zones", label: "구역관리" },
    { href: "/users", label: "계정관리" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px minmax(0, 1fr)", minHeight: "100vh" }}>
      <aside style={{ background: "#fff", borderRight: "1px solid #eee", padding: 14, display: "grid", alignContent: "space-between" }}>
        <div style={{ display: "grid", gap: 10 }}>
          <strong>GRmap Admin</strong>
          {menus.map((menu) => (
            <Link
              key={menu.href}
              href={menu.href}
              className="chip"
              style={{
                background: pathname === menu.href ? "#111" : "transparent",
                color: pathname === menu.href ? "#fff" : "#111",
              }}
            >
              {menu.label}
            </Link>
          ))}
        </div>
        <button
          className="btn"
          onClick={async () => {
            await fetch("/api/session", { method: "DELETE" });
            router.push("/login");
          }}
        >
          로그아웃
        </button>
      </aside>
      <main style={{ padding: 16 }}>{children}</main>
    </div>
  );
}
