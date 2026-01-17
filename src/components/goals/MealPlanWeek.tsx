import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, Utensils } from "lucide-react";
import { useGoalsData } from "@/hooks/useGoalsData";

interface MealPlanWeekProps {
  category: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_SLOTS = ['Breakfast', 'Snack 1', 'Lunch', 'Snack 2', 'Dinner'];

const MealPlanWeek: React.FC<MealPlanWeekProps> = ({ category }) => {
  const { goalsData, saveGoal } = useGoalsData(category);
  const [localMeals, setLocalMeals] = useState<Record<string, Record<string, string>>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize from saved data
  useEffect(() => {
    const savedMeals: Record<string, Record<string, string>> = {};
    
    DAYS.forEach(day => {
      savedMeals[day] = {};
      const dayData = goalsData.find(g => 
        g.subcategory === 'Food' && 
        g.period_key === `meal_plan_${day.toLowerCase()}` &&
        g.period_type === 'meal_plan'
      );
      
      if (dayData?.planned_goal) {
        try {
          const parsed = JSON.parse(dayData.planned_goal);
          savedMeals[day] = parsed;
        } catch {
          // If not JSON, treat as legacy format
          MEAL_SLOTS.forEach((slot, idx) => {
            savedMeals[day][slot] = '';
          });
        }
      } else {
        MEAL_SLOTS.forEach(slot => {
          savedMeals[day][slot] = '';
        });
      }
    });
    
    setLocalMeals(savedMeals);
  }, [goalsData]);

  const handleMealChange = (day: string, slot: string, value: string) => {
    setLocalMeals(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [slot]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    DAYS.forEach(day => {
      const meals = localMeals[day] || {};
      saveGoal({
        category,
        subcategory: 'Food',
        period_key: `meal_plan_${day.toLowerCase()}`,
        period_type: 'meal_plan',
        planned_goal: JSON.stringify(meals),
      });
    });
    setHasChanges(false);
  };

  const getDayEmoji = (day: string) => {
    const emojis: Record<string, string> = {
      'Monday': '🌅',
      'Tuesday': '🌤️',
      'Wednesday': '☀️',
      'Thursday': '⭐',
      'Friday': '🎉',
      'Saturday': '🌴',
      'Sunday': '🌈'
    };
    return emojis[day] || '📅';
  };

  return (
    <Card className="shadow-md border-0 bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-gray-700 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-orange-500" />
            🍎 Weekly Meal Plan
          </CardTitle>
          {hasChanges && (
            <Button 
              onClick={handleSave}
              className="bg-orange-500 hover:bg-orange-600 text-white"
              size="sm"
            >
              <Save className="w-3 h-3 mr-1" />
              Save All
            </Button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Plan your meals for the current week. Edit anytime!
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Header row with days */}
            <div className="grid grid-cols-8 gap-2 mb-2">
              <div className="text-xs font-semibold text-gray-500 py-2"></div>
              {DAYS.map(day => (
                <div key={day} className="text-center">
                  <span className="text-sm mr-1">{getDayEmoji(day)}</span>
                  <span className="text-xs font-semibold text-gray-700">{day.slice(0, 3)}</span>
                </div>
              ))}
            </div>
            
            {/* Meal rows */}
            {MEAL_SLOTS.map((slot, slotIdx) => (
              <div key={slot} className="grid grid-cols-8 gap-2 mb-2">
                <div className="text-xs font-medium text-gray-600 py-2 flex items-center">
                  {slot}
                </div>
                {DAYS.map(day => (
                  <Input
                    key={`${day}-${slot}`}
                    placeholder={slot}
                    value={localMeals[day]?.[slot] || ''}
                    onChange={(e) => handleMealChange(day, slot, e.target.value)}
                    className="h-8 text-xs bg-orange-50 border-orange-200 focus:border-orange-400 placeholder:text-gray-400"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MealPlanWeek;
