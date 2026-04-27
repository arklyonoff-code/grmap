"use client";

import { useState } from "react";
import { WaitLevel, VehicleSize, Zone } from "@grmap/shared/types";
import { submitWebReport } from "@/lib/firebase";

const waitOptions: { label: string; value: WaitLevel }[] = [
  { label: "바로 진입", value: "none" },
  { label: "10분 이내", value: "under10" },
  { label: "30분 이내", value: "under30" },
  { label: "1시간 이상", value: "over60" },
];

export function ReportForm({
  zone,
  onClose,
}: {
  zone: Zone;
  onClose: () => void;
}) {
  const [waitLevel, setWaitLevel] = useState<WaitLevel | null>(null);
  const [vehicleSize, setVehicleSize] = useState<VehicleSize | null>(null);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  const disabled = !waitLevel || state !== "idle";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "grid",
        placeItems: "center",
        zIndex: 20,
      }}
    >
      <div className="card" style={{ width: "min(560px, 92vw)", display: "grid", gap: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>{zone.name} 제보하기</h2>
        <div style={{ display: "grid", gap: 8 }}>
          <p style={{ fontWeight: 600 }}>대기시간 (필수)</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 8 }}>
            {waitOptions.map((option) => (
              <button
                key={option.value}
                className="chip"
                onClick={() => setWaitLevel(option.value)}
                style={{
                  height: 44,
                  justifyContent: "center",
                  background: waitLevel === option.value ? "#111" : "#fff",
                  color: waitLevel === option.value ? "#fff" : "#111",
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          <p style={{ fontWeight: 600 }}>차량 크기 (선택)</p>
          <div style={{ display: "flex", gap: 8 }}>
            {(["1ton", "5ton", "11ton_plus"] as const).map((v) => (
              <button
                key={v}
                className="chip"
                onClick={() => setVehicleSize(v)}
                style={{
                  background: vehicleSize === v ? "#111" : "#fff",
                  color: vehicleSize === v ? "#fff" : "#111",
                }}
              >
                {v === "11ton_plus" ? "11톤+" : v.replace("ton", "톤")}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          <p style={{ fontWeight: 600 }}>메시지 (선택)</p>
          <input
            className="input"
            placeholder="예: A도크 막힘, B도크 여유"
            maxLength={60}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="chip" onClick={onClose}>
            닫기
          </button>
          <button
            className="btn"
            disabled={disabled}
            style={{ opacity: disabled ? 0.35 : 1, background: state === "done" ? "#1D9E75" : "#111" }}
            onClick={() => {
              if (!waitLevel) return;
              void (async () => {
                setState("loading");
                await submitWebReport({ zoneId: zone.id, waitLevel, vehicleSize, message });
                setState("done");
                setTimeout(onClose, 1500);
              })();
            }}
          >
            {state === "loading" ? "공유 중..." : state === "done" ? "공유 완료" : "제보 공유하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
