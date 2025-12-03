
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { HabitsState } from "@/types/habit";
import { formatDateISO } from "@/utils/habitUtils";
import { Brain } from "lucide-react";

interface PresencePlanningProps {
  habitsState: HabitsState;
  viewMonth: number;
  viewYear: number;
  onUpdatePresencePlan: (date: string, journaling: boolean, meditationDone: boolean, mindfulPhone: boolean) => void;
}

const PresencePlanning: React.FC<PresencePlanningProps> = ({
  habitsState,
  viewMonth,
  viewYear,
  onUpdatePresencePlan
}) => {
  // Get all days in the current month where presence/meditation is completed
  const getCompletedPresenceDays = () => {
    const completedDays: { 
      date: Date; 
      dateISO: string; 
      journaling: boolean;
      meditationDone: boolean;
      mindfulPhone: boolean;
    }[] = [];
    
    // Get the number of days in the current month
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(viewYear, viewMonth, day);
      const dateISO = formatDateISO(date);
      const dayData = habitsState.days[dateISO];
      
      // Check if presence/meditation is completed for this day
      if (dayData?.meditation?.completed) {
        completedDays.push({
          date,
          dateISO,
          journaling: dayData.meditation.journaling || false,
          meditationDone: dayData.meditation.meditationDone || false,
          mindfulPhone: dayData.meditation.mindfulPhone || false
        });
      }
    }
    
    return completedDays;
  };

  const completedDays = getCompletedPresenceDays();

  const handleCheckboxChange = (
    dateISO: string, 
    field: 'journaling' | 'meditationDone' | 'mindfulPhone',
    checked: boolean
  ) => {
    const dayData = habitsState.days[dateISO];
    const currentJournaling = dayData?.meditation?.journaling || false;
    const currentMeditationDone = dayData?.meditation?.meditationDone || false;
    const currentMindfulPhone = dayData?.meditation?.mindfulPhone || false;

    const updatedValues = {
      journaling: field === 'journaling' ? checked : currentJournaling,
      meditationDone: field === 'meditationDone' ? checked : currentMeditationDone,
      mindfulPhone: field === 'mindfulPhone' ? checked : currentMindfulPhone
    };

    onUpdatePresencePlan(dateISO, updatedValues.journaling, updatedValues.meditationDone, updatedValues.mindfulPhone);
  };

  const formatDateDisplay = (date: Date) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = dayNames[date.getDay()];
    const dayNumber = date.getDate();
    return `${dayName} ${dayNumber}`;
  };

  if (completedDays.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Presence Planning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">
            No presence days completed this month. Mark "Done" on presence in the calendar to track what you did.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Presence Planning
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Track what you did on your completed presence days
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-3">
          {completedDays.map((day) => (
            <div
              key={day.dateISO}
              className="border rounded-lg p-2 bg-purple-50 border-purple-200 hover:bg-purple-100 transition-colors"
            >
              <div className="text-center mb-2">
                <div className="text-xs font-semibold text-purple-700">
                  {formatDateDisplay(day.date)}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`journaling-${day.dateISO}`}
                    checked={day.journaling}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange(day.dateISO, 'journaling', checked as boolean)
                    }
                    className="h-4 w-4"
                  />
                  <label 
                    htmlFor={`journaling-${day.dateISO}`}
                    className="text-xs cursor-pointer"
                  >
                    📝 Journaling
                  </label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`meditation-${day.dateISO}`}
                    checked={day.meditationDone}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange(day.dateISO, 'meditationDone', checked as boolean)
                    }
                    className="h-4 w-4"
                  />
                  <label 
                    htmlFor={`meditation-${day.dateISO}`}
                    className="text-xs cursor-pointer"
                  >
                    🧘 Meditation
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`mindfulPhone-${day.dateISO}`}
                    checked={day.mindfulPhone}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange(day.dateISO, 'mindfulPhone', checked as boolean)
                    }
                    className="h-4 w-4"
                  />
                  <label 
                    htmlFor={`mindfulPhone-${day.dateISO}`}
                    className="text-xs cursor-pointer"
                  >
                    📱 Mindful Phone
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PresencePlanning;
