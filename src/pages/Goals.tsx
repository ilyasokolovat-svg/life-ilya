
import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Settings } from "lucide-react";
import GoalTimeframes from "@/components/goals/GoalTimeframes";
import WeeklyTracker from "@/components/goals/WeeklyTracker";
import SubcategoryManager from "@/components/goals/SubcategoryManager";

const Goals = () => {
  const { category } = useParams<{ category: string }>();
  
  const categoryConfig = {
    career: {
      title: "Career Goals",
      subcategories: ["Commission/Bonus/Dividends", "Quota Achievement", "Salary/Income", "Promotion", "Sales Skills"]
    },
    business: {
      title: "Business Goals", 
      subcategories: ["TT Website", "TT Instagram Organic", "TT Ads", "Selo Olive Oil", "Real Estate Projects"]
    },
    investments: {
      title: "Investment Goals",
      subcategories: ["Crypto", "ETFs", "Monthly Investment"]
    },
    skills: {
      title: "Skills Development Goals",
      subcategories: ["Spanish Language", "Arabic Language", "Golf", "Yachting", "Networking", "Sales Skills", "Books"]
    }
  };

  const [subcategories, setSubcategories] = useState(
    categoryConfig[category as keyof typeof categoryConfig]?.subcategories || []
  );

  const currentConfig = categoryConfig[category as keyof typeof categoryConfig];

  if (!currentConfig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Category not found</h1>
          <Link to="/">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const addSubcategory = (name: string) => {
    setSubcategories(prev => [...prev, name]);
  };

  const removeSubcategory = (name: string) => {
    setSubcategories(prev => prev.filter(sub => sub !== name));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to="/">
                <Button variant="ghost" size="sm" className="mr-4 hover:bg-gray-100">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {currentConfig.title}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Subcategory Manager */}
        <SubcategoryManager
          subcategories={subcategories}
          onAdd={addSubcategory}
          onRemove={removeSubcategory}
        />

        {/* Combined Goal Timeframes for all subcategories */}
        <Card className="mb-8 shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
            <CardTitle className="text-xl font-bold text-gray-800">Goal Planning & Review</CardTitle>
            <p className="text-gray-600">Set and track your goals across all timeframes</p>
          </CardHeader>
          <CardContent className="p-6">
            <GoalTimeframes subcategories={subcategories} />
          </CardContent>
        </Card>

        {/* Combined Weekly Tracker for all subcategories */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
            <CardTitle className="text-xl font-bold text-gray-800">Weekly Progress Tracking</CardTitle>
            <p className="text-gray-600">Monitor your weekly progress and monthly reviews</p>
          </CardHeader>
          <CardContent className="p-6">
            <WeeklyTracker subcategories={subcategories} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Goals;
