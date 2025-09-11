import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useGoalsData } from "@/hooks/useGoalsData";

interface MultiSubcategoryWeeklyPlanningProps {
  category: string;
  visibleSubcategories: string[];
  year: number;
  quarter: number;
  hidePastWeeks?: boolean;
}

const MultiSubcategoryWeeklyPlanning: React.FC<MultiSubcategoryWeeklyPlanningProps> = ({
  category,
  visibleSubcategories,
  year,
  quarter,
  hidePastWeeks = true
}) => {
  const { goalsData, saveGoal } = useGoalsData(category);
  const [localPlans, setLocalPlans] = useState<Record<string, string>>({});
  const [changedWeeks, setChangedWeeks] = useState<Set<string>>(new Set());

  // Helper function to get Monday of any given date (consistent week start)
  const getMondayOfWeek = (date: Date): Date => {
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    result.setDate(diff);
    return result;
  };

  // Generate consistent week key using Monday's date
  const generateWeekKey = (monday: Date): string => {
    return `${monday.getFullYear()}-${monday.getMonth() + 1}-${monday.getDate()}`;
  };

  // Generate weeks for a quarter with consistent keys
  const generateWeeksForQuarter = (year: number, quarter: number) => {
    const weeks = [];
    const startMonth = (quarter - 1) * 3; // 0, 3, 6, 9
    const today = new Date();
    
    for (let month = 0; month < 3; month++) {
      const currentMonth = startMonth + month;
      const monthName = new Date(year, currentMonth, 1).toLocaleDateString('en-US', { month: 'long' });
      
      // Get all weeks in this month
      const firstDay = new Date(year, currentMonth, 1);
      const lastDay = new Date(year, currentMonth + 1, 0);
      
      // Find the start of the first week (Monday) - this might be in the previous month
      let weekStart = getMondayOfWeek(firstDay);
      
      const monthWeeks = [];
      while (weekStart <= lastDay) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        // Only include weeks that overlap with this month AND conditionally filter past weeks
        if (weekEnd >= firstDay && (!hidePastWeeks || weekEnd >= today)) {
          // Use consistent week key based on Monday
          const weekKey = generateWeekKey(weekStart);
          monthWeeks.push({
            key: weekKey,
            start: new Date(weekStart),
            end: new Date(weekEnd),
            label: `${weekStart.getDate()}-${weekEnd.getDate()}`
          });
        }
        
        weekStart.setDate(weekStart.getDate() + 7);
      }
      
      if (monthWeeks.length > 0) {
        weeks.push({
          month: monthName,
          weeks: monthWeeks
        });
      }
    }
    
    return weeks;
  };

  // Get plan data for a specific week and subcategory
  const getWeekPlan = (weekKey: string, subcategory: string) => {
    const goalData = goalsData.find(g => 
      g.category === category && 
      g.subcategory === subcategory && 
      g.period_key === weekKey
    );
    return goalData?.planned_goal || '';
  };

  // Get completion status for a week and subcategory
  const getWeekCompleted = (weekKey: string, subcategory: string) => {
    const goalData = goalsData.find(g => 
      g.category === category && 
      g.subcategory === subcategory && 
      g.period_key === weekKey
    );
    return goalData?.actual_result === 'completed';
  };

  // Get current plan value (local or saved)
  const getCurrentPlanValue = (weekKey: string, subcategory: string) => {
    const localKey = `${weekKey}-${subcategory}`;
    return localPlans[localKey] !== undefined ? localPlans[localKey] : getWeekPlan(weekKey, subcategory);
  };

  // Handle week plan changes
  const handleWeekPlanChange = (weekKey: string, subcategory: string, newValue: string) => {
    const localKey = `${weekKey}-${subcategory}`;
    setLocalPlans(prev => ({ ...prev, [localKey]: newValue }));
    setChangedWeeks(prev => new Set([...prev, localKey]));
  };

  // Save week plan
  const handleSaveWeekPlan = (weekKey: string, subcategory: string) => {
    const localKey = `${weekKey}-${subcategory}`;
    const currentValue = localPlans[localKey] || '';
    
    // Format with bullet points automatically
    const formattedValue = currentValue
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const trimmed = line.trim();
        return trimmed.startsWith('•') ? line : `• ${trimmed}`;
      })
      .join('\n');
    
    saveGoal({
      category,
      subcategory,
      period_key: weekKey,
      period_type: 'week',
      planned_goal: formattedValue,
      actual_result: getWeekCompleted(weekKey, subcategory) ? 'completed' : null
    });

    setChangedWeeks(prev => {
      const newSet = new Set(prev);
      newSet.delete(localKey);
      return newSet;
    });
  };

  // Toggle week completion
  const toggleWeekCompletion = (weekKey: string, subcategory: string, completed: boolean) => {
    saveGoal({
      category,
      subcategory,
      period_key: weekKey,
      period_type: 'week',
      planned_goal: getWeekPlan(weekKey, subcategory),
      actual_result: completed ? 'completed' : null
    });
  };

  return (
    <div className="space-y-6">
      {visibleSubcategories.map((subcategory) => (
        <Card key={subcategory} className="shadow-md border-0 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-gray-700">{subcategory}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="flex gap-4 pb-4" style={{ minWidth: 'max-content' }}>
                {generateWeeksForQuarter(year, quarter).map((monthData) => (
                  <div key={`${subcategory}-${monthData.month}`} className="space-y-3">
                    <h5 className="font-medium text-center text-sm text-gray-600">
                      {monthData.month}
                    </h5>
                    <div className="flex gap-3">
                      {monthData.weeks.map((week) => {
                        const isCompleted = getWeekCompleted(week.key, subcategory);
                        const weekPlan = getCurrentPlanValue(week.key, subcategory);
                        const localKey = `${week.key}-${subcategory}`;
                        const hasChanges = changedWeeks.has(localKey);
                        
                        return (
                          <div 
                            key={`${subcategory}-${week.key}`} 
                            className={`w-56 border rounded-lg p-3 shadow-sm transition-all duration-300 ${
                              isCompleted 
                                ? 'bg-gray-50 border-gray-300 opacity-75' 
                                : 'bg-white border-gray-200 hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-xs font-medium ${isCompleted ? 'text-gray-500' : 'text-gray-700'}`}>
                                {week.label} {monthData.month.slice(0, 3)}
                              </span>
                              <Checkbox
                                checked={isCompleted}
                                onCheckedChange={(checked) => toggleWeekCompletion(week.key, subcategory, !!checked)}
                                className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                              />
                            </div>
                            <Textarea
                              placeholder="Enter your plan for this week..."
                              value={weekPlan}
                              onChange={(e) => handleWeekPlanChange(week.key, subcategory, e.target.value)}
                              className={`min-h-[80px] resize-none border-0 shadow-inner mb-2 text-xs ${
                                isCompleted 
                                  ? 'bg-gray-100 text-gray-600 placeholder:text-gray-400' 
                                  : 'bg-gray-50 focus:bg-white'
                              }`}
                              style={{ minHeight: Math.max(80, weekPlan.split('\n').length * 16) + 'px' }}
                            />
                            {hasChanges && (
                              <Button 
                                onClick={() => handleSaveWeekPlan(week.key, subcategory)}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                                size="sm"
                              >
                                <Save className="w-3 h-3 mr-1" />
                                Save
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MultiSubcategoryWeeklyPlanning;