export const BADGES = {
  first_checkin: { label: '첫 출근', emoji: '🎉', condition: '첫 체크인' },
  three_days: { label: '3일 연속', emoji: '🔥', condition: '3일 연속 체크인' },
  seven_days: { label: '일주일 개근', emoji: '⭐', condition: '7일 연속 체크인' },
  thirty_days: { label: '한달 개근', emoji: '👑', condition: '30일 연속 체크인' },
  mission_master: { label: '미션 마스터', emoji: '🏆', condition: '미션 100회 완료' },
} as const;

export type BadgeKey = keyof typeof BADGES;
