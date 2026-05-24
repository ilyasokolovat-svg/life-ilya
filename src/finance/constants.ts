export const COLORS = {
  etfs: '#534AB7',
  crypto: '#EF9F27',
  cash: '#1D9E75',
  debt: '#E24B4A',
  positive: '#1D9E75',
  carLoan: '#EF9F27',
  muted: '#94a3b8',
  grid: '#e2e8f0',
} as const;

export const BUCKET_COLOR_BY_NAME = (label: string): string => {
  const l = label.toLowerCase();
  if (l.includes('crypto')) return COLORS.crypto;
  if (l.includes('etf') || l.includes('stock')) return COLORS.etfs;
  if (l.includes('cash')) return COLORS.cash;
  return COLORS.muted;
};

export const AED_TO_USD = 0.272;

export const GOAL_COLOR_PRESETS = [
  '#534AB7', // purple
  '#1D9E75', // teal
  '#EF9F27', // amber
  '#E24B4A', // red
  '#2563eb', // blue
  '#64748b', // slate
];

export const BIRTH_YEAR = 1994;
