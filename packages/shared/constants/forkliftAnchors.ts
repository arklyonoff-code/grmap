import { zoneLatLngToForkliftSceneXZ } from '../utils/forkliftMapLayout';

export type ForkliftFloorId = 'ground' | 'b1' | 'b2';

export type ForkliftStructureAnchor = {
  id: string;
  lat: number;
  lng: number;
  halfWidth: number;
  halfHeight: number;
  halfDepth: number;
  colorHex: string;
  layers: readonly ForkliftFloorId[];
  isDanger?: boolean;
  /** Rotation around Y (radians); orientation only, not position. */
  yawRad?: number;
};

/**
 * 지하 하역장·진입로 등 — 위치는 lat/lng만 사용하고 scene XZ는 hyperMap 투영으로 계산.
 */
export const FORKLIFT_STRUCTURE_ANCHORS: readonly ForkliftStructureAnchor[] = [
  {
    id: 'cold-dock-b1',
    lat: 37.4928,
    lng: 127.1183,
    halfWidth: 30,
    halfHeight: 1.75,
    halfDepth: 20,
    colorHex: '#0984e3',
    layers: ['b1'],
  },
  {
    id: 'general-dock-b1',
    lat: 37.4932,
    lng: 127.1195,
    halfWidth: 25,
    halfHeight: 1.75,
    halfDepth: 17,
    colorHex: '#636e72',
    layers: ['b1'],
  },
  {
    id: 'ramp-a',
    lat: 37.4944,
    lng: 127.1171,
    halfWidth: 8,
    halfHeight: 1.2,
    halfDepth: 14,
    colorHex: '#636e72',
    layers: ['ground', 'b1'],
    isDanger: true,
    yawRad: 0.35,
  },
  {
    id: 'ramp-b',
    lat: 37.4913,
    lng: 127.1204,
    halfWidth: 8,
    halfHeight: 1.2,
    halfDepth: 14,
    colorHex: '#636e72',
    layers: ['ground', 'b1', 'b2'],
    isDanger: true,
    yawRad: -0.45,
  },
  {
    id: 'b2-slab',
    lat: 37.49295,
    lng: 127.119,
    halfWidth: 38,
    halfHeight: 0.6,
    halfDepth: 28,
    colorHex: '#2d3436',
    layers: ['b2'],
  },
] as const;

export type ForkliftResolvedAnchor = ForkliftStructureAnchor & { x: number; z: number };

export function resolveForkliftAnchors(): ForkliftResolvedAnchor[] {
  return FORKLIFT_STRUCTURE_ANCHORS.map((a) => {
    const { x, z } = zoneLatLngToForkliftSceneXZ(a.lat, a.lng);
    return { ...a, x, z };
  });
}
