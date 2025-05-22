
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

  const renderDay = (date: Date) => {
    const dayData = getDayData(date);
    const isoDate = formatDateISO(date);
    const isToday = formatDateISO(today) === isoDate;
    const isPast = date < new Date(today.setHours(0, 0, 0, 0));
    
    // Calculate completion percentage if day has planned habits
    const completionPercentage = dayData ? getDayCompletionPercentage(dayData) : 0;
    
    // Day style (highlight today)
    const dayStyle = isToday
      ? 'border-2 border-blue shadow-sm'
      : 'border border-gray-light';
      
    // Color based on completion (only if day has planned tasks)
    let colorStyle = '';
    if (completionPercentage > 0) {
      if (completionPercentage === 100) {
        colorStyle = 'bg-success/10';
      } else if (completionPercentage >= 50) {
        colorStyle = 'bg-blue-light/50';
      } else {
        colorStyle = 'bg-gray-light';
      }
    }

    return (
      <div 
        key={isoDate} 
        className={`habit-day ${dayStyle} ${colorStyle} min-h-[140px]`}
      >
        <div className="habit-day-content">
          {/* Date and completion indicator */}
          <div className="flex justify-between items-start mb-1">
            <span className={`text-sm font-medium ${isToday ? 'text-blue-dark' : ''}`}>
              {date.getDate()}
            </span>
            {completionPercentage > 0 && (
              <span 
                className={`habit-badge ${
                  completionPercentage === 100 
                    ? 'completed' 
                    : completionPercentage > 0 
                      ? 'planned' 
                      : ''
                }`}
              >
                {completionPercentage}%
              </span>
            )}
          </div>
          
          {/* Habits for the day */}
          <div className="space-y-1">
            {['gym', 'alcohol', 'sleep'].map((habitType) => (
              <HabitTracker
                key={`${isoDate}-${habitType}`}
                date={date}
                habitType={habitType as HabitType}
                habitData={
                  dayData?.[habitType as HabitType] || { planned: false, completed: false }
                }
                onUpdate={(type, data) => onUpdateHabit(date, type, data)}
              />
            ))}
          </div>
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
