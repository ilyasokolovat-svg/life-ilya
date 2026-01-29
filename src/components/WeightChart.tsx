import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HabitsState, HabitType, HabitData } from "@/types/habit";
import { formatDateISO } from "@/utils/habitUtils";
import { Scale, TrendingDown, TrendingUp, Minus } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ReferenceLine } from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WeightChartProps {
  habitsState: HabitsState;
  viewMonth: number;
  viewYear: number;
  onUpdateHabit?: (date: Date, type: HabitType, data: HabitData) => void;
}

const WeightChart: React.FC<WeightChartProps> = ({
  habitsState,
  viewMonth,
  viewYear,
  onUpdateHabit
}) => {
  const [selectedDay, setSelectedDay] = useState<{ date: string; day: number; weight: number | null; bodyFat: number | null } | null>(null);
  const [editWeight, setEditWeight] = useState<string>("");
  const [editBodyFat, setEditBodyFat] = useState<string>("");

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

  const handleDotClick = (data: any) => {
    if (data && data.payload) {
      const dayData = data.payload;
      setSelectedDay(dayData);
      setEditWeight(dayData.weight?.toString() || "");
      setEditBodyFat(dayData.bodyFat?.toString() || "");
    }
  };

  const handleSave = () => {
    if (!selectedDay || !onUpdateHabit) return;
    
    const date = new Date(selectedDay.date);
    const existingSleepData = habitsState.days[selectedDay.date]?.sleep || { planned: false, completed: false };
    
    const updatedSleepData = {
      ...existingSleepData,
      weight: editWeight ? parseFloat(editWeight) : undefined,
      bodyFat: editBodyFat ? parseFloat(editBodyFat) : undefined
    };
    
    onUpdateHabit(date, 'sleep', updatedSleepData);
    setSelectedDay(null);
  };

  const formatSelectedDate = (dateISO: string) => {
    const date = new Date(dateISO);
    return date.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Custom dot component that handles clicks - shows for all days
  const CustomDot = (props: any) => {
    const { cx, cy, payload, dataKey, index } = props;
    if (!cx) return null;
    
    const hasData = payload[dataKey] !== null && payload[dataKey] !== undefined;
    
    // For days without data, show a small clickable empty circle at a fixed position
    if (!hasData) {
      // Only show empty dots for the weight line to avoid duplicates
      if (dataKey !== 'weight') return null;
      return (
        <circle
          cx={cx}
          cy={props.height ? props.height / 2 : 125} // Center vertically if no data
          r={4}
          fill="transparent"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth={1}
          strokeDasharray="2 2"
          style={{ cursor: 'pointer', opacity: 0.5 }}
          onClick={() => handleDotClick({ payload })}
        />
      );
    }
    
    if (!cy) return null;
    
    return (
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill={dataKey === 'weight' ? "hsl(var(--primary))" : "hsl(var(--secondary))"}
        stroke="white"
        strokeWidth={2}
        style={{ cursor: 'pointer' }}
        onClick={() => handleDotClick({ payload })}
      />
    );
  };

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
    <>
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
          <p className="text-xs text-muted-foreground mt-2">Click any dot to add or edit weight data</p>
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
                dot={<CustomDot dataKey="weight" />}
                activeDot={{ r: 8, cursor: 'pointer', onClick: (e: any, payload: any) => handleDotClick(payload) }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="bodyFat"
                stroke="hsl(var(--secondary))"
                strokeWidth={2}
                dot={<CustomDot dataKey="bodyFat" />}
                activeDot={{ r: 8, cursor: 'pointer', onClick: (e: any, payload: any) => handleDotClick(payload) }}
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

      <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className="sm:max-w-[320px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              {selectedDay && formatSelectedDate(selectedDay.date)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="e.g., 75.5"
                value={editWeight}
                onChange={(e) => setEditWeight(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bodyFat">Body Fat (%)</Label>
              <Input
                id="bodyFat"
                type="number"
                step="0.1"
                placeholder="e.g., 15.0"
                value={editBodyFat}
                onChange={(e) => setEditBodyFat(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setSelectedDay(null)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSave}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WeightChart;
