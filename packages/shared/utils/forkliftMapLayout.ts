import type { Zone } from '../types/index';
import { MOCK_ZONES } from '../constants/mock-zones';
import { projectLatLngToHyperMap } from './hyperMap';

/**
 * Converts hyperMap plane units (same as mapX/mapZ from projectLatLngToHyperMap)
 * to scene XZ used by Forklift 3D (web + mobile WebView).
 */
export const FORKLIFT_HYPER_PLANE_TO_SCENE = 48 as const;

export function hyperMapToForkliftSceneXZ(mapX: number, mapZ: number): { x: number; z: number } {
  return {
    x: mapX * FORKLIFT_HYPER_PLANE_TO_SCENE,
    z: mapZ * FORKLIFT_HYPER_PLANE_TO_SCENE,
  };
}

export function zoneLatLngToForkliftSceneXZ(lat: number, lng: number): { x: number; z: number } {
  const { mapX, mapZ } = projectLatLngToHyperMap(lat, lng);
  return hyperMapToForkliftSceneXZ(mapX, mapZ);
}

/** Box half-extents in scene units (sizes only; positions from lat/lng via zoneLatLngToForkliftSceneXZ). */
export const FORKLIFT_ZONE_BOX_BY_TYPE: Record<
  Zone['type'],
  { halfWidth: number; halfHeight: number; halfDepth: number }
> = {
  vegetable: { halfWidth: 14, halfHeight: 2, halfDepth: 10 },
  fruit: { halfWidth: 14, halfHeight: 2, halfDepth: 10 },
  fish: { halfWidth: 12, halfHeight: 2, halfDepth: 9 },
  dry: { halfWidth: 11, halfHeight: 2, halfDepth: 9 },
  general: { halfWidth: 11, halfHeight: 2, halfDepth: 9 },
};

export const FORKLIFT_ZONE_COLOR_HEX: Record<Zone['type'], string> = {
  vegetable: '#4B7BEC',
  fruit: '#F7B731',
  fish: '#2BCBBA',
  dry: '#A55EEA',
  general: '#778CA3',
};

export type ForkliftZoneLayout = Zone & {
  x: number;
  z: number;
  halfWidth: number;
  halfHeight: number;
  halfDepth: number;
  colorHex: string;
};

export function buildForkliftZoneLayouts(zones: readonly Zone[] = MOCK_ZONES): ForkliftZoneLayout[] {
  return zones.map((zone) => {
    const { x, z } = zoneLatLngToForkliftSceneXZ(zone.lat, zone.lng);
    const box = FORKLIFT_ZONE_BOX_BY_TYPE[zone.type];
    return {
      ...zone,
      x,
      z,
      halfWidth: box.halfWidth,
      halfHeight: box.halfHeight,
      halfDepth: box.halfDepth,
      colorHex: FORKLIFT_ZONE_COLOR_HEX[zone.type],
    };
  });
}
