import { useEffect, useState } from "react";

export function useFinanceStorage<T>(key: string, seed: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) {
        localStorage.setItem(key, JSON.stringify(seed));
        return seed;
      }
      return JSON.parse(raw);
    } catch {
      return seed;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(new CustomEvent("finance-saved"));
    } catch {}
  }, [key, value]);

  return [value, setValue] as const;
}

export const nextId = (arr: { id: number }[]) =>
  arr.length === 0 ? 1 : Math.max(...arr.map(a => a.id)) + 1;
