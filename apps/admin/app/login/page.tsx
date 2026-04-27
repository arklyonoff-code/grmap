"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInAdmin } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 16 }}>
      <section className="card" style={{ width: "min(420px, 92vw)", display: "grid", gap: 10 }}>
        <h1 style={{ fontSize: 22, marginBottom: 4 }}>관리자 로그인</h1>
        <input className="input" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error ? <p style={{ color: "#e24b4a", fontSize: 14 }}>{error}</p> : null}
        <button
          className="btn"
          disabled={loading}
          onClick={() => {
            void (async () => {
              setLoading(true);
              setError("");
              try {
                const allowed = await signInAdmin(email, password);
                if (!allowed) {
                  setError("접근 권한이 없습니다");
                  setLoading(false);
                  return;
                }
                await fetch("/api/session", { method: "POST" });
                router.push("/");
              } catch {
                setError("로그인에 실패했습니다");
                setLoading(false);
              }
            })();
          }}
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </section>
    </main>
  );
}
