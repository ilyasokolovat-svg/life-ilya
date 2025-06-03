
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Heart,
  LogOut,
  User,
  Target
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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

      <main className="container mx-auto px-4 py-12">
        {/* Main Navigation Cards */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Your Journey</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* Healthy Life Card */}
            <Link to="/habits">
              <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 border-0 shadow-lg">
                <CardHeader className="text-center pb-6">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <Heart className="w-10 h-10 text-white" />
                  </div>
                  <CardTitle className="text-3xl font-bold text-gray-800">Healthy Life</CardTitle>
                </CardHeader>
                <CardContent className="text-center pb-8">
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Track your daily habits and build a foundation for lasting health and wellness
                  </p>
                </CardContent>
              </Card>
            </Link>

            {/* Goals Card */}
            <Link to="/goals">
              <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 border-0 shadow-lg">
                <CardHeader className="text-center pb-6">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <Target className="w-10 h-10 text-white" />
                  </div>
                  <CardTitle className="text-3xl font-bold text-gray-800">Goals</CardTitle>
                </CardHeader>
                <CardContent className="text-center pb-8">
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Plan and track your goals across career, business, investments, and skills
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Summary Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border-0">
          <h2 className="text-3xl font-bold mb-8 flex items-center justify-center">
            <Target className="w-8 h-8 mr-3 text-blue-600" />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              2025 Vision
            </span>
          </h2>
          
          <div className="text-center">
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              "The difference between who you are and who you want to be is what you do."
            </p>
            <p className="text-lg text-gray-500 mt-4">
              Your journey starts with a single step. Take it today.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
