
import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HabitType, DayData } from "@/types/habit";
import HabitTracker from "./HabitTracker";
import { formatDateISO, getDaysInMonth, getDayCompletionPercentage } from "@/utils/habitUtils";
import { Separator } from "@/components/ui/separator";

interface CalendarProps {
  days: Record<string, DayData>;
  onUpdateHabit: (date: Date, type: HabitType, data: { planned: boolean; completed: boolean }) => void;
}

const Calendar: React.FC<CalendarProps> = ({ days, onUpdateHabit }) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' });
  
  // Get array of week days
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
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
    
    if (dayData[habitType].planned && dayData[habitType].completed) {
      return "bg-success";
    } else if (dayData[habitType].planned) {
      return "bg-blue-light/50";
    }
    
    return "bg-transparent";
  };

  renderDay = (date: Date) => {
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

    return (
      <div 
        key={isoDate} 
        className={`habit-day ${dayStyle} min-h-[140px] overflow-hidden flex flex-col`}
      >
        <div className="p-1">
          <span className={`text-sm font-medium ${isToday ? 'text-blue-dark' : ''}`}>
            {date.getDate()}
          </span>
        </div>
        
        {/* Habit mini-zones - display at the top with clear separation, reordered */}
        <div className="flex w-full h-3 mb-1 border-t border-gray-100">
          <div className={`w-1/4 ${getHabitStatusClass(dayData, "sleep")}`}></div>
          <div className={`w-1/4 ${getHabitStatusClass(dayData, "gym")}`}></div>
          <div className={`w-1/4 ${getHabitStatusClass(dayData, "alcohol")}`}></div>
          <div className={`w-1/4 ${getHabitStatusClass(dayData, "meditation")}`}></div>
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
      {/* Calendar header */}
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

      {/* Legend for mini-zones */}
      <div className="flex flex-wrap items-center justify-end mb-2 text-xs">
        <div className="flex items-center mr-3">
          <div className="w-3 h-3 bg-success mr-1"></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-light/50 mr-1"></div>
          <span>Planned</span>
        </div>
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Week day headers */}
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
    </div>
  );
};

export default Calendar;
