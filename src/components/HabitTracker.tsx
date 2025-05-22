
import React, { useState } from "react";
import { Dumbbell, Wine, Moon } from "lucide-react";
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
      completed: checked ? habitData.completed : false,
    });
  };

  const handleCompletedChange = (checked: boolean) => {
    if (checked && !habitData.completed) {
      setShowAnimation(true);
      setTimeout(() => setShowAnimation(false), 1000);
      toast(`Great job! You completed your ${habitType} goal!`, {
        icon: "🎉",
      });
    }
    
    onUpdate(habitType, {
      ...habitData,
      completed: checked,
    });
  };

  const isToday = new Date().toDateString() === date.toDateString();
  const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

  const renderIcon = () => {
    switch (habitType) {
      case "gym":
        return <Dumbbell className={`h-3.5 w-3.5 ${habitData.completed ? "text-success" : ""}`} />;
      case "alcohol":
        return <Wine className={`h-3.5 w-3.5 ${habitData.completed ? "text-success" : ""}`} />;
      case "sleep":
        return <Moon className={`h-3.5 w-3.5 ${habitData.completed ? "text-success" : ""}`} />;
      default:
        return null;
    }
  };

  const habitLabel = habitType.charAt(0).toUpperCase() + habitType.slice(1);
  const habitStatusClass = habitData.planned && habitData.completed 
    ? "bg-success/10 border-success border" 
    : habitData.planned 
      ? "bg-blue-light/10 border-blue-light border" 
      : "";

  return (
    <div className={`flex items-center justify-between py-0.5 px-1 rounded ${showAnimation ? "animate-success-pulse" : ""} ${habitStatusClass}`}>
      <div className="flex items-center gap-1">
        {renderIcon()}
        <span className="text-[10px] font-medium ml-0.5">{habitLabel}</span>
      </div>
      
      <div className="flex items-center gap-1 ml-auto">
        <div className="flex items-center mr-1">
          <label className="text-[9px] mr-0.5 whitespace-nowrap">Plan</label>
          <Checkbox
            checked={habitData.planned}
            onCheckedChange={handlePlannedChange}
            disabled={isPast && !habitData.planned}
            className="h-3 w-3"
          />
        </div>
        
        <div className="flex items-center">
          <label className="text-[9px] mr-0.5 whitespace-nowrap">Done</label>
          <Checkbox
            checked={habitData.completed}
            onCheckedChange={handleCompletedChange}
            disabled={!habitData.planned || (!isToday && !isPast)}
            className={`h-3 w-3 ${habitData.completed ? "bg-success border-success" : ""}`}
          />
        </div>
      </div>
    </div>
  );
};

export default HabitTracker;
