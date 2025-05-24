
import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent, ChartLegend } from "@/components/ui/chart";

interface WeeklyGoalStats {
  weekStart: Date;
  planned: number;
  completed: number;
}

interface GoalsWeeklyChartProps {
  subcategory: string;
  data: WeeklyGoalStats[];
  viewMonth?: number;
  viewYear?: number;
  satisfactionData?: Record<string, boolean>;
  onSatisfactionToggle?: (weekKey: string) => void;
  colors: { primary: string; secondary: string };
}

const GoalsWeeklyChart: React.FC<GoalsWeeklyChartProps> = ({ 
  subcategory,
  data,
  viewMonth,
  viewYear,
  satisfactionData = {},
  onSatisfactionToggle,
  colors
}) => {
  // Format week label for display (e.g., "May 12-18")
  const formatWeekLabel = (weekStart: Date): string => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const startDay = weekStart.getDate();
    const endDay = weekEnd.getDate();
    const month = weekStart.toLocaleString('default', { month: 'short' });
    
    return `${month} ${startDay}-${endDay}`;
  };
  
  // Transform data for the chart
  const chartData = data.map((week) => {
    const weekKey = `${week.weekStart.getFullYear()}-${week.weekStart.getMonth()}-${Math.floor(week.weekStart.getDate() / 7)}`;
    const isSatisfied = satisfactionData[weekKey] || false;
    
    return {
      name: formatWeekLabel(week.weekStart),
      planned: week.planned,
      completed: week.completed,
      remaining: week.planned - week.completed,
      weekKey,
      isSatisfied
    };
  });

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
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-xs font-medium">{subcategory}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="h-[140px]">
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
                barCategoryGap={8}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={8} tickMargin={5} />
                <YAxis 
                  allowDecimals={false} 
                  fontSize={8} 
                  domain={[0, 7]}
                  ticks={[0, 1, 2, 3, 4, 5, 6, 7]}
                />
                <Tooltip content={<ChartTooltipContent />} />
                
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
        <ChartLegend
          className="mt-1"
          payload={[
            { value: "Completed", color: colors.primary, dataKey: "completed" },
            { value: "Goal", color: colors.secondary, dataKey: "remaining" },
            { value: "Satisfied", color: "#22c55e", dataKey: "satisfied" }
          ]}
        />
        {onSatisfactionToggle && (
          <p className="text-xs text-gray-500 mt-1">Click bars to mark satisfaction</p>
        )}
      </CardContent>
    </Card>
  );
};

export default GoalsWeeklyChart;
