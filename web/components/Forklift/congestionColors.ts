import type { ZoneWithStatus } from '@grmap/shared/types';

/** Forklift 3D sphere / panel — matches product palette (globals + design tokens). */
export const FORKLIFT_CONGESTION_HEX: Record<ZoneWithStatus['congestionLevel'], string> = {
  green: '#1D9E75',
  yellow: '#EF9F27',
  red: '#E24B4A',
  unknown: '#B4B2A9',
};
