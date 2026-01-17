import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, Moon, Smartphone } from "lucide-react";
import { useGoalsData } from "@/hooks/useGoalsData";

interface SleepScheduleWeekProps {
  category: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SleepScheduleWeek: React.FC<SleepScheduleWeekProps> = ({ category }) => {
  const { goalsData, saveGoal } = useGoalsData(category);
  const [localSchedule, setLocalSchedule] = useState<Record<string, { electronicsOff: string; bedtime: string }>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize from saved data
  useEffect(() => {
    const savedSchedule: Record<string, { electronicsOff: string; bedtime: string }> = {};
    
    DAYS.forEach(day => {
      const dayData = goalsData.find(g => 
        g.subcategory === 'Sleep' && 
        g.period_key === `sleep_schedule_${day.toLowerCase()}` &&
        g.period_type === 'sleep_schedule'
      );
      
      if (dayData?.planned_goal) {
        try {
          const parsed = JSON.parse(dayData.planned_goal);
          savedSchedule[day] = parsed;
        } catch {
          savedSchedule[day] = { electronicsOff: '', bedtime: '' };
        }
      } else {
        savedSchedule[day] = { electronicsOff: '', bedtime: '' };
      }
    });
    
    setLocalSchedule(savedSchedule);
  }, [goalsData]);

  const handleScheduleChange = (day: string, field: 'electronicsOff' | 'bedtime', value: string) => {
    setLocalSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    DAYS.forEach(day => {
      const schedule = localSchedule[day] || { electronicsOff: '', bedtime: '' };
      saveGoal({
        category,
        subcategory: 'Sleep',
        period_key: `sleep_schedule_${day.toLowerCase()}`,
        period_type: 'sleep_schedule',
        planned_goal: JSON.stringify(schedule),
      });
    });
    setHasChanges(false);
  };

  const getDayEmoji = (day: string) => {
    const emojis: Record<string, string> = {
      'Monday': '🌅',
      'Tuesday': '🌤️',
      'Wednesday': '☀️',
      'Thursday': '⭐',
      'Friday': '🎉',
      'Saturday': '🌴',
      'Sunday': '🌈'
    };
    return emojis[day] || '📅';
  };

  return (
    <Card className="shadow-md border-0 bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-gray-700 flex items-center gap-2">
            <Moon className="w-5 h-5 text-indigo-500" />
            😴 Weekly Sleep Schedule
          </CardTitle>
          {hasChanges && (
            <Button 
              onClick={handleSave}
              className="bg-indigo-500 hover:bg-indigo-600 text-white"
              size="sm"
            >
              <Save className="w-3 h-3 mr-1" />
              Save All
            </Button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Plan your sleep routine for the week. Edit anytime!
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Header row with days */}
            <div className="grid grid-cols-8 gap-2 mb-3">
              <div className="text-xs font-semibold text-gray-500 py-2"></div>
              {DAYS.map(day => (
                <div key={day} className="text-center">
                  <span className="text-sm mr-1">{getDayEmoji(day)}</span>
                  <span className="text-xs font-semibold text-gray-700">{day.slice(0, 3)}</span>
                </div>
              ))}
            </div>
            
            {/* Electronics Off row */}
            <div className="grid grid-cols-8 gap-2 mb-3">
              <div className="text-xs font-medium text-gray-600 py-2 flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-gray-400" />
                Electronics Off
              </div>
              {DAYS.map(day => (
                <Input
                  key={`${day}-electronics`}
                  type="time"
                  value={localSchedule[day]?.electronicsOff || ''}
                  onChange={(e) => handleScheduleChange(day, 'electronicsOff', e.target.value)}
                  className="h-8 text-xs bg-purple-50 border-purple-200 focus:border-purple-400"
                />
              ))}
            </div>
            
            {/* Bedtime row */}
            <div className="grid grid-cols-8 gap-2">
              <div className="text-xs font-medium text-gray-600 py-2 flex items-center gap-1">
                <Moon className="w-3 h-3 text-indigo-400" />
                Bedtime
              </div>
              {DAYS.map(day => (
                <Input
                  key={`${day}-bedtime`}
                  type="time"
                  value={localSchedule[day]?.bedtime || ''}
                  onChange={(e) => handleScheduleChange(day, 'bedtime', e.target.value)}
                  className="h-8 text-xs bg-indigo-50 border-indigo-200 focus:border-indigo-400"
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SleepScheduleWeek;
