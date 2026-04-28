export const CONGESTION_COLORS = {
  green: '#1D9E75',
  yellow: '#EF9F27',
  red: '#E24B4A',
  unknown: '#B4B2A9',
} as const;

export const TYPOGRAPHY = {
  zoneTitle: { fontSize: 20, fontWeight: 700 },
  waitValue: { fontSize: 36, fontWeight: 700 },
  dockDescription: { fontSize: 15, fontWeight: 400 },
  secondaryInfo: { fontSize: 13, color: '#999999' },
  hint: { fontSize: 11, color: '#AAAAAA' },
} as const;

export const MAP_STYLE = [
  { featureType: 'all', elementType: 'geometry', stylers: [{ saturation: -60 }] },
  { featureType: 'poi', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'all', stylers: [{ visibility: 'off' }] },
] as const;
