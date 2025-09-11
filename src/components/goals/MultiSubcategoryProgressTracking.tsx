import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Target, Calendar, Save } from "lucide-react";
import { useGoalsData } from "@/hooks/useGoalsData";

interface MultiSubcategoryProgressTrackingProps {
  category: string;
  visibleSubcategories: string[];
}

const MultiSubcategoryProgressTracking: React.FC<MultiSubcategoryProgressTrackingProps> = ({
  category,
  visibleSubcategories
}) => {
  const { goalsData, saveGoal } = useGoalsData(category);
  const [localGoals, setLocalGoals] = React.useState<Record<string, Record<string, string>>>({});
  const [changedGoals, setChangedGoals] = React.useState<Set<string>>(new Set());

  // Get current date info
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;

  // Get goals for a specific period and subcategory
  const getPeriodGoals = (periodKey: string, subcategory: string) => {
    const goalData = goalsData.find(g => 
      g.category === category && 
      g.subcategory === subcategory && 
      g.period_key === periodKey &&
      g.period_type === 'period_goals'
    );
    return goalData?.planned_goal || '';
  };

  // Get current local value or saved value
  const getCurrentValue = (periodKey: string, subcategory: string) => {
    return localGoals[periodKey]?.[subcategory] !== undefined 
      ? localGoals[periodKey][subcategory] 
      : getPeriodGoals(periodKey, subcategory);
  };

  // Handle goal changes
  const handleGoalChange = (periodKey: string, subcategory: string, value: string) => {
    setLocalGoals(prev => ({
      ...prev,
      [periodKey]: {
        ...prev[periodKey],
        [subcategory]: value
      }
    }));
    setChangedGoals(prev => new Set([...prev, `${periodKey}-${subcategory}`]));
  };

  // Save goal
  const handleSaveGoal = (periodKey: string, subcategory: string) => {
    const value = localGoals[periodKey]?.[subcategory] || '';
    
    // Format with bullet points automatically
    const formattedValue = value
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
      period_key: periodKey,
      period_type: 'period_goals',
      planned_goal: formattedValue,
      actual_result: undefined
    });

    setChangedGoals(prev => {
      const newSet = new Set(prev);
      newSet.delete(`${periodKey}-${subcategory}`);
      return newSet;
    });
  };

  return (
    <div className="space-y-4">
      {/* 2025 Strategic Goals */}
      <Card className="bg-gradient-to-br from-indigo-100 to-purple-200 border border-indigo-300 shadow-sm">
        <CardContent className="p-4">
          <div className="text-sm font-semibold text-indigo-700 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" />
            2025 Strategic Goals
          </div>
          <div className="space-y-3">
            {visibleSubcategories.map((subcategory) => {
              const goalValue = getCurrentValue('2025', subcategory);
              const hasChanges = changedGoals.has(`2025-${subcategory}`);
              
              return (
                <div key={subcategory} className="space-y-2">
                  <div className="text-xs font-medium text-indigo-600">{subcategory}</div>
                  <Textarea
                    placeholder={`Enter your 2025 goals for ${subcategory}...`}
                    value={goalValue}
                    onChange={(e) => handleGoalChange('2025', subcategory, e.target.value)}
                    className={`border-indigo-200 focus:border-indigo-400 text-xs resize-none ${
                      getPeriodGoals('2025', subcategory) && !hasChanges
                        ? 'bg-indigo-100/50 text-indigo-800'
                        : 'bg-white/70'
                    }`}
                    style={{ minHeight: Math.max(40, goalValue.split('\n').length * 16) + 'px' }}
                  />
                  {hasChanges && (
                    <Button 
                      onClick={() => handleSaveGoal('2025', subcategory)}
                      className="bg-indigo-500 hover:bg-indigo-600 text-white"
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
        </CardContent>
      </Card>

      {/* Current Quarter Goals */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 shadow-sm">
        <CardContent className="p-4">
          <div className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Q{currentQuarter} {currentYear} Goals
          </div>
          <div className="space-y-3">
            {visibleSubcategories.map((subcategory) => {
              const currentQuarterKey = `${currentYear}-Q${currentQuarter}`;
              const goalValue = getCurrentValue(currentQuarterKey, subcategory);
              const hasChanges = changedGoals.has(`${currentQuarterKey}-${subcategory}`);
              
              return (
                <div key={subcategory} className="space-y-2">
                  <div className="text-xs font-medium text-blue-600">{subcategory}</div>
                  <Textarea
                    placeholder={`Enter your Q${currentQuarter} goals for ${subcategory}...`}
                    value={goalValue}
                    onChange={(e) => handleGoalChange(currentQuarterKey, subcategory, e.target.value)}
                    className={`border-blue-200 focus:border-blue-400 text-xs resize-none ${
                      getPeriodGoals(currentQuarterKey, subcategory) && !hasChanges
                        ? 'bg-blue-100/50 text-blue-800'
                        : 'bg-white/70'
                    }`}
                    style={{ minHeight: Math.max(40, goalValue.split('\n').length * 16) + 'px' }}
                  />
                  {hasChanges && (
                    <Button 
                      onClick={() => handleSaveGoal(currentQuarterKey, subcategory)}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
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
        </CardContent>
      </Card>
    </div>
  );
};

export default MultiSubcategoryProgressTracking;