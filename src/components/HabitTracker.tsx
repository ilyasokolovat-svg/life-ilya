
import React, { useState } from "react";
import { Dumbbell, Wine, Moon, Lotus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { HabitData, HabitType } from "@/types/habit";
import { toast } from "sonner";

interface HabitTrackerProps {
  date: Date;
  habitType: HabitType;
  habitData: HabitData;
  onUpdate: (type: HabitType, data: HabitData) => void;
}

const HabitTracker: React.FC<HabitTrackerProps> = ({
  date,
  habitType,
  habitData,
  onUpdate,
}) => {
  const [showAnimation, setShowAnimation] = useState(false);

  const handlePlannedChange = (checked: boolean) => {
    onUpdate(habitType, {
      ...habitData,
      planned: checked,
      // Don't automatically change completed state when unplanning
    });
  };

  const handleCompletedChange = (checked: boolean) => {
    // If marking as completed, show animation and toast
    if (checked && !habitData.completed) {
      setShowAnimation(true);
      setTimeout(() => setShowAnimation(false), 1000);
      toast(`Great job! You completed your ${habitType} goal!`, {
        icon: "🎉",
      });
    }
    
    // When completing, automatically mark as planned too
    onUpdate(habitType, {
      ...habitData,
      completed: checked,
      planned: checked ? true : habitData.planned, // If completing, ensure it's also planned
    });
  };

  const isToday = new Date().toDateString() === date.toDateString();
  const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
  const isFuture = date > new Date(new Date().setHours(23, 59, 59, 999));

  const renderIcon = () => {
    switch (habitType) {
      case "gym":
        return <Dumbbell className={`h-3.5 w-3.5 ${habitData.completed ? "text-success" : ""}`} />;
      case "alcohol":
        return <Wine className={`h-3.5 w-3.5 ${habitData.completed ? "text-success" : ""}`} />;
      case "sleep":
        return <Moon className={`h-3.5 w-3.5 ${habitData.completed ? "text-success" : ""}`} />;
      case "meditation":
        return <Lotus className={`h-3.5 w-3.5 ${habitData.completed ? "text-success" : ""}`} />;
      default:
        return null;
    }
  };

  const habitLabel = habitType.charAt(0).toUpperCase() + habitType.slice(1);
  
  // Update the status class to color the entire row based on completion status
  let habitStatusClass = "bg-transparent";
  
  if (habitData.planned && habitData.completed) {
    habitStatusClass = "bg-success/20 border-success border text-success font-medium";
  } else if (habitData.planned) {
    habitStatusClass = "bg-blue-light/20 border-blue-light border";
  }

  return (
    <div className={`flex items-center justify-between py-0.5 px-1 rounded ${showAnimation ? "animate-success-pulse" : ""} ${habitStatusClass}`}>
      <div className="flex items-center gap-1">
        {renderIcon()}
        <span className="text-[10px] font-medium ml-0.5">{habitLabel}</span>
      </div>
      
      <div className="flex items-center gap-1 ml-auto">
        <div className="flex items-center mr-1">
          <label className="text-[9px] mr-0.5 whitespace-nowrap">P</label>
          <Checkbox
            checked={habitData.planned}
            onCheckedChange={handlePlannedChange}
            // Allow planning for today and future dates, disable only for past dates that weren't planned
            disabled={isPast && !habitData.planned}
            className="h-3 w-3"
          />
        </div>
        
        <div className="flex items-center">
          <label className="text-[9px] mr-0.5 whitespace-nowrap">D</label>
          <Checkbox
            checked={habitData.completed}
            onCheckedChange={handleCompletedChange}
            // Only disable completion for future dates
            disabled={isFuture}
            className={`h-3 w-3 ${habitData.completed ? "bg-success border-success" : ""}`}
          />
        </div>
      </div>
    </div>
  );
};

export default HabitTracker;
