
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, User, LogOut, ChevronLeft, ChevronRight, Utensils } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface MealPlan {
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string;
}

interface WeeklyMealPlan {
  [key: string]: MealPlan;
}

const MealPlanning = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Get current week start date (Monday)
  const getCurrentWeekStart = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff));
  };

  const [currentWeekStart, setCurrentWeekStart] = useState(getCurrentWeekStart());
  const [mealPlans, setMealPlans] = useState<WeeklyMealPlan>({});

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const mealTypes = [
    { key: 'breakfast', label: 'Breakfast', icon: '🍳' },
    { key: 'lunch', label: 'Lunch', icon: '🥗' },
    { key: 'dinner', label: 'Dinner', icon: '🍽️' },
    { key: 'snacks', label: 'Snacks', icon: '🍎' }
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDateKey = (dayIndex: number) => {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + dayIndex);
    return date.toISOString().split('T')[0];
  };

  const getWeekDateRange = () => {
    const endDate = new Date(currentWeekStart);
    endDate.setDate(currentWeekStart.getDate() + 6);
    return `${formatDate(currentWeekStart)} - ${formatDate(endDate)}`;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(currentWeekStart.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newDate);
  };

  const updateMealPlan = (dateKey: string, mealType: string, value: string) => {
    setMealPlans(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        [mealType]: value
      }
    }));
  };

  const getMealPlan = (dateKey: string, mealType: string) => {
    return mealPlans[dateKey]?.[mealType as keyof MealPlan] || '';
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-green-50">
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
                    className="text-gray-600 hover:text-green-600"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Back to Dashboard</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <div className="flex items-center gap-2">
              <Utensils className="h-6 w-6 text-green-600" />
              <h1 className="text-2xl md:text-3xl font-bold text-green-700">Meal Planning</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
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
          <p className="text-center text-gray-600 text-sm md:text-base">Plan your meals for a healthier week ahead</p>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        {/* Week Navigation */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek('prev')}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous Week
          </Button>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800">{getWeekDateRange()}</h2>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek('next')}
            className="flex items-center gap-1"
          >
            Next Week
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Weekly Meal Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          {days.map((day, dayIndex) => {
            const dateKey = getDateKey(dayIndex);
            const date = new Date(currentWeekStart);
            date.setDate(currentWeekStart.getDate() + dayIndex);
            
            return (
              <Card key={day} className="h-fit">
                <CardHeader className="pb-3">
                  <CardTitle className="text-center text-sm font-medium">
                    <div className="text-green-700 font-semibold">{day}</div>
                    <div className="text-xs text-gray-500 mt-1">{formatDate(date)}</div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-3">
                  {mealTypes.map((meal) => (
                    <div key={meal.key} className="space-y-1">
                      <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                        <span>{meal.icon}</span>
                        {meal.label}
                      </label>
                      <Textarea
                        placeholder={`Plan your ${meal.label.toLowerCase()}...`}
                        value={getMealPlan(dateKey, meal.key)}
                        onChange={(e) => updateMealPlan(dateKey, meal.key, e.target.value)}
                        className="min-h-[60px] text-xs resize-none"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tips Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg text-green-700">Meal Planning Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-800 mb-1">🛒 Prep Smart</h4>
                <p>Plan meals that share ingredients to reduce waste and shopping time.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-1">⏰ Batch Cook</h4>
                <p>Prepare larger portions on weekends that can be used throughout the week.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-1">🌈 Balance</h4>
                <p>Include a variety of colors and nutrients in your daily meals.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-1">📱 Keep It Simple</h4>
                <p>Start with simple recipes and gradually try more complex ones.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-1">🥗 Include Snacks</h4>
                <p>Plan healthy snacks to avoid impulsive food choices during the day.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-1">💧 Stay Hydrated</h4>
                <p>Don't forget to plan for adequate water intake throughout your day.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default MealPlanning;
