export type SafetySign =
  | { kind: 'height_limit'; meters: number }
  | { kind: 'speed_limit'; kmh: number }
  | { kind: 'accident_prone' }
  | { kind: 'ramp'; floorLevel: number };

export interface DangerZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description: string;
  sign: SafetySign;
  /** 하위 호환 — 신규 데이터는 sign 사용 */
  type?: 'basement_ramp' | 'narrow_passage' | 'blind_spot';
  floorLevel?: number;
}

/** 가락시장 위험 구역 — 현장 GPS 측정 후 좌표 업데이트 */
export const DANGER_ZONES: DangerZone[] = [
  {
    id: 'dz-01',
    name: '지하 1층 진입 램프',
    lat: 37.4925,
    lng: 127.1185,
    description: '비/눈 시 미끄러움 주의',
    sign: { kind: 'ramp', floorLevel: -1 },
    type: 'basement_ramp',
    floorLevel: -1,
  },
  {
    id: 'dz-02',
    name: '지하 2층 진입 램프',
    lat: 37.4922,
    lng: 127.1182,
    description: '경사 급함, 속도 감속 필수',
    sign: { kind: 'ramp', floorLevel: -2 },
    type: 'basement_ramp',
    floorLevel: -2,
  },
  {
    id: 'dz-03',
    name: '제한높이 3.2M 구간',
    lat: 37.4931,
    lng: 127.1188,
    description: '천장 낮음 — 적재 높이 확인',
    sign: { kind: 'height_limit', meters: 3.2 },
  },
  {
    id: 'dz-04',
    name: '제한속도 10km/h',
    lat: 37.4928,
    lng: 127.1191,
    description: '통로 내 서행',
    sign: { kind: 'speed_limit', kmh: 10 },
  },
  {
    id: 'dz-05',
    name: '사고다발구역',
    lat: 37.493,
    lng: 127.1193,
    description: '교차·후진 주의',
    sign: { kind: 'accident_prone' },
  },
];
