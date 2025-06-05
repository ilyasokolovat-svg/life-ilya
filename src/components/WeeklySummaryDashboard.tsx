
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useWeeklySummary } from "@/hooks/useWeeklySummary";
import { useGoalsData } from "@/hooks/useGoalsData";

const WeeklySummaryDashboard: React.FC = () => {
  const { weeklySummary, isLoading, currentWeekKey } = useWeeklySummary();

  // Get unique categories to handle updates
  const categories = [...new Set(weeklySummary.map(item => item.category))];
  
  // Create hooks for each category
  const careerHook = useGoalsData('career');
  const businessHook = useGoalsData('business');
  const investmentsHook = useGoalsData('investments');
  const skillsHook = useGoalsData('skills');

  const getHookForCategory = (category: string) => {
    switch (category) {
      case 'career': return careerHook;
      case 'business': return businessHook;
      case 'investments': return investmentsHook;
      case 'skills': return skillsHook;
      default: return null;
    }
  };

  const toggleTaskCompletion = (item: any, completed: boolean) => {
    const hook = getHookForCategory(item.category);
    if (hook) {
      hook.saveGoal({
        category: item.category,
        subcategory: item.subcategory,
        period_key: item.period_key,
        period_type: 'week',
        planned_goal: item.planned_goal,
        actual_result: completed ? 'completed' : undefined
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>This Week's Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (weeklySummary.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>This Week's Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">
            No tasks planned for this week. Start planning in your goal categories!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>This Week's Tasks</CardTitle>
        <p className="text-sm text-gray-600">Week of {currentWeekKey}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {weeklySummary.map((item) => (
          <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg">
            <Checkbox
              checked={item.isCompleted}
              onCheckedChange={(checked) => toggleTaskCompletion(item, !!checked)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-blue-600">{item.category}</span>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-gray-700">{item.subcategory}</span>
              </div>
              <p className={`text-sm ${item.isCompleted ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                {item.planned_goal}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default WeeklySummaryDashboard;
