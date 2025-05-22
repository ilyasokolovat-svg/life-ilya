
import React, { useState } from "react";
import { Gym, AlcoholOff, Sleep } from "lucide-react";
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
        return <Gym className={`h-5 w-5 ${habitData.completed ? "text-success" : ""}`} />;
      case "alcohol":
        return <AlcoholOff className={`h-5 w-5 ${habitData.completed ? "text-success" : ""}`} />;
      case "sleep":
        return <Sleep className={`h-5 w-5 ${habitData.completed ? "text-success" : ""}`} />;
      default:
        return null;
    }
  };

  const habitLabel = habitType.charAt(0).toUpperCase() + habitType.slice(1);

  return (
    <div className={`flex items-center justify-between p-1 ${showAnimation ? "animate-success-pulse" : ""}`}>
      <div className="flex items-center space-x-2">
        {renderIcon()}
        <span className="text-sm">{habitLabel}</span>
      </div>
      
      <div className="flex items-center space-x-3">
        <div className="flex items-center">
          <span className="text-xs mr-1">Plan</span>
          <Checkbox
            checked={habitData.planned}
            onCheckedChange={handlePlannedChange}
            disabled={isPast && !habitData.planned}
          />
        </div>
        
        <div className="flex items-center">
          <span className="text-xs mr-1">Done</span>
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
