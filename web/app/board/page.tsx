"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { get, ref } from "firebase/database";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { CATEGORY_COLORS, CATEGORY_LABELS, URGENT_CATEGORIES, ZONE_LABELS } from "@grmap/shared/constants/board";
import type { BoardPost, PostCategory, WaitReport, Zone } from "@grmap/shared/types";
import { getCongestionLevel, getElapsedText, getWaitLevelLabel } from "@grmap/shared/utils/report";
import { fetchPostsPage, getMarketSignal, subscribePosts } from "@/services/board";
import { rtdb } from "@/lib/firebase";

const CATEGORY_FILTERS: Array<{ key: "all" | PostCategory; label: string }> = [
  { key: "all", label: "전체" },
  { key: "free", label: CATEGORY_LABELS.free },
  { key: "info", label: CATEGORY_LABELS.info },
  { key: "question", label: CATEGORY_LABELS.question },
  { key: "notice", label: CATEGORY_LABELS.notice },
  { key: "wanted", label: "⚡ 급구" },
  { key: "selling", label: "⚡ 급매" },
  { key: "price", label: CATEGORY_LABELS.price },
];

const ZONE_FILTERS = Object.entries(ZONE_LABELS).map(([key, label]) => ({ key, label }));

export default function BoardListPage() {
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [olderPosts, setOlderPosts] = useState<BoardPost[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [reports, setReports] = useState<WaitReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<"all" | PostCategory>("all");
  const [zoneTag, setZoneTag] = useState<string>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    setOlderPosts([]);
    setCursor(null);
    setHasMore(true);
    fetchPostsPage(category === "all" ? undefined : category, zoneTag)
      .then(({ cursor: nextCursor, posts: firstPage }) => {
        setCursor(nextCursor);
        setHasMore(firstPage.length >= 20);
      })
      .catch(() => undefined);
    const unsubscribe = subscribePosts(
      (nextPosts) => {
        setPosts(nextPosts);
        setLoading(false);
      },
      category === "all" ? undefined : category,
      zoneTag
    );
    return unsubscribe;
  }, [category, zoneTag]);

  useEffect(() => {
    if (!rtdb) {
      setZones([]);
      setReports([]);
      return;
    }
    Promise.all([get(ref(rtdb, "/zones")), get(ref(rtdb, "/wait_reports"))]).then(([zoneSnap, reportSnap]) => {
      const loadedZones = Object.entries(zoneSnap.val() ?? {}).map(([id, value]) => ({
        id,
        ...(value as Omit<Zone, "id">),
      }));
      const now = Date.now();
      const loadedReports = Object.entries(reportSnap.val() ?? {})
        .map(([id, value]) => ({ id, ...(value as Omit<WaitReport, "id">) }))
        .filter((item) => item.status !== "hidden" && item.expiresAt > now)
        .sort((a, b) => b.createdAt - a.createdAt);
      setZones(loadedZones);
      setReports(loadedReports);
    });
  }, [rtdb]);

  const merged = useMemo(() => {
    const byId = new Map<string, BoardPost>();
    [...posts, ...olderPosts].forEach((item) => byId.set(item.id, item));
    return sortPosts(Array.from(byId.values()));
  }, [posts, olderPosts]);
  const marketSignal = useMemo(() => getMarketSignal(posts), [posts]);

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(merged.length / pageSize));
  const pagePosts = merged.slice((page - 1) * pageSize, page * pageSize);
  const pricePosts = pagePosts.filter((post) => post.category === "price");
  const normalPosts = pagePosts.filter((post) => post.category !== "price");

  return (
    <main className="board-page">
      <div className="board-container">
        <ZoneStatusBar reports={reports} zones={zones} />
        <div className="board-filters">
          <div className="chip-row">
            {CATEGORY_FILTERS.map((item) => (
              <button
                key={item.key}
                className={`chip ${category === item.key ? "selected" : ""}`}
                onClick={() => {
                  setCategory(item.key);
                  setPage(1);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="chip-row">
            {ZONE_FILTERS.map((item) => (
              <button
                key={item.key}
                className={`chip ${zoneTag === item.key ? "selected" : ""}`}
                onClick={() => {
                  setZoneTag(item.key);
                  setPage(1);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <MarketSignalSection signalPosts={marketSignal} />

        <section className="board-list">
          {loading ? (
            <div className="board-empty">불러오는 중...</div>
          ) : category === "price" ? (
            <PriceListView posts={pricePosts} />
          ) : normalPosts.length ? (
            normalPosts.map((post) => <PostListItem key={post.id} post={post} />)
          ) : (
            <div className="board-empty">게시글이 없습니다.</div>
          )}
        </section>

        <div className="board-pagination">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            이전
          </button>
          {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((num) => (
            <button
              key={num}
              className={page === num ? "active" : ""}
              onClick={() => setPage(num)}
            >
              {num}
            </button>
          ))}
          <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            다음
          </button>
          <button
            disabled={!hasMore || loadingMore}
            onClick={async () => {
              if (!cursor || loadingMore) return;
              setLoadingMore(true);
              try {
                const { posts: next, cursor: nextCursor } = await fetchPostsPage(
                  category === "all" ? undefined : category,
                  zoneTag,
                  cursor
                );
                setOlderPosts((prev) => [...prev, ...next]);
                setCursor(nextCursor);
                setHasMore(next.length >= 20);
              } finally {
                setLoadingMore(false);
              }
            }}
          >
            {loadingMore ? "불러오는 중..." : hasMore ? "더보기" : "끝"}
          </button>
        </div>
      </div>

      <Link href="/board/write" className="board-write-fab" aria-label="글쓰기">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
        </svg>
      </Link>
    </main>
  );
}

function sortPosts(allPosts: BoardPost[]) {
  const notices = allPosts.filter((p) => p.category === "notice").sort((a, b) => b.createdAt - a.createdAt);
  const urgent = allPosts
    .filter((p) => URGENT_CATEGORIES.includes(p.category as (typeof URGENT_CATEGORIES)[number]) && p.status !== "done")
    .sort((a, b) => b.createdAt - a.createdAt);
  const done = allPosts.filter((p) => p.status === "done").sort((a, b) => b.createdAt - a.createdAt);
  const rest = allPosts
    .filter((p) => p.category !== "notice" && !URGENT_CATEGORIES.includes(p.category as (typeof URGENT_CATEGORIES)[number]) && p.status === "active")
    .sort((a, b) => b.createdAt - a.createdAt);
  return [...notices, ...urgent, ...rest, ...done];
}

function ZoneStatusBar({ reports, zones }: { reports: WaitReport[]; zones: Zone[] }) {
  if (!zones.length) return null;
  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "12px 16px", borderBottom: "0.5px solid #EEEEEE", scrollbarWidth: "none" }}>
      {zones.map((zone) => {
        const report = reports.find((item) => item.zoneId === zone.id) ?? null;
        const level = getCongestionLevel(report);
        const color = { green: "#1D9E75", yellow: "#EF9F27", red: "#E24B4A", unknown: "#B4B2A9" }[level];
        return (
          <div key={zone.id} style={{ flexShrink: 0, padding: "8px 12px", border: "0.5px solid #EEEEEE", borderRadius: 10, minWidth: 80, textAlign: "center" }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: color, margin: "0 auto 4px" }} />
            <div style={{ fontSize: 12, fontWeight: 500 }}>{zone.shortName}</div>
            <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>
              {report ? getWaitLevelLabel(report.waitLevel) : "정보없음"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MarketSignalSection({ signalPosts }: { signalPosts: BoardPost[] }) {
  if (!signalPosts.length) return null;
  return (
    <div style={{ padding: "12px 16px", borderBottom: "0.5px solid #EEEEEE" }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: "#E24B4A", letterSpacing: 0.5, marginBottom: 8 }}>
        MARKET SIGNAL
      </div>
      {signalPosts.map((post) => (
        <a key={post.id} href={`/board/detail?id=${post.id}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", textDecoration: "none" }}>
          <span style={{ fontSize: 11, color: "#E24B4A", fontWeight: 700, width: 16 }}>🔥</span>
          <span style={{ fontSize: 14, color: "#111", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {post.title}
          </span>
          <span style={{ fontSize: 12, color: "#aaa", flexShrink: 0 }}>♥{post.likeCount ?? post.likes ?? 0}</span>
        </a>
      ))}
    </div>
  );
}

function PostListItem({ post }: { post: BoardPost }) {
  const isDone = post.status === "done";
  const isUrgent = URGENT_CATEGORIES.includes(post.category as (typeof URGENT_CATEGORIES)[number]);
  const catColor = CATEGORY_COLORS[post.category];

  return (
    <a href={`/board/detail?id=${post.id}`} style={{ display: "block", padding: "14px 16px", borderBottom: "0.5px solid #EEEEEE", opacity: isDone ? 0.45 : 1, textDecoration: "none" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
        <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 99, background: catColor.bg, color: catColor.text, fontWeight: 500 }}>
          {isUrgent ? "⚡" : ""}{CATEGORY_LABELS[post.category]}
        </span>
        {post.zoneTag !== "all" && (
          <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 99, background: "#F1F1F1", color: "#555" }}>
            {ZONE_LABELS[post.zoneTag as keyof typeof ZONE_LABELS]}
          </span>
        )}
        {isDone && (
          <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 99, background: "#E5E7EB", color: "#6B7280" }}>
            거래완료
          </span>
        )}
        <span style={{ fontSize: 11, color: "#aaa", marginLeft: "auto" }}>{getElapsedText(post.createdAt)}</span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 500, color: "#111", textDecoration: isDone ? "line-through" : "none", marginBottom: 4 }}>
        {post.title}
        {post.category === "price" && post.priceValue && (
          <span style={{ fontSize: 13, color: "#1D9E75", marginLeft: 8 }}>
            {post.priceValue.toLocaleString()}원/{post.priceUnit}
          </span>
        )}
      </div>
      <div style={{ fontSize: 12, color: "#aaa" }}>
        {post.nickname} · 💬{post.commentCount} · ♥{post.likeCount ?? post.likes ?? 0}
      </div>
    </a>
  );
}

function PriceListView({ posts }: { posts: BoardPost[] }) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px 80px", padding: "8px 16px", background: "#F8F8F8", fontSize: 12, color: "#999", fontWeight: 500, borderBottom: "0.5px solid #EEEEEE" }}>
        <span>품목</span>
        <span>구역</span>
        <span style={{ textAlign: "right" }}>가격</span>
        <span style={{ textAlign: "right" }}>시각</span>
      </div>

      {posts.map((post) => {
        const diff = post.priceYesterday && post.priceValue ? post.priceValue - post.priceYesterday : null;
        return (
          <a key={post.id} href={`/board/detail?id=${post.id}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px 80px", padding: "12px 16px", borderBottom: "0.5px solid #EEEEEE", alignItems: "center", textDecoration: "none", color: "inherit" }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{post.priceItem || post.title}</span>
            <span style={{ fontSize: 13, color: "#555" }}>{ZONE_LABELS[post.zoneTag as keyof typeof ZONE_LABELS] || "전체"}</span>
            <span style={{ fontSize: 14, textAlign: "right", fontWeight: 500, color: "#111" }}>
              {post.priceValue?.toLocaleString()}
              <span style={{ fontSize: 11, color: "#aaa" }}>{post.priceUnit}</span>
            </span>
            <div style={{ textAlign: "right" }}>
              {diff !== null && (
                <span style={{ fontSize: 12, color: diff > 0 ? "#E24B4A" : diff < 0 ? "#1D9E75" : "#aaa" }}>
                  {diff > 0 ? "▲" : diff < 0 ? "▼" : "-"}
                  {Math.abs(diff).toLocaleString()}
                </span>
              )}
              <div style={{ fontSize: 11, color: "#aaa" }}>{getElapsedText(post.createdAt)}</div>
            </div>
          </a>
        );
      })}

      {posts.length === 0 && (
        <div style={{ padding: 40, textAlign: "center", color: "#aaa", fontSize: 14 }}>
          오늘 등록된 시세 정보가 없어요
        </div>
      )}
    </div>
  );
}
