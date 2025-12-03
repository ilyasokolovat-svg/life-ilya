
import { HabitsState } from "@/types/habit";

export interface FriendCount {
  name: string;
  count: number;
}

// Calculate top friends met for a specific month
export const calculateTopFriends = (
  state: HabitsState, 
  year: number, 
  month: number,
  limit: number = 3
): FriendCount[] => {
  const friendCounts: Record<string, number> = {};

  if (!state || !state.days) {
    return [];
  }

  // Get the number of days in the month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateISO = date.toISOString().split('T')[0];
    const dayData = state.days[dateISO];

    // Only count if social is planned (or completed)
    if (dayData?.social?.socialPerson) {
      const personString = dayData.social.socialPerson;
      
      // Split by comma, trim whitespace, and count each person
      const people = personString.split(',').map(p => p.trim()).filter(p => p.length > 0);
      
      for (const person of people) {
        // Normalize the name (capitalize first letter of each word)
        const normalizedName = person
          .toLowerCase()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        friendCounts[normalizedName] = (friendCounts[normalizedName] || 0) + 1;
      }
    }
  }

  // Convert to array, sort by count descending, and take top N
  const sortedFriends = Object.entries(friendCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  return sortedFriends;
};
