
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Moon, Dumbbell, Wine, Brain } from "lucide-react";
import { HabitType, HabitData, DayData } from "@/types/habit";
import { getDubaiDate, formatDateISO } from "@/utils/dateUtils";

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

  const handleHabitComplete = (habitType: HabitType, completed: boolean) => {
    // Get current data for this habit or create default
    const currentHabitData = todayData?.[habitType] || { planned: false, completed: false };
    
    // Create updated habit data - when completed, also mark as planned
    const updatedHabitData: HabitData = {
      ...currentHabitData,
      completed,
      planned: completed ? true : currentHabitData.planned // Keep planned true if it was already true
    };
    
    console.log(`TodayHabits: Updating ${habitType} for ${todayISO}:`, { 
      current: currentHabitData, 
      updated: updatedHabitData 
    });
    
    // Call the update function which will sync to calendar
    onUpdateHabit(today, habitType, updatedHabitData);
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
      name: 'No Alcohol',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {habits.map((habit) => {
            const Icon = habit.icon;
            const habitData = todayData?.[habit.type] || { planned: false, completed: false };
            
            console.log(`TodayHabits: Rendering ${habit.type} with data:`, habitData);
            
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
                  // Sleep hours input
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
                  </div>
                ) : (
                  // Completed checkbox for other habits
                  <div className="flex items-center justify-center">
                    <div 
                      className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-white/50 transition-colors"
                      onClick={() => handleHabitComplete(habit.type, !habitData.completed)}
                    >
                      <Checkbox
                        checked={habitData.completed || false}
                        onCheckedChange={(checked) => {
                          handleHabitComplete(habit.type, !!checked);
                        }}
                        className="h-6 w-6 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                      <label className="text-lg font-medium text-gray-700 cursor-pointer">
                        Completed
                      </label>
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
