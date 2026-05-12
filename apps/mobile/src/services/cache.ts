import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WaitReport, Zone } from '@grmap/shared/types';

const CACHE_KEYS = {
  zones: 'cache_zones',
  reports: 'cache_reports',
  timestamp: 'cache_timestamp',
};

const CACHE_MAX_AGE_MS = 60 * 60 * 1000;

export async function saveToCache(zones: Zone[], reports: WaitReport[]): Promise<void> {
  await AsyncStorage.multiSet([
    [CACHE_KEYS.zones, JSON.stringify(zones)],
    [CACHE_KEYS.reports, JSON.stringify(reports)],
    [CACHE_KEYS.timestamp, String(Date.now())],
  ]);
}

export async function loadFromCache(): Promise<{
  zones: Zone[];
  reports: WaitReport[];
  cachedAt: number | null;
  isStale: boolean;
} | null> {
  const results = await AsyncStorage.multiGet([
    CACHE_KEYS.zones,
    CACHE_KEYS.reports,
    CACHE_KEYS.timestamp,
  ]);
  const zonesStr = results[0][1];
  const reportsStr = results[1][1];
  const tsStr = results[2][1];
  if (!zonesStr || !reportsStr) return null;

  const cachedAt = tsStr ? parseInt(tsStr, 10) : null;
  const isStale = cachedAt ? Date.now() - cachedAt > CACHE_MAX_AGE_MS : true;

  return {
    zones: JSON.parse(zonesStr) as Zone[],
    reports: JSON.parse(reportsStr) as WaitReport[],
    cachedAt,
    isStale,
  };
}
