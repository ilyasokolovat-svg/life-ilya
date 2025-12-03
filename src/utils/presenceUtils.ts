
import { HabitsState } from "@/types/habit";

export interface PresenceStats {
  journaling: number;
  meditation: number;
  mindfulPhone: number;
}

// Calculate presence stats for a specific month
export const calculatePresenceStats = (
  state: HabitsState, 
  year: number, 
  month: number
): PresenceStats => {
  const stats: PresenceStats = {
    journaling: 0,
    meditation: 0,
    mindfulPhone: 0
  };

  if (!state || !state.days) {
    return stats;
  }

  // Get the number of days in the month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateISO = date.toISOString().split('T')[0];
    const dayData = state.days[dateISO];

    // Only count if presence/meditation is completed
    if (dayData?.meditation?.completed) {
      if (dayData.meditation.journaling) {
        stats.journaling++;
      }
      if (dayData.meditation.meditationDone) {
        stats.meditation++;
      }
      if (dayData.meditation.mindfulPhone) {
        stats.mindfulPhone++;
      }
    }
  }

  return stats;
};
