
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HabitType, HabitGoal } from "@/types/habit";
import { Dumbbell, Wine, Moon, Brain } from "lucide-react";

interface GoalSettingProps {
  goals: Record<HabitType, HabitGoal>;
  onUpdateGoal: (type: HabitType, goal: HabitGoal) => void;
}

const GoalSetting: React.FC<GoalSettingProps> = ({ goals, onUpdateGoal }) => {
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

  const handleFrequencyChange = (type: HabitType, value: string) => {
    onUpdateGoal(type, {
      ...goals[type],
      frequency: parseInt(value) || 0
    });
  };

  const handleNotesChange = (type: HabitType, value: string) => {
    onUpdateGoal(type, {
      ...goals[type],
      notes: value
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {Object.keys(goals).map((habitType) => {
        const type = habitType as HabitType;
        const goal = goals[type];
        
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
                    value={goal.frequency}
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
                  value={goal.notes}
                  onChange={(e) => handleNotesChange(type, e.target.value)}
                  className="mt-1 h-24 resize-none"
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default GoalSetting;
