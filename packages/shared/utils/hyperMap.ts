import type { ZoneWithStatus } from '../types/index';

/** 가락시장 중심 — 슬롯은 위·경도를 통로 평면(xz)에 투영 */
export const GARAK_MAP_CENTER = { lat: 37.4929, lng: 127.119 };

const MAP_X_SCALE = 920;
const MAP_Z_SCALE = -1050;

export type ZoneHyperSlot = ZoneWithStatus & { mapX: number; mapZ: number };

export function assignHyperMapSlots(zones: ZoneWithStatus[]): ZoneHyperSlot[] {
  return zones.map((z) => ({
    ...z,
    mapX: (z.lng - GARAK_MAP_CENTER.lng) * MAP_X_SCALE,
    mapZ: (z.lat - GARAK_MAP_CENTER.lat) * MAP_Z_SCALE,
  }));
}
