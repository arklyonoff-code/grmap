import { CONGESTION_COLORS } from './design';

export const MOCK_ZONES = [
  { id: 'zone-01', name: '채소1동', shortName: '채소1', lat: 37.4935, lng: 127.1185 },
  { id: 'zone-02', name: '채소2동', shortName: '채소2', lat: 37.4942, lng: 127.1196 },
  { id: 'zone-03', name: '과일동', shortName: '과일', lat: 37.492, lng: 127.12 },
  { id: 'zone-04', name: '수산동', shortName: '수산', lat: 37.491, lng: 127.1178 },
  { id: 'zone-05', name: '건어물동', shortName: '건어물', lat: 37.4916, lng: 127.121 },
  { id: 'zone-06', name: '일반동', shortName: '일반', lat: 37.495, lng: 127.1174 },
] as const;

export const MOCK_FEED = [
  {
    id: 'r1',
    zoneId: 'zone-01',
    waitLevel: 'over60',
    vehicleSize: '11톤+',
    platform: 'app',
    createdAt: Date.now() - 12 * 60_000,
  },
  {
    id: 'r2',
    zoneId: 'zone-03',
    waitLevel: 'none',
    vehicleSize: '5톤',
    platform: 'web',
    createdAt: Date.now() - 5 * 60_000,
  },
  {
    id: 'r3',
    zoneId: 'zone-04',
    waitLevel: 'under30',
    vehicleSize: '1톤',
    platform: 'app',
    createdAt: Date.now() - 20 * 60_000,
  },
  {
    id: 'r4',
    zoneId: 'zone-06',
    waitLevel: 'over60',
    vehicleSize: undefined,
    platform: 'web',
    createdAt: Date.now() - 38 * 60_000,
  },
] as const;

export const WAIT_LABELS: Record<string, string> = {
  none: '바로 진입 가능',
  under10: '10분 이내',
  under30: '30분 이내',
  over60: '1시간 이상',
};

export function getCongestionLevel(waitLevel: string) {
  if (waitLevel === 'none' || waitLevel === 'under10') return 'green';
  if (waitLevel === 'under30') return 'yellow';
  if (waitLevel === 'over60') return 'red';
  return 'unknown';
}

export function getCongestionColor(waitLevel: string) {
  const level = getCongestionLevel(waitLevel);
  return CONGESTION_COLORS[level];
}

export function getElapsedText(createdAt: number) {
  const mins = Math.floor((Date.now() - createdAt) / 60_000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  return `${Math.floor(mins / 60)}시간 전`;
}

export function isReportStale(createdAt: number) {
  return Date.now() - createdAt >= 30 * 60_000;
}
