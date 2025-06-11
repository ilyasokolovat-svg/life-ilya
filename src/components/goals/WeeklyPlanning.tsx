
import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface WeeklyPlanningProps {
  year: number;
  quarter: number;
  getWeekPlan: (weekKey: string) => string;
  getWeekCompleted: (weekKey: string) => boolean;
  onWeekPlanChange: (weekKey: string, plan: string) => void;
  onToggleWeekCompletion: (weekKey: string, completed: boolean) => void;
}

const WeeklyPlanning: React.FC<WeeklyPlanningProps> = ({
  year,
  quarter,
  getWeekPlan,
  getWeekCompleted,
  onWeekPlanChange,
  onToggleWeekCompletion
}) => {
  // Generate weeks for a quarter
  const generateWeeksForQuarter = (year: number, quarter: number) => {
    const weeks = [];
    const startMonth = (quarter - 1) * 3; // 0, 3, 6, 9
    
    for (let month = 0; month < 3; month++) {
      const currentMonth = startMonth + month;
      const monthName = new Date(year, currentMonth, 1).toLocaleDateString('en-US', { month: 'long' });
      
      // Get all weeks in this month
      const firstDay = new Date(year, currentMonth, 1);
      const lastDay = new Date(year, currentMonth + 1, 0);
      
      // Find the start of the first week (Monday)
      let weekStart = new Date(firstDay);
      weekStart.setDate(firstDay.getDate() - ((firstDay.getDay() + 6) % 7));
      
      const monthWeeks = [];
      while (weekStart <= lastDay) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        // Only include weeks that overlap with this month
        if (weekEnd >= firstDay) {
          const weekKey = `${year}-${currentMonth + 1}-${weekStart.getDate()}`;
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
                const weekPlan = getWeekPlan(week.key);
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
                      placeholder="Enter your plan for this week..."
                      value={weekPlan}
                      onChange={(e) => onWeekPlanChange(week.key, e.target.value)}
                      className={`min-h-[100px] resize-none border-0 shadow-inner ${
                        isCompleted 
                          ? 'bg-gray-100 text-gray-600 placeholder:text-gray-400' 
                          : 'bg-gray-50 focus:bg-white'
                      }`}
                      style={{ minHeight: Math.max(100, weekPlan.split('\n').length * 20) + 'px' }}
                    />
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
