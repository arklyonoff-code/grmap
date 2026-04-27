import { WaitReport, Zone } from "@grmap/shared/types";

export const NOW_TS = Date.now();

export const zones: Zone[] = [
  { id: "zone-01", name: "채소1동", shortName: "채소1", type: "vegetable", lat: 37.4935, lng: 127.1185, dockDescription: "정문 좌측 A~D 도크, 1번 게이트 진입" },
  { id: "zone-02", name: "채소2동", shortName: "채소2", type: "vegetable", lat: 37.4942, lng: 127.1196, dockDescription: "2번 게이트 직진 후 우회전, E~H 도크" },
  { id: "zone-03", name: "과일동", shortName: "과일", type: "fruit", lat: 37.492, lng: 127.12, dockDescription: "동측 입구, 1~8번 도크" },
  { id: "zone-04", name: "수산동", shortName: "수산", type: "fish", lat: 37.491, lng: 127.1178, dockDescription: "서문 진입 후 좌측, 냉동 하역장" },
  { id: "zone-05", name: "건어물동", shortName: "건어물", type: "dry", lat: 37.4916, lng: 127.121, dockDescription: "남측 소형 게이트, 5톤 이하 권장" },
  { id: "zone-06", name: "일반동", shortName: "일반", type: "general", lat: 37.495, lng: 127.1174, dockDescription: "북문 진입, 서/동측 하역장 구분" },
];

export const reports: WaitReport[] = [
  { id: "r-001", zoneId: "zone-01", waitLevel: "over60", vehicleSize: "11ton_plus", message: undefined, deviceId: "web-mock-1", platform: "web", status: "active", createdAt: NOW_TS - 12 * 60000, expiresAt: NOW_TS + 30 * 60000, upvotes: 2 },
  { id: "r-002", zoneId: "zone-03", waitLevel: "none", vehicleSize: "5ton", message: undefined, deviceId: "app-mock-2", platform: "app", status: "active", createdAt: NOW_TS - 5 * 60000, expiresAt: NOW_TS + 40 * 60000, upvotes: 1 },
  { id: "r-003", zoneId: "zone-04", waitLevel: "under30", vehicleSize: "1ton", message: "B도크 빠름", deviceId: "web-mock-3", platform: "web", status: "active", createdAt: NOW_TS - 20 * 60000, expiresAt: NOW_TS + 20 * 60000, upvotes: 0 },
  { id: "r-004", zoneId: "zone-06", waitLevel: "over60", vehicleSize: null, message: undefined, deviceId: "app-mock-4", platform: "app", status: "active", createdAt: NOW_TS - 38 * 60000, expiresAt: NOW_TS + 7 * 60000, upvotes: 0 },
];

export function waitLabel(level: WaitReport["waitLevel"]): string {
  if (level === "none") return "바로 진입";
  if (level === "under10") return "10분 이내";
  if (level === "under30") return "30분 이내";
  return "1시간 이상";
}

export function waitStatus(level: WaitReport["waitLevel"]): "clear" | "caution" | "congested" {
  if (level === "none" || level === "under10") return "clear";
  if (level === "under30") return "caution";
  return "congested";
}

export function elapsedText(createdAt: number, nowTs = NOW_TS): string {
  const mins = Math.floor((nowTs - createdAt) / 60000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  return `${Math.floor(mins / 60)}시간 전`;
}
