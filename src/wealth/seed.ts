// Historical seed data for Ilya
export const SEED_ACCOUNTS = [
  { label: 'Cash & Yield', type: 'cash' as const, liquid: true, is_estimated: false, color: '#60a5fa', sort_order: 0 },
  { label: 'ETFs & Stocks', type: 'investments' as const, liquid: true, is_estimated: false, color: '#4ade80', sort_order: 1 },
  { label: 'Crypto', type: 'investments' as const, liquid: true, is_estimated: true, color: '#fbbf24', sort_order: 2 },
  { label: 'Car Loan', type: 'debt' as const, liquid: false, is_estimated: false, color: '#f87171', sort_order: 3 },
  { label: 'Credit Card', type: 'debt' as const, liquid: true, is_estimated: false, color: '#fb923c', sort_order: 4 },
];

export const SEED_BUCKETS = [
  { label: 'Global ETFs & Stocks', description: 'IBKR, Trading 212, eToro — combined', color: '#4ade80', sort_order: 0 },
  { label: 'Crypto', description: 'All platforms: Binance, OKX, Bybit, KuCoin, MM, Gate, MEXC, Bitget', color: '#fbbf24', sort_order: 1 },
  { label: 'Cash in brokers', description: 'Uninvested cash across platforms', color: '#60a5fa', sort_order: 2 },
];

// [month, total, crypto, stocks_etfs, cash]
export const SEED_INVESTMENTS: [string, number, number, number, number][] = [
  ['2021-01', 10240, 4096, 6144, 0], ['2021-05', 18077, 7231, 10846, 0],
  ['2021-08', 24008, 9603, 14405, 0], ['2021-09', 25600, 10240, 15360, 0],
  ['2021-10', 18816, 7526, 11290, 0], ['2021-11', 20211, 8084, 12127, 0],
  ['2021-12', 18669, 7468, 11201, 0], ['2022-01', 12867, 5147, 7720, 0],
  ['2022-02', 17540, 7016, 10524, 0], ['2022-03', 21617, 8647, 12970, 0],
  ['2022-04', 12979, 5192, 7787, 0], ['2022-05', 13572, 5429, 8143, 0],
  ['2022-08', 28713, 11485, 17228, 0], ['2022-09', 26884, 10754, 16130, 0],
  ['2022-11', 23160, 9264, 13896, 0], ['2023-01', 27756, 11102, 16654, 0],
  ['2023-02', 28709, 11484, 17225, 0], ['2023-03', 28271, 11308, 16963, 0],
  ['2023-04', 29842, 11937, 17905, 0], ['2023-09', 28951, 9028, 19923, 0],
  ['2023-10', 60388, 21500, 38888, 0], ['2023-11', 64554, 23738, 40816, 0],
  ['2024-01', 56603, 17000, 39603, 0], ['2024-02', 61869, 20000, 41869, 0],
  ['2024-04', 64384, 22000, 42384, 0], ['2024-07', 49293, 28720, 19430, 1143],
  ['2024-08', 45464, 25836, 18500, 1128], ['2024-11', 46768, 31385, 15383, 0],
  ['2024-12', 63435, 46435, 17000, 0], ['2025-02', 45977, 33477, 12500, 0],
  ['2025-03', 39019, 29214, 9805, 0], ['2025-06', 41004, 25354, 10750, 4900],
  ['2025-08', 49911, 32583, 11407, 5921], ['2025-09', 53003, 33452, 13122, 6429],
  ['2025-11', 54867, 33445, 13687, 7735], ['2025-12', 54873, 31646, 14368, 8859],
  ['2026-05', 59498, 25896, 21230, 12172],
];

// Net worth snapshots: [month, cash, investments, crypto, car_loan, credit_card]
export const SEED_NW: [string, number, number, number, number, number][] = [
  ['2023-12', 5000, 24166, 9028, -66000, -500],
  ['2024-12', 8000, 17000, 46435, -66000, -2000],
  ['2025-12', 8000, 14368, 31646, -64000, -1000],
  ['2026-01', 20000, 23777, 10200, -66000, -10600],
  ['2026-05', 0, 33602, 25896, -62818, -14488],
];

export const SEED_BUDGET_CATS = [
  { label: 'Accommodation', budget: 2000, color: '#60a5fa', sort_order: 0 },
  { label: 'Food & Dining', budget: 1300, color: '#4ade80', sort_order: 1 },
  { label: 'Travel', budget: 600, color: '#a78bfa', sort_order: 2 },
  { label: 'Entertainment', budget: 400, color: '#fbbf24', sort_order: 3 },
  { label: 'Transport', budget: 650, color: '#34d399', sort_order: 4 },
  { label: 'Investments', budget: 3450, color: '#60a5fa', sort_order: 5 },
  { label: 'Health & Sport', budget: 220, color: '#f472b6', sort_order: 6 },
  { label: 'Presents & Gifts', budget: 360, color: '#fb923c', sort_order: 7 },
  { label: 'Clothes', budget: 290, color: '#818cf8', sort_order: 8 },
  { label: 'Other', budget: 520, color: '#888784', sort_order: 9 },
];

export const SEED_BUDGET_MONTHS: { month: string; salary: number; extra: { description: string; amount: number; type: 'bonus' | 'other' } }[] = [
  { month: '2023-12', salary: 7329, extra: { description: 'Commission', amount: 3653, type: 'other' } },
  { month: '2024-12', salary: 6050, extra: { description: 'Commission', amount: 342, type: 'other' } },
  { month: '2025-12', salary: 9583, extra: { description: 'Commission', amount: 5625, type: 'bonus' } },
];

export const SEED_GOALS = [
  { name: 'Financial Independence', target_amount: 550000, target_date: '2030-12', color: '#4ade80', priority: 1, allocation_pct: 45 },
  { name: '2026 Net Worth Target', target_amount: 111000, target_date: '2026-12', color: '#60a5fa', priority: 2, allocation_pct: 30 },
  { name: 'Emergency Fund', target_amount: 15000, target_date: '2026-06', color: '#fbbf24', priority: 3, allocation_pct: 15 },
  { name: 'Debt Free (Car Loan)', target_amount: 62818, target_date: '2028-06', color: '#f87171', priority: 4, allocation_pct: 10 },
];

export const SEED_SETTINGS = {
  currency: '$', savings_rate_target: 30, fi_multiplier: 25,
  annual_growth_rate: 8, display_name: 'Ilya',
};

export const NW_PROJECTION_TARGETS: Record<number, number> = {
  2025: 40000, 2026: 111000, 2027: 196000, 2028: 301000, 2029: 418000, 2030: 551000,
};
