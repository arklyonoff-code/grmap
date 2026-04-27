import { WaitLevel, WaitReport } from '../types/index';

export const WAIT_LABELS: Record<WaitLevel, string> = {
  none: '바로 진입 가능',
  under10: '10분 이내',
  under30: '30분 이내',
  over60: '1시간 이상',
};

export function getWaitLevelLabel(level: WaitLevel): string {
  return WAIT_LABELS[level];
}

export function getCongestionLevel(report: WaitReport | null): 'green' | 'yellow' | 'red' | 'unknown' {
  if (!report) return 'unknown';
  if (report.waitLevel === 'none' || report.waitLevel === 'under10') return 'green';
  if (report.waitLevel === 'under30') return 'yellow';
  return 'red';
}

export function getElapsedText(createdAt: number): string {
  const mins = Math.floor((Date.now() - createdAt) / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  return `${Math.floor(mins / 60)}시간 전`;
}

export function getElapsedMinutes(createdAt: number): number {
  return Math.floor((Date.now() - createdAt) / 60000);
}

export function isReportStale(createdAt: number): boolean {
  return Date.now() - createdAt > 30 * 60 * 1000;
}

export function buildReportExpiry(): number {
  return Date.now() + 45 * 60 * 1000;
}
