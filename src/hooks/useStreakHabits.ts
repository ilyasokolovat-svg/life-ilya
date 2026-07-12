import { useState, useEffect } from 'react';

export type DayStatus = 'pending' | 'completed' | 'missed';

export interface StreakHabit {
  id: string;
  name: string;
  goalDuration: number;
  completedDays: DayStatus[];
  createdAt: string;
  lastUpdateDate: string;
}

const updateMissedDays = (habit: StreakHabit): StreakHabit => {
  const lastUpdate = new Date(habit.lastUpdateDate);
  const now = new Date();
  const daysSinceCreation = Math.floor((now.getTime() - new Date(habit.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  
  const updatedDays = [...habit.completedDays];
  
  // Find the last completed or missed day
  let lastMarkedIndex = -1;
  for (let i = updatedDays.length - 1; i >= 0; i--) {
    if (updatedDays[i] === 'completed' || updatedDays[i] === 'missed') {
      lastMarkedIndex = i;
      break;
    }
  }
  
  // Mark missed days from last marked day to current day
  const currentDayIndex = Math.min(daysSinceCreation, habit.goalDuration - 1);
  for (let i = lastMarkedIndex + 1; i <= currentDayIndex; i++) {
    if (updatedDays[i] === 'pending') {
      updatedDays[i] = 'missed';
    }
  }
  
  return { ...habit, completedDays: updatedDays };
};

// Same-tab pub/sub so all hook instances stay in sync
const streakListeners = new Set<(habits: StreakHabit[]) => void>();

const loadStreakHabits = (): StreakHabit[] => {
  const stored = localStorage.getItem('streakHabits');
  const parsed = stored ? JSON.parse(stored) : [];
  return parsed.map((habit: any) => {
    if (habit.completedDays.length > 0 && typeof habit.completedDays[0] === 'boolean') {
      habit.completedDays = habit.completedDays.map((completed: boolean) =>
        completed ? 'completed' : 'pending'
      );
    }
    if (!habit.lastUpdateDate) habit.lastUpdateDate = habit.createdAt;
    return updateMissedDays(habit);
  });
};

export const useStreakHabits = () => {
  const [streakHabits, setStreakHabitsState] = useState<StreakHabit[]>(loadStreakHabits);

  const setStreakHabits = (next: StreakHabit[] | ((prev: StreakHabit[]) => StreakHabit[])) => {
    setStreakHabitsState((prev) => {
      const value = typeof next === 'function' ? (next as any)(prev) : next;
      localStorage.setItem('streakHabits', JSON.stringify(value));
      streakListeners.forEach((fn) => fn(value));
      return value;
    });
  };

  useEffect(() => {
    const fn = (v: StreakHabit[]) => setStreakHabitsState(v);
    streakListeners.add(fn);
    return () => { streakListeners.delete(fn); };
  }, []);

  useEffect(() => {
    // Update missed days every minute
    const interval = setInterval(() => {
      setStreakHabits(prev => prev.map(updateMissedDays));
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const addStreakHabit = (name: string, goalDuration: number) => {
    const now = new Date().toISOString();
    const newHabit: StreakHabit = {
      id: Date.now().toString(),
      name,
      goalDuration,
      completedDays: Array(goalDuration).fill('pending'),
      createdAt: now,
      lastUpdateDate: now,
    };
    setStreakHabits([...streakHabits, newHabit]);
  };

  const toggleDay = (habitId: string, dayIndex: number) => {
    setStreakHabits(streakHabits.map(habit => {
      if (habit.id === habitId) {
        const newCompletedDays = [...habit.completedDays];
        const currentStatus = newCompletedDays[dayIndex];
        
        // Toggle between completed and pending/missed
        if (currentStatus === 'completed') {
          newCompletedDays[dayIndex] = 'pending';
        } else {
          newCompletedDays[dayIndex] = 'completed';
        }
        
        return { 
          ...habit, 
          completedDays: newCompletedDays,
          lastUpdateDate: new Date().toISOString()
        };
      }
      return habit;
    }));
  };

  const deleteStreakHabit = (habitId: string) => {
    setStreakHabits(streakHabits.filter(habit => habit.id !== habitId));
  };

  return {
    streakHabits,
    addStreakHabit,
    toggleDay,
    deleteStreakHabit,
  };
};
