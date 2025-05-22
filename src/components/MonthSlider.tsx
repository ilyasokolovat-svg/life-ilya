
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface MonthSliderProps {
  viewMonth: number;
  viewYear: number;
  onChange: (month: number, year: number) => void;
}

const MonthSlider: React.FC<MonthSliderProps> = ({
  viewMonth,
  viewYear,
  onChange
}) => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Calculate relative month position for the slider (0-11)
  const monthPosition = viewMonth;

  // Previous month function
  const prevMonth = () => {
    const newMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const newYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    onChange(newMonth, newYear);
  };

  // Next month function
  const nextMonth = () => {
    const newMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    const newYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    onChange(newMonth, newYear);
  };

  // Handle slider change
  const handleSliderChange = (value: number[]) => {
    const newMonth = value[0];
    onChange(newMonth, viewYear);
  };

  // Get the month name
  const getMonthName = (month: number) => {
    return new Date(2000, month, 1).toLocaleDateString('default', { month: 'long' });
  };

  return (
    <div className="flex items-center gap-2 w-full px-1">
      <Button 
        variant="outline" 
        size="icon" 
        className="h-8 w-8" 
        onClick={prevMonth}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex-1 flex items-center gap-2">
        <div className="text-sm font-medium min-w-28">
          {getMonthName(viewMonth)} {viewYear}
        </div>
        <div className="flex-1">
          <Slider
            value={[monthPosition]}
            min={0}
            max={11}
            step={1}
            onValueChange={handleSliderChange}
          />
        </div>
      </div>
      <Button 
        variant="outline" 
        size="icon" 
        className="h-8 w-8" 
        onClick={nextMonth}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      {(viewMonth !== currentMonth || viewYear !== currentYear) && (
        <Button 
          variant="secondary" 
          size="sm" 
          className="h-8 text-xs"
          onClick={() => onChange(currentMonth, currentYear)}
        >
          Today
        </Button>
      )}
    </div>
  );
};

export default MonthSlider;
