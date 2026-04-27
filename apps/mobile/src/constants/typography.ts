export const Typography = {
  display: { fontSize: 36, fontWeight: '700', letterSpacing: -1 },
  heading: { fontSize: 20, fontWeight: '600', letterSpacing: -0.5 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  caption: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  micro: { fontSize: 11, fontWeight: '400', lineHeight: 16 },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export const TouchTarget = {
  minHeight: 48,
  minWidth: 48,
} as const;
