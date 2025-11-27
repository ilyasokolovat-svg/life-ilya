
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HabitType, WeeklyStats } from "@/types/habit";
import WeeklyChart from "./WeeklyChart";

interface HabitStatsChartProps {
  habitType: HabitType;
  weeklyData: WeeklyStats[];
  chartMonth: number;
  chartYear: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const HabitStatsChart: React.FC<HabitStatsChartProps> = ({
  habitType,
  weeklyData,
  chartMonth,
  chartYear,
  onPrevMonth,
  onNextMonth
}) => {
  const getMonthName = (month: number) => {
    return new Date(2000, month, 1).toLocaleDateString('default', { month: 'short' });
  };

  const getHabitTitle = () => {
    switch (habitType) {
      case "gym":
        return "Gym Workouts";
      case "alcohol":
        return "No Alcohol Days";
      case "sleep":
        return "Good Sleep";
      case "meditation":
        return "Presence";
      case "social":
        return "Social Activities";
      default:
        return "";
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Chart navigation */}
      <div className="flex items-center justify-between text-xs font-medium mb-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onPrevMonth}
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>
        <span>{getMonthName(chartMonth)} {chartYear}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onNextMonth}
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
      
      {/* Embedded Weekly Chart */}
      <div className="h-[110px]">
        <WeeklyChart 
          habitType={habitType} 
          data={weeklyData}
          title={`${getHabitTitle()} Trend`}
          compact={true}
          viewMonth={chartMonth}
          viewYear={chartYear}
        />
      </div>
    </div>
  );
};

export default HabitStatsChart;
