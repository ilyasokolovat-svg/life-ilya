import { useEffect, useState } from "react";

// Same-tab pub/sub so multiple hook instances stay in sync
const listeners = new Map<string, Set<(value: unknown) => void>>();

function subscribe(key: string, fn: (value: unknown) => void) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(fn);
  return () => {
    listeners.get(key)?.delete(fn);
  };
}

function broadcast(key: string, value: unknown) {
  listeners.get(key)?.forEach((fn) => fn(value));
}

function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log("Error reading from localStorage", error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      broadcast(key, valueToStore);
    } catch (error) {
      console.log("Error writing to localStorage", error);
    }
  };

  useEffect(() => {
    // Cross-tab
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        try {
          setStoredValue(JSON.parse(event.newValue));
        } catch (error) {
          console.error("Error parsing localStorage change", error);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Same-tab
    const unsub = subscribe(key, (v) => setStoredValue(v as T));

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      unsub();
    };
  }, [key]);

  return [storedValue, setValue] as const;
}

export default useLocalStorage;
