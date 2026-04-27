import Link from "next/link";

export function TopNav() {
  return (
    <nav className="top-nav">
      <Link className="chip" href="/">
        지도
      </Link>
      <Link className="chip" href="/feed">
        제보 피드
      </Link>
      <Link className="chip" href="/report/new">
        제보 등록
      </Link>
      <Link className="chip" href="http://localhost:3002/login">
        관리자
      </Link>
    </nav>
  );
}
