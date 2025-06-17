
import React, { useState, useEffect } from "react";
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

  // Update local state when habitData changes
  useEffect(() => {
    setSleepHours(habitData.sleepHours?.toString() || "");
  }, [habitData.sleepHours]);

  const handlePlannedChange = (checked: boolean) => {
    console.log(`HabitTracker: Planned change for ${habitType}:`, checked);
    onUpdate(habitType, { ...habitData, planned: checked });
  };

  const handleCompletedChange = (checked: boolean) => {
    console.log(`HabitTracker: Completed change for ${habitType}:`, checked);
    onUpdate(habitType, { ...habitData, completed: checked });
  };

  const handleSleepHoursChange = (value: string) => {
    setSleepHours(value);
    const hours = parseFloat(value);
    if (!isNaN(hours) && hours >= 0) {
      const updatedData = {
        ...habitData,
        sleepHours: hours,
        planned: true,
        completed: hours >= 7
      };
      console.log(`HabitTracker: Sleep hours change for ${habitType}:`, updatedData);
      onUpdate(habitType, updatedData);
    } else if (value === "") {
      const updatedData = {
        ...habitData,
        sleepHours: undefined,
        completed: false
      };
      console.log(`HabitTracker: Sleep hours cleared for ${habitType}:`, updatedData);
      onUpdate(habitType, updatedData);
    }
  };

  console.log(`HabitTracker: Rendering ${habitType} with data:`, habitData);

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
            checked={habitData.planned || false}
            onCheckedChange={handlePlannedChange}
            className="h-3 w-3 border-gray-400"
          />
          <Checkbox
            checked={habitData.completed || false}
            onCheckedChange={handleCompletedChange}
            className="h-3 w-3 border-green-500"
          />
        </div>
      )}
    </div>
  );
};

export default HabitTracker;
