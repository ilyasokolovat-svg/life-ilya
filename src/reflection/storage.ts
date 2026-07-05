import { useCallback, useEffect, useState } from "react";
import type { WeeklyReflection } from "./types";

const STORAGE_KEY = "weekly_reflection";

function load(): WeeklyReflection[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as WeeklyReflection[]) : [];
  } catch {
    return [];
  }
}

function save(entries: WeeklyReflection[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore quota / privacy mode errors
  }
}

let mem: WeeklyReflection[] | null = null;
const listeners = new Set<() => void>();

function getAll(): WeeklyReflection[] {
  if (!mem) mem = load();
  return mem;
}

function setAll(updater: (prev: WeeklyReflection[]) => WeeklyReflection[]) {
  mem = updater(getAll());
  save(mem);
  listeners.forEach((l) => l());
}

export function useReflections() {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((n) => n + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  const entries = getAll();

  const upsert = useCallback((entry: WeeklyReflection) => {
    setAll((prev) => {
      const rest = prev.filter((e) => e.weekKey !== entry.weekKey);
      return [...rest, entry].sort((a, b) => (a.weekKey < b.weekKey ? -1 : 1));
    });
  }, []);

  const remove = useCallback((weekKey: string) => {
    setAll((prev) => prev.filter((e) => e.weekKey !== weekKey));
  }, []);

  const hasForWeek = useCallback((weekKey: string) => {
    return getAll().some((e) => e.weekKey === weekKey);
  }, []);

  return { entries, upsert, remove, hasForWeek };
}

// Session-scoped dismissal so we re-prompt on next visit, not this one.
const DISMISS_KEY = "weekly_reflection_dismissed";
export function dismissForSession(weekKey: string) {
  try { sessionStorage.setItem(DISMISS_KEY, weekKey); } catch {}
}
export function isDismissedForSession(weekKey: string): boolean {
  try { return sessionStorage.getItem(DISMISS_KEY) === weekKey; } catch { return false; }
}
