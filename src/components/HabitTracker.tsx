
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
        return <Dumbbell className={`h-5 w-5 ${habitData.completed ? "text-success" : ""}`} />;
      case "alcohol":
        return <Wine className={`h-5 w-5 ${habitData.completed ? "text-success" : ""}`} />;
      case "sleep":
        return <Moon className={`h-5 w-5 ${habitData.completed ? "text-success" : ""}`} />;
      default:
        return null;
    }
  };

  const habitLabel = habitType.charAt(0).toUpperCase() + habitType.slice(1);

  return (
    <div className={`flex items-center justify-between p-2 rounded-md ${showAnimation ? "animate-success-pulse bg-blue-light/20" : ""}`}>
      <div className="flex items-center space-x-2">
        {renderIcon()}
        <span className="text-sm font-medium">{habitLabel}</span>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-xs whitespace-nowrap mr-1">Plan</span>
          <Checkbox
            checked={habitData.planned}
            onCheckedChange={handlePlannedChange}
            disabled={isPast && !habitData.planned}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs whitespace-nowrap mr-1">Done</span>
          <Checkbox
            checked={habitData.completed}
            onCheckedChange={handleCompletedChange}
            disabled={!habitData.planned || (!isToday && !isPast)}
            className={habitData.completed ? "bg-success border-success" : ""}
          />
        </div>
      </div>
    </div>
  );
};

export default HabitTracker;
