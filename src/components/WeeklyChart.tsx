
import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeeklyStats, HabitType } from "@/types/habit";
import { formatWeekLabel, habitColors } from "@/utils/chartUtils";
import { ChartContainer, ChartTooltipContent, ChartLegend } from "@/components/ui/chart";

interface WeeklyChartProps {
  habitType: HabitType;
  data: WeeklyStats[];
  title?: string;
  compact?: boolean;
}

const WeeklyChart: React.FC<WeeklyChartProps> = ({ habitType, data, title, compact = false }) => {
  const colors = habitColors[habitType];
  
  // Transform data for the chart
  const chartData = data.map((week) => ({
    name: formatWeekLabel(week.weekStart),
    planned: habitType === 'sleep' ? 7 : week.planned, // For sleep, we use 7 days as the goal
    completed: week.completed,
  }));
  
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
        return "Meditation";
      default:
        return "";
    }
  })();

  const chartConfig = {
    completed: {
      label: "Completed",
      color: colors.primary,
    },
    planned: {
      label: "Goal",
      color: colors.secondary,
    },
  };
  
  const content = (
    <div className={compact ? "h-[100px]" : "h-[140px]"}>
      <ChartContainer config={chartConfig}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" fontSize={8} tickMargin={5} />
            <YAxis allowDecimals={false} fontSize={8} />
            <Tooltip content={<ChartTooltipContent />} />
            <Bar dataKey="planned" fill={colors.secondary} radius={[2, 2, 0, 0]} />
            <Bar dataKey="completed" fill={colors.primary} radius={[2, 2, 0, 0]} />
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
        <ChartLegend
          className="mt-1"
          payload={[
            { value: "Completed", color: colors.primary, dataKey: "completed" },
            { value: "Goal", color: colors.secondary, dataKey: "planned" }
          ]}
        />
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
        <ChartLegend
          className="mt-1"
          payload={[
            { value: "Completed", color: colors.primary, dataKey: "completed" },
            { value: "Goal", color: colors.secondary, dataKey: "planned" }
          ]}
        />
      </CardContent>
    </Card>
  );
};

export default WeeklyChart;
