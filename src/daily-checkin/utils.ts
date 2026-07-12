/** Current hour in Dubai (0-23). */
export function dubaiHour(): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dubai",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const h = parts.find((p) => p.type === "hour")?.value ?? "0";
  return parseInt(h, 10);
}

/** True after 18:00 Dubai time. */
export function isEveningWindow(): boolean {
  return dubaiHour() >= 18;
}

/** Consecutive-day streak of check-ins up to today. */
export function checkinStreak(log: Record<string, unknown>, todayISO: string): number {
  if (!log[todayISO]) {
    // If not done today, count streak ending yesterday only if yesterday exists
    const d = new Date(todayISO + "T00:00:00");
    d.setDate(d.getDate() - 1);
    const y = d.toISOString().slice(0, 10);
    if (!log[y]) return 0;
    return countBack(log, y);
  }
  return countBack(log, todayISO);
}

function countBack(log: Record<string, unknown>, fromISO: string): number {
  let count = 0;
  const cursor = new Date(fromISO + "T00:00:00");
  while (log[cursor.toISOString().slice(0, 10)]) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}
