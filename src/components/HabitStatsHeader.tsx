
import React from "react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { HabitType, HabitGoal } from "@/types/habit";
import { Dumbbell, Wine, Moon, Brain } from "lucide-react";

interface HabitStatsHeaderProps {
  habitType: HabitType;
  goal?: HabitGoal;
}

const HabitStatsHeader: React.FC<HabitStatsHeaderProps> = ({ 
  habitType, 
  goal
}) => {
  const getHabitIcon = (type: HabitType) => {
    switch (type) {
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

  const getHabitTitle = (type: HabitType) => {
    switch (type) {
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

  return (
    <CardHeader className="pb-2">
      <CardTitle className="text-lg flex items-center gap-2">
        {getHabitIcon(habitType)}
        {getHabitTitle(habitType)}
        {goal && (
          <span className="text-sm font-normal text-muted-foreground ml-auto">
            Goal: {goal.frequency} days
          </span>
        )}
      </CardTitle>
    </CardHeader>
  );
};

export default HabitStatsHeader;
