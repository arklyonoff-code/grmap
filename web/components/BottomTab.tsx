"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomTab() {
  const pathname = usePathname();

  const isBoard = pathname.startsWith("/board");

  return (
    <nav className="bottom-tab">
      <Link href="/" className={`tab-link ${pathname === "/" ? "active" : ""}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="1 6 8 3 16 6 23 3 23 18 16 21 8 18 1 21 1 6" />
          <line x1="8" y1="3" x2="8" y2="18" />
          <line x1="16" y1="6" x2="16" y2="21" />
        </svg>
        지도
      </Link>
      <Link href="/feed" className={`tab-link ${pathname === "/feed" ? "active" : ""}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        제보
      </Link>
      <Link href="/board" className={`tab-link ${isBoard ? "active" : ""}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        게시판
      </Link>
    </nav>
  );
}
