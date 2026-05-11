import type { ZoneWithStatus } from '@grmap/shared/types';

/** 통로 좌표(Three.js: xz 평면, 카메라가 +z에서 -z 방향을 봄) */
const KNOWN_SLOTS: Record<string, { x: number; z: number }> = {
  'zone-01': { x: -1.15, z: -0.5 },
  'zone-02': { x: 1.12, z: -5 },
  'zone-03': { x: -1.05, z: -9.5 },
  'zone-04': { x: 1.18, z: -14 },
  'zone-05': { x: -1.1, z: -18.5 },
  'zone-06': { x: 1.05, z: -23 },
};

export type ZoneHyperSlot = ZoneWithStatus & { mapX: number; mapZ: number };

export function assignHyperMapSlots(zones: ZoneWithStatus[]): ZoneHyperSlot[] {
  const n = zones.length;
  return zones.map((z, i) => {
    const p = KNOWN_SLOTS[z.id];
    if (p) return { ...z, mapX: p.x, mapZ: p.z };
    const t = n <= 1 ? 0.5 : i / (n - 1);
    return {
      ...z,
      mapX: (i % 2 === 0 ? -1 : 1) * 1.1,
      mapZ: 4 - t * 28,
    };
  });
}
