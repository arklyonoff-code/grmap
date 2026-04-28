"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { CATEGORY_LABELS, ZONE_LABELS } from "@grmap/shared/constants/board";
import type { PostCategory } from "@grmap/shared/types";
import { generateRandomNickname } from "@grmap/shared/utils/nickname";
import { createPost } from "@/services/board";
import { sha256 } from "@/utils/hash";

const CATEGORIES: PostCategory[] = ["free", "info", "question", "wanted", "selling", "price"];

export default function BoardWritePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState(() => {
    if (typeof window === "undefined") return generateRandomNickname();
    return localStorage.getItem("grmap_nickname") || generateRandomNickname();
  });
  const [password, setPassword] = useState("");
  const [category, setCategory] = useState<PostCategory>("free");
  const [zoneTag, setZoneTag] = useState<keyof typeof ZONE_LABELS>("all");
  const [title, setTitle] = useState("");
  const [priceItem, setPriceItem] = useState("");
  const [priceValue, setPriceValue] = useState<number | "">("");
  const [priceUnit, setPriceUnit] = useState("원/kg");
  const [submitting, setSubmitting] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, Link, Image],
    content: "",
    editorProps: {
      attributes: {
        class: "tiptap-editor",
      },
    },
  });

  const zoneOptions = useMemo(
    () => Object.entries(ZONE_LABELS).map(([key, label]) => ({ key, label })),
    []
  );

  const handleNicknameChange = (value: string) => {
    setNickname(value);
    localStorage.setItem("grmap_nickname", value);
  };

  const handleRandomNickname = () => {
    const newNick = generateRandomNickname();
    setNickname(newNick);
    localStorage.setItem("grmap_nickname", newNick);
  };

  const onSubmit = async () => {
    const content = editor?.getHTML().trim() ?? "";
    if (!nickname.trim() || !password.trim() || !title.trim() || !content || content === "<p></p>") {
      alert("닉네임, 비밀번호, 제목, 내용을 모두 입력해주세요.");
      return;
    }

    try {
      setSubmitting(true);
      const passwordHash = await sha256(password.trim());
      await createPost({
        title: title.trim(),
        content,
        nickname: nickname.trim(),
        passwordHash,
        category,
        zoneTag,
        deviceId: "",
        priceItem: category === "price" ? priceItem || undefined : undefined,
        priceValue: category === "price" && priceValue !== "" ? Number(priceValue) : undefined,
        priceUnit: category === "price" ? priceUnit : undefined,
      });
      router.push("/board");
    } catch (error) {
      alert(error instanceof Error ? error.message : "등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="board-page">
      <div className="board-container write">
        <p style={{ fontSize: 13, color: "#999", marginBottom: 4 }}>
          닉네임과 비밀번호는 글 삭제 시 필요합니다.
        </p>

        <div className="inline-fields">
          <div className="nickname-wrap">
            <input
              value={nickname}
              onChange={(e) => handleNicknameChange(e.target.value)}
              placeholder="엉뚱한찰떡926"
              maxLength={20}
            />
            <button type="button" onClick={handleRandomNickname} aria-label="랜덤 닉네임">
              ↻
            </button>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호(삭제할 때 필요해요)"
            maxLength={20}
          />
        </div>

        <select value={category} onChange={(e) => setCategory(e.target.value as PostCategory)} className="board-select">
          {CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {CATEGORY_LABELS[item]}
            </option>
          ))}
        </select>
        {["wanted", "selling"].includes(category) && (
          <p style={{ fontSize: 12, color: "#E24B4A", marginTop: -4 }}>
            ⚡ 급구·급매 게시글은 목록 상단에 노출됩니다.
          </p>
        )}

        <label className="board-label">구역 태그</label>
        <div className="chip-row">
          {zoneOptions.map((option) => (
            <button
              key={option.key}
              className={`chip ${zoneTag === option.key ? "selected" : ""}`}
              onClick={() => setZoneTag(option.key as keyof typeof ZONE_LABELS)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <input
          className="board-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="오늘의 식사 메뉴 추천"
          maxLength={100}
        />
        {category === "price" && (
          <div style={{ display: "flex", gap: 8, marginTop: -4 }}>
            <input
              placeholder="품목명 (예: 배추, 고추)"
              value={priceItem}
              onChange={(e) => setPriceItem(e.target.value)}
              maxLength={20}
              className="board-input"
              style={{ flex: 2 }}
            />
            <input
              type="number"
              placeholder="가격"
              value={priceValue}
              onChange={(e) => setPriceValue(e.target.value ? Number(e.target.value) : "")}
              className="board-input"
              style={{ flex: 1 }}
            />
            <select
              value={priceUnit}
              onChange={(e) => setPriceUnit(e.target.value)}
              className="board-select"
              style={{ flex: 1 }}
            >
              <option value="원/kg">원/kg</option>
              <option value="원/박스">원/박스</option>
              <option value="원/망">원/망</option>
              <option value="원/개">원/개</option>
            </select>
          </div>
        )}

        <div className="editor-toolbar">
          <button onClick={() => editor?.chain().focus().toggleBold().run()}>Bold</button>
          <button onClick={() => editor?.chain().focus().toggleItalic().run()}>Italic</button>
          <button onClick={() => editor?.chain().focus().toggleStrike().run()}>Strike</button>
          <button onClick={() => editor?.chain().focus().toggleBulletList().run()}>BulletList</button>
          <button onClick={() => editor?.chain().focus().toggleOrderedList().run()}>OrderedList</button>
          <button
            onClick={() => {
              const url = prompt("링크 URL 입력");
              if (url) editor?.chain().focus().setLink({ href: url }).run();
            }}
          >
            Link
          </button>
          <button
            onClick={() => {
              const url = prompt("이미지 URL 입력");
              if (url) editor?.chain().focus().setImage({ src: url }).run();
            }}
          >
            Image
          </button>
        </div>

        <EditorContent editor={editor} />

        <button className="submit-btn" onClick={onSubmit} disabled={submitting}>
          {submitting ? "등록 중..." : "등록"}
        </button>
      </div>
    </main>
  );
}
