import { push, ref, serverTimestamp } from "firebase/database";
import type { VehicleSize, WaitLevel } from "@grmap/shared/types";
import { rtdb } from "@/lib/firebase";
import { completeMission, getOrCreateDeviceId } from "@/services/mission";

export async function submitWaitReport(
  zoneId: string,
  waitLevel: WaitLevel,
  vehicleSize: VehicleSize | null
): Promise<void> {
  if (!rtdb) {
    throw new Error("Realtime Database가 설정되지 않아 대기시간 공유를 저장할 수 없습니다.");
  }

  const deviceId = getOrCreateDeviceId();
  const now = Date.now();
  const expiresAt = now + 45 * 60 * 1000;

  await push(ref(rtdb, "/wait_reports"), {
    zoneId,
    waitLevel,
    vehicleSize,
    message: null,
    deviceId,
    platform: "web",
    status: "active",
    createdAt: now,
    createdAtServer: serverTimestamp(),
    expiresAt,
    upvotes: 0,
  });

  const nickname = localStorage.getItem("grmap_nickname") || "익명";
  await completeMission("waittime", deviceId, nickname, 2);
}
