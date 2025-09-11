
import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface WeeklyPlanningProps {
  year: number;
  quarter: number;
  getWeekPlan: (weekKey: string) => string;
  getWeekCompleted: (weekKey: string) => boolean;
  onWeekPlanChange: (weekKey: string, plan: string) => void;
  onToggleWeekCompletion: (weekKey: string, completed: boolean) => void;
  onSaveWeekPlan: (weekKey: string, plan: string) => void;
}

const WeeklyPlanning: React.FC<WeeklyPlanningProps> = ({
  year,
  quarter,
  getWeekPlan,
  getWeekCompleted,
  onToggleWeekCompletion,
  onSaveWeekPlan
}) => {
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
        
        // Only include weeks that overlap with this month AND haven't passed yet
        if (weekEnd >= firstDay && weekEnd >= today) {
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

  const getCurrentPlanValue = (weekKey: string) => {
    return localPlans[weekKey] !== undefined ? localPlans[weekKey] : getWeekPlan(weekKey);
  };

  const handleWeekPlanChange = (weekKey: string, newValue: string) => {
    setLocalPlans(prev => ({ ...prev, [weekKey]: newValue }));
    setChangedWeeks(prev => new Set([...prev, weekKey]));
  };

  const handleSaveWeekPlan = (weekKey: string) => {
    const currentValue = localPlans[weekKey] || '';
    
    // Format with bullet points automatically
    const formattedValue = currentValue
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const trimmed = line.trim();
        return trimmed.startsWith('•') ? line : `• ${trimmed}`;
      })
      .join('\n');
    
    onSaveWeekPlan(weekKey, formattedValue);
    setChangedWeeks(prev => {
      const newSet = new Set(prev);
      newSet.delete(weekKey);
      return newSet;
    });
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-6 pb-4" style={{ minWidth: 'max-content' }}>
        {generateWeeksForQuarter(year, quarter).map((monthData) => (
          <div key={monthData.month} className="space-y-4">
            <h4 className="font-medium text-center text-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {monthData.month}
            </h4>
            <div className="flex gap-4">
              {monthData.weeks.map((week) => {
                const isCompleted = getWeekCompleted(week.key);
                const weekPlan = getCurrentPlanValue(week.key);
                const hasChanges = changedWeeks.has(week.key);
                
                return (
                  <div 
                    key={week.key} 
                    className={`w-64 border rounded-xl p-4 shadow-md transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-gray-50 border-gray-300 opacity-75' 
                        : 'bg-white border-gray-200 hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-sm font-medium ${isCompleted ? 'text-gray-500' : 'text-gray-800'}`}>
                        {week.label} {monthData.month.slice(0, 3)}
                      </span>
                      <Checkbox
                        checked={isCompleted}
                        onCheckedChange={(checked) => onToggleWeekCompletion(week.key, !!checked)}
                        className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                    </div>
                    <Textarea
                      placeholder="Enter your plan for this week...&#10;• Each line will become a bullet point"
                      value={weekPlan}
                      onChange={(e) => handleWeekPlanChange(week.key, e.target.value)}
                      className={`min-h-[100px] resize-none border-0 shadow-inner mb-3 ${
                        isCompleted 
                          ? 'bg-gray-100 text-gray-600 placeholder:text-gray-400' 
                          : 'bg-gray-50 focus:bg-white'
                      }`}
                      style={{ minHeight: Math.max(100, weekPlan.split('\n').length * 20) + 'px' }}
                    />
                    {hasChanges && (
                      <Button 
                        onClick={() => handleSaveWeekPlan(week.key)}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                        size="sm"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Plan
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
  );
};

export default WeeklyPlanning;
