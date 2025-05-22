
import React, { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import Calendar from "@/components/Calendar";
import HabitStats from "@/components/HabitStats";
import MonthSlider from "@/components/MonthSlider";
import GoalSetting from "@/components/GoalSetting";
import { HabitType, HabitsState, HabitData, HabitGoal } from "@/types/habit";
import { 
  calculateHabitStats, 
  formatDateISO, 
  createEmptyDayData, 
  createDefaultGoals,
  formatYearMonth,
  getMonthGoals
} from "@/utils/habitUtils";
import { getMonthlyWeeklyStats } from "@/utils/chartUtils";
import { Moon, Dumbbell, Wine, Brain } from "lucide-react";
import useSupabaseHabits from "@/hooks/useSupabaseHabits";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const Index = () => {
  // Use Supabase hook instead of localStorage
  const { habitsState, updateDay, updateGoal, isLoading } = useSupabaseHabits();

  // Track current view month/year for charts and calendar
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  
  // Track individual chart months/years
  const [chartMonths, setChartMonths] = useState({
    sleep: { month: viewMonth, year: viewYear },
    gym: { month: viewMonth, year: viewYear },
    alcohol: { month: viewMonth, year: viewYear },
    meditation: { month: viewMonth, year: viewYear }
  });

  // Ensure today exists in the data (moved to useEffect to avoid react state update in render)
  useEffect(() => {
    if (isLoading) return;
    
    const today = new Date();
    const todayISO = formatDateISO(today);
    
    if (!habitsState.days[todayISO]) {
      updateDay(today, 'sleep', { planned: false, completed: false });
    }
  }, [isLoading, habitsState.days]);

  const handleUpdateHabit = (date: Date, type: HabitType, data: HabitData) => {
    updateDay(date, type, data);
  };

  const handleUpdateGoal = (type: HabitType, goal: HabitGoal) => {
    updateGoal(type, goal, viewYear, viewMonth);
  };
  
  // Handle month change for charts and calendar
  const handleMonthChange = (month: number, year: number) => {
    setViewMonth(month);
    setViewYear(year);
    
    // Also update all chart months
    setChartMonths({
      sleep: { month, year },
      gym: { month, year },
      alcohol: { month, year },
      meditation: { month, year }
    });
  };
  
  // Handle individual chart month change
  const handleChartMonthChange = (type: HabitType, month: number, year: number) => {
    setChartMonths(prev => ({
      ...prev,
      [type]: { month, year }
    }));
  };
  
  // Get goals for current view month
  const currentMonthGoals = getMonthGoals(habitsState, viewYear, viewMonth);
  
  // Calculate stats for each habit type
  const sleepStats = calculateHabitStats(habitsState, "sleep");
  const gymStats = calculateHabitStats(habitsState, "gym");
  const alcoholStats = calculateHabitStats(habitsState, "alcohol");
  const meditationStats = calculateHabitStats(habitsState, "meditation");
  
  // Get weekly stats for each habit type with their respective months
  const sleepWeeklyStats = getMonthlyWeeklyStats(habitsState, "sleep", chartMonths.sleep.year, chartMonths.sleep.month);
  const gymWeeklyStats = getMonthlyWeeklyStats(habitsState, "gym", chartMonths.gym.year, chartMonths.gym.month);
  const alcoholWeeklyStats = getMonthlyWeeklyStats(habitsState, "alcohol", chartMonths.alcohol.year, chartMonths.alcohol.month);
  const meditationWeeklyStats = getMonthlyWeeklyStats(habitsState, "meditation", chartMonths.meditation.year, chartMonths.meditation.month);

  // Show loading state while fetching data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-blue-light/10 flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-dark mb-4" />
        <h2 className="text-xl font-medium text-blue-dark">Loading your habits...</h2>
        <p className="text-gray-600 mt-2">Syncing data across your devices</p>
      </div>
    );
  }

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
        {/* Month Slider for Charts and Calendar */}
        <div className="mb-4">
          <MonthSlider
            viewMonth={viewMonth}
            viewYear={viewYear}
            onChange={handleMonthChange}
          />
        </div>
        
        {/* Goals Section */}
        <div className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">Your Monthly Goals</h2>
          <GoalSetting 
            goals={currentMonthGoals}
            viewMonth={viewMonth}
            viewYear={viewYear}
            onUpdateGoal={handleUpdateGoal}
          />
        </div>
        
        {/* Calendar Section */}
        <div className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">Your Monthly Calendar</h2>
          <div className="bg-white rounded-lg shadow-md p-4">
            <Calendar
              days={habitsState.days}
              onUpdateHabit={handleUpdateHabit}
              viewMonth={viewMonth}
              viewYear={viewYear}
            />
          </div>
        </div>
        
        {/* Stats section with integrated charts */}
        <div className="mt-8 mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">Your Progress Stats</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Sleep */}
            <HabitStats 
              habitType="sleep" 
              stats={sleepStats} 
              goal={currentMonthGoals.sleep} 
              weeklyData={sleepWeeklyStats}
              viewMonth={chartMonths.sleep.month}
              viewYear={chartMonths.sleep.year}
              onMonthChange={(month, year) => handleChartMonthChange("sleep", month, year)}
            />
            
            {/* Gym */}
            <HabitStats 
              habitType="gym" 
              stats={gymStats} 
              goal={currentMonthGoals.gym} 
              weeklyData={gymWeeklyStats}
              viewMonth={chartMonths.gym.month}
              viewYear={chartMonths.gym.year}
              onMonthChange={(month, year) => handleChartMonthChange("gym", month, year)}
            />
            
            {/* Alcohol */}
            <HabitStats 
              habitType="alcohol" 
              stats={alcoholStats} 
              goal={currentMonthGoals.alcohol} 
              weeklyData={alcoholWeeklyStats}
              viewMonth={chartMonths.alcohol.month}
              viewYear={chartMonths.alcohol.year}
              onMonthChange={(month, year) => handleChartMonthChange("alcohol", month, year)}
            />
            
            {/* Meditation */}
            <HabitStats 
              habitType="meditation" 
              stats={meditationStats} 
              goal={currentMonthGoals.meditation} 
              weeklyData={meditationWeeklyStats}
              viewMonth={chartMonths.meditation.month}
              viewYear={chartMonths.meditation.year}
              onMonthChange={(month, year) => handleChartMonthChange("meditation", month, year)}
            />
          </div>
        </div>
        
        {/* Motivational section */}
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
