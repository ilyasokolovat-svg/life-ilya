
import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { HabitType, HabitData } from "@/types/habit";
import { Moon, Dumbbell, Wine, Brain } from "lucide-react";

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
  const [sleepHours, setSleepHours] = useState(habitData.sleepHours?.toString() || "");

  const getHabitIcon = () => {
    const iconProps = { className: "h-3 w-3" };
    switch (habitType) {
      case "sleep":
        return <Moon {...iconProps} />;
      case "gym":
        return <Dumbbell {...iconProps} />;
      case "alcohol":
        return <Wine {...iconProps} />;
      case "meditation":
        return <Brain {...iconProps} />;
      default:
        return null;
    }
  };

  const handlePlannedChange = (checked: boolean) => {
    onUpdate(habitType, { ...habitData, planned: checked });
  };

  const handleCompletedChange = (checked: boolean) => {
    onUpdate(habitType, { ...habitData, completed: checked });
  };

  const handleSleepHoursChange = (value: string) => {
    setSleepHours(value);
    const hours = parseFloat(value);
    if (!isNaN(hours) && hours >= 0) {
      onUpdate(habitType, { ...habitData, sleepHours: hours });
    }
  };

  return (
    <div className="flex items-center justify-between text-xs space-x-1">
      <div className="flex items-center space-x-1">
        {getHabitIcon()}
        {/* Only show planned checkbox for non-sleep habits */}
        {habitType !== "sleep" && (
          <Checkbox
            checked={habitData.planned}
            onCheckedChange={handlePlannedChange}
            className="h-3 w-3 border-gray-400"
          />
        )}
      </div>
      
      <div className="flex items-center space-x-1">
        {habitType === "sleep" ? (
          <Input
            type="number"
            value={sleepHours}
            onChange={(e) => handleSleepHoursChange(e.target.value)}
            placeholder="hrs"
            className="w-8 h-4 text-xs p-0 text-center border-gray-300"
            min="0"
            max="24"
            step="0.5"
          />
        ) : (
          <Checkbox
            checked={habitData.completed}
            onCheckedChange={handleCompletedChange}
            className="h-3 w-3 border-green-500"
          />
        )}
      </div>
    </div>
  );
};

export default HabitTracker;
