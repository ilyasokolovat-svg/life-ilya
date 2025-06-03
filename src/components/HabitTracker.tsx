

import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { HabitType, HabitData } from "@/types/habit";

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
    <div className="flex items-center space-x-1">
      {habitType === "sleep" ? (
        <div className="flex items-center space-x-1">
          <Input
            type="number"
            value={sleepHours}
            onChange={(e) => handleSleepHoursChange(e.target.value)}
            placeholder="hrs"
            className="w-12 h-6 text-xs p-1 text-center border-gray-300"
            min="0"
            max="24"
            step="0.5"
          />
        </div>
      ) : (
        <div className="flex items-center space-x-1">
          <Checkbox
            checked={habitData.planned}
            onCheckedChange={handlePlannedChange}
            className="h-3 w-3 border-gray-400"
          />
          <Checkbox
            checked={habitData.completed}
            onCheckedChange={handleCompletedChange}
            className="h-3 w-3 border-green-500"
          />
        </div>
      )}
    </div>
  );
};

export default HabitTracker;

