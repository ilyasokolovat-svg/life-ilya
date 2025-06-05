import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Save, Calendar, Target, Eye, EyeOff } from "lucide-react";
import { useParams } from "react-router-dom";
import { useGoalsData } from "@/hooks/useGoalsData";

interface GoalTimeframesProps {
  subcategories: string[];
}

const GoalTimeframes: React.FC<GoalTimeframesProps> = ({ subcategories }) => {
  const { category } = useParams<{ category: string }>();
  const { goalsData, saveGoal, isSaving } = useGoalsData(category || '');
  const [localGoals, setLocalGoals] = useState<Record<string, Record<string, any>>>({});
  const [hidePastQuarters, setHidePastQuarters] = useState(false);

  const currentDate = new Date();
  const currentQuarter = Math.floor(currentDate.getMonth() / 3) + 1;
  const currentYear = currentDate.getFullYear();

  console.log('Current date:', currentDate);
  console.log('Current quarter:', currentQuarter);
  console.log('Current year:', currentYear);

  const quarters = [
    { key: "q1_2025", label: "Q1 2025", color: "border-blue-200 bg-blue-50", quarter: 1, year: 2025 },
    { key: "q2_2025", label: "Q2 2025", color: "border-green-200 bg-green-50", quarter: 2, year: 2025 },
    { key: "q3_2025", label: "Q3 2025", color: "border-yellow-200 bg-yellow-50", quarter: 3, year: 2025 },
    { key: "q4_2025", label: "Q4 2025", color: "border-purple-200 bg-purple-50", quarter: 4, year: 2025 }
  ];

  const years = [
    { key: "year_2025", label: "2025", color: "border-indigo-200 bg-indigo-50" },
    { key: "year_2026", label: "2026", color: "border-pink-200 bg-pink-50" },
    { key: "year_2030", label: "2030", color: "border-gray-200 bg-gray-50" }
  ];

  // Load data from database into local state
  useEffect(() => {
    const loadedGoals: Record<string, Record<string, any>> = {};
    
    subcategories.forEach(subcategory => {
      loadedGoals[subcategory] = {};
      
      goalsData.forEach(goal => {
        if (goal.subcategory === subcategory) {
          if (!loadedGoals[subcategory][goal.period_key]) {
            loadedGoals[subcategory][goal.period_key] = {};
          }
          
          if (goal.period_type === 'year') {
            loadedGoals[subcategory][goal.period_key].goal = goal.planned_goal || '';
          } else {
            loadedGoals[subcategory][goal.period_key].planned = goal.planned_goal || '';
            loadedGoals[subcategory][goal.period_key].fact = goal.actual_result || '';
          }
        }
      });
    });
    
    setLocalGoals(loadedGoals);
  }, [goalsData, subcategories]);

  const updateGoal = (subcategory: string, period: string, type: string, value: string) => {
    setLocalGoals(prev => ({
      ...prev,
      [subcategory]: {
        ...prev[subcategory],
        [period]: {
          ...prev[subcategory]?.[period],
          [type]: value
        }
      }
    }));
  };

  const handleSaveAllGoals = async () => {
    if (!category) return;
    
    const savePromises: Promise<void>[] = [];
    
    Object.entries(localGoals).forEach(([subcategory, periods]) => {
      Object.entries(periods).forEach(([periodKey, data]) => {
        const isYear = years.some(y => y.key === periodKey);
        
        if (isYear) {
          // For years, save as goal
          if (data.goal && data.goal.trim()) {
            savePromises.push(
              new Promise<void>((resolve, reject) => {
                saveGoal({
                  category,
                  subcategory,
                  period_key: periodKey,
                  period_type: 'year',
                  planned_goal: data.goal,
                }, {
                  onSuccess: () => resolve(),
                  onError: reject
                });
              })
            );
          }
        } else {
          // For quarters, save both planned and fact
          if (data.planned && data.planned.trim()) {
            savePromises.push(
              new Promise<void>((resolve, reject) => {
                saveGoal({
                  category,
                  subcategory,
                  period_key: periodKey,
                  period_type: 'quarter',
                  planned_goal: data.planned,
                  actual_result: data.fact || '',
                }, {
                  onSuccess: () => resolve(),
                  onError: reject
                });
              })
            );
          }
          
          if (data.fact && data.fact.trim()) {
            savePromises.push(
              new Promise<void>((resolve, reject) => {
                saveGoal({
                  category,
                  subcategory,
                  period_key: periodKey,
                  period_type: 'quarter',
                  planned_goal: data.planned || '',
                  actual_result: data.fact,
                }, {
                  onSuccess: () => resolve(),
                  onError: reject
                });
              })
            );
          }
        }
      });
    });
    
    try {
      await Promise.all(savePromises);
    } catch (error) {
      console.error('Error saving goals:', error);
    }
  };

  const isPastQuarter = (quarter: number, year: number) => {
    console.log(`Checking if Q${quarter} ${year} is past. Current: Q${currentQuarter} ${currentYear}`);
    
    if (year < currentYear) {
      console.log(`${year} < ${currentYear}, so it's past`);
      return true;
    }
    
    if (year === currentYear && quarter < currentQuarter) {
      console.log(`Same year (${year}) but Q${quarter} < Q${currentQuarter}, so it's past`);
      return true;
    }
    
    console.log(`Q${quarter} ${year} is current or future`);
    return false;
  };

  const filteredQuarters = hidePastQuarters 
    ? quarters.filter(q => {
        const isPast = isPastQuarter(q.quarter, q.year);
        console.log(`Q${q.quarter} ${q.year} isPast: ${isPast}`);
        return !isPast;
      })
    : quarters;

  console.log('Filtered quarters:', filteredQuarters.map(q => q.label));

  const allPeriods = [...filteredQuarters, ...years];

  return (
    <div className="space-y-8">
      {/* Goals Spreadsheet with Tabs */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            Goal Planning & Review
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHidePastQuarters(!hidePastQuarters)}
            className="flex items-center space-x-2"
          >
            {hidePastQuarters ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>{hidePastQuarters ? "Show" : "Hide"} Past Quarters</span>
          </Button>
        </div>

        <Card className="border-2 border-gray-200">
          <CardHeader>
            <CardTitle className="text-base font-bold text-gray-800">
              Goals Overview - All Time Periods
            </CardTitle>
            <p className="text-sm text-gray-600">
              Switch between subcategories to view and edit goals across all quarters and years
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {subcategories.length > 0 ? (
              <Tabs defaultValue={subcategories[0]} className="w-full">
                <div className="px-6 pt-4 pb-2">
                  <TabsList className="h-auto bg-transparent border-0 p-0 w-full justify-start">
                    <div className="flex flex-wrap gap-1 w-full">
                      {subcategories.map((subcategory) => (
                        <TabsTrigger 
                          key={subcategory} 
                          value={subcategory} 
                          className="px-4 py-2 text-xs font-medium rounded-t-lg border border-gray-200 border-b-0 bg-gray-50 hover:bg-gray-100 data-[state=active]:bg-white data-[state=active]:border-gray-300 data-[state=active]:border-b-white data-[state=active]:text-blue-600 data-[state=active]:font-semibold whitespace-nowrap"
                        >
                          {subcategory}
                        </TabsTrigger>
                      ))}
                    </div>
                  </TabsList>
                </div>

                {subcategories.map((subcategory) => (
                  <TabsContent key={subcategory} value={subcategory} className="mt-0">
                    <div className="p-6">
                      <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                        <div className="flex w-max space-x-4 p-4">
                          {/* Fixed subcategory label column */}
                          <div className="flex-shrink-0 w-32">
                            <div className="h-16 flex items-center border-b-2 border-gray-300 mb-4">
                              <div className="font-bold text-sm text-gray-700">Period</div>
                            </div>
                            <div className="font-medium text-sm text-gray-800 bg-gray-50 p-3 rounded">
                              {subcategory}
                            </div>
                          </div>

                          {/* Horizontally scrollable periods */}
                          {allPeriods.map((period) => (
                            <div key={period.key} className="flex-shrink-0 w-48">
                              {/* Header */}
                              <div className="text-center border-b-2 border-gray-300 pb-2 mb-4">
                                <div className="font-bold text-sm text-gray-700 mb-2">
                                  {period.label}
                                </div>
                                <div className="flex gap-2">
                                  <div className="flex-1 text-xs text-gray-500 font-medium">Plan</div>
                                  <div className="flex-1 text-xs text-gray-500 font-medium">Fact</div>
                                </div>
                              </div>

                              {/* Input fields */}
                              <div className="flex gap-2">
                                {/* Plan */}
                                <div className="flex-1">
                                  <Textarea
                                    placeholder="Plan..."
                                    value={localGoals[subcategory]?.[period.key]?.planned || ""}
                                    onChange={(e) => updateGoal(subcategory, period.key, 'planned', e.target.value)}
                                    className="min-h-[80px] text-xs resize-none overflow-hidden"
                                    style={{
                                      height: 'auto',
                                      minHeight: '80px'
                                    }}
                                    onInput={(e) => {
                                      const target = e.target as HTMLTextAreaElement;
                                      target.style.height = 'auto';
                                      target.style.height = Math.max(80, target.scrollHeight) + 'px';
                                    }}
                                  />
                                </div>
                                {/* Fact */}
                                <div className="flex-1">
                                  <Textarea
                                    placeholder="Fact..."
                                    value={
                                      years.some(y => y.key === period.key) 
                                        ? localGoals[subcategory]?.[period.key]?.goal || ""
                                        : localGoals[subcategory]?.[period.key]?.fact || ""
                                    }
                                    onChange={(e) => updateGoal(
                                      subcategory, 
                                      period.key, 
                                      years.some(y => y.key === period.key) ? 'goal' : 'fact', 
                                      e.target.value
                                    )}
                                    className="min-h-[80px] text-xs resize-none overflow-hidden"
                                    style={{
                                      height: 'auto',
                                      minHeight: '80px'
                                    }}
                                    onInput={(e) => {
                                      const target = e.target as HTMLTextAreaElement;
                                      target.style.height = 'auto';
                                      target.style.height = Math.max(80, target.scrollHeight) + 'px';
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <div className="p-6 text-center text-gray-500">
                No subcategories available. Please add some subcategories first.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleSaveAllGoals}
          disabled={isSaving}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save All Goals'}
        </Button>
      </div>
    </div>
  );
};

export default GoalTimeframes;
