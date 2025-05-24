
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  Briefcase, 
  DollarSign, 
  GraduationCap,
  Calendar,
  Target
} from "lucide-react";

const Dashboard = () => {
  const categories = [
    {
      id: "career",
      title: "Career",
      icon: Briefcase,
      color: "bg-blue-500",
      subcategories: ["Commission/Bonus/Dividends", "Quota Achievement", "Salary/Income", "Promotion", "Sales Skills"]
    },
    {
      id: "business",
      title: "Business",
      icon: TrendingUp,
      color: "bg-green-500",
      subcategories: ["TT Website", "TT Instagram Organic", "TT Ads", "Selo Olive Oil", "Real Estate Projects"]
    },
    {
      id: "investments",
      title: "Investments",
      icon: DollarSign,
      color: "bg-purple-500",
      subcategories: ["Crypto", "ETFs", "Monthly Investment"]
    },
    {
      id: "skills",
      title: "Skills Development",
      icon: GraduationCap,
      color: "bg-orange-500",
      subcategories: ["Spanish Language", "Arabic Language", "Golf", "Yachting", "Networking", "Sales Skills", "Books"]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-gray-900 text-center">
            Goals and Habit Tracking 2025
          </h1>
          <p className="text-center text-gray-600 mt-2">
            Track your journey across all areas of life
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Habit Tracker Card */}
          <Link to="/habits">
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl">Habit Tracker</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Track your daily habits and build consistency
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Goal Category Cards */}
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Link key={category.id} to={`/goals/${category.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="text-center">
                    <div className={`mx-auto w-12 h-12 ${category.color} rounded-full flex items-center justify-center mb-4`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{category.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {category.subcategories.slice(0, 3).map((sub, index) => (
                        <p key={index} className="text-sm text-gray-600">
                          • {sub}
                        </p>
                      ))}
                      {category.subcategories.length > 3 && (
                        <p className="text-sm text-gray-500">
                          +{category.subcategories.length - 3} more
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Summary Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <Target className="w-6 h-6 mr-2" />
            2025 Goals Summary
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <div key={category.id} className="p-4 rounded-lg border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3">{category.title}</h3>
                <div className="space-y-2">
                  <div className="bg-blue-50 p-2 rounded">
                    <p className="text-xs text-gray-600">2025 Goal</p>
                    <p className="text-sm font-medium">To be set</p>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <p className="text-xs text-gray-600">Current Status</p>
                    <p className="text-sm font-medium">Starting</p>
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
