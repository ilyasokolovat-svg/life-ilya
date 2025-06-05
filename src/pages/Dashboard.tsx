
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Target, TrendingUp, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import WeeklyDashboard from "@/components/WeeklyDashboard";

const Dashboard = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Personal Growth Dashboard
            </h1>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{user?.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
          <p className="mt-2 text-gray-600">Track your habits and achieve your goals</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          {/* Healthy Life Card */}
          <Link to="/habits">
            <Card className="group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-2xl font-bold flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                      <Target className="w-6 h-6" />
                    </div>
                    Healthy Life
                  </div>
                  <ArrowRight className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-100 mb-4">
                  Track your daily habits: sleep, exercise, meditation, and mindful living
                </p>
                <div className="flex items-center text-sm text-blue-200">
                  <span>Start tracking →</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Goals Card */}
          <Link to="/goals-overview">
            <Card className="group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-2xl font-bold flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    Goals
                  </div>
                  <ArrowRight className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-100 mb-4">
                  Set and track your career, business, investment, and skill development goals
                </p>
                <div className="flex items-center text-sm text-purple-200">
                  <span>Manage goals →</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Weekly Dashboard */}
        <div className="max-w-4xl mx-auto mb-12">
          <WeeklyDashboard />
        </div>

        {/* Additional Stats or Info */}
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800">Welcome Back!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Your personal growth journey continues. Use the tools above to track your daily habits 
                and work towards your long-term goals.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Habit Tracking</h4>
                  <p className="text-sm text-blue-600">
                    Monitor sleep, exercise, meditation, and mindfulness daily
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-800 mb-2">Goal Management</h4>
                  <p className="text-sm text-purple-600">
                    Set quarterly and monthly targets across all life areas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
