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
    return habit;
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

  // Cycle: pending → completed → missed → pending
  // User manually marks each day; no automatic missed-marking.
  const toggleDay = (habitId: string, dayIndex: number) => {
    setStreakHabits(streakHabits.map(habit => {
      if (habit.id !== habitId) return habit;
      const newDays = [...habit.completedDays];
      const cur = newDays[dayIndex];
      newDays[dayIndex] = cur === 'pending' ? 'completed' : cur === 'completed' ? 'missed' : 'pending';
      return { ...habit, completedDays: newDays, lastUpdateDate: new Date().toISOString() };
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
