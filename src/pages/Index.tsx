
import React, { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import Calendar from "@/components/Calendar";
import HabitStats from "@/components/HabitStats";
import WeeklyChart from "@/components/WeeklyChart";
import GoalSetting from "@/components/GoalSetting";
import { HabitType, HabitsState, HabitData, HabitGoal } from "@/types/habit";
import { calculateHabitStats, formatDateISO, createEmptyDayData, createDefaultGoals } from "@/utils/habitUtils";
import { getMonthlyWeeklyStats } from "@/utils/chartUtils";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Moon, Dumbbell, Wine, Brain } from "lucide-react";

const Index = () => {
  const [habitsState, setHabitsState] = useLocalStorage<HabitsState>("habits-tracker", {
    days: {},
    currentDate: formatDateISO(new Date()),
    goals: createDefaultGoals()
  });

  // Track current view month/year for charts
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());

  // Ensure today exists in the data
  useEffect(() => {
    const today = new Date();
    const todayISO = formatDateISO(today);
    
    if (!habitsState.days[todayISO]) {
      setHabitsState((prevState) => ({
        ...prevState,
        days: {
          ...prevState.days,
          [todayISO]: createEmptyDayData(today)
        },
        currentDate: todayISO
      }));
    }

    // Also ensure goals exist
    if (!habitsState.goals || Object.keys(habitsState.goals).length === 0) {
      setHabitsState((prevState) => ({
        ...prevState,
        goals: createDefaultGoals()
      }));
    }
    
    // Sync view month/year with calendar
    setViewMonth(today.getMonth());
    setViewYear(today.getFullYear());
  }, [habitsState, setHabitsState]);

  const handleUpdateHabit = (date: Date, type: HabitType, data: HabitData) => {
    const dateISO = formatDateISO(date);
    
    setHabitsState((prevState) => {
      // Get or create the day data
      const existingDay = prevState.days[dateISO] || createEmptyDayData(date);
      
      // Update the specific habit
      const updatedDay = {
        ...existingDay,
        [type]: data
      };
      
      // Return updated state
      return {
        ...prevState,
        days: {
          ...prevState.days,
          [dateISO]: updatedDay
        }
      };
    });
  };

  const handleUpdateGoal = (type: HabitType, goal: HabitGoal) => {
    setHabitsState((prevState) => ({
      ...prevState,
      goals: {
        ...prevState.goals,
        [type]: goal
      }
    }));
  };
  
  // Handle month change for charts
  const handleCalendarMonthChange = (month: number, year: number) => {
    setViewMonth(month);
    setViewYear(year);
  };
  
  // Ensure goals object exists before accessing it
  const safeGoals = habitsState.goals || createDefaultGoals();
  
  // Calculate stats for each habit type using safe goals
  const sleepStats = calculateHabitStats(habitsState, "sleep");
  const gymStats = calculateHabitStats(habitsState, "gym");
  const alcoholStats = calculateHabitStats(habitsState, "alcohol");
  const meditationStats = calculateHabitStats(habitsState, "meditation");
  
  // Get weekly stats for each habit type
  const sleepWeeklyStats = getMonthlyWeeklyStats(habitsState, "sleep", viewYear, viewMonth);
  const gymWeeklyStats = getMonthlyWeeklyStats(habitsState, "gym", viewYear, viewMonth);
  const alcoholWeeklyStats = getMonthlyWeeklyStats(habitsState, "alcohol", viewYear, viewMonth);
  const meditationWeeklyStats = getMonthlyWeeklyStats(habitsState, "meditation", viewYear, viewMonth);

  return (
    <div className="min-h-screen bg-blue-light/10 pb-12">
      <Toaster />
      
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-dark text-center">Habit Tracker</h1>
          <p className="text-center text-gray-600 mt-1 text-sm md:text-base">Track your journey to become a better version of yourself</p>
        </div>
      </header>
      
      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        {/* Goals Section */}
        <div className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">Your Monthly Goals</h2>
          <GoalSetting 
            goals={safeGoals}
            onUpdateGoal={handleUpdateGoal}
          />
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">Your Monthly Calendar</h2>
          <div className="bg-white rounded-lg shadow-md p-4">
            <Calendar
              days={habitsState.days}
              onUpdateHabit={handleUpdateHabit}
            />
          </div>
        </div>
        
        {/* Stats section - reordered to match habit order */}
        <div className="mt-8 mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">Your Progress Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <HabitStats habitType="sleep" stats={sleepStats} goal={safeGoals.sleep} />
            <HabitStats habitType="gym" stats={gymStats} goal={safeGoals.gym} />
            <HabitStats habitType="alcohol" stats={alcoholStats} goal={safeGoals.alcohol} />
            <HabitStats habitType="meditation" stats={meditationStats} goal={safeGoals.meditation} />
          </div>
        </div>
        
        {/* Weekly Charts Section */}
        <div className="mt-8 mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">Weekly Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <WeeklyChart habitType="sleep" data={sleepWeeklyStats} />
            <WeeklyChart habitType="gym" data={gymWeeklyStats} />
            <WeeklyChart habitType="alcohol" data={alcoholWeeklyStats} />
            <WeeklyChart habitType="meditation" data={meditationWeeklyStats} />
          </div>
        </div>
        
        {/* Motivational section - reordered icons to match habit order */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-xl md:text-2xl font-bold mb-6">Your Habits Shape Your Future</h2>
          <div className="flex justify-center flex-wrap gap-8 mb-6">
            <div className="flex flex-col items-center">
              <div className="bg-blue-light p-4 rounded-full mb-2">
                <Moon className="h-8 w-8 text-blue-dark" />
              </div>
              <p className="text-sm">Rest Well</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-blue-light p-4 rounded-full mb-2">
                <Dumbbell className="h-8 w-8 text-blue-dark" />
              </div>
              <p className="text-sm">Stay Active</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-blue-light p-4 rounded-full mb-2">
                <Wine className="h-8 w-8 text-blue-dark" />
              </div>
              <p className="text-sm">Stay Sober</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-blue-light p-4 rounded-full mb-2">
                <Brain className="h-8 w-8 text-blue-dark" />
              </div>
              <p className="text-sm">Stay Mindful</p>
            </div>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            "The difference between who you are and who you want to be is what you do."
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;
