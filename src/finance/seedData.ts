import type {
  NetWorthEntry, Holding, HoldingSnapshot, Liability, SalaryEntry,
  BonusEntry, SavingsEntry, ProjectionAssumptions, AllocationTarget,
  BudgetCategory, BudgetSalary, ExpensePlan, Milestone, DisciplineEntry,
} from "./types";

export const SEED_NETWORTH: NetWorthEntry[] = [
  { id: 1, date: "2021-01", netWorth: -22623, note: "Starting point" },
  { id: 2, date: "2026-04", netWorth: -17808, note: "Apr 2026 snapshot" },
];

export const SEED_HOLDINGS: Holding[] = [
  { id: 1, platform: "IBKR", assetClass: "ETFs & Stocks", color: "#1A56DB", note: "Main ETF account — IWRD, SPY, VT, QQQ, IAU" },
  { id: 2, platform: "KuCoin", assetClass: "Crypto", color: "#B45309", note: "" },
  { id: 3, platform: "Bybit", assetClass: "Crypto", color: "#B45309", note: "" },
  { id: 4, platform: "OKX", assetClass: "Crypto", color: "#B45309", note: "" },
  { id: 5, platform: "eToro", assetClass: "ETFs & Stocks", color: "#1A56DB", note: "" },
  { id: 6, platform: "Trading 212", assetClass: "Cash & Savings", color: "#6B6B6B", note: "" },
];

export const SEED_SNAPSHOTS: HoldingSnapshot[] = [
  { id: 1, holdingId: 1, date: "2026-04", value: 12172 },
  { id: 2, holdingId: 2, date: "2026-04", value: 9253 },
  { id: 3, holdingId: 3, date: "2026-04", value: 9900 },
  { id: 4, holdingId: 4, date: "2026-04", value: 3438 },
  { id: 5, holdingId: 5, date: "2026-04", value: 230 },
  { id: 6, holdingId: 6, date: "2026-04", value: 15000 },
];

export const SEED_LIABILITIES: Liability[] = [
  { id: 1, name: "Car loan (BMW)", value: 62818, note: "AED 4,700/mo · payoff available after 6 months" },
  { id: 2, name: "Credit card (ENBD)", value: 14488, note: "Target: clear by Q3 2026" },
];

export const SEED_SALARY: SalaryEntry[] = [
  { id: 1, date: "2016-01", monthlySalary: 1500, note: "" },
  { id: 2, date: "2017-01", monthlySalary: 2000, note: "" },
  { id: 3, date: "2018-01", monthlySalary: 4650, note: "" },
  { id: 4, date: "2019-01", monthlySalary: 3000, note: "" },
  { id: 5, date: "2020-01", monthlySalary: 3750, note: "" },
  { id: 6, date: "2021-01", monthlySalary: 5000, note: "" },
  { id: 7, date: "2022-01", monthlySalary: 5500, note: "" },
  { id: 8, date: "2023-01", monthlySalary: 5500, note: "" },
  { id: 9, date: "2024-01", monthlySalary: 8200, note: "" },
  { id: 10, date: "2025-01", monthlySalary: 11500, note: "" },
  { id: 11, date: "2026-01", monthlySalary: 11500, note: "Dubai · AED 42,235" },
];

export const SEED_ASSUMPTIONS: ProjectionAssumptions = {
  base: { monthlySaved: 4900, annualBonus: 0, returnRate: 0.08 },
  strong: { monthlySaved: 4900, annualBonus: 25000, returnRate: 0.10 },
  conservative: { monthlySaved: 3500, annualBonus: 0, returnRate: 0.06 },
};

export const SEED_ALLOCATION: AllocationTarget[] = [
  { assetClass: "ETFs & Stocks", targetPct: 40 },
  { assetClass: "Crypto", targetPct: 20 },
  { assetClass: "Cash & Savings", targetPct: 10 },
  { assetClass: "Other", targetPct: 30 },
];

export const SEED_MILESTONES: Milestone[] = [
  { id: 1, label: "Debt-free", value: 0 },
  { id: 2, label: "2026 goal", value: 111000 },
  { id: 3, label: "200K", value: 200000 },
  { id: 4, label: "500K", value: 500000 },
];

export const SEED_BUDGET_CATEGORIES: BudgetCategory[] = [
  { id: 1, name: "Salary", subcategory: "", type: "income", targetPct: null, note: "" },
  { id: 2, name: "Commission / Bonus", subcategory: "", type: "income", targetPct: null, note: "" },
  { id: 3, name: "Investing", subcategory: "", type: "invest", targetPct: 30.59, note: "" },
  { id: 4, name: "Accommodation", subcategory: "", type: "need", targetPct: 28.85, note: "8.4K AED rental" },
  { id: 5, name: "Transport", subcategory: "", type: "need", targetPct: 14.42, note: "BMW loan" },
  { id: 6, name: "Food", subcategory: "Groceries", type: "need", targetPct: 4.37, note: "" },
  { id: 7, name: "Food", subcategory: "Dining out", type: "need", targetPct: 4.37, note: "" },
  { id: 8, name: "Health", subcategory: "Sport", type: "need", targetPct: 2.62, note: "" },
  { id: 9, name: "Health", subcategory: "Medical", type: "need", targetPct: 0.87, note: "" },
  { id: 10, name: "Travel", subcategory: "", type: "want", targetPct: 4.37, note: "" },
  { id: 11, name: "Social", subcategory: "Alcohol / Shisha", type: "want", targetPct: 2.01, note: "" },
  { id: 12, name: "Social", subcategory: "Non-alcohol", type: "want", targetPct: 0.96, note: "" },
  { id: 13, name: "Dating", subcategory: "", type: "want", targetPct: 2.62, note: "" },
  { id: 14, name: "Clothes", subcategory: "", type: "want", targetPct: 1.09, note: "" },
  { id: 15, name: "Presents", subcategory: "", type: "need", targetPct: 0.66, note: "" },
  { id: 16, name: "Miscellaneous", subcategory: "", type: "need", targetPct: 2.0, note: "" },
];

export const SEED_BUDGET_SALARY: BudgetSalary = { currentMonthlySalary: 11500 };

export const SEED_SAVINGS: SavingsEntry[] = [
  { id: 1, date: "2026-01", targetAmount: 4000, actualAmount: 4900, note: "Discipline check passed" },
];

export const SEED_BONUS: BonusEntry[] = [
  { id: 1, date: "2026-02", type: "commission", amount: 3600, allocatedTo: "Debt repayment", note: "" },
];

export const SEED_EXPENSES: ExpensePlan[] = [];

export const SEED_DISCIPLINE: DisciplineEntry[] = [
  {
    id: 1, date: "2026-01",
    checks: { savingsHit: true, cryptoWithinLimit: false, etfsFunded: true, debtRepaid: true, noUnplannedSpend: true, sheetUpdated: true },
    note: "Crypto still above 20% limit due to market. Will rebalance.",
  },
];
