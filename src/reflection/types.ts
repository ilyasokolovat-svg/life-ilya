export type Tri = -1 | 0 | 1;

export interface WeeklyReflection {
  weekKey: string;      // ISO week key, e.g. "2026-W28"
  weekLabel: string;    // Human label, e.g. "Jun 29 – Jul 5"
  overall: 1 | 2 | 3 | 4 | 5;
  goalsProgress: Tri;
  health: Tri;
  energy: Tri;
  note?: string;
  submittedAt: number;
}
