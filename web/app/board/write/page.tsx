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

const CATEGORIES: PostCategory[] = ["free", "info", "question"];

export default function BoardWritePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState(generateRandomNickname());
  const [password, setPassword] = useState("");
  const [category, setCategory] = useState<PostCategory>("free");
  const [zoneTag, setZoneTag] = useState<keyof typeof ZONE_LABELS>("all");
  const [title, setTitle] = useState("");
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
        <section className="guest-banner">
          <p>비회원 작성 모드 (회원 작성 가능)</p>
          <div>
            <button disabled>로그인</button>
            <button disabled>회원가입</button>
          </div>
        </section>

        <div className="inline-fields">
          <div className="nickname-wrap">
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="엉뚱한찰떡926"
              maxLength={20}
            />
            <button type="button" onClick={() => setNickname(generateRandomNickname())} aria-label="랜덤 닉네임">
              ↻
            </button>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="삭제할 때 필요해요"
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
          placeholder="오늘의 가성비 메뉴 추천"
          maxLength={100}
        />

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
