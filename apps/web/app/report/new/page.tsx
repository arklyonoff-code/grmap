"use client";

import { useEffect, useState } from "react";
import { TopNav } from "@/components/top-nav";
import { zones } from "@/lib/mock-data";
import { fetchZonesFromFirebase, submitWebReport } from "@/lib/firebase";
import { Zone } from "@grmap/shared/types";

const waitOptions = [
  { label: "없음", value: "none" },
  { label: "10분↓", value: "under10" },
  { label: "30분↓", value: "under30" },
  { label: "1시간↑", value: "over60" },
] as const;

export default function NewReportPage() {
  const [zoneOptions, setZoneOptions] = useState<Zone[]>(zones);
  const [zoneId, setZoneId] = useState("");
  const [waitLevel, setWaitLevel] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  useEffect(() => {
    void fetchZonesFromFirebase().then((firebaseZones) => {
      if (firebaseZones.length) setZoneOptions(firebaseZones);
    });
  }, []);

  const disabled = !zoneId || !waitLevel || state !== "idle";

  return (
    <main className="page-wrap">
      <TopNav />
      <h1 className="section-title">제보 등록</h1>
      <section className="card" style={{ display: "grid", gap: 18 }}>
        <div>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>어느 구역이에요?</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {zoneOptions.map((zone) => (
              <button key={zone.id} className="chip" onClick={() => setZoneId(zone.id)} style={{ background: zoneId === zone.id ? "#111" : "#fff", color: zoneId === zone.id ? "#fff" : "#111" }}>
                {zone.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>지금 대기 얼마나 돼요?</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 8 }}>
            {waitOptions.map((option) => (
              <button key={option.value} className="chip" onClick={() => setWaitLevel(option.value)} style={{ justifyContent: "center", height: 52, borderRadius: 12, background: waitLevel === option.value ? "#111" : "#fff", color: waitLevel === option.value ? "#fff" : "#111" }}>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>
            차량 크기 (선택) <span className="muted" style={{ fontWeight: 400 }}>안 해도 돼요</span>
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            {["1ton", "5ton", "11ton_plus"].map((v) => (
              <button key={v} className="chip" onClick={() => setVehicle(v)} style={{ background: vehicle === v ? "#111" : "#fff", color: vehicle === v ? "#fff" : "#111" }}>
                {v === "11ton_plus" ? "11톤+" : v.replace("ton", "톤")}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>메시지 (선택, 최대 60자)</p>
          <input
            className="input"
            style={{ width: "100%" }}
            maxLength={60}
            placeholder="예: A도크 막힘, B도크 여유"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <button
          className="btn"
          style={{ height: 56, borderRadius: 16, opacity: disabled ? 0.35 : 1, background: state === "done" ? "#1d9e75" : "#111" }}
          disabled={disabled}
          onClick={() => {
            void (async () => {
              setState("loading");
              const ok = await submitWebReport({
                zoneId,
                waitLevel: waitLevel as "none" | "under10" | "under30" | "over60",
                vehicleSize:
                  vehicle === "1ton" || vehicle === "5ton" || vehicle === "11ton_plus"
                    ? vehicle
                    : null,
                message,
              });
              if (!ok) {
                setState("idle");
                return;
              }
              setState("done");
              setTimeout(() => {
                setState("idle");
                setZoneId("");
                setWaitLevel("");
                setVehicle("");
                setMessage("");
              }, 1500);
            })();
          }}
        >
          {state === "loading" ? "공유 중..." : state === "done" ? "공유 완료" : "공유하기"}
        </button>
      </section>
    </main>
  );
}
