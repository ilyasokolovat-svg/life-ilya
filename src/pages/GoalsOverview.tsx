
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

  // Calculate the position of the selected category for line positioning
  const getCategoryPosition = () => {
    if (!selectedCategory) return 50;
    const categories = Object.keys(categoryConfig);
    const index = categories.indexOf(selectedCategory);
    const totalCategories = categories.length;
    return 12.5 + (75 / (totalCategories - 1)) * index; // Distribute across 75% of width, starting at 12.5%
  };

  // Calculate the position of the selected subcategory for line positioning  
  const getSubcategoryPosition = () => {
    if (!selectedSubcategory || !selectedConfig) return 50;
    const index = selectedConfig.subcategories.indexOf(selectedSubcategory);
    const totalSubcategories = selectedConfig.subcategories.length;
    if (totalSubcategories === 1) return 50;
    return 10 + (80 / (totalSubcategories - 1)) * index; // Distribute across 80% of width, starting at 10%
  };

  // Calculate the position of the selected period for line positioning
  const getPeriodPosition = () => {
    if (!selectedPeriod) return 50;
    const index = allPeriods.findIndex(p => p.key === selectedPeriod);
    const totalPeriods = allPeriods.length;
    if (totalPeriods === 1) return 50;
    return 5 + (90 / (totalPeriods - 1)) * index; // Distribute across 90% of width, starting at 5%
  };

  const categoryPosition = getCategoryPosition();
  const subcategoryPosition = getSubcategoryPosition();
  const periodPosition = getPeriodPosition();

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
        <div className="space-y-8">
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

          {/* Subcategories */}
          {selectedCategory && selectedConfig && (
            <div className="relative">
              {/* Connection lines from selected category to subcategories */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Vertical line down from selected category */}
                <div 
                  className="absolute w-0.5 h-4 bg-blue-500"
                  style={{
                    left: `${categoryPosition}%`,
                    top: '-16px',
                    transform: 'translateX(-50%)'
                  }}
                />
                {/* Horizontal line across subcategories area */}
                <div 
                  className="absolute h-0.5 bg-blue-500"
                  style={{
                    left: '10%',
                    right: '10%',
                    top: '-12px'
                  }}
                />
                {/* Vertical lines down to each subcategory */}
                {selectedConfig.subcategories.map((_, index) => {
                  const subcategoryPos = selectedConfig.subcategories.length === 1 
                    ? 50 
                    : 10 + (80 / (selectedConfig.subcategories.length - 1)) * index;
                  return (
                    <div
                      key={index}
                      className="absolute w-0.5 h-4 bg-blue-500"
                      style={{
                        left: `${subcategoryPos}%`,
                        top: '-12px',
                        transform: 'translateX(-50%)'
                      }}
                    />
                  );
                })}
              </div>
              
              <div className="flex justify-center items-start gap-4 overflow-x-auto pt-8">
                {selectedConfig.subcategories.map((subcategory) => (
                  <Card 
                    key={subcategory}
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
                ))}
              </div>
            </div>
          )}

          {/* Time Periods */}
          {selectedSubcategory && selectedCategory && (
            <div className="relative">
              {/* Connection lines from selected subcategory to periods */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Vertical line down from selected subcategory */}
                <div 
                  className="absolute w-0.5 h-4 bg-green-500"
                  style={{
                    left: `${subcategoryPosition}%`,
                    top: '-16px',
                    transform: 'translateX(-50%)'
                  }}
                />
                {/* Horizontal line across periods area */}
                <div 
                  className="absolute h-0.5 bg-green-500"
                  style={{
                    left: '5%',
                    right: '5%',
                    top: '-12px'
                  }}
                />
                {/* Vertical lines down to each period */}
                {allPeriods.map((_, index) => {
                  const periodPos = allPeriods.length === 1 
                    ? 50 
                    : 5 + (90 / (allPeriods.length - 1)) * index;
                  return (
                    <div
                      key={index}
                      className="absolute w-0.5 h-4 bg-green-500"
                      style={{
                        left: `${periodPos}%`,
                        top: '-12px',
                        transform: 'translateX(-50%)'
                      }}
                    />
                  );
                })}
              </div>
              
              <div className="flex justify-center items-start gap-4 overflow-x-auto pt-8">
                {allPeriods.map((period) => {
                  const goalData = getGoalData(selectedSubcategory, period.key);
                  const isQuarter = quarters.some(q => q.key === period.key);
                  const periodType = isQuarter ? 'quarter' : 'year';
                  
                  return (
                    <Card 
                      key={period.key}
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
                  );
                })}
              </div>
            </div>
          )}

          {/* Weekly Planning */}
          {selectedPeriod && quarters.some(q => q.key === selectedPeriod) && (
            <div className="relative">
              {/* Connection lines from selected period to weeks */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Vertical line down from selected period */}
                <div 
                  className="absolute w-0.5 h-4 bg-purple-500"
                  style={{
                    left: `${periodPosition}%`,
                    top: '-16px',
                    transform: 'translateX(-50%)'
                  }}
                />
                {/* Horizontal line across weeks area */}
                <div 
                  className="absolute h-0.5 bg-purple-500"
                  style={{
                    left: '25%',
                    right: '25%',
                    top: '-12px'
                  }}
                />
                {/* Vertical lines down to each week */}
                {weeks.map((_, index) => {
                  const weekPos = weeks.length === 1 
                    ? 50 
                    : 25 + (50 / (weeks.length - 1)) * index;
                  return (
                    <div
                      key={index}
                      className="absolute w-0.5 h-4 bg-purple-500"
                      style={{
                        left: `${weekPos}%`,
                        top: '-12px',
                        transform: 'translateX(-50%)'
                      }}
                    />
                  );
                })}
              </div>
              
              <div className="flex justify-center items-start gap-4 pt-8">
                {weeks.map((week) => (
                  <Card key={week} className="hover:shadow-lg transition-shadow min-w-[100px]">
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
                ))}
              </div>
            </div>
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
