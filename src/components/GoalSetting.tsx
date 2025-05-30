
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { HabitType, HabitGoal } from "@/types/habit";
import { Dumbbell, Wine, Moon, Brain } from "lucide-react";

interface GoalSettingProps {
  goals: Record<HabitType, HabitGoal>;
  viewMonth: number;
  viewYear: number;
  onUpdateGoal: (type: HabitType, goal: HabitGoal) => void;
}

// Updated default goal with the new values
const createDefaultGoal = (habitType: HabitType): HabitGoal => {
  const defaultFrequencies = {
    gym: 12,
    alcohol: 25,
    sleep: 20,
    meditation: 25
  };
  
  return {
    frequency: defaultFrequencies[habitType],
    notes: ""
  };
};

const GoalSetting: React.FC<GoalSettingProps> = ({ goals, viewMonth, viewYear, onUpdateGoal }) => {
  // Local state to manage form values independently
  const [localGoals, setLocalGoals] = useState<Record<HabitType, HabitGoal>>(() => {
    const habitTypes: HabitType[] = ['gym', 'alcohol', 'sleep', 'meditation'];
    const initialGoals: Record<HabitType, HabitGoal> = {} as Record<HabitType, HabitGoal>;
    
    habitTypes.forEach(type => {
      initialGoals[type] = goals[type] || createDefaultGoal(type);
    });
    
    return initialGoals;
  });
  
  // Update local state when props change
  useEffect(() => {
    const habitTypes: HabitType[] = ['gym', 'alcohol', 'sleep', 'meditation'];
    const updatedGoals: Record<HabitType, HabitGoal> = {} as Record<HabitType, HabitGoal>;
    
    habitTypes.forEach(type => {
      updatedGoals[type] = goals[type] || createDefaultGoal(type);
    });
    
    setLocalGoals(updatedGoals);
  }, [goals, viewMonth, viewYear]);

  const getHabitIcon = (habitType: HabitType) => {
    switch (habitType) {
      case "gym":
        return <Dumbbell className="h-4 w-4" />;
      case "alcohol":
        return <Wine className="h-4 w-4" />;
      case "sleep":
        return <Moon className="h-4 w-4" />;
      case "meditation":
        return <Brain className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getHabitTitle = (habitType: HabitType) => {
    switch (habitType) {
      case "gym":
        return "Gym";
      case "alcohol":
        return "No Alcohol";
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
    const frequency = parseInt(value) || 0;
    const currentGoal = localGoals[type] || createDefaultGoal(type);
    const newGoal = {
      ...currentGoal,
      frequency
    };
    
    // Update local state immediately for UI responsiveness
    setLocalGoals(prev => ({
      ...prev,
      [type]: newGoal
    }));
    
    // Update parent state
    onUpdateGoal(type, newGoal);
  };

  // Define habit types to ensure consistent ordering
  const habitTypes: HabitType[] = ['gym', 'alcohol', 'sleep', 'meditation'];

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">
        Goals for {getMonthName(viewMonth)} {viewYear}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {habitTypes.map((habitType) => {
          const localGoal = localGoals[habitType] || createDefaultGoal(habitType);
          
          return (
            <Card key={habitType} className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getHabitIcon(habitType)}
                    <span className="text-sm font-medium">{getHabitTitle(habitType)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min="0"
                      max="31"
                      value={localGoal.frequency}
                      className="w-12 h-7 text-xs p-1 text-center"
                      onChange={(e) => handleFrequencyChange(habitType, e.target.value)}
                    />
                    <span className="text-xs text-muted-foreground">days</span>
                  </div>
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
