
import React, { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { HabitType, HabitData } from "@/types/habit";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile } from "lucide-react";

interface HabitTrackerProps {
  date: Date;
  habitType: HabitType;
  habitData: HabitData;
  onUpdate: (type: HabitType, data: HabitData) => void;
  isMobile?: boolean;
}

const HabitTracker: React.FC<HabitTrackerProps> = ({
  date,
  habitType,
  habitData,
  onUpdate,
  isMobile = false,
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

  const handleWellRestedChange = (checked: boolean) => {
    console.log(`HabitTracker: Well rested change for ${habitType}:`, checked);
    onUpdate(habitType, { ...habitData, wellRested: checked });
  };

  console.log(`HabitTracker: Rendering ${habitType} with data:`, habitData);

  const checkboxSize = isMobile ? "h-5 w-5" : "h-3 w-3";
  const inputSize = isMobile ? "w-16 h-8 text-sm" : "w-12 h-6 text-xs";
  const spacing = isMobile ? "space-x-3" : "space-x-1";

  return (
    <div className={`flex items-center ${spacing}`}>
      {habitType === "sleep" ? (
        <div className={`flex items-center ${spacing}`}>
          <Input
            type="number"
            value={sleepHours}
            onChange={(e) => handleSleepHoursChange(e.target.value)}
            placeholder="hrs"
            className={`${inputSize} p-1 text-center border-gray-300`}
            min="0"
            max="24"
            step="0.5"
          />
          {/* Well rested indicator/toggle */}
          <Popover>
            <PopoverTrigger asChild>
              <button 
                className={`p-1 rounded transition-colors ${
                  habitData.wellRested 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'hover:bg-gray-100 text-gray-400'
                }`}
                title={habitData.wellRested ? "Felt well rested" : "Mark as well rested"}
              >
                <Smile className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-44 p-2" align="end">
              <div 
                className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-100"
                onClick={() => handleWellRestedChange(!habitData.wellRested)}
              >
                <Checkbox
                  checked={habitData.wellRested || false}
                  onCheckedChange={(checked) => handleWellRestedChange(!!checked)}
                  className="h-4 w-4 data-[state=checked]:bg-blue-500"
                />
                <label className="text-sm cursor-pointer">
                  😴 Felt well rested
                </label>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      ) : (
        <div className={`flex items-center ${spacing}`}>
          <Checkbox
            checked={habitData.planned || false}
            onCheckedChange={handlePlannedChange}
            className={`${checkboxSize} border-gray-400`}
          />
          <Checkbox
            checked={habitData.completed || false}
            onCheckedChange={handleCompletedChange}
            className={`${checkboxSize} border-green-500`}
          />
        </div>
      )}
    </div>
  );
};

export default HabitTracker;
