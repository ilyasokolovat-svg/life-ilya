
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, Calendar } from "lucide-react";
import { useGoalsData } from "@/hooks/useGoalsData";

interface WeeklyPlanningProps {
  category: string;
  subcategory: string;
  periodKey: string;
}

const WeeklyPlanning: React.FC<WeeklyPlanningProps> = ({ category, subcategory, periodKey }) => {
  const { weeklyData, saveWeeklyData, isSaving } = useGoalsData(category);
  const [weeklyPlans, setWeeklyPlans] = useState<Record<number, { plan: string; fact: string }>>({});

  const weeks = [1, 2, 3, 4];

  // Load existing weekly data
  useEffect(() => {
    const monthKey = periodKey; // For now, using periodKey as monthKey
    const existingWeeks: Record<number, { plan: string; fact: string }> = {};
    
    weeks.forEach(weekIndex => {
      const existingWeek = weeklyData.find(
        week => week.subcategory === subcategory && 
                week.month_key === monthKey && 
                week.week_index === weekIndex
      );
      
      existingWeeks[weekIndex] = {
        plan: existingWeek?.plan_text || "",
        fact: existingWeek?.fact_text || "",
      };
    });
    
    setWeeklyPlans(existingWeeks);
  }, [weeklyData, subcategory, periodKey]);

  const updateWeeklyPlan = (weekIndex: number, field: 'plan' | 'fact', value: string) => {
    setWeeklyPlans(prev => ({
      ...prev,
      [weekIndex]: {
        ...prev[weekIndex],
        [field]: value
      }
    }));
  };

  const handleSaveWeek = (weekIndex: number) => {
    const weekData = weeklyPlans[weekIndex];
    saveWeeklyData({
      category,
      subcategory,
      month_key: periodKey,
      week_index: weekIndex,
      plan_text: weekData.plan,
      fact_text: weekData.fact,
    });
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-700 flex items-center">
        <Calendar className="w-4 h-4 mr-2" />
        Weekly Planning
      </h4>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {weeks.map((weekIndex) => (
          <Card key={weekIndex} className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-gray-600">
                Week {weekIndex}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Plan</label>
                <Textarea
                  placeholder="Weekly plan..."
                  value={weeklyPlans[weekIndex]?.plan || ""}
                  onChange={(e) => updateWeeklyPlan(weekIndex, 'plan', e.target.value)}
                  className="min-h-[60px] text-xs"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fact</label>
                <Textarea
                  placeholder="What happened..."
                  value={weeklyPlans[weekIndex]?.fact || ""}
                  onChange={(e) => updateWeeklyPlan(weekIndex, 'fact', e.target.value)}
                  className="min-h-[60px] text-xs"
                />
              </div>
              
              <Button 
                onClick={() => handleSaveWeek(weekIndex)}
                disabled={isSaving}
                size="sm"
                className="w-full text-xs"
              >
                <Save className="w-3 h-3 mr-1" />
                Save Week {weekIndex}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default WeeklyPlanning;
