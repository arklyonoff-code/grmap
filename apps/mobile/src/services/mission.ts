import AsyncStorage from '@react-native-async-storage/async-storage';
import { get, ref, update } from 'firebase/database';
import { BADGES, type BadgeKey } from '@grmap/shared/constants/mission';
import type { MissionStamp, TodayMissions } from '@grmap/shared/types';
import { rtdb } from './firebase';

type MissionType = 'checkin' | 'waittime' | 'price';

const GARAK_LAT = 37.4929;
const GARAK_LNG = 127.119;
const RADIUS_M = 1000;

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function weekKeyFromDate(date = new Date()) {
  const start = new Date(date);
  const day = (start.getDay() + 6) % 7;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - day);
  return start.toISOString().split('T')[0];
}

function getYesterday(dateText: string) {
  const yesterday = new Date(`${dateText}T00:00:00`);
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

function getDistanceM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toMissionStamp(deviceId: string, raw: unknown): MissionStamp {
  const item = (raw ?? {}) as Partial<MissionStamp>;
  return {
    deviceId,
    totalStamps: Number(item.totalStamps ?? 0),
    lastCheckinDate: String(item.lastCheckinDate ?? ''),
    consecutiveDays: Number(item.consecutiveDays ?? 0),
    weeklyStamps: Number(item.weeklyStamps ?? 0),
    badges: Array.isArray(item.badges) ? item.badges.map(String) : [],
    nickname: String(item.nickname ?? '익명'),
    weekKey: typeof item.weekKey === 'string' ? item.weekKey : undefined,
  };
}

function applyBadges(baseBadges: string[], nextConsecutiveDays: number, nextTotalStamps: number): string[] {
  const set = new Set<string>(baseBadges);
  set.add('first_checkin');
  if (nextConsecutiveDays >= 3) set.add('three_days');
  if (nextConsecutiveDays >= 7) set.add('seven_days');
  if (nextConsecutiveDays >= 30) set.add('thirty_days');
  if (nextTotalStamps >= 100) set.add('mission_master');
  return Object.keys(BADGES).filter((key) => set.has(key as BadgeKey));
}

export async function getOrCreateMissionDeviceId(): Promise<string> {
  const key = 'grmap_device_id';
  const existing = await AsyncStorage.getItem(key);
  if (existing) return existing;
  const created = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(key, created);
  return created;
}

export async function loadTodayMissions(): Promise<TodayMissions> {
  const saved = await AsyncStorage.getItem('grmap_today_missions');
  const date = await AsyncStorage.getItem('grmap_mission_date');
  if (!saved || date !== todayStr()) {
    const fresh: TodayMissions = { checkin: false, waittime: false, price: false, date: todayStr() };
    await AsyncStorage.setItem('grmap_today_missions', JSON.stringify(fresh));
    await AsyncStorage.setItem('grmap_mission_date', fresh.date);
    return fresh;
  }
  return JSON.parse(saved) as TodayMissions;
}

async function saveTodayMissions(missions: TodayMissions) {
  await AsyncStorage.setItem('grmap_today_missions', JSON.stringify(missions));
  await AsyncStorage.setItem('grmap_mission_date', missions.date);
}

async function saveLocalProgress(totalStamps: number, consecutiveDays: number, badges: string[]) {
  await AsyncStorage.setItem('grmap_total_stamps', String(totalStamps));
  await AsyncStorage.setItem('grmap_consecutive_days', String(consecutiveDays));
  await AsyncStorage.setItem('grmap_badges', JSON.stringify(badges));
}

async function loadLocalProgress() {
  return {
    totalStamps: Number((await AsyncStorage.getItem('grmap_total_stamps')) ?? '0'),
    consecutiveDays: Number((await AsyncStorage.getItem('grmap_consecutive_days')) ?? '0'),
    badges: JSON.parse((await AsyncStorage.getItem('grmap_badges')) ?? '[]') as string[],
  };
}

export async function fetchMyMissionStamp(deviceId: string): Promise<MissionStamp> {
  const local = await loadLocalProgress();
  const snap = await get(ref(rtdb, `mission_stamps/${deviceId}`));
  if (!snap.exists()) {
    return {
      deviceId,
      totalStamps: local.totalStamps,
      lastCheckinDate: '',
      consecutiveDays: local.consecutiveDays,
      weeklyStamps: 0,
      badges: local.badges,
      nickname: '익명',
    };
  }
  const stamp = toMissionStamp(deviceId, snap.val());
  await saveLocalProgress(stamp.totalStamps, stamp.consecutiveDays, stamp.badges);
  return stamp;
}

export async function completeMission(
  type: MissionType,
  deviceId: string,
  nickname: string,
  reward: number
): Promise<boolean> {
  const missions = await loadTodayMissions();
  if (missions[type]) return false;
  missions[type] = true;
  await saveTodayMissions(missions);

  const stampRef = ref(rtdb, `mission_stamps/${deviceId}`);
  const snap = await get(stampRef);
  const current = toMissionStamp(deviceId, snap.val());

  const currentWeekKey = weekKeyFromDate();
  const normalizedWeekly = current.weekKey === currentWeekKey ? current.weeklyStamps : 0;
  const nextTotalStamps = current.totalStamps + reward;
  const updates: Partial<MissionStamp> = {
    totalStamps: nextTotalStamps,
    weeklyStamps: normalizedWeekly + reward,
    nickname,
    weekKey: currentWeekKey,
  };

  if (type === 'checkin') {
    const yesterday = getYesterday(todayStr());
    const isConsecutive = current.lastCheckinDate === yesterday;
    const nextConsecutiveDays = isConsecutive ? current.consecutiveDays + 1 : 1;
    updates.consecutiveDays = nextConsecutiveDays;
    updates.lastCheckinDate = todayStr();
    updates.badges = applyBadges(current.badges, nextConsecutiveDays, nextTotalStamps);
  } else if (nextTotalStamps >= 100 && !current.badges.includes('mission_master')) {
    updates.badges = [...current.badges, 'mission_master'];
  }

  await update(stampRef, updates);
  await saveLocalProgress(
    Number(updates.totalStamps ?? current.totalStamps),
    Number(updates.consecutiveDays ?? current.consecutiveDays),
    (updates.badges as string[] | undefined) ?? current.badges
  );
  return true;
}

export async function handleCheckinApp(
  lat: number,
  lng: number,
  deviceId: string,
  nickname: string
): Promise<{ success: boolean; message: string }> {
  const dist = getDistanceM(lat, lng, GARAK_LAT, GARAK_LNG);
  if (dist > RADIUS_M) {
    return {
      success: false,
      message: `가락시장 근처에서만 가능해요.\n현재 ${Math.round(dist)}m 거리`,
    };
  }
  await completeMission('checkin', deviceId, nickname, 3);
  return { success: true, message: '현장 인증 완료! +3🪙 스탬프 적립' };
}

export async function fetchWeeklyRanking(): Promise<MissionStamp[]> {
  const snap = await get(ref(rtdb, 'mission_stamps'));
  if (!snap.exists()) return [];
  const all: MissionStamp[] = [];
  snap.forEach((child) => {
    all.push(toMissionStamp(child.key ?? '', child.val()));
  });
  const currentWeek = weekKeyFromDate();
  return all
    .map((item) => ({
      ...item,
      weeklyStamps: item.weekKey === currentWeek ? item.weeklyStamps : 0,
    }))
    .sort((a, b) => b.weeklyStamps - a.weeklyStamps)
    .slice(0, 10);
}
