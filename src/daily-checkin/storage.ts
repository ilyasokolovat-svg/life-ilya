import { useCallback, useEffect, useState } from "react";
import type { DailyCheckinLog } from "./types";
import { getTodayISO } from "@/utils/dateUtils";

const STORAGE_KEY = "daily_checkin_log";
const DISMISS_KEY = "daily_checkin_dismissed_date";

function load(): DailyCheckinLog {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function persist(log: DailyCheckinLog) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch {}
}

let mem: DailyCheckinLog | null = null;
const listeners = new Set<() => void>();

function getLog(): DailyCheckinLog {
  if (!mem) mem = load();
  return mem;
}

function setLog(updater: (prev: DailyCheckinLog) => DailyCheckinLog) {
  mem = updater(getLog());
  persist(mem);
  listeners.forEach((l) => l());
}

export function useDailyCheckinLog() {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((n) => n + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  const log = getLog();

  const markToday = useCallback(() => {
    const date = getTodayISO();
    setLog((prev) => ({ ...prev, [date]: { date, savedAt: new Date().toISOString() } }));
  }, []);

  const hasToday = useCallback(() => {
    return !!getLog()[getTodayISO()];
  }, []);

  return { log, markToday, hasToday };
}

export function dismissForToday() {
  try { sessionStorage.setItem(DISMISS_KEY, getTodayISO()); } catch {}
}

export function isDismissedToday(): boolean {
  try { return sessionStorage.getItem(DISMISS_KEY) === getTodayISO(); } catch { return false; }
}
