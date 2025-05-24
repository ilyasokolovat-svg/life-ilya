
import React from "react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { HabitType, HabitGoal } from "@/types/habit";
import { Dumbbell, Wine, Moon, Brain } from "lucide-react";
import { habitColors } from "@/utils/chartUtils";

interface HabitStatsHeaderProps {
  habitType: HabitType;
  goal?: HabitGoal;
  monthlyProgress: number;
  progressLabel: string;
}

const HabitStatsHeader: React.FC<HabitStatsHeaderProps> = ({
  habitType,
  goal,
  monthlyProgress,
  progressLabel
}) => {
  const colors = habitColors[habitType];

  const getHabitIcon = () => {
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

  const getHabitTitle = () => {
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

  return (
    <CardHeader className="pb-2">
      <CardTitle className="text-lg flex items-center gap-2">
        {getHabitIcon()}
        {getHabitTitle()}
      </CardTitle>
      
      {goal && progressLabel && (
        <div className="mt-2">
          <div className="flex justify-between mb-1">
            <span className="text-xs">{progressLabel}</span>
            <span className="text-xs font-semibold">{monthlyProgress}%</span>
          </div>
          <Progress 
            value={monthlyProgress} 
            className="h-2" 
            style={{ 
              "--progress-background": colors.secondary,
              "--progress-foreground": colors.primary
            } as React.CSSProperties}
          />
        </div>
      )}
    </CardHeader>
  );
};

export default HabitStatsHeader;
