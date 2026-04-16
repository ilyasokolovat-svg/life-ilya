import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getDubaiDate } from "@/utils/dateUtils";

export type CheckinType = "weekly" | "monthly" | "quarterly";

interface CheckinState {
  weekly_last: string | null;
  monthly_last: string | null;
  quarterly_last: string | null;
}

function getDubaiQuarter(d: Date): number {
  return Math.floor(d.getMonth() / 3) + 1;
}

function getDubaiISOWeek(d: Date): string {
  // ISO week number calculation
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${date.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

function getDubaiMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getDubaiQuarterKey(d: Date): string {
  return `${d.getFullYear()}-Q${getDubaiQuarter(d)}`;
}

function getPreviousQuarterKey(d: Date): string {
  let q = getDubaiQuarter(d) - 1;
  let y = d.getFullYear();
  if (q === 0) { q = 4; y--; }
  return `${y}-Q${q}`;
}

function getPreviousMonthKey(d: Date): string {
  let m = d.getMonth(); // 0-based, current month
  let y = d.getFullYear();
  if (m === 0) { m = 12; y--; }
  return `${y}-${String(m).padStart(2, "0")}`;
}

function getPreviousWeekKey(d: Date): string {
  const prev = new Date(d);
  prev.setDate(prev.getDate() - 7);
  return getDubaiISOWeek(prev);
}

export function useCheckinTrigger() {
  const { user } = useAuth();
  const [dueCheckin, setDueCheckin] = useState<CheckinType | null>(null);
  const [periodKey, setPeriodKey] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const shownThisSession = useRef(false);

  const checkDue = useCallback(async () => {
    if (!user?.id || shownThisSession.current) return;

    const today = getDubaiDate();
    const currentQuarterKey = getDubaiQuarterKey(today);
    const currentMonthKey = getDubaiMonthKey(today);
    const currentWeekKey = getDubaiISOWeek(today);

    // Fetch checkin state
    const { data: state } = await supabase
      .from("checkin_state")
      .select("weekly_last, monthly_last, quarterly_last")
      .eq("user_id", user.id)
      .maybeSingle();

    const s: CheckinState = {
      weekly_last: state?.weekly_last || null,
      monthly_last: state?.monthly_last || null,
      quarterly_last: state?.quarterly_last || null,
    };

    // Check for in-progress (incomplete) reviews first
    const { data: inProgress } = await supabase
      .from("checkin_reviews")
      .select("checkin_type, period_key")
      .eq("user_id", user.id)
      .eq("completed", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (inProgress) {
      shownThisSession.current = true;
      setDueCheckin(inProgress.checkin_type as CheckinType);
      setPeriodKey(inProgress.period_key);
      setTimeout(() => setShowModal(true), 1500);
      return;
    }

    // Quarterly check: has current quarter changed since last quarterly?
    const prevQ = getPreviousQuarterKey(today);
    const quarterlyDue = !s.quarterly_last || (() => {
      const lastDate = new Date(s.quarterly_last);
      const lastQ = getDubaiQuarterKey(lastDate);
      return lastQ !== currentQuarterKey;
    })();

    if (quarterlyDue) {
      shownThisSession.current = true;
      setDueCheckin("quarterly");
      setPeriodKey(prevQ);
      setTimeout(() => setShowModal(true), 1500);
      return;
    }

    // Monthly check (skip if quarterly was due)
    const prevM = getPreviousMonthKey(today);
    const monthlyDue = !s.monthly_last || (() => {
      const lastDate = new Date(s.monthly_last);
      const lastM = getDubaiMonthKey(lastDate);
      return lastM !== currentMonthKey;
    })();

    if (monthlyDue) {
      shownThisSession.current = true;
      setDueCheckin("monthly");
      setPeriodKey(prevM);
      setTimeout(() => setShowModal(true), 1500);
      return;
    }

    // Weekly check (skip if monthly was due)
    const prevW = getPreviousWeekKey(today);
    const weeklyDue = !s.weekly_last || (() => {
      const lastDate = new Date(s.weekly_last);
      const lastW = getDubaiISOWeek(lastDate);
      return lastW !== currentWeekKey;
    })();

    if (weeklyDue) {
      shownThisSession.current = true;
      setDueCheckin("weekly");
      setPeriodKey(prevW);
      setTimeout(() => setShowModal(true), 1500);
      return;
    }
  }, [user?.id]);

  useEffect(() => {
    checkDue();
  }, [checkDue]);

  const dismiss = useCallback(() => {
    setShowModal(false);
  }, []);

  return { dueCheckin, periodKey, showModal, dismiss };
}
