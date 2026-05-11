import type { ZoneWithStatus } from '../types/index';
import { WAIT_LABELS } from './report';

export const GRMAP_SHARE_URL = 'https://grmap.pages.dev';

export function buildZoneShareMessage(
  zone: ZoneWithStatus,
  options?: { shareUrl?: string }
): string {
  const level = zone.congestionLevel;
  const emoji =
    level === 'green' ? '🟢' : level === 'yellow' ? '🟡' : level === 'red' ? '🔴' : '⚪';
  const wait = zone.latestReport ? WAIT_LABELS[zone.latestReport.waitLevel] : '정보 없음';
  const time = new Date().toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return [
    `${emoji} [가락맵] ${zone.name} 현황`,
    `⏱ 대기: ${wait}`,
    `🕐 ${time} 기준`,
    `📍 ${options?.shareUrl ?? GRMAP_SHARE_URL}`,
  ].join('\n');
}
