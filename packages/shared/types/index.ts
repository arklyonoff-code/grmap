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

export type PostCategory =
  | 'free'
  | 'info'
  | 'question'
  | 'notice'
  | 'wanted'
  | 'selling'
  | 'price';
export type PostStatus = 'active' | 'hidden' | 'done';
export type BoardPostType = 'info' | 'demand' | 'supply' | 'price_signal' | 'closed';

export interface BoardPost {
  id: string;
  title: string;
  content: string;
  nickname: string;
  passwordHash: string;
  type: BoardPostType;
  category: PostCategory;
  zoneTag: string;
  deviceId: string;
  viewCount: number;
  likeCount: number;
  likes?: number;
  commentCount: number;
  createdAt: number;
  status: PostStatus;
  priceItem?: string;
  priceValue?: number;
  priceUnit?: string;
  priceYesterday?: number;
}

export interface BoardComment {
  id: string;
  postId: string;
  content: string;
  nickname: string;
  passwordHash: string;
  deviceId: string;
  createdAt: number;
  status: PostStatus;
}

export interface MissionStamp {
  deviceId: string;
  totalStamps: number;
  lastCheckinDate: string;
  consecutiveDays: number;
  weeklyStamps: number;
  badges: string[];
  nickname: string;
  weekKey?: string;
}

export interface TodayMissions {
  checkin: boolean;
  waittime: boolean;
  price: boolean;
  date: string;
}
