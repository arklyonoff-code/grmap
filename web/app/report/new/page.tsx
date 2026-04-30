 "use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { get, ref } from "firebase/database";
import { MOCK_ZONES } from "@grmap/shared/constants/mock-zones";
import type { VehicleSize, WaitLevel, Zone } from "@grmap/shared/types";
import { rtdb } from "@/lib/firebase";
import { submitWaitReport } from "@/services/waitReport";

const WAIT_OPTIONS: Array<{ label: string; value: WaitLevel }> = [
  { label: "없음", value: "none" },
  { label: "10분↓", value: "under10" },
  { label: "30분↓", value: "under30" },
  { label: "1시간↑", value: "over60" },
];

const VEHICLE_OPTIONS: Array<{ label: string; value: VehicleSize | null }> = [
  { label: "선택안함", value: null },
  { label: "1톤", value: "1ton" },
  { label: "5톤", value: "5ton" },
  { label: "11톤+", value: "11ton_plus" },
];

export default function ReportPage() {
  const router = useRouter();
  const [zones, setZones] = useState<Zone[]>(MOCK_ZONES);
  const [zoneId, setZoneId] = useState<string>(MOCK_ZONES[0]?.id ?? "");
  const [waitLevel, setWaitLevel] = useState<WaitLevel | null>(null);
  const [vehicleSize, setVehicleSize] = useState<VehicleSize | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!rtdb) return;
    get(ref(rtdb, "/zones"))
      .then((snap) => {
        const loaded = Object.entries(snap.val() ?? {}).map(([id, value]) => ({
          id,
          ...(value as Omit<Zone, "id">),
        }));
        if (loaded.length) {
          setZones(loaded);
          setZoneId((prev) => prev || loaded[0].id);
        }
      })
      .catch(() => undefined);
  }, []);

  const canSubmit = useMemo(() => Boolean(zoneId && waitLevel && !submitting), [zoneId, waitLevel, submitting]);

  return (
    <main className="page-wrap">
      <section className="card" style={{ display: "grid", gap: 14 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>대기시간 공유</h1>

        <div style={{ display: "grid", gap: 8 }}>
          <p style={{ fontWeight: 600 }}>어느 구역이에요?</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {zones.map((zone) => (
              <button
                key={zone.id}
                className="filter-chip"
                type="button"
                style={zone.id === zoneId ? { background: "#111", color: "#fff", borderColor: "#111" } : undefined}
                onClick={() => setZoneId(zone.id)}
              >
                {zone.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <p style={{ fontWeight: 600 }}>지금 대기 얼마나 돼요?</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 8 }}>
            {WAIT_OPTIONS.map((item) => (
              <button
                key={item.value}
                className="filter-chip"
                type="button"
                onClick={() => setWaitLevel(item.value)}
                style={{
                  justifyContent: "center",
                  minHeight: 52,
                  borderRadius: 12,
                  ...(waitLevel === item.value ? { background: "#111", color: "#fff", borderColor: "#111" } : {}),
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <p style={{ fontWeight: 600 }}>차량 크기 (선택)</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {VEHICLE_OPTIONS.map((item) => (
              <button
                key={item.label}
                className="filter-chip"
                type="button"
                style={
                  item.value === vehicleSize ? { background: "#111", color: "#fff", borderColor: "#111" } : undefined
                }
                onClick={() => setVehicleSize(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          disabled={!canSubmit}
          onClick={async () => {
            if (!zoneId || !waitLevel || submitting) return;
            try {
              setSubmitting(true);
              await submitWaitReport(zoneId, waitLevel, vehicleSize);
              alert("공유 완료! 오늘 미션 +2🪙 적립");
              router.push("/mission");
            } catch (error) {
              alert(error instanceof Error ? error.message : "공유에 실패했습니다.");
            } finally {
              setSubmitting(false);
            }
          }}
          style={{
            width: "100%",
            height: 56,
            border: "none",
            borderRadius: 16,
            background: "#111111",
            color: "#ffffff",
            fontSize: 16,
            fontWeight: 600,
            opacity: canSubmit ? 1 : 0.4,
          }}
        >
          {submitting ? "등록 중..." : "공유하기"}
        </button>
      </section>
    </main>
  );
}
