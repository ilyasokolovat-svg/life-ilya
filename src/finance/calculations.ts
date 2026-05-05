import type { Holding, HoldingSnapshot, ProjectionScenario } from "./types";

export function getLatestSnapshots(snapshots: HoldingSnapshot[]): Map<number, HoldingSnapshot> {
  const map = new Map<number, HoldingSnapshot>();
  for (const s of snapshots) {
    const cur = map.get(s.holdingId);
    if (!cur || s.date > cur.date) map.set(s.holdingId, s);
  }
  return map;
}

export function getSnapshotForDate(snapshots: HoldingSnapshot[], holdingId: number, date: string) {
  return snapshots.find(s => s.holdingId === holdingId && s.date === date);
}

export function getPreviousSnapshot(snapshots: HoldingSnapshot[], holdingId: number, beforeDate: string) {
  const all = snapshots.filter(s => s.holdingId === holdingId && s.date < beforeDate).sort((a, b) => b.date.localeCompare(a.date));
  return all[0];
}

export function projectNetWorth(
  startValue: number, startDate: string, monthsForward: number, scenario: ProjectionScenario
): { date: string; value: number }[] {
  const monthlyReturn = Math.pow(1 + scenario.returnRate, 1 / 12) - 1;
  const monthlyBonus = scenario.annualBonus / 12;
  const out: { date: string; value: number }[] = [];
  const [y, m] = startDate.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  let value = startValue;
  for (let i = 1; i <= monthsForward; i++) {
    value = value * (1 + monthlyReturn) + scenario.monthlySaved + monthlyBonus;
    d.setMonth(d.getMonth() + 1);
    out.push({
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      value: Math.round(value),
    });
  }
  return out;
}

export function getAllocationByClass(holdings: Holding[], snapshots: HoldingSnapshot[]) {
  const latest = getLatestSnapshots(snapshots);
  const byClass = new Map<string, number>();
  for (const h of holdings) {
    const snap = latest.get(h.id);
    const v = snap?.value ?? 0;
    byClass.set(h.assetClass, (byClass.get(h.assetClass) ?? 0) + v);
  }
  return byClass;
}

export function classColor(c: string): string {
  if (c === "ETFs & Stocks") return "#1A56DB";
  if (c === "Crypto") return "#B45309";
  if (c === "Cash & Savings") return "#6B6B6B";
  return "#A0A0A0";
}
