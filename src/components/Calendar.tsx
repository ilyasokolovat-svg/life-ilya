import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Moon, Dumbbell, WineOff, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HabitType, DayData } from "@/types/habit";
import HabitTracker from "./HabitTracker";
import { formatDateISO, getDaysInMonth, getDayCompletionPercentage } from "@/utils/habitUtils";
import { getDubaiDate } from "@/utils/dateUtils";
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
  const dubaiToday = getDubaiDate();
  const [currentMonth, setCurrentMonth] = useState(viewMonth !== undefined ? viewMonth : dubaiToday.getMonth());
  const [currentYear, setCurrentYear] = useState(viewYear !== undefined ? viewYear : dubaiToday.getFullYear());
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
    const dayData = days[isoDate];
    
    // Add debug logging to see what's happening
    console.log(`Calendar: getDayData for ${isoDate}:`, dayData);
    console.log(`Calendar: Available days keys:`, Object.keys(days));
    
    return dayData;
  };

  const getCompletedHabitsCount = (dayData: DayData | undefined): number => {
    if (!dayData) return 0;
    
    let count = 0;
    const habitTypes: HabitType[] = ['sleep', 'gym', 'alcohol', 'meditation'];
    
    habitTypes.forEach(habitType => {
      if (habitType === 'sleep' && dayData[habitType].sleepHours && dayData[habitType].sleepHours >= 7) {
        count++;
      } else if (dayData[habitType].completed) {
        count++;
      }
    });
    
    return count;
  };

  const getProgressBarColor = (completedCount: number): string => {
    switch (completedCount) {
      case 1: return '#90EE90'; // Light green
      case 2: return '#32CD32'; // Lime green  
      case 3: return '#228B22'; // Forest green
      case 4: return '#006400'; // Dark green
      default: return 'transparent';
    }
  };

  const renderDay = (date: Date) => {
    const dayData = getDayData(date);
    const isoDate = formatDateISO(date);
    const todayISO = formatDateISO(dubaiToday);
    const isToday = todayISO === isoDate;
    const isPast = date < new Date(dubaiToday.setHours(0, 0, 0, 0));
    const completedCount = getCompletedHabitsCount(dayData);
    const progressPercentage = (completedCount / 4) * 100;
    const isAllCompleted = completedCount === 4;
    
    // Add debug logging for today's date
    if (isToday) {
      console.log(`Calendar: Rendering TODAY (${isoDate}). DayData:`, dayData);
      console.log(`Calendar: Dubai today calculated as:`, todayISO);
    }
    
    // Check if alcohol is planned (no alcohol day)
    const isAlcoholPlanned = dayData?.alcohol?.planned || false;
    
    // Enhanced day styling with yellow border for no alcohol days
    let dayStyle = '';
    if (isToday) {
      dayStyle = isAlcoholPlanned 
        ? 'border-2 border-yellow-400 bg-blue-50 shadow-lg ring-2 ring-yellow-300'
        : 'border-2 border-blue-500 bg-blue-50 shadow-lg';
    } else {
      dayStyle = isAlcoholPlanned
        ? 'border-2 border-yellow-400 bg-white hover:shadow-md transition-shadow duration-200'
        : 'border border-gray-200 bg-white hover:shadow-md transition-shadow duration-200';
    }

    // Reordering habits to put sleep first, then gym, alcohol, and meditation
    const habitOrder: HabitType[] = ['sleep', 'gym', 'alcohol', 'meditation'];

    // Adjust cell height based on screen size
    const cellHeight = isMobile ? 'min-h-[110px]' : 'min-h-[140px]';

    const getHabitLabel = (habitType: HabitType) => {
      switch (habitType) {
        case 'sleep': return 'Sleep';
        case 'gym': return 'Gym';
        case 'alcohol': return 'No Alcohol';
        case 'meditation': return 'Meditation';
        default: return '';
      }
    };

    const getHabitIcon = (habitType: HabitType) => {
      const iconProps = { className: "h-3 w-3" };
      switch (habitType) {
        case "sleep":
          return <Moon {...iconProps} />;
        case "gym":
          return <Dumbbell {...iconProps} />;
        case "alcohol":
          return <WineOff {...iconProps} />;
        case "meditation":
          return <Brain {...iconProps} />;
        default:
          return null;
      }
    };

    return (
      <div 
        key={isoDate} 
        className={`habit-day ${dayStyle} ${cellHeight} overflow-hidden flex flex-col rounded-lg relative`}
      >
        {/* Enhanced day header with conditional yellowish background */}
        <div className={`p-2 flex justify-between items-center border-b border-gray-200 ${
          isAlcoholPlanned 
            ? 'bg-gradient-to-r from-yellow-50 to-yellow-100' 
            : 'bg-gradient-to-r from-gray-50 to-gray-100'
        }`}>
          <span className={`text-sm font-semibold ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
            {date.getDate()}
          </span>
          <div className="flex items-center gap-1">
            {/* No alcohol icon indicator with yellow color */}
            {isAlcoholPlanned && (
              <WineOff className="h-3 w-3 text-yellow-600" />
            )}
            {isAllCompleted && (
              <span className="text-lg animate-pulse">🎉</span>
            )}
          </div>
        </div>
        
        {/* Enhanced progress bar */}
        <div className="w-full h-1 bg-gray-100">
          <div 
            className="h-full transition-all duration-500 ease-out"
            style={{
              width: `${progressPercentage}%`,
              backgroundColor: getProgressBarColor(completedCount),
              boxShadow: progressPercentage > 0 ? '0 0 4px rgba(0,0,0,0.2)' : 'none'
            }}
          ></div>
        </div>
        
        {/* Habits for the day with restructured layout */}
        <div className="flex-1 p-2 space-y-1">
          {habitOrder.map((habitType) => {
            // Get the most up-to-date habit data, ensuring we have the latest state
            const currentHabitData = dayData?.[habitType] || { planned: false, completed: false };
            console.log(`Calendar: Rendering ${habitType} for ${isoDate}:`, currentHabitData);
            
            return (
              <div key={`${isoDate}-${habitType}`} className="bg-gray-50 rounded px-2 py-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 flex-1">
                    {getHabitIcon(habitType)}
                    <span className="text-xs font-medium text-gray-600">
                      {getHabitLabel(habitType)}
                    </span>
                  </div>
                  <HabitTracker
                    key={`${isoDate}-${habitType}-${currentHabitData.completed}-${Date.now()}`}
                    date={date}
                    habitType={habitType}
                    habitData={currentHabitData}
                    onUpdate={(type, data) => {
                      console.log(`Calendar: HabitTracker update for ${type} on ${isoDate}:`, data);
                      onUpdateHabit(date, type, data);
                    }}
                  />
                </div>
              </div>
            );
          })}
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
                  setCurrentMonth(dubaiToday.getMonth());
                  setCurrentYear(dubaiToday.getFullYear());
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

      {/* Legend for progress bar */}
      <div className="flex flex-wrap items-center justify-end mb-2 text-xs">
        <div className="flex items-center mr-3">
          <div className="w-3 h-3 mr-1 rounded" style={{ backgroundColor: '#90EE90' }}></div>
          <span>1/4</span>
        </div>
        <div className="flex items-center mr-3">
          <div className="w-3 h-3 mr-1 rounded" style={{ backgroundColor: '#32CD32' }}></div>
          <span>2/4</span>
        </div>
        <div className="flex items-center mr-3">
          <div className="w-3 h-3 mr-1 rounded" style={{ backgroundColor: '#228B22' }}></div>
          <span>3/4</span>
        </div>
        <div className="flex items-center mr-3">
          <div className="w-3 h-3 mr-1 rounded" style={{ backgroundColor: '#006400' }}></div>
          <span>4/4 🎉</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 mr-1 rounded border-2 border-yellow-400 bg-white"></div>
          <span>No alcohol planned</span>
        </div>
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Week day headers - now starting with Monday */}
        {weekDays.map((day) => (
          <div key={day} className="text-center font-medium py-3 text-gray-600 bg-gray-50 rounded-t-lg">
            {day}
          </div>
        ))}
        
        {/* Empty cells for days before the 1st of the month */}
        {Array.from({ length: firstDayOfMonth }).map((_, index) => (
          <div key={`empty-${index}`} className="bg-gray-50 border border-gray-100 rounded-lg opacity-50" />
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
              <WineOff className="h-3.5 w-3.5 mr-1" />
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
