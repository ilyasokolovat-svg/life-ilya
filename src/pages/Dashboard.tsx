
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  TrendingUp, 
  Briefcase, 
  DollarSign, 
  GraduationCap,
  Calendar,
  Target,
  Heart,
  LogOut,
  User
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

  const categories = [
    {
      id: "career",
      title: "Career",
      icon: Briefcase,
      color: "bg-blue-500",
      hoverColor: "hover:bg-blue-600",
      subcategories: ["Commission/Bonus/Dividends", "Quota Achievement", "Salary/Income", "Promotion", "Sales Skills"]
    },
    {
      id: "business",
      title: "Business",
      icon: TrendingUp,
      color: "bg-green-500",
      hoverColor: "hover:bg-green-600",
      subcategories: ["TT Website", "TT Instagram Organic", "TT Ads", "Selo Olive Oil", "Real Estate Projects"]
    },
    {
      id: "investments",
      title: "Investments",
      icon: DollarSign,
      color: "bg-purple-500",
      hoverColor: "hover:bg-purple-600",
      subcategories: ["Crypto", "ETFs", "Monthly Investment"]
    },
    {
      id: "skills",
      title: "Skills Development",
      icon: GraduationCap,
      color: "bg-orange-500",
      hoverColor: "hover:bg-orange-600",
      subcategories: ["Spanish Language", "Arabic Language", "Golf", "Yachting", "Networking", "Sales Skills", "Books"]
    }
  ];

  const summaryCategories = [
    ...categories,
    {
      id: "sport-health",
      title: "Sport & Health",
      icon: Heart,
      color: "bg-red-500",
      hoverColor: "hover:bg-red-600",
      subcategories: ["Gym", "Sleep", "Meditation", "Alcohol Abstinence"]
    }
  ];

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
        {/* Navigation Cards */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Your Journey Areas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Healthy Life Card */}
            <Link to="/habits">
              <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 border-0 shadow-lg">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-800">Healthy Life</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Track your daily habits and build a foundation for lasting health and wellness
                  </p>
                </CardContent>
              </Card>
            </Link>

            {/* Goal Category Cards */}
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Link key={category.id} to={`/goals/${category.id}`}>
                  <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 border-0 shadow-lg">
                    <CardHeader className="text-center pb-4">
                      <div className={`mx-auto w-16 h-16 ${category.color} ${category.hoverColor} rounded-2xl flex items-center justify-center mb-6 shadow-lg transition-colors duration-300`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <CardTitle className="text-2xl font-bold text-gray-800">{category.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {category.subcategories.slice(0, 3).map((sub, index) => (
                          <p key={index} className="text-sm text-gray-600 flex items-center">
                            <span className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mr-3"></span>
                            {sub}
                          </p>
                        ))}
                        {category.subcategories.length > 3 && (
                          <p className="text-sm text-gray-500 font-medium">
                            +{category.subcategories.length - 3} more areas
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Summary Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border-0">
          <h2 className="text-3xl font-bold mb-8 flex items-center justify-center">
            <Target className="w-8 h-8 mr-3 text-blue-600" />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              2025 Goals Overview
            </span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {summaryCategories.map((category) => (
              <div key={category.id} className="group">
                <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 group-hover:border-blue-300">
                  <div className="flex items-center mb-4">
                    <div className={`w-10 h-10 ${category.color} rounded-lg flex items-center justify-center mr-3 shadow-md`}>
                      <category.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">{category.title}</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                      <p className="text-xs font-medium text-blue-700 mb-1">2025 Goal</p>
                      <p className="text-sm font-bold text-blue-900">To be defined</p>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                      <p className="text-xs font-medium text-green-700 mb-1">Current Status</p>
                      <p className="text-sm font-bold text-green-900">Getting Started</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
