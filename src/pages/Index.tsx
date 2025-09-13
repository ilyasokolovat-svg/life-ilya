
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Calendar from "@/components/Calendar";
import HabitStats from "@/components/HabitStats";
import MonthSlider from "@/components/MonthSlider";
import GoalSetting from "@/components/GoalSetting";
import { HabitType, HabitData, HabitGoal } from "@/types/habit";
import { 
  calculateHabitStats, 
  getDubaiDate,
  formatYearMonth,
  getMonthGoals
} from "@/utils/habitUtils";
import { getDubaiDate as getDubaiDateFromUtils, formatDateISO, getTodayISO } from "@/utils/dateUtils";
import { getMonthlyWeeklyStats } from "@/utils/chartUtils";
import { Moon, Dumbbell, Wine, Brain, Users, Cloud, CloudOff, LogOut, User, Save, ArrowLeft } from "lucide-react";
import useHabits from "@/hooks/useHabits";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import GymPlanning from "@/components/GymPlanning";
import SocialPlanning from "@/components/SocialPlanning";
import TodayHabits from "@/components/TodayHabits";

const Index = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  // Use our hybrid habits hook
  const { habitsState, updateDay, updateGoal, syncEnabled, toggleSync, isSyncing, forceSyncToCloud } = useHabits();

  // Track current view month/year for charts and calendar using Dubai timezone
  const dubaiDate = getDubaiDateFromUtils();
  const [viewMonth, setViewMonth] = useState(dubaiDate.getMonth());
  const [viewYear, setViewYear] = useState(dubaiDate.getFullYear());
  
  // Track individual chart months/years
  const [chartMonths, setChartMonths] = useState({
    sleep: { month: viewMonth, year: viewYear },
    gym: { month: viewMonth, year: viewYear },
    alcohol: { month: viewMonth, year: viewYear },
    meditation: { month: viewMonth, year: viewYear },
    social: { month: viewMonth, year: viewYear }
  });

  const handleUpdateHabit = (date: Date, type: HabitType, data: HabitData) => {
    updateDay(date, type, data);
  };

  const handleUpdateLocation = (date: Date, location: string) => {
    const dateISO = formatDateISO(date);
    
    // Get existing day data or create new one
    const existingData = habitsState.days[dateISO] || {
      date: dateISO,
      gym: { planned: false, completed: false },
      alcohol: { planned: false, completed: false },
      sleep: { planned: false, completed: false },
      meditation: { planned: false, completed: false },
      social: { planned: false, completed: false }
    };
    
    // Update the habits state directly (local storage only, no sync needed for location)
    habitsState.days[dateISO] = { ...existingData, location };
    
    // Trigger a re-render by updating a habit (we'll use sleep as it's least disruptive)
    updateDay(date, 'sleep', existingData.sleep);
  };

  const handleUpdateGoal = (type: HabitType, goal: HabitGoal) => {
    updateGoal(type, goal, viewYear, viewMonth);
  };
  
  // Add new handler for gym planning updates including calories
  const handleUpdateGymPlan = (dateISO: string, workoutType: string, location: string, calories?: string) => {
    const date = new Date(dateISO);
    const existingData = habitsState.days[dateISO]?.gym || { planned: false, completed: false };
    
    const updatedData = {
      ...existingData,
      workoutType,
      location,
      ...(calories !== undefined && { calories })
    };
    
    updateDay(date, 'gym', updatedData);
  };
  
  // Add new handler for social planning updates
  const handleUpdateSocialPlan = (dateISO: string, socialEvent: string, location: string, socialPerson?: string) => {
    const date = new Date(dateISO);
    const existingData = habitsState.days[dateISO]?.social || { planned: false, completed: false };
    
    const updatedData = {
      ...existingData,
      socialEvent,
      location,
      ...(socialPerson !== undefined && { socialPerson })
    };
    
    updateDay(date, 'social', updatedData);
  };
  
  // Handle month change for charts and calendar with better bounds checking
  const handleMonthChange = (month: number, year: number) => {
    // Ensure we don't go beyond reasonable bounds
    const minYear = 2020;
    const maxYear = getDubaiDateFromUtils().getFullYear() + 1;
    
    if (year < minYear || year > maxYear) {
      console.warn(`Year ${year} is out of bounds (${minYear}-${maxYear})`);
      return;
    }
    
    if (month < 0 || month > 11) {
      console.warn(`Month ${month} is out of bounds (0-11)`);
      return;
    }
    
    setViewMonth(month);
    setViewYear(year);
    
    // Also update all chart months
    setChartMonths({
      sleep: { month, year },
      gym: { month, year },
      alcohol: { month, year },
      meditation: { month, year },
      social: { month, year }
    });
  };
  
  // Handle individual chart month change
  const handleChartMonthChange = (type: HabitType, month: number, year: number) => {
    setChartMonths(prev => ({
      ...prev,
      [type]: { month, year }
    }));
  };
  
  // Get goals for current view month - ensure defaults exist
  const currentMonthGoals = getMonthGoals(habitsState, viewYear, viewMonth);
  
  // Calculate stats for each habit type - now month-specific
  const sleepStats = calculateHabitStats(habitsState, "sleep", viewYear, viewMonth);
  const gymStats = calculateHabitStats(habitsState, "gym", viewYear, viewMonth);
  const alcoholStats = calculateHabitStats(habitsState, "alcohol", viewYear, viewMonth);
  const meditationStats = calculateHabitStats(habitsState, "meditation", viewYear, viewMonth);
  const socialStats = calculateHabitStats(habitsState, "social", viewYear, viewMonth);

  // Create habit stats object for GoalSetting
  const habitStats = {
    sleep: sleepStats,
    gym: gymStats,
    alcohol: alcoholStats,
    meditation: meditationStats,
    social: socialStats
  };
  
  // Get weekly stats for each habit type with their respective months
  const sleepWeeklyStats = getMonthlyWeeklyStats(habitsState, "sleep", chartMonths.sleep.year, chartMonths.sleep.month);
  const gymWeeklyStats = getMonthlyWeeklyStats(habitsState, "gym", chartMonths.gym.year, chartMonths.gym.month);
  const alcoholWeeklyStats = getMonthlyWeeklyStats(habitsState, "alcohol", chartMonths.alcohol.year, chartMonths.alcohol.month);
  const meditationWeeklyStats = getMonthlyWeeklyStats(habitsState, "meditation", chartMonths.meditation.year, chartMonths.meditation.month);
  const socialWeeklyStats = getMonthlyWeeklyStats(habitsState, "social", chartMonths.social.year, chartMonths.social.month);

  // Toggle cloud sync
  const handleToggleSync = () => {
    toggleSync(!syncEnabled);
  };

  // Handle save changes
  const handleSaveChanges = () => {
    forceSyncToCloud();
  };

  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    navigate('/');
  };

  // Get today's data using Dubai timezone consistently
  const todayISO = getTodayISO();
  const todayData = habitsState.days[todayISO] || null;

  console.log('Index: Today is (Dubai timezone):', todayISO, 'Data:', todayData);

  return (
    <div className="min-h-screen bg-blue-light/10 pb-12">
      <Toaster />
      
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {/* Back to Dashboard Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToDashboard}
                    className="text-gray-600 hover:text-blue-600"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Back to Dashboard</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <h1 className="text-2xl md:text-3xl font-bold text-blue-dark">Habit Tracker</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Save Changes Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveChanges}
                    disabled={!syncEnabled || isSyncing}
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Save className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {isSyncing ? 'Saving...' : 'Save Changes'}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Save all changes from this device to cloud</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* User info */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{user?.email}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Logged in as {user?.email}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Sync toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex items-center gap-1 ${syncEnabled ? 'text-green-600' : 'text-gray-400'}`}
                    onClick={handleToggleSync}
                    disabled={isSyncing}
                  >
                    {syncEnabled ? (
                      <>
                        <Cloud className="h-4 w-4" />
                        <span className="text-xs hidden sm:inline">Sync On</span>
                      </>
                    ) : (
                      <>
                        <CloudOff className="h-4 w-4" />
                        <span className="text-xs hidden sm:inline">Sync Off</span>
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{syncEnabled ? 'Disable' : 'Enable'} cloud sync across devices</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Sign out */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="text-gray-600 hover:text-red-600"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sign out</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        <div className="container mx-auto px-4 pb-2">
          <p className="text-center text-gray-600 text-sm md:text-base">Track your journey to become a better version of yourself</p>
          <p className="text-center text-gray-500 text-xs">Dubai Time (GMT+4): {dubaiDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
          })}</p>
        </div>
      </header>
      
      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        {/* Today's Habits Section - Mobile Friendly */}
        <TodayHabits 
          todayData={todayData}
          onUpdateHabit={handleUpdateHabit}
        />
        
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
            habitStats={habitStats}
            habitsState={habitsState}
          />
        </div>
        
        {/* Calendar Section */}
        <div className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">Your Monthly Calendar</h2>
          <div className="bg-white rounded-lg shadow-md p-4">
            <Calendar
              days={habitsState.days}
              onUpdateHabit={handleUpdateHabit}
              onUpdateLocation={handleUpdateLocation}
              viewMonth={viewMonth}
              viewYear={viewYear}
            />
          </div>
        </div>
        
        {/* Stats section with integrated charts */}
        <div className="mt-8 mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">Your Progress Stats</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Sleep */}
            <HabitStats 
              habitType="sleep" 
              stats={sleepStats} 
              goal={currentMonthGoals.sleep} 
              weeklyData={sleepWeeklyStats}
              viewMonth={chartMonths.sleep.month}
              viewYear={chartMonths.sleep.year}
              onMonthChange={(month, year) => handleChartMonthChange("sleep", month, year)}
              habitsState={habitsState}
            />
            
            {/* Gym - ADD habitsState prop */}
            <HabitStats 
              habitType="gym" 
              stats={gymStats} 
              goal={currentMonthGoals.gym} 
              weeklyData={gymWeeklyStats}
              viewMonth={chartMonths.gym.month}
              viewYear={chartMonths.gym.year}
              onMonthChange={(month, year) => handleChartMonthChange("gym", month, year)}
              habitsState={habitsState}
            />
            
            {/* Alcohol - ADD habitsState prop */}
            <HabitStats 
              habitType="alcohol" 
              stats={alcoholStats} 
              goal={currentMonthGoals.alcohol} 
              weeklyData={alcoholWeeklyStats}
              viewMonth={chartMonths.alcohol.month}
              viewYear={chartMonths.alcohol.year}
              onMonthChange={(month, year) => handleChartMonthChange("alcohol", month, year)}
              habitsState={habitsState}
            />
            
            {/* Meditation - ADD habitsState prop */}
            <HabitStats 
              habitType="meditation" 
              stats={meditationStats} 
              goal={currentMonthGoals.meditation} 
              weeklyData={meditationWeeklyStats}
              viewMonth={chartMonths.meditation.month}
              viewYear={chartMonths.meditation.year}
              onMonthChange={(month, year) => handleChartMonthChange("meditation", month, year)}
              habitsState={habitsState}
            />
            
            {/* Social - ADD habitsState prop */}
            <HabitStats 
              habitType="social" 
              stats={socialStats} 
              goal={currentMonthGoals.social} 
              weeklyData={socialWeeklyStats}
              viewMonth={chartMonths.social.month}
              viewYear={chartMonths.social.year}
              onMonthChange={(month, year) => handleChartMonthChange("social", month, year)}
              habitsState={habitsState}
            />
          </div>
        </div>
        
        {/* Gym Planning Section */}
        <div className="mt-8 mb-8">
          <GymPlanning 
            habitsState={habitsState}
            viewMonth={viewMonth}
            viewYear={viewYear}
            onUpdateGymPlan={handleUpdateGymPlan}
          />
        </div>
        
        {/* Social Planning Section */}
        <div className="mt-8 mb-8">
          <SocialPlanning 
            habitsState={habitsState}
            viewMonth={viewMonth}
            viewYear={viewYear}
            onUpdateSocialPlan={handleUpdateSocialPlan}
          />
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
            <div className="flex flex-col items-center">
              <div className="bg-blue-light p-4 rounded-full mb-2">
                <Users className="h-8 w-8 text-blue-dark" />
              </div>
              <p className="text-sm">Stay Social</p>
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
