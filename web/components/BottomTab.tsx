"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomTab() {
  const pathname = usePathname();
  return (
    <nav className="bottom-tab">
      <Link href="/" className={`tab-link ${pathname === "/" ? "active" : ""}`}>
        지도
      </Link>
      <Link href="/feed" className={`tab-link ${pathname === "/feed" ? "active" : ""}`}>
        제보
      </Link>
    </nav>
  );
}
