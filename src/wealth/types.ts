export type AccountType = 'cash' | 'investments' | 'retirement' | 'property' | 'debt';
export type ExtraType = 'bonus' | 'freelance' | 'dividend' | 'tax-refund' | 'other';

export interface Settings {
  id: string; user_id: string; currency: string; savings_rate_target: number;
  fi_multiplier: number; annual_growth_rate: number; display_name: string;
  display_currency?: 'USD' | 'AED';
}
export interface Account {
  id: string; label: string; type: AccountType; liquid: boolean; is_estimated: boolean;
  linked_goal_id: string | null; color: string; sort_order: number;
  target_pct?: number;
}
export interface NWSnapshot { id: string; month: string; account_id: string; value: number; }
export interface BudgetCategory { id: string; label: string; budget: number; color: string; sort_order: number; }
export interface BudgetMonth { id: string; month: string; salary: number; }
export interface BudgetExtra { id: string; month: string; description: string; amount: number; type: ExtraType; }
export interface BudgetSpending { id: string; month: string; category_id: string; actual: number; locked?: boolean; source?: string; }
export interface InvestmentBucket { id: string; label: string; description: string | null; color: string; sort_order: number; }
export interface InvestmentSnapshot { id: string; month: string; bucket_id: string; value: number; contribution: number; }
export type GoalValueSource = 'net_worth' | 'total_portfolio' | 'linked_account' | 'manual';
export interface Goal {
  id: string; name: string; target_amount: number; target_date: string; color: string;
  priority: number; allocation_pct: number; linked_account_id: string | null;
  value_source: GoalValueSource; manual_current_value: number;
}
export interface BonusPool { id: string; month: string; description: string; source_extra_id: string | null; total_amount: number; }
export interface BonusAllocation { id: string; pool_id: string; goal_id: string; amount: number; note: string | null; }

export interface WealthData {
  settings: Settings | null;
  accounts: Account[];
  nwSnapshots: NWSnapshot[];
  budgetCategories: BudgetCategory[];
  budgetMonths: BudgetMonth[];
  budgetExtras: BudgetExtra[];
  budgetSpending: BudgetSpending[];
  investmentBuckets: InvestmentBucket[];
  investmentSnapshots: InvestmentSnapshot[];
  goals: Goal[];
  bonusPools: BonusPool[];
  bonusAllocations: BonusAllocation[];
}
