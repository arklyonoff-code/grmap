export const CATEGORY_LABELS = {
  free: '자유',
  info: '정보공유',
  question: '질문',
  notice: '공지',
} as const;

export const CATEGORY_COLORS = {
  free: { bg: '#F1F1F1', text: '#555555' },
  info: { bg: '#E1F5EE', text: '#0F6E56' },
  question: { bg: '#EFF6FF', text: '#185FA5' },
  notice: { bg: '#FEF9EC', text: '#92400E' },
} as const;

export const ZONE_LABELS = {
  all: '전체',
  'zone-01': '채소1동',
  'zone-02': '채소2동',
  'zone-03': '과일동',
  'zone-04': '수산동',
  'zone-05': '건어물동',
  'zone-06': '일반동',
} as const;
