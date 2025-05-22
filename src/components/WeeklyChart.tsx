
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
}

const WeeklyChart: React.FC<WeeklyChartProps> = ({ habitType, data, title }) => {
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
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{chartTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[180px]">
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={10} tickMargin={5} />
                <YAxis allowDecimals={false} fontSize={10} />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="planned" fill={colors.secondary} radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" fill={colors.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
        <ChartLegend
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
