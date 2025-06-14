
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Target,
  Heart,
  LogOut,
  User,
  Utensils
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import WeeklySummaryDashboard from "@/components/WeeklySummaryDashboard";
import TestDataLoader from "@/components/TestDataLoader";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <TestDataLoader />
      
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-start mb-4">
            <div className="text-center flex-1">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Goals and Habit Tracking 2025
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Track your journey across all areas of life and build the future you envision
              </p>
            </div>
            
            {/* User controls */}
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
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Main Navigation Bubbles - Moved to top */}
        <div className="flex justify-center items-center gap-12 mb-12">
          {/* Healthy Life Bubble */}
          <Link to="/habits">
            <div className="group relative">
              <div className="w-44 h-44 bg-gradient-to-br from-red-500 via-pink-500 to-red-600 rounded-full flex items-center justify-center shadow-2xl transform transition-all duration-300 hover:scale-110 hover:shadow-3xl cursor-pointer">
                <div className="text-center">
                  <Heart className="w-14 h-14 text-white mb-3 mx-auto" />
                  <h2 className="text-xl font-bold text-white">Healthy Life</h2>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-pink-400 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </div>
          </Link>

          {/* Meal Planning Bubble */}
          <Link to="/meal-planning">
            <div className="group relative">
              <div className="w-44 h-44 bg-gradient-to-br from-green-500 via-emerald-500 to-green-600 rounded-full flex items-center justify-center shadow-2xl transform transition-all duration-300 hover:scale-110 hover:shadow-3xl cursor-pointer">
                <div className="text-center">
                  <Utensils className="w-14 h-14 text-white mb-3 mx-auto" />
                  <h2 className="text-xl font-bold text-white">Meal Planning</h2>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </div>
          </Link>

          {/* Goals Bubble */}
          <Link to="/goals-overview">
            <div className="group relative">
              <div className="w-44 h-44 bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600 rounded-full flex items-center justify-center shadow-2xl transform transition-all duration-300 hover:scale-110 hover:shadow-3xl cursor-pointer">
                <div className="text-center">
                  <Target className="w-14 h-14 text-white mb-3 mx-auto" />
                  <h2 className="text-xl font-bold text-white">Goals</h2>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </div>
          </Link>
        </div>

        {/* Weekly Summary Dashboard */}
        <div className="max-w-4xl mx-auto">
          <WeeklySummaryDashboard />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
