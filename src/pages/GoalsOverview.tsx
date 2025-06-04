
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Pencil } from "lucide-react";
import GoalEditDialog from "@/components/goals/GoalEditDialog";
import { useGoalsData } from "@/hooks/useGoalsData";

const GoalsOverview = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [editingPeriod, setEditingPeriod] = useState<{ 
    category: string; 
    subcategory: string; 
    period: string; 
    periodType: 'quarter' | 'year' 
  } | null>(null);

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

  const quarters = [
    { key: "q1_2025", label: "Q1 2025" },
    { key: "q2_2025", label: "Q2 2025" },
    { key: "q3_2025", label: "Q3 2025" },
    { key: "q4_2025", label: "Q4 2025" }
  ];

  const years = [
    { key: "year_2025", label: "2025" },
    { key: "year_2026", label: "2026" },
    { key: "year_2030", label: "2030" }
  ];

  const allPeriods = [...quarters, ...years];
  const weeks = [1, 2, 3, 4];

  const { goalsData } = useGoalsData(selectedCategory || '');

  const getGoalData = (subcategory: string, periodKey: string) => {
    return goalsData.find(
      goal => goal.subcategory === subcategory && goal.period_key === periodKey
    );
  };

  const handleCategoryClick = (categoryKey: string) => {
    setSelectedCategory(selectedCategory === categoryKey ? null : categoryKey);
    setSelectedSubcategory(null);
    setSelectedPeriod(null);
  };

  const handleSubcategoryClick = (subcategory: string) => {
    setSelectedSubcategory(selectedSubcategory === subcategory ? null : subcategory);
    setSelectedPeriod(null);
  };

  const handlePeriodClick = (periodKey: string) => {
    if (quarters.some(q => q.key === periodKey)) {
      setSelectedPeriod(selectedPeriod === periodKey ? null : periodKey);
    }
  };

  const handleEditClick = (subcategory: string, period: string, periodType: 'quarter' | 'year') => {
    if (selectedCategory) {
      setEditingPeriod({ category: selectedCategory, subcategory, period, periodType });
    }
  };

  const selectedConfig = selectedCategory ? categoryConfig[selectedCategory as keyof typeof categoryConfig] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-center">
            Goals Planning
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-12">
          {/* Main Categories */}
          <div className="flex justify-center items-center gap-8 flex-wrap">
            {Object.entries(categoryConfig).map(([key, config]) => (
              <Card 
                key={key}
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg min-w-[200px] ${
                  selectedCategory === key 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleCategoryClick(key)}
              >
                <CardContent className="p-6 text-center">
                  <Target className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <h3 className="font-bold text-lg">{config.title}</h3>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Connecting Line to Subcategories */}
          {selectedCategory && selectedConfig && (
            <>
              <div className="flex justify-center">
                <div className="w-0.5 h-8 bg-gray-400"></div>
              </div>

              {/* Subcategories */}
              <div className="relative">
                {/* Horizontal Line */}
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-4/5 h-0.5 bg-gray-400"></div>
                
                <div className="flex justify-center items-start gap-4 overflow-x-auto pb-4">
                  {selectedConfig.subcategories.map((subcategory) => (
                    <div key={subcategory} className="flex flex-col items-center">
                      {/* Vertical connection line */}
                      <div className="w-0.5 h-6 bg-gray-400"></div>
                      
                      <Card 
                        className={`cursor-pointer transition-all duration-300 hover:shadow-lg min-w-[150px] ${
                          selectedSubcategory === subcategory 
                            ? 'ring-2 ring-green-500 bg-green-50' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleSubcategoryClick(subcategory)}
                      >
                        <CardContent className="p-4 text-center">
                          <h4 className="font-semibold text-sm">{subcategory}</h4>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Time Periods */}
          {selectedSubcategory && selectedCategory && (
            <>
              <div className="flex justify-center">
                <div className="w-0.5 h-8 bg-gray-400"></div>
              </div>

              <div className="relative">
                {/* Horizontal Line */}
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-4/5 h-0.5 bg-gray-400"></div>
                
                <div className="flex justify-center items-start gap-4 overflow-x-auto pb-4">
                  {allPeriods.map((period) => {
                    const goalData = getGoalData(selectedSubcategory, period.key);
                    const isQuarter = quarters.some(q => q.key === period.key);
                    const periodType = isQuarter ? 'quarter' : 'year';
                    
                    return (
                      <div key={period.key} className="flex flex-col items-center">
                        {/* Vertical connection line */}
                        <div className="w-0.5 h-6 bg-gray-400"></div>
                        
                        <Card 
                          className={`cursor-pointer transition-all duration-300 hover:shadow-lg min-w-[120px] group ${
                            selectedPeriod === period.key 
                              ? 'ring-2 ring-purple-500 bg-purple-50' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handlePeriodClick(period.key)}
                          title={goalData ? `Plan: ${goalData.planned_goal || 'Not set'}\nFact: ${goalData.actual_result || 'Not set'}` : 'No data yet'}
                        >
                          <CardContent className="p-3 text-center relative">
                            <h5 className="font-medium text-sm">{period.label}</h5>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(selectedSubcategory, period.key, periodType);
                              }}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            {goalData && (
                              <div className="mt-1">
                                <div className="text-xs text-green-600">✓ Has data</div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Weekly Planning */}
          {selectedPeriod && quarters.some(q => q.key === selectedPeriod) && (
            <>
              <div className="flex justify-center">
                <div className="w-0.5 h-8 bg-gray-400"></div>
              </div>

              <div className="relative">
                {/* Horizontal Line */}
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-3/5 h-0.5 bg-gray-400"></div>
                
                <div className="flex justify-center items-start gap-4">
                  {weeks.map((week) => (
                    <div key={week} className="flex flex-col items-center">
                      {/* Vertical connection line */}
                      <div className="w-0.5 h-6 bg-gray-400"></div>
                      
                      <Card className="hover:shadow-lg transition-shadow min-w-[100px]">
                        <CardContent className="p-3 text-center">
                          <h6 className="font-medium text-sm mb-2">Week {week}</h6>
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="Plan"
                              className="w-full text-xs p-1 border rounded"
                            />
                            <input
                              type="text"
                              placeholder="Fact"
                              className="w-full text-xs p-1 border rounded"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Edit Dialog */}
        {editingPeriod && (
          <GoalEditDialog
            isOpen={!!editingPeriod}
            onClose={() => setEditingPeriod(null)}
            category={editingPeriod.category}
            subcategory={editingPeriod.subcategory}
            periodKey={editingPeriod.period}
            periodType={editingPeriod.periodType}
          />
        )}
      </main>
    </div>
  );
};

export default GoalsOverview;
