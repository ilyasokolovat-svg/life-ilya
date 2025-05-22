
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { HabitStats as HabitStatsType, HabitType, HabitGoal, WeeklyStats } from "@/types/habit";
import { Dumbbell, Wine, Moon, Brain } from "lucide-react";
import { habitColors } from "@/utils/chartUtils";
import WeeklyChart from "./WeeklyChart";

interface HabitStatsProps {
  habitType: HabitType;
  stats: HabitStatsType;
  goal?: HabitGoal;
  weeklyData: WeeklyStats[];
  viewMonth: number;
  viewYear: number;
}

const HabitStats: React.FC<HabitStatsProps> = ({ 
  habitType, 
  stats, 
  goal,
  weeklyData,
  viewMonth,
  viewYear
}) => {
  const colors = habitColors[habitType];
  
  const getHabitIcon = () => {
    switch (habitType) {
      case "gym":
        return <Dumbbell className="h-5 w-5" />;
      case "alcohol":
        return <Wine className="h-5 w-5" />;
      case "sleep":
        return <Moon className="h-5 w-5" />;
      case "meditation":
        return <Brain className="h-5 w-5" />;
      default:
        return null;
    }
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
        return "Meditation";
      default:
        return "";
    }
  };

  // Calculate progress toward monthly goal
  const monthlyProgress = goal?.frequency ? Math.min(100, Math.round((stats.totalCompleted / goal.frequency) * 100)) : 0;

  return (
    <Card className="stats-card h-full" style={{ borderColor: colors.primary }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          {getHabitIcon()}
          {getHabitTitle()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-md" style={{ backgroundColor: colors.secondary }}>
            <p className="text-xs text-muted-foreground">Current Streak</p>
            <h3 className="text-xl font-bold">{stats.currentStreak} days</h3>
          </div>
          <div className="p-2 rounded-md" style={{ backgroundColor: colors.secondary }}>
            <p className="text-xs text-muted-foreground">Longest Streak</p>
            <h3 className="text-xl font-bold">{stats.longestStreak} days</h3>
          </div>
          <div className="p-2 rounded-md" style={{ backgroundColor: colors.secondary }}>
            <p className="text-xs text-muted-foreground">Total Completed</p>
            <h3 className="text-xl font-bold">{stats.totalCompleted}</h3>
          </div>
          <div className="p-2 rounded-md" style={{ backgroundColor: colors.secondary }}>
            <p className="text-xs text-muted-foreground">Completion Rate</p>
            <h3 className="text-xl font-bold">{stats.completionRate}%</h3>
          </div>
        </div>
        
        {goal && (
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs">Monthly Goal Progress ({stats.totalCompleted}/{goal.frequency} days)</span>
              <span className="text-xs font-semibold">{monthlyProgress}%</span>
            </div>
            <Progress 
              value={monthlyProgress} 
              className="h-2" 
              style={{ 
                "--progress-background": colors.secondary,
                "--progress-foreground": colors.primary
              } as React.CSSProperties}
            />
          </div>
        )}
        
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-xs">Overall Completion</span>
            <span className="text-xs font-semibold">{stats.completionRate}%</span>
          </div>
          <Progress 
            value={stats.completionRate} 
            className="h-2"
            style={{ 
              "--progress-background": colors.secondary,
              "--progress-foreground": colors.primary
            } as React.CSSProperties}
          />
        </div>
        
        {/* Embedded Weekly Chart */}
        <div className="mt-1">
          <WeeklyChart 
            habitType={habitType} 
            data={weeklyData}
            title={`${getHabitTitle()} Trend`}
            compact={true}
          />
        </div>
        
        {goal?.notes && (
          <div className="p-2 bg-gray-50 rounded-md">
            <p className="text-xs font-medium mb-1">Goal Notes:</p>
            <p className="text-sm">{goal.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HabitStats;
