
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff } from "lucide-react";
import { useGoalsData } from "@/hooks/useGoalsData";

interface SubcategoryTimelineProps {
  category: string;
  subcategory: string;
}

interface TimelinePeriod {
  id: string;
  label: string;
  type: 'quarter' | 'year';
  year: number;
  quarter?: number;
  isPast: boolean;
}

const SubcategoryTimeline: React.FC<SubcategoryTimelineProps> = ({ category, subcategory }) => {
  const [hidePastPeriods, setHidePastPeriods] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<TimelinePeriod | null>(null);
  const { goalsData, saveGoal } = useGoalsData(category);

  // Get current date info
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11
  const currentQuarter = Math.floor(currentMonth / 3) + 1; // 1-4

  // Generate timeline periods
  const generateTimeline = (): TimelinePeriod[] => {
    const periods: TimelinePeriod[] = [];
    
    // Current year quarters
    for (let q = 1; q <= 4; q++) {
      const isPast = q < currentQuarter;
      periods.push({
        id: `${currentYear}-Q${q}`,
        label: `Q${q}`,
        type: 'quarter',
        year: currentYear,
        quarter: q,
        isPast
      });
    }
    
    // Future years
    const futureYears = [currentYear + 1, currentYear + 2, currentYear + 5]; // 2026, 2027, 2030
    futureYears.forEach(year => {
      periods.push({
        id: `${year}`,
        label: `${year}`,
        type: 'year',
        year,
        isPast: false
      });
    });
    
    return periods;
  };

  const timeline = generateTimeline();
  const visiblePeriods = hidePastPeriods ? timeline.filter(p => !p.isPast) : timeline;

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

  // Get plan data for a specific week
  const getWeekPlan = (weekKey: string) => {
    const goalData = goalsData.find(g => 
      g.category === category && 
      g.subcategory === subcategory && 
      g.period_key === weekKey
    );
    return goalData?.planned_goal || '';
  };

  // Get completion status for a week
  const getWeekCompleted = (weekKey: string) => {
    const goalData = goalsData.find(g => 
      g.category === category && 
      g.subcategory === subcategory && 
      g.period_key === weekKey
    );
    return goalData?.actual_result === 'completed';
  };

  // Save week plan
  const saveWeekPlan = (weekKey: string, plan: string) => {
    saveGoal({
      category,
      subcategory,
      period_key: weekKey,
      period_type: 'week',
      planned_goal: plan,
      actual_result: getWeekCompleted(weekKey) ? 'completed' : undefined
    });
  };

  // Toggle week completion
  const toggleWeekCompletion = (weekKey: string, completed: boolean) => {
    saveGoal({
      category,
      subcategory,
      period_key: weekKey,
      period_type: 'week',
      planned_goal: getWeekPlan(weekKey),
      actual_result: completed ? 'completed' : undefined
    });
  };

  return (
    <div className="space-y-6">
      {/* Timeline Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{subcategory} Timeline</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setHidePastPeriods(!hidePastPeriods)}
          className="flex items-center gap-2"
        >
          {hidePastPeriods ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          {hidePastPeriods ? 'Show Past' : 'Hide Past'}
        </Button>
      </div>

      {/* Timeline Bubbles */}
      <div className="flex flex-wrap gap-3">
        {visiblePeriods.map((period) => (
          <Button
            key={period.id}
            variant={selectedPeriod?.id === period.id ? "default" : "outline"}
            className={`rounded-full px-6 py-2 ${
              period.isPast ? 'opacity-60' : ''
            }`}
            onClick={() => setSelectedPeriod(period)}
          >
            {period.label}
          </Button>
        ))}
      </div>

      {/* Weekly Planner */}
      {selectedPeriod && selectedPeriod.type === 'quarter' && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedPeriod.label} {selectedPeriod.year} - Weekly Planning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="flex gap-6 pb-4" style={{ minWidth: 'max-content' }}>
                {generateWeeksForQuarter(selectedPeriod.year, selectedPeriod.quarter!).map((monthData) => (
                  <div key={monthData.month} className="space-y-4">
                    <h4 className="font-medium text-center text-gray-700">{monthData.month}</h4>
                    <div className="flex gap-4">
                      {monthData.weeks.map((week) => (
                        <div key={week.key} className="w-64 border rounded-lg p-4 bg-white shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium">
                              {week.label} {monthData.month.slice(0, 3)}
                            </span>
                            <Checkbox
                              checked={getWeekCompleted(week.key)}
                              onCheckedChange={(checked) => toggleWeekCompletion(week.key, !!checked)}
                            />
                          </div>
                          <Textarea
                            placeholder="Enter your plan for this week..."
                            value={getWeekPlan(week.key)}
                            onChange={(e) => saveWeekPlan(week.key, e.target.value)}
                            className="min-h-[100px] resize-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SubcategoryTimeline;
