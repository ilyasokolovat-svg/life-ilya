
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Moon, Dumbbell, Wine, Brain } from "lucide-react";
import { HabitType, HabitData, DayData } from "@/types/habit";
import { formatDateISO } from "@/utils/habitUtils";

interface TodayHabitsProps {
  todayData: DayData | null;
  onUpdateHabit: (date: Date, type: HabitType, data: HabitData) => void;
}

const TodayHabits: React.FC<TodayHabitsProps> = ({ todayData, onUpdateHabit }) => {
  const today = new Date();
  const todayISO = formatDateISO(today);

  const handleHabitUpdate = (habitType: HabitType, updates: Partial<HabitData>) => {
    // Get the current data for this specific habit type, preserving all existing fields
    const currentData = todayData?.[habitType] || { planned: false, completed: false };
    
    // Merge updates with current data, preserving all existing fields
    const newData: HabitData = {
      planned: currentData.planned,
      completed: currentData.completed,
      ...(currentData.sleepHours !== undefined && { sleepHours: currentData.sleepHours }),
      ...(currentData.workoutType !== undefined && { workoutType: currentData.workoutType }),
      ...(currentData.location !== undefined && { location: currentData.location }),
      ...updates
    };
    
    console.log(`Updating ${habitType} habit:`, { currentData, updates, newData });
    onUpdateHabit(today, habitType, newData);
  };

  const handleSleepHoursChange = (value: string) => {
    const hours = parseFloat(value);
    if (!isNaN(hours) && hours >= 0) {
      handleHabitUpdate('sleep', { sleepHours: hours });
    } else if (value === "") {
      // Handle empty input
      handleHabitUpdate('sleep', { sleepHours: undefined });
    }
  };

  const habits = [
    {
      type: 'sleep' as HabitType,
      icon: Moon,
      name: 'Sleep',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      isSpecial: true
    },
    {
      type: 'gym' as HabitType,
      icon: Dumbbell,
      name: 'Gym',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      type: 'alcohol' as HabitType,
      icon: Wine,
      name: 'No Alcohol',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      type: 'meditation' as HabitType,
      icon: Brain,
      name: 'Meditation',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
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
            })}
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
                className={`p-4 rounded-lg border-2 transition-all ${
                  habitData.completed 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                } ${habit.bgColor}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-full ${habit.bgColor}`}>
                    <Icon className={`h-5 w-5 ${habit.color}`} />
                  </div>
                  <span className="font-medium text-gray-900">{habit.name}</span>
                </div>
                
                {habit.isSpecial ? (
                  // Sleep hours input
                  <div className="space-y-2">
                    <Input
                      type="number"
                      value={habitData.sleepHours?.toString() || ""}
                      onChange={(e) => handleSleepHoursChange(e.target.value)}
                      placeholder="Hours slept"
                      className="w-full"
                      min="0"
                      max="24"
                      step="0.5"
                    />
                    <div className="text-xs text-gray-500 text-center">
                      Hours: {habitData.sleepHours || 0}
                    </div>
                  </div>
                ) : (
                  // Regular checkboxes for other habits
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={habitData.planned}
                        onCheckedChange={(checked) => 
                          handleHabitUpdate(habit.type, { planned: !!checked })
                        }
                        className="h-4 w-4"
                      />
                      <label className="text-sm text-gray-600">Planned</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={habitData.completed}
                        onCheckedChange={(checked) => 
                          handleHabitUpdate(habit.type, { completed: !!checked })
                        }
                        className="h-4 w-4 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                      <label className="text-sm font-medium text-gray-700">Completed</label>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default TodayHabits;
