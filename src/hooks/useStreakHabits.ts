import { useState, useEffect } from 'react';

export interface StreakHabit {
  id: string;
  name: string;
  goalDuration: number;
  completedDays: boolean[];
  createdAt: string;
}

export const useStreakHabits = () => {
  const [streakHabits, setStreakHabits] = useState<StreakHabit[]>(() => {
    const stored = localStorage.getItem('streakHabits');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('streakHabits', JSON.stringify(streakHabits));
  }, [streakHabits]);

  const addStreakHabit = (name: string, goalDuration: number) => {
    const newHabit: StreakHabit = {
      id: Date.now().toString(),
      name,
      goalDuration,
      completedDays: Array(goalDuration).fill(false),
      createdAt: new Date().toISOString(),
    };
    setStreakHabits([...streakHabits, newHabit]);
  };

  const toggleDay = (habitId: string, dayIndex: number) => {
    setStreakHabits(streakHabits.map(habit => {
      if (habit.id === habitId) {
        const newCompletedDays = [...habit.completedDays];
        newCompletedDays[dayIndex] = !newCompletedDays[dayIndex];
        return { ...habit, completedDays: newCompletedDays };
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
