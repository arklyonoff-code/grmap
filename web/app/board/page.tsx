"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CATEGORY_COLORS, CATEGORY_LABELS, ZONE_LABELS } from "@grmap/shared/constants/board";
import type { BoardPost, PostCategory } from "@grmap/shared/types";
import { getElapsedText } from "@/constants/mock-data";
import { fetchPosts } from "@/services/board";

const CATEGORY_FILTERS: Array<{ key: "all" | PostCategory; label: string }> = [
  { key: "all", label: "전체" },
  { key: "free", label: CATEGORY_LABELS.free },
  { key: "info", label: CATEGORY_LABELS.info },
  { key: "question", label: CATEGORY_LABELS.question },
  { key: "notice", label: CATEGORY_LABELS.notice },
];

const ZONE_FILTERS = Object.entries(ZONE_LABELS).map(([key, label]) => ({ key, label }));

export default function BoardListPage() {
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<"all" | PostCategory>("all");
  const [zoneTag, setZoneTag] = useState<string>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetchPosts(category === "all" ? undefined : category, zoneTag, undefined)
      .then(setPosts)
      .finally(() => setLoading(false));
  }, [category, zoneTag]);

  const notices = useMemo(() => posts.filter((post) => post.category === "notice"), [posts]);
  const normalPosts = useMemo(() => posts.filter((post) => post.category !== "notice"), [posts]);
  const merged = useMemo(() => [...notices, ...normalPosts], [notices, normalPosts]);

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(merged.length / pageSize));
  const pagePosts = merged.slice((page - 1) * pageSize, page * pageSize);

  return (
    <main className="board-page">
      <div className="board-container">
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

        <section className="board-list">
          {loading ? (
            <div className="board-empty">불러오는 중...</div>
          ) : pagePosts.length ? (
            pagePosts.map((post) => (
              <Link key={post.id} href={`/board/detail?id=${post.id}`} className={`board-item ${post.category === "notice" ? "notice" : ""}`}>
                <div className="board-item-top">
                  <div className="badge-wrap">
                    <span
                      className="category-badge"
                      style={{
                        backgroundColor: CATEGORY_COLORS[post.category].bg,
                        color: CATEGORY_COLORS[post.category].text,
                      }}
                    >
                      {CATEGORY_LABELS[post.category]}
                    </span>
                    <span className="zone-badge">{ZONE_LABELS[post.zoneTag as keyof typeof ZONE_LABELS] ?? "전체"}</span>
                  </div>
                  <span className="elapsed">{getElapsedText(post.createdAt)}</span>
                </div>
                <p className="board-title">{post.title}</p>
                <p className="board-meta">
                  {post.nickname} &nbsp; 💬 {post.commentCount} &nbsp; ♥ {post.likes}
                </p>
              </Link>
            ))
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
