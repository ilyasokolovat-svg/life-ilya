
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { HabitsState } from "@/types/habit";
import { formatDateISO } from "@/utils/habitUtils";
import { Dumbbell } from "lucide-react";

interface GymPlanningProps {
  habitsState: HabitsState;
  viewMonth: number;
  viewYear: number;
  onUpdateGymPlan: (date: string, workoutType: string, location: string) => void;
}

const GymPlanning: React.FC<GymPlanningProps> = ({
  habitsState,
  viewMonth,
  viewYear,
  onUpdateGymPlan
}) => {
  // Get all days in the current month where gym is planned
  const getPlannedGymDays = () => {
    const plannedDays: { date: Date; dateISO: string; workoutType: string; location: string }[] = [];
    
    // Get the number of days in the current month
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(viewYear, viewMonth, day);
      const dateISO = formatDateISO(date);
      const dayData = habitsState.days[dateISO];
      
      // Check if gym is planned for this day
      if (dayData?.gym?.planned) {
        plannedDays.push({
          date,
          dateISO,
          workoutType: dayData.gym.workoutType || '',
          location: dayData.gym.location || ''
        });
      }
    }
    
    return plannedDays;
  };

  const plannedDays = getPlannedGymDays();

  const handleWorkoutTypeChange = (dateISO: string, workoutType: string) => {
    const dayData = habitsState.days[dateISO];
    const location = dayData?.gym?.location || '';
    onUpdateGymPlan(dateISO, workoutType, location);
  };

  const handleLocationChange = (dateISO: string, location: string) => {
    const dayData = habitsState.days[dateISO];
    const workoutType = dayData?.gym?.workoutType || '';
    onUpdateGymPlan(dateISO, workoutType, location);
  };

  const formatDateDisplay = (date: Date) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = dayNames[date.getDay()];
    const dayNumber = date.getDate();
    return `${dayName} ${dayNumber}`;
  };

  if (plannedDays.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            Gym Planning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">
            No gym sessions planned for this month. Check the "Plan" checkbox in the calendar to start planning your workouts.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5" />
          Gym Planning
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Plan your workouts for the days you've marked in the calendar
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {plannedDays.map((day) => (
            <div
              key={day.dateISO}
              className="border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="text-center mb-3">
                <div className="text-sm font-semibold text-blue-600">
                  {formatDateDisplay(day.date)}
                </div>
              </div>
              
              <div className="space-y-2">
                <div>
                  <Input
                    type="text"
                    placeholder="Workout type"
                    value={day.workoutType}
                    onChange={(e) => handleWorkoutTypeChange(day.dateISO, e.target.value)}
                    className="text-xs h-8 placeholder:text-gray-400"
                  />
                </div>
                
                <div>
                  <Input
                    type="text"
                    placeholder="Location"
                    value={day.location}
                    onChange={(e) => handleLocationChange(day.dateISO, e.target.value)}
                    className="text-xs h-8 placeholder:text-gray-400"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default GymPlanning;
