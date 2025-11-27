

import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeeklyStats, HabitType } from "@/types/habit";
import { formatWeekLabel, habitColors } from "@/utils/chartUtils";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface WeeklyChartProps {
  habitType: HabitType;
  data: WeeklyStats[];
  title?: string;
  compact?: boolean;
  viewMonth?: number;
  viewYear?: number;
  onMonthChange?: (month: number, year: number) => void;
  satisfactionData?: Record<string, boolean>;
  onSatisfactionToggle?: (weekKey: string) => void;
}

const WeeklyChart: React.FC<WeeklyChartProps> = ({ 
  habitType, 
  data, 
  title, 
  compact = false,
  viewMonth,
  viewYear,
  onMonthChange,
  satisfactionData = {},
  onSatisfactionToggle
}) => {
  const colors = habitColors[habitType];
  
  // Transform data for the chart - create a new format that includes both planned and completed
  const chartData = data.map((week) => {
    const weekKey = `${week.weekStart.getFullYear()}-${week.weekStart.getMonth()}-${Math.floor(week.weekStart.getDate() / 7)}`;
    const isSatisfied = satisfactionData[weekKey] || false;
    
    return {
      name: formatWeekLabel(week.weekStart),
      planned: habitType === 'sleep' ? 7 : week.planned,
      completed: week.completed,
      remaining: (habitType === 'sleep' ? 7 : week.planned) - week.completed,
      weekKey,
      isSatisfied
    };
  });
  
  // Get title based on habit type if not provided
  const chartTitle = title || (() => {
    switch (habitType) {
      case "sleep":
        return "Sleep (7+ hours)";
      case "gym":
        return "Gym Workouts";
      case "alcohol":
        return "No Alcohol";
      case "meditation":
        return "Presence";
      case "social":
        return "Social Activities";
      default:
        return "";
    }
  })();

  const chartConfig = {
    completed: {
      label: "Completed",
      color: colors.primary,
    },
    remaining: {
      label: "Goal",
      color: colors.secondary,
    },
  };

  const handleBarClick = (data: any) => {
    if (onSatisfactionToggle && data.weekKey) {
      onSatisfactionToggle(data.weekKey);
    }
  };
  
  const content = (
    <div className={compact ? "h-[120px]" : "h-[140px]"}>
      <ChartContainer config={chartConfig}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData} 
            margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
            barCategoryGap={6}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" fontSize={8} tickMargin={5} />
            <YAxis 
              allowDecimals={false} 
              fontSize={8} 
              domain={[0, 7]}
              ticks={[0, 1, 2, 3, 4, 5, 6, 7]}
            />
            <Tooltip 
              content={<ChartTooltipContent />}
              offset={compact ? 30 : 20}
              position={{ y: compact ? 80 : 100 }}
            />
            
            {/* First render the "completed" part (darker color) */}
            <Bar 
              dataKey="completed" 
              radius={[2, 2, 0, 0]}
              stackId="a"
              onClick={handleBarClick}
              style={{ cursor: onSatisfactionToggle ? 'pointer' : 'default' }}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`completed-cell-${index}`} 
                  fill={entry.isSatisfied ? '#22c55e' : colors.primary}
                  stroke={entry.isSatisfied ? '#16a34a' : 'none'}
                  strokeWidth={entry.isSatisfied ? 2 : 0}
                />
              ))}
            </Bar>
            
            {/* Then render the "remaining" part (lighter color) */}
            <Bar 
              dataKey="remaining" 
              radius={[2, 2, 0, 0]}
              stackId="a"
              onClick={handleBarClick}
              style={{ cursor: onSatisfactionToggle ? 'pointer' : 'default' }}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`remaining-cell-${index}`} 
                  fill={entry.isSatisfied ? '#dcfce7' : colors.secondary}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
  
  if (compact) {
    return (
      <div>
        <h4 className="text-xs font-medium mb-1">{chartTitle}</h4>
        {content}
        {onSatisfactionToggle && (
          <p className="text-xs text-gray-500 mt-1">Click bars to mark satisfaction</p>
        )}
      </div>
    );
  }
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-xs font-medium">{chartTitle}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {content}
        {onSatisfactionToggle && (
          <p className="text-xs text-gray-500 mt-1">Click bars to mark satisfaction</p>
        )}
      </CardContent>
    </Card>
  );
};

export default WeeklyChart;

