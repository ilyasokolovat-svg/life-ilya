export interface DailyCheckinRecord {
  date: string; // ISO YYYY-MM-DD (Dubai)
  savedAt: string; // ISO timestamp
}

export type DailyCheckinLog = Record<string, DailyCheckinRecord>;
