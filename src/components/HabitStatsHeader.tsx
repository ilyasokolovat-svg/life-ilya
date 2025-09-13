
import React from "react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { HabitType } from "@/types/habit";
import { Dumbbell, Wine, Moon, Brain, Users } from "lucide-react";

interface HabitStatsHeaderProps {
  habitType: HabitType;
}

const HabitStatsHeader: React.FC<HabitStatsHeaderProps> = ({ 
  habitType
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
      case "social":
        return <Users className="h-5 w-5" />;
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
        return "Presence";
      case "social":
        return "Social";
      default:
        return "";
    }
  };

  return (
    <CardHeader className="pb-2">
      <CardTitle className="text-lg flex items-center gap-2">
        {getHabitIcon(habitType)}
        {getHabitTitle(habitType)}
      </CardTitle>
    </CardHeader>
  );
};

export default HabitStatsHeader;
