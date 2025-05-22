
import React, { useState } from "react";
import { Dumbbell, Wine, Moon, Brain } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { HabitData, HabitType } from "@/types/habit";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/use-mobile";

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
  const [sleepHours, setSleepHours] = useState(
    habitData.sleepHours !== undefined ? habitData.sleepHours.toString() : ""
  );
  const isMobile = useMediaQuery("(max-width: 640px)");

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

  const handleSleepHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSleepHours(value);
    
    const hours = parseFloat(value);
    const isCompleted = !isNaN(hours) && hours >= 7;
    
    if (isCompleted && !habitData.completed) {
      setShowAnimation(true);
      setTimeout(() => setShowAnimation(false), 1000);
      toast(`Great job! You got enough sleep!`, {
        icon: "🎉",
      });
    }
    
    onUpdate(habitType, {
      ...habitData,
      sleepHours: isNaN(hours) ? undefined : hours,
      completed: isCompleted,
      planned: true, // Always mark as planned when hours are entered
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
        return <Brain className={`h-3.5 w-3.5 ${habitData.completed ? "text-success" : ""}`} />;
      default:
        return null;
    }
  };
  
  // Update the status class to color the entire row based on completion status
  let habitStatusClass = "bg-transparent";
  
  if (habitData.planned && habitData.completed) {
    habitStatusClass = "bg-success/20 border-success border text-success font-medium";
  } else if (habitData.planned) {
    habitStatusClass = "bg-blue-light/20 border-blue-light border";
  }

  return (
    <div className={`flex items-center justify-between py-0.5 px-1 rounded ${showAnimation ? "animate-success-pulse" : ""} ${habitStatusClass}`}>
      <div className="flex items-center">
        {renderIcon()}
        {!isMobile && (
          <span className="ml-1 text-xs">
            {habitType.charAt(0).toUpperCase() + habitType.slice(1)}
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-1 ml-auto">
        {habitType === "sleep" ? (
          <div className="flex items-center">
            <Input
              type="number"
              value={sleepHours}
              onChange={handleSleepHoursChange}
              className="h-5 w-10 text-[10px] px-1 py-0"
              placeholder="hrs"
              min="0"
              max="24"
              step="0.5"
              disabled={isFuture}
            />
          </div>
        ) : (
          <>
            <div className="flex items-center">
              <Checkbox
                checked={habitData.planned}
                onCheckedChange={handlePlannedChange}
                // Allow planning for today and future dates, disable only for past dates that weren't planned
                disabled={isPast && !habitData.planned}
                className="h-3 w-3"
                aria-label="Planned"
              />
            </div>
            
            <div className="flex items-center">
              <Checkbox
                checked={habitData.completed}
                onCheckedChange={handleCompletedChange}
                // Only disable completion for future dates
                disabled={isFuture}
                className={`h-3 w-3 ${habitData.completed ? "bg-success border-success" : ""}`}
                aria-label="Completed"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HabitTracker;
