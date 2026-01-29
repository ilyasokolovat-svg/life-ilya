import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HabitsState } from "@/types/habit";
import { formatDateISO } from "@/utils/habitUtils";
import { Scale, TrendingDown, TrendingUp, Minus } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from "recharts";

interface WeightChartProps {
  habitsState: HabitsState;
  viewMonth: number;
  viewYear: number;
}

const WeightChart: React.FC<WeightChartProps> = ({
  habitsState,
  viewMonth,
  viewYear
}) => {
  // Get all days in the current month with weight data
  const getWeightData = () => {
    const weightData: { date: string; day: number; weight: number | null; bodyFat: number | null }[] = [];
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(viewYear, viewMonth, day);
      const dateISO = formatDateISO(date);
      const dayData = habitsState.days[dateISO];
      
      // Weight is stored in the sleep habit data for daily check-in
      const weight = dayData?.sleep?.weight || null;
      const bodyFat = dayData?.sleep?.bodyFat || null;
      
      weightData.push({
        date: dateISO,
        day,
        weight,
        bodyFat
      });
    }
    
    return weightData;
  };

  const weightData = getWeightData();
  
  // Filter to only entries with weight data for calculations
  const entriesWithWeight = weightData.filter(d => d.weight !== null);
  
  // Calculate stats
  const latestWeight = entriesWithWeight.length > 0 
    ? entriesWithWeight[entriesWithWeight.length - 1].weight 
    : null;
  const firstWeight = entriesWithWeight.length > 0 
    ? entriesWithWeight[0].weight 
    : null;
  const weightChange = latestWeight && firstWeight 
    ? (latestWeight - firstWeight).toFixed(1) 
    : null;
  const avgWeight = entriesWithWeight.length > 0
    ? (entriesWithWeight.reduce((sum, d) => sum + (d.weight || 0), 0) / entriesWithWeight.length).toFixed(1)
    : null;

  // Get the trend icon
  const getTrendIcon = () => {
    if (!weightChange) return <Minus className="h-4 w-4 text-muted-foreground" />;
    const change = parseFloat(weightChange);
    if (change > 0) return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const chartConfig = {
    weight: {
      label: "Weight",
      color: "hsl(var(--primary))",
    },
    bodyFat: {
      label: "Body Fat %",
      color: "hsl(var(--secondary))",
    },
  };

  // Get month name
  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString('default', { month: 'long' });

  if (entriesWithWeight.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Weight Tracking - {monthName} {viewYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No weight data recorded for this month. Add your weight in Today's Habits to start tracking.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Weight Tracking - {monthName} {viewYear}
        </CardTitle>
        <div className="flex flex-wrap gap-4 mt-2 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Current:</span>
            <span className="font-semibold">{latestWeight} kg</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Average:</span>
            <span className="font-semibold">{avgWeight} kg</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Change:</span>
            <span className="font-semibold flex items-center gap-1">
              {getTrendIcon()}
              {weightChange ? `${parseFloat(weightChange) > 0 ? '+' : ''}${weightChange} kg` : 'N/A'}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <LineChart 
            data={weightData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <XAxis 
              dataKey="day" 
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value}`}
            />
            <YAxis 
              domain={['auto', 'auto']}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value}`}
              width={40}
            />
            {avgWeight && (
              <ReferenceLine 
                y={parseFloat(avgWeight)} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="3 3" 
                label={{ value: 'Avg', position: 'right', fontSize: 10 }}
              />
            )}
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    if (name === 'weight') return [`${value} kg`, 'Weight'];
                    if (name === 'bodyFat') return [`${value}%`, 'Body Fat'];
                    return [value, name];
                  }}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 3, fill: "hsl(var(--primary))" }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="bodyFat"
              stroke="hsl(var(--secondary))"
              strokeWidth={2}
              dot={{ r: 3, fill: "hsl(var(--secondary))" }}
              connectNulls
            />
          </LineChart>
        </ChartContainer>
        
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <span className="text-muted-foreground">Weight (kg)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-secondary"></div>
            <span className="text-muted-foreground">Body Fat (%)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeightChart;
