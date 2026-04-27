export type WaitLevel = 'none' | 'under10' | 'under30' | 'over60';
export type VehicleSize = '1ton' | '5ton' | '11ton_plus';
export type Platform = 'web' | 'app';
export type ReportStatus = 'active' | 'hidden' | 'expired';

export interface Zone {
  id: string;
  name: string;
  shortName: string;
  type: 'vegetable' | 'fruit' | 'fish' | 'dry' | 'general';
  lat: number;
  lng: number;
  dockDescription: string;
  entryNote?: string;
}

export interface WaitReport {
  id: string;
  zoneId: string;
  waitLevel: WaitLevel;
  vehicleSize: VehicleSize | null;
  message?: string;
  deviceId: string;
  platform: Platform;
  status: ReportStatus;
  createdAt: number;
  expiresAt: number;
  upvotes: number;
}

export interface AdminUser {
  uid: string;
  email: string;
  role: 'superadmin' | 'moderator';
  createdAt: number;
}

export interface ZoneWithStatus extends Zone {
  latestReport: WaitReport | null;
  congestionLevel: 'green' | 'yellow' | 'red' | 'unknown';
}
