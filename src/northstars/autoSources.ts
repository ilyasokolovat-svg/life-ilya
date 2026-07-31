import { supabase } from "@/integrations/supabase/client";

/** Metrics can pull their current value from an existing source of truth. */
export type AutoSource = "gym_sessions" | "net_worth" | "debt";

export const AUTO_SOURCE_LABEL: Record<AutoSource, string> = {
  gym_sessions: "Healthy Life training log",
  net_worth: "Finance · net worth",
  debt: "Finance · total debt",
};

export interface AutoSourceData {
  /** Completed gym days between two ISO dates (inclusive). */
  gymSessions: (startISO: string, endISO: string) => number;
  netWorth: number;
  debt: number;
}

const isDebtLabel = (label: string, type: string) =>
  type === "debt" ||
  label.includes("loan") ||
  label.includes("debt") ||
  label.includes("credit");

export async function fetchAutoSources(userId: string): Promise<AutoSourceData> {
  const [days, accounts, nw, inv] = await Promise.all([
    supabase.from("habit_days").select("date, habit_data").eq("user_id", userId),
    supabase.from("accounts").select("id, label, type"),
    supabase.from("nw_snapshots").select("account_id, month, value"),
    supabase.from("investment_snapshots").select("bucket_id, month, value"),
  ]);

  const gymDates = new Set<string>();
  for (const row of days.data || []) {
    const hd = (row as { habit_data: Record<string, { completed?: boolean }> }).habit_data;
    if (hd?.gym?.completed) gymDates.add((row as { date: string }).date);
  }

  const latestBy = <T extends { month: string; value: number | string }>(rows: T[], key: keyof T) => {
    const map = new Map<string, T>();
    for (const r of rows) {
      const k = String(r[key]);
      const prev = map.get(k);
      if (!prev || r.month > prev.month) map.set(k, r);
    }
    return map;
  };

  const nwLatest = latestBy((nw.data || []) as never[], "account_id" as never);
  const invLatest = latestBy((inv.data || []) as never[], "bucket_id" as never);

  let investments = 0;
  invLatest.forEach((r) => (investments += Number((r as { value: number }).value) || 0));

  let debt = 0;
  let cc = 0;
  for (const a of (accounts.data || []) as { id: string; label: string; type: string }[]) {
    const snap = nwLatest.get(a.id) as { value: number } | undefined;
    if (!snap) continue;
    const label = (a.label || "").toLowerCase();
    if (!isDebtLabel(label, a.type)) continue;
    const abs = Math.abs(Number(snap.value) || 0);
    debt += abs;
    if (label.includes("credit")) cc += abs;
  }

  return {
    gymSessions: (startISO: string, endISO: string) => {
      let n = 0;
      gymDates.forEach((d) => {
        if (d >= startISO && d <= endISO) n += 1;
      });
      return n;
    },
    netWorth: investments - cc,
    debt,
  };
}
