
import React, { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { HabitType, HabitData } from "@/types/habit";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile, Dumbbell, Flame, Footprints, StretchHorizontal } from "lucide-react";

const workoutIntensityConfig = {
  full: { label: 'Full Workout', emoji: '🏋️', icon: Dumbbell, color: 'bg-green-500 text-white' },
  hiit: { label: 'Quick HIIT', emoji: '🔥', icon: Flame, color: 'bg-orange-500 text-white' },
  walk: { label: 'Walk/Cardio', emoji: '🚶', icon: Footprints, color: 'bg-blue-400 text-white' },
  stretch: { label: 'Stretching', emoji: '🧘', icon: StretchHorizontal, color: 'bg-purple-400 text-white' },
} as const;

type IntensityKey = 'full' | 'hiit' | 'walk' | 'stretch';

// Helper to normalize workoutIntensity to array
const getIntensityArray = (wi: HabitData['workoutIntensity']): IntensityKey[] => {
  if (!wi) return [];
  if (Array.isArray(wi)) return wi;
  return [wi];
};

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

  useEffect(() => {
    setSleepHours(habitData.sleepHours?.toString() || "");
  }, [habitData.sleepHours]);

  const handlePlannedChange = (checked: boolean) => {
    onUpdate(habitType, { ...habitData, planned: checked });
  };

  const handleCompletedChange = (checked: boolean) => {
    if (habitType === 'gym' && checked) {
      onUpdate(habitType, { ...habitData, completed: true, workoutIntensity: habitData.workoutIntensity || 'full' });
    } else if (habitType === 'gym' && !checked) {
      onUpdate(habitType, { ...habitData, completed: false, workoutIntensity: undefined });
    } else {
      onUpdate(habitType, { ...habitData, completed: checked });
    }
  };

  const handleToggleIntensity = (intensity: IntensityKey) => {
    const current = getIntensityArray(habitData.workoutIntensity);
    let updated: IntensityKey[];
    if (current.includes(intensity)) {
      updated = current.filter(i => i !== intensity);
    } else {
      updated = [...current, intensity];
    }
    if (updated.length === 0) {
      onUpdate(habitType, { ...habitData, completed: false, planned: habitData.planned, workoutIntensity: undefined });
    } else {
      onUpdate(habitType, { ...habitData, completed: true, planned: true, workoutIntensity: updated });
    }
  };

  const handleSleepHoursChange = (value: string) => {
    setSleepHours(value);
    const hours = parseFloat(value);
    if (!isNaN(hours) && hours >= 0) {
      onUpdate(habitType, { ...habitData, sleepHours: hours, planned: true, completed: hours >= 7 });
    } else if (value === "") {
      onUpdate(habitType, { ...habitData, sleepHours: undefined, completed: false });
    }
  };

  const handleWellRestedChange = (checked: boolean) => {
    onUpdate(habitType, { ...habitData, wellRested: checked });
  };

  const checkboxSize = isMobile ? "h-5 w-5" : "h-3 w-3";
  const inputSize = isMobile ? "w-16 h-8 text-sm" : "w-12 h-6 text-xs";
  const spacing = isMobile ? "space-x-3" : "space-x-1";

  const intensityArr = getIntensityArray(habitData.workoutIntensity);

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
      ) : habitType === "gym" ? (
        <div className={`flex items-center ${spacing}`}>
          <Checkbox
            checked={habitData.planned || false}
            onCheckedChange={handlePlannedChange}
            className={`${checkboxSize} border-gray-400`}
          />
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={`rounded transition-colors flex items-center gap-0.5 ${
                  habitData.completed && intensityArr.length > 0
                    ? 'px-1 py-0.5 bg-green-500 text-white text-xs rounded'
                    : ''
                }`}
              >
                {habitData.completed && intensityArr.length > 0 ? (
                  <span className={isMobile ? "text-base" : "text-xs"}>
                    {intensityArr.map(k => workoutIntensityConfig[k]?.emoji).join('')}
                  </span>
                ) : (
                  <Checkbox
                    checked={habitData.completed || false}
                    onCheckedChange={handleCompletedChange}
                    className={`${checkboxSize} border-green-500`}
                  />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-44 p-1.5" align="end">
              <div className="space-y-0.5">
                {(Object.entries(workoutIntensityConfig) as [IntensityKey, typeof workoutIntensityConfig[IntensityKey]][]).map(([key, cfg]) => {
                  const isSelected = intensityArr.includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() => handleToggleIntensity(key)}
                      className={`w-full text-left px-2 py-1.5 rounded text-xs hover:bg-gray-100 flex items-center gap-2 ${
                        isSelected ? `${cfg.color} hover:opacity-90` : ''
                      }`}
                    >
                      <span>{cfg.emoji}</span> {cfg.label}
                    </button>
                  );
                })}
                {habitData.completed && (
                  <button
                    onClick={() => {
                      onUpdate(habitType, { ...habitData, completed: false, workoutIntensity: undefined });
                    }}
                    className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-gray-100 text-gray-500"
                  >
                    Clear
                  </button>
                )}
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
