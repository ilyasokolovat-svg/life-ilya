
import { useState, useEffect } from "react";
import { HabitsState, DayData, HabitType, HabitData } from "@/types/habit";
import { formatDateISO, createEmptyDayData, createDefaultMonthlyGoals } from "@/utils/habitUtils";
import { toast } from "sonner";
import useLocalStorage from "./useLocalStorage";

export default function useHabits() {
  // Use our existing localStorage hook
  const [habitsState, setHabitsState] = useLocalStorage<HabitsState>("habits_data", {
    days: {},
    currentDate: formatDateISO(new Date()),
    goals: createDefaultMonthlyGoals()
  });

  // Ensure today exists in the data
  useEffect(() => {
    const today = new Date();
    const todayISO = formatDateISO(today);
    
    if (!habitsState.days[todayISO]) {
      const updatedDays = {
        ...habitsState.days,
        [todayISO]: createEmptyDayData(today)
      };
      
      setHabitsState({
        ...habitsState,
        days: updatedDays
      });
    }
  }, []);

  // Update a habit for a specific day
  const updateDay = (date: Date, type: HabitType, data: HabitData) => {
    try {
      const dateISO = formatDateISO(date);
      
      // Get or create the day data
      let dayData: DayData = habitsState.days[dateISO] 
        ? { ...habitsState.days[dateISO] } 
        : createEmptyDayData(date);
      
      // Update the specific habit data
      dayData = {
        ...dayData,
        [type]: data
      };
      
      // Update state
      const updatedDays = {
        ...habitsState.days,
        [dateISO]: dayData
      };
      
      setHabitsState({
        ...habitsState,
        days: updatedDays
      });
      
      toast.success('Progress saved!', { duration: 1500 });
    } catch (error) {
      console.error('Error updating day:', error);
      toast.error('Failed to save your progress');
    }
  };
  
  // Update a goal for a specific habit type
  const updateGoal = (type: HabitType, goal: any, year: number, month: number) => {
    try {
      const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
      
      // Get current goals or default
      const monthGoals = habitsState.goals[monthKey] || createDefaultMonthlyGoals()[monthKey];
      
      // Create updated goals object
      const updatedGoals = {
        ...habitsState.goals,
        [monthKey]: {
          ...monthGoals,
          [type]: goal
        }
      };
      
      // Update state
      setHabitsState({
        ...habitsState,
        goals: updatedGoals
      });
      
      toast.success('Goal updated!', { duration: 1500 });
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error('Failed to save your goal');
    }
  };

  return {
    habitsState,
    updateDay,
    updateGoal,
    isLoading: false
  };
}
