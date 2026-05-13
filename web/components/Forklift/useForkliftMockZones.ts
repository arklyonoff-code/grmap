import { useMemo } from 'react';
import { MOCK_ZONES } from '@grmap/shared/constants/mock-zones';
import type { WaitLevel, WaitReport, ZoneWithStatus } from '@grmap/shared/types';
import { getCongestionLevel } from '@grmap/shared/utils/report';
import { MOCK_FEED } from '@/constants/mock-data';

function toWaitReport(item: (typeof MOCK_FEED)[number]): WaitReport {
  return {
    id: item.id,
    zoneId: item.zoneId,
    waitLevel: item.waitLevel as WaitLevel,
    vehicleSize: null,
    deviceId: 'web-demo',
    platform: 'web',
    status: 'active',
    createdAt: item.createdAt,
    expiresAt: item.createdAt + 45 * 60_000,
    upvotes: 0,
  };
}

/** Mock-only congestion (MOCK_FEED); Firebase reports hook는 별 PR. */
export function useForkliftMockZones(): ZoneWithStatus[] {
  return useMemo(() => {
    const reportMap = new Map<string, WaitReport>();
    MOCK_FEED.forEach((report) => {
      const prev = reportMap.get(report.zoneId);
      const next = toWaitReport(report);
      if (!prev || next.createdAt > prev.createdAt) {
        reportMap.set(report.zoneId, next);
      }
    });
    return MOCK_ZONES.map((zone) => {
      const latestReport = reportMap.get(zone.id) ?? null;
      return {
        ...zone,
        latestReport,
        congestionLevel: getCongestionLevel(latestReport),
      };
    });
  }, []);
}
