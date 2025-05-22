
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { HabitStats as HabitStatsType, HabitType } from "@/types/habit";
import { Gym, AlcoholOff, Sleep } from "lucide-react";

interface HabitStatsProps {
  habitType: HabitType;
  stats: HabitStatsType;
}

const HabitStats: React.FC<HabitStatsProps> = ({ habitType, stats }) => {
  const getHabitIcon = () => {
    switch (habitType) {
      case "gym":
        return <Gym className="h-5 w-5" />;
      case "alcohol":
        return <AlcoholOff className="h-5 w-5" />;
      case "sleep":
        return <Sleep className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getHabitTitle = () => {
    switch (habitType) {
      case "gym":
        return "Gym Workouts";
      case "alcohol":
        return "Alcohol-Free Days";
      case "sleep":
        return "Good Sleep";
      default:
        return "";
    }
  };

  return (
    <Card className="stats-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          {getHabitIcon()}
          {getHabitTitle()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Current Streak</p>
            <h3 className="text-2xl font-bold">{stats.currentStreak} days</h3>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Longest Streak</p>
            <h3 className="text-2xl font-bold">{stats.longestStreak} days</h3>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Completed</p>
            <h3 className="text-2xl font-bold">{stats.totalCompleted}</h3>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Completion Rate</p>
            <h3 className="text-2xl font-bold">{stats.completionRate}%</h3>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between mb-1">
            <span className="text-xs">Completion</span>
            <span className="text-xs font-semibold">{stats.completionRate}%</span>
          </div>
          <Progress value={stats.completionRate} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
};

export default HabitStats;
