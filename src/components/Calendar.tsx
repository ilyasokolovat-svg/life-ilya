
import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HabitType, DayData } from "@/types/habit";
import HabitTracker from "./HabitTracker";
import { formatDateISO, getDaysInMonth, getDayCompletionPercentage } from "@/utils/habitUtils";
import { Separator } from "@/components/ui/separator";
import { habitColors } from "@/utils/chartUtils";
import { useMediaQuery } from "@/hooks/use-mobile";

interface CalendarProps {
  days: Record<string, DayData>;
  onUpdateHabit: (date: Date, type: HabitType, data: { planned: boolean; completed: boolean; sleepHours?: number }) => void;
  viewMonth?: number;
  viewYear?: number;
}

const Calendar: React.FC<CalendarProps> = ({ days, onUpdateHabit, viewMonth, viewYear }) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(viewMonth !== undefined ? viewMonth : today.getMonth());
  const [currentYear, setCurrentYear] = useState(viewYear !== undefined ? viewYear : today.getFullYear());
  const isMobile = useMediaQuery("(max-width: 640px)");

  // Update calendar when viewMonth or viewYear prop changes
  useEffect(() => {
    if (viewMonth !== undefined && viewYear !== undefined) {
      setCurrentMonth(viewMonth);
      setCurrentYear(viewYear);
    }
  }, [viewMonth, viewYear]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  
  // Calculate first day of month with Monday as first day of week (0)
  // In JavaScript, Sunday is 0, Monday is 1, ..., Saturday is 6
  // To make Monday the first day, we subtract 1 and use modulo 7
  const firstDayOfMonth = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;
  
  const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' });
  
  // Update weekdays array to start with Monday
  const weekDays = isMobile ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Navigation functions
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  
  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getDayData = (date: Date): DayData | undefined => {
    const isoDate = formatDateISO(date);
    return days[isoDate];
  };

  const getHabitStatusClass = (dayData: DayData | undefined, habitType: HabitType): string => {
    if (!dayData || !dayData[habitType]) {
      return "bg-transparent";
    }
    
    if (habitType === 'sleep' && dayData[habitType].sleepHours && dayData[habitType].sleepHours >= 7) {
      return "bg-success";
    } else if (dayData[habitType].planned && dayData[habitType].completed) {
      return "bg-success";
    } else if (dayData[habitType].planned) {
      return "bg-blue-light/50";
    }
    
    return "bg-transparent";
  };

  const renderDay = (date: Date) => {
    const dayData = getDayData(date);
    const isoDate = formatDateISO(date);
    const isToday = formatDateISO(today) === isoDate;
    const isPast = date < new Date(today.setHours(0, 0, 0, 0));
    
    // Day style (highlight today)
    const dayStyle = isToday
      ? 'border-2 border-blue shadow-sm'
      : 'border border-gray-light';

    // Reordering habits to put sleep first, then gym, alcohol, and meditation
    const habitOrder: HabitType[] = ['sleep', 'gym', 'alcohol', 'meditation'];

    // Adjust cell height based on screen size
    const cellHeight = isMobile ? 'min-h-[110px]' : 'min-h-[140px]';

    return (
      <div 
        key={isoDate} 
        className={`habit-day ${dayStyle} ${cellHeight} overflow-hidden flex flex-col`}
      >
        <div className="p-1">
          <span className={`text-sm font-medium ${isToday ? 'text-blue-dark' : ''}`}>
            {date.getDate()}
          </span>
        </div>
        
        {/* Habit mini-zones - display at the top with clear separation, reordered */}
        <div className="flex w-full h-3 mb-1 border-t border-gray-100">
          {habitOrder.map((habit) => (
            <div 
              key={`mini-${isoDate}-${habit}`}
              className={`w-1/4 ${getHabitStatusClass(dayData, habit)}`}
              style={{
                backgroundColor: getHabitStatusClass(dayData, habit) === "bg-success" 
                  ? habitColors[habit].primary 
                  : getHabitStatusClass(dayData, habit) === "bg-blue-light/50"
                    ? habitColors[habit].secondary
                    : "transparent"
              }}
            ></div>
          ))}
        </div>
        
        {/* Habits for the day - reordered */}
        <div className="flex-1 p-1 space-y-1">
          {habitOrder.map((habitType) => (
            <HabitTracker
              key={`${isoDate}-${habitType}`}
              date={date}
              habitType={habitType}
              habitData={
                dayData?.[habitType] || { planned: false, completed: false }
              }
              onUpdate={(type, data) => onUpdateHabit(date, type, data)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      {/* Calendar header - only show if viewMonth/Year not provided (means we're not controlled by slider) */}
      {viewMonth === undefined && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {monthName} {currentYear}
            </h2>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentMonth(today.getMonth());
                  setCurrentYear(today.getFullYear());
                }}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <Separator className="my-4" />
        </>
      )}

      {/* Legend for mini-zones */}
      <div className="flex flex-wrap items-center justify-end mb-2 text-xs">
        <div className="flex items-center mr-3">
          <div className="w-3 h-3 mr-1" style={{ backgroundColor: habitColors.sleep.primary }}></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 mr-1" style={{ backgroundColor: habitColors.sleep.secondary }}></div>
          <span>Planned</span>
        </div>
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Week day headers - now starting with Monday */}
        {weekDays.map((day) => (
          <div key={day} className="text-center font-medium py-2">
            {day}
          </div>
        ))}
        
        {/* Empty cells for days before the 1st of the month */}
        {Array.from({ length: firstDayOfMonth }).map((_, index) => (
          <div key={`empty-${index}`} className="bg-gray-50 border border-gray-100" />
        ))}
        
        {/* Actual days */}
        {daysInMonth.map((date) => renderDay(date))}
      </div>
      
      {/* Legend for mobile */}
      {isMobile && (
        <div className="mt-4 border-t pt-2">
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center">
              <Moon className="h-3.5 w-3.5 mr-1" />
              <span>Sleep</span>
            </div>
            <div className="flex items-center">
              <Dumbbell className="h-3.5 w-3.5 mr-1" />
              <span>Gym</span>
            </div>
            <div className="flex items-center">
              <Wine className="h-3.5 w-3.5 mr-1" />
              <span>No Alcohol</span>
            </div>
            <div className="flex items-center">
              <Brain className="h-3.5 w-3.5 mr-1" />
              <span>Meditation</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
