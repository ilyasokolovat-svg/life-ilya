
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Moon, Dumbbell, Wine, Brain, Scale, Flame, Footprints, StretchHorizontal } from "lucide-react";
import { HabitType, HabitData, DayData } from "@/types/habit";
import { getDubaiDate, formatDateISO } from "@/utils/dateUtils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface TodayHabitsProps {
  todayData: DayData | null;
  onUpdateHabit: (date: Date, type: HabitType, data: HabitData) => void;
}

const TodayHabits: React.FC<TodayHabitsProps> = ({ todayData, onUpdateHabit }) => {
  // Use Dubai date consistently with the rest of the app
  const today = getDubaiDate();
  const todayISO = formatDateISO(today);

  console.log('TodayHabits: Using date:', todayISO, 'Date object:', today);
  console.log('TodayHabits: Received todayData:', todayData);

  const workoutIntensityConfig = {
    full: { label: 'Full Workout', emoji: '🏋️', color: 'bg-green-500' },
    hiit: { label: 'Quick HIIT', emoji: '🔥', color: 'bg-orange-500' },
    walk: { label: 'Walk/Cardio', emoji: '🚶', color: 'bg-blue-400' },
    stretch: { label: 'Stretching', emoji: '🧘', color: 'bg-purple-400' },
  };

  const handleHabitComplete = (habitType: HabitType, completed: boolean) => {
    const currentHabitData = todayData?.[habitType] || { planned: false, completed: false };
    
    const updatedHabitData: HabitData = {
      ...currentHabitData,
      completed,
      planned: completed ? true : currentHabitData.planned
    };
    
    // For gym, default to 'full' intensity
    if (habitType === 'gym') {
      updatedHabitData.workoutIntensity = completed ? (currentHabitData.workoutIntensity || 'full') : undefined;
    }
    
    onUpdateHabit(today, habitType, updatedHabitData);
  };

  const handleWorkoutIntensity = (intensity: 'full' | 'hiit' | 'walk' | 'stretch') => {
    const currentHabitData = todayData?.gym || { planned: false, completed: false };
    const updatedHabitData: HabitData = {
      ...currentHabitData,
      completed: true,
      planned: true,
      workoutIntensity: intensity,
    };
    onUpdateHabit(today, 'gym', updatedHabitData);
  };

  const handleSleepHoursChange = (value: string) => {
    const currentHabitData = todayData?.sleep || { planned: false, completed: false };
    const hours = parseFloat(value);
    
    if (!isNaN(hours) && hours >= 0) {
      const updatedHabitData: HabitData = {
        ...currentHabitData,
        sleepHours: hours,
        planned: true,
        completed: hours >= 7 // Auto-complete if 7+ hours
      };
      console.log(`TodayHabits: Sleep hours update for ${todayISO}:`, updatedHabitData);
      onUpdateHabit(today, 'sleep', updatedHabitData);
    } else if (value === "") {
      const updatedHabitData: HabitData = {
        ...currentHabitData,
        sleepHours: undefined,
        completed: false
      };
      console.log(`TodayHabits: Sleep hours cleared for ${todayISO}:`, updatedHabitData);
      onUpdateHabit(today, 'sleep', updatedHabitData);
    }
  };

  const handleWellRestedChange = (checked: boolean) => {
    const currentHabitData = todayData?.sleep || { planned: false, completed: false };
    const updatedHabitData: HabitData = {
      ...currentHabitData,
      wellRested: checked
    };
    console.log(`TodayHabits: Well rested update for ${todayISO}:`, updatedHabitData);
    onUpdateHabit(today, 'sleep', updatedHabitData);
  };

  const handleWeightChange = (value: string) => {
    const currentHabitData = todayData?.sleep || { planned: false, completed: false };
    const weight = parseFloat(value);
    
    if (!isNaN(weight) && weight > 0) {
      const updatedHabitData: HabitData = {
        ...currentHabitData,
        weight
      };
      onUpdateHabit(today, 'sleep', updatedHabitData);
    } else if (value === "") {
      const updatedHabitData: HabitData = {
        ...currentHabitData,
        weight: undefined
      };
      onUpdateHabit(today, 'sleep', updatedHabitData);
    }
  };

  const handleBodyFatChange = (value: string) => {
    const currentHabitData = todayData?.sleep || { planned: false, completed: false };
    const bodyFat = parseFloat(value);
    
    if (!isNaN(bodyFat) && bodyFat >= 0 && bodyFat <= 100) {
      const updatedHabitData: HabitData = {
        ...currentHabitData,
        bodyFat
      };
      onUpdateHabit(today, 'sleep', updatedHabitData);
    } else if (value === "") {
      const updatedHabitData: HabitData = {
        ...currentHabitData,
        bodyFat: undefined
      };
      onUpdateHabit(today, 'sleep', updatedHabitData);
    }
  };

  const habits = [
    {
      type: 'sleep' as HabitType,
      icon: Moon,
      name: 'Sleep (7+ hrs)',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      isSpecial: true
    },
    {
      type: 'gym' as HabitType,
      icon: Dumbbell,
      name: 'Gym',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      type: 'alcohol' as HabitType,
      icon: Wine,
      name: 'Sober Day',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    },
    {
      type: 'meditation' as HabitType,
      icon: Brain,
      name: 'Presence',
      description: 'Meditate, Journal and mindful phone usage',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ];

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Today's Habits</span>
          <span className="text-sm font-normal text-gray-500">
            {today.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'short', 
              day: 'numeric' 
            })} ({todayISO})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {habits.map((habit) => {
            const Icon = habit.icon;
            const habitData = todayData?.[habit.type] || { planned: false, completed: false };
            
            return (
              <div
                key={habit.type}
                className={`p-6 rounded-lg border-2 transition-all ${
                  habitData.completed 
                    ? 'border-green-400 bg-green-50' 
                    : `${habit.borderColor} ${habit.bgColor} hover:border-gray-300`
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-3 rounded-full ${habit.bgColor}`}>
                    <Icon className={`h-6 w-6 ${habit.color}`} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-lg">{habit.name}</div>
                    {habit.description && (
                      <div className="text-sm text-gray-600 mt-1">{habit.description}</div>
                    )}
                  </div>
                </div>
                
                {habit.isSpecial ? (
                  // Sleep hours input + well rested checkbox
                  <div className="space-y-3">
                    <Input
                      type="number"
                      value={habitData.sleepHours?.toString() || ""}
                      onChange={(e) => handleSleepHoursChange(e.target.value)}
                      placeholder="Hours slept"
                      className="w-full text-center text-lg py-3"
                      min="0"
                      max="24"
                      step="0.5"
                    />
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-2">
                        Hours: {habitData.sleepHours || 0}
                      </div>
                      {habitData.completed && (
                        <div className="text-green-600 font-medium flex items-center justify-center gap-1">
                          ✓ Completed
                        </div>
                      )}
                    </div>
                    {/* Well Rested Checkbox */}
                    <div 
                      className="flex items-center justify-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-white/50 transition-colors border border-dashed border-blue-200"
                      onClick={() => handleWellRestedChange(!habitData.wellRested)}
                    >
                      <Checkbox
                        checked={habitData.wellRested || false}
                        onCheckedChange={(checked) => handleWellRestedChange(!!checked)}
                        className="h-5 w-5 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                      />
                      <label className="text-sm font-medium text-blue-700 cursor-pointer">
                        😴 Felt well rested
                      </label>
                    </div>
                  </div>
                ) : habit.type === 'gym' ? (
                  // Gym with workout intensity selector
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.entries(workoutIntensityConfig) as [string, { label: string; emoji: string; color: string }][]).map(([key, cfg]) => {
                        const isSelected = habitData.completed && habitData.workoutIntensity === key;
                        return (
                          <button
                            key={key}
                            onClick={() => handleWorkoutIntensity(key as any)}
                            className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                              isSelected
                                ? `${cfg.color} text-white border-transparent shadow-md`
                                : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                            }`}
                          >
                            <span className="text-lg">{cfg.emoji}</span>
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                    {habitData.completed && (
                      <button
                        onClick={() => handleHabitComplete('gym', false)}
                        className="w-full text-xs text-gray-400 hover:text-gray-600 py-1"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Weight Tracking Section */}
        <div className="mt-6 p-6 rounded-lg border-2 border-orange-200 bg-orange-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-orange-100">
              <Scale className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 text-lg">Body Composition</div>
              <div className="text-sm text-gray-600 mt-1">Track your weight and body fat percentage</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Weight (kg)</label>
              <Input
                type="number"
                value={todayData?.sleep?.weight?.toString() || ""}
                onChange={(e) => handleWeightChange(e.target.value)}
                placeholder="e.g. 75.5"
                className="w-full text-center"
                min="0"
                max="500"
                step="0.1"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Body Fat (%)</label>
              <Input
                type="number"
                value={todayData?.sleep?.bodyFat?.toString() || ""}
                onChange={(e) => handleBodyFatChange(e.target.value)}
                placeholder="e.g. 15.0"
                className="w-full text-center"
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TodayHabits;
