
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HabitType, HabitGoal } from "@/types/habit";
import { Dumbbell, Wine, Moon, Brain } from "lucide-react";

interface GoalSettingProps {
  goals: Record<HabitType, HabitGoal>;
  viewMonth: number;
  viewYear: number;
  onUpdateGoal: (type: HabitType, goal: HabitGoal) => void;
}

const GoalSetting: React.FC<GoalSettingProps> = ({ goals, viewMonth, viewYear, onUpdateGoal }) => {
  // Local state for form values to prevent immediate updates during typing
  const [localGoals, setLocalGoals] = useState<Record<HabitType, HabitGoal>>(goals);
  
  // Update local state when props change
  useEffect(() => {
    setLocalGoals(goals);
  }, [goals, viewMonth, viewYear]);

  const getHabitIcon = (habitType: HabitType) => {
    switch (habitType) {
      case "gym":
        return <Dumbbell className="h-5 w-5" />;
      case "alcohol":
        return <Wine className="h-5 w-5" />;
      case "sleep":
        return <Moon className="h-5 w-5" />;
      case "meditation":
        return <Brain className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getHabitTitle = (habitType: HabitType) => {
    switch (habitType) {
      case "gym":
        return "Gym Workouts";
      case "alcohol":
        return "No Alcohol Days";
      case "sleep":
        return "Good Sleep";
      case "meditation":
        return "Meditation";
      default:
        return "";
    }
  };
  
  // Get month name for display
  const getMonthName = (month: number) => {
    return new Date(2000, month, 1).toLocaleString('default', { month: 'long' });
  };

  const handleFrequencyChange = (type: HabitType, value: string) => {
    const newLocalGoals = {
      ...localGoals,
      [type]: {
        ...localGoals[type],
        frequency: parseInt(value) || 0
      }
    };
    
    setLocalGoals(newLocalGoals);
    onUpdateGoal(type, newLocalGoals[type]);
  };

  const handleNotesChange = (type: HabitType, value: string) => {
    // First update local state
    setLocalGoals({
      ...localGoals,
      [type]: {
        ...localGoals[type],
        notes: value
      }
    });
  };
  
  // Only send updates to parent when user stops typing (blur event)
  const handleNotesBlur = (type: HabitType) => {
    onUpdateGoal(type, localGoals[type]);
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">
        Goals for {getMonthName(viewMonth)} {viewYear}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Object.keys(goals).map((habitType) => {
          const type = habitType as HabitType;
          const localGoal = localGoals[type];
          
          return (
            <Card key={habitType} className="overflow-hidden">
              <CardHeader className="pb-2 bg-blue-light/20">
                <CardTitle className="text-lg flex items-center gap-2">
                  {getHabitIcon(type)}
                  {getHabitTitle(type)}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div>
                  <Label htmlFor={`${type}-frequency`}>Goal (days per month)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id={`${type}-frequency`}
                      type="number"
                      min="0"
                      max="31"
                      value={localGoal.frequency}
                      className="w-24"
                      onChange={(e) => handleFrequencyChange(type, e.target.value)}
                    />
                    <span className="text-sm text-muted-foreground">days/month</span>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor={`${type}-notes`}>Notes</Label>
                  <Textarea
                    id={`${type}-notes`}
                    placeholder="Add notes for your goal..."
                    value={localGoal.notes}
                    onChange={(e) => handleNotesChange(type, e.target.value)}
                    onBlur={() => handleNotesBlur(type)}
                    className="mt-1 h-24 resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default GoalSetting;
