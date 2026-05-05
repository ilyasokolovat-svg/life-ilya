export type AssetClass = "ETFs & Stocks" | "Crypto" | "Cash & Savings" | "Other";

export interface NetWorthEntry { id: number; date: string; netWorth: number; note: string; }
export interface Holding { id: number; platform: string; assetClass: string; color: string; note: string; }
export interface HoldingSnapshot { id: number; holdingId: number; date: string; value: number; }
export interface Liability { id: number; name: string; value: number; note: string; }
export interface SalaryEntry { id: number; date: string; monthlySalary: number; note: string; }
export interface BonusEntry { id: number; date: string; type: "bonus" | "commission" | "other"; amount: number; allocatedTo: string; note: string; }
export interface SavingsEntry { id: number; date: string; targetAmount: number; actualAmount: number; note: string; }

export interface ProjectionScenario { monthlySaved: number; annualBonus: number; returnRate: number; }
export interface ProjectionAssumptions {
  base: ProjectionScenario;
  strong: ProjectionScenario;
  conservative: ProjectionScenario;
}

export interface AllocationTarget { assetClass: string; targetPct: number; }
export interface BudgetCategory { id: number; name: string; subcategory: string; type: "need" | "want" | "invest" | "income"; targetPct: number | null; note: string; }
export interface BudgetActual { id: number; categoryId: number; year: number; month: number; planned: number; actual: number; }
export interface BudgetSalary { currentMonthlySalary: number; }
export interface ExpensePlan { id: number; name: string; targetDate: string; amount: number; priority: "high" | "medium" | "low"; note: string; }
export interface Milestone { id: number; label: string; value: number; }

export interface DisciplineChecks {
  savingsHit: boolean;
  cryptoWithinLimit: boolean;
  etfsFunded: boolean;
  debtRepaid: boolean;
  noUnplannedSpend: boolean;
  sheetUpdated: boolean;
}
export interface DisciplineEntry { id: number; date: string; checks: DisciplineChecks; note: string; }
