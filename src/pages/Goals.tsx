
import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react";
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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

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

  const toggleSection = (subcategory: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [subcategory]: !prev[subcategory]
    }));
  };

  const addSubcategory = (name: string) => {
    setSubcategories(prev => [...prev, name]);
  };

  const removeSubcategory = (name: string) => {
    setSubcategories(prev => prev.filter(sub => sub !== name));
    setExpandedSections(prev => {
      const newState = { ...prev };
      delete newState[name];
      return newState;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to="/">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{currentConfig.title}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Subcategory Manager */}
        <SubcategoryManager
          subcategories={subcategories}
          onAdd={addSubcategory}
          onRemove={removeSubcategory}
        />

        {/* Goals Sections */}
        <div className="space-y-6">
          {subcategories.map((subcategory) => (
            <Card key={subcategory} className="overflow-hidden">
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => toggleSection(subcategory)}
              >
                <CardTitle className="flex items-center justify-between">
                  <span>{subcategory}</span>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      {expandedSections[subcategory] ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-1" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-1" />
                          Show
                        </>
                      )}
                    </Button>
                    {expandedSections[subcategory] ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              
              {expandedSections[subcategory] && (
                <CardContent className="space-y-6">
                  {/* Goal Timeframes */}
                  <GoalTimeframes subcategory={subcategory} />
                  
                  {/* Weekly Tracker */}
                  <WeeklyTracker subcategory={subcategory} />
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Goals;
