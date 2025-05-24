
import React from "react";
import { HabitType, HabitStats } from "@/types/habit";
import { habitColors } from "@/utils/chartUtils";

interface SleepQualityStats {
  goodSleep: number;
  averageSleep: number;
  badSleep: number;
}

interface HabitStatsMetricsProps {
  habitType: HabitType;
  stats: HabitStats;
  sleepQualityStats?: SleepQualityStats;
}

const HabitStatsMetrics: React.FC<HabitStatsMetricsProps> = ({
  habitType,
  stats,
  sleepQualityStats
}) => {
  const colors = habitColors[habitType];

  if (habitType === 'sleep' && sleepQualityStats) {
    return (
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 rounded-md bg-green-100">
          <p className="text-xs text-muted-foreground">Good Sleep 😊</p>
          <h3 className="text-xl font-bold">{sleepQualityStats.goodSleep}</h3>
        </div>
        <div className="p-2 rounded-md bg-yellow-100">
          <p className="text-xs text-muted-foreground">Average Sleep 😐</p>
          <h3 className="text-xl font-bold">{sleepQualityStats.averageSleep}</h3>
        </div>
        <div className="p-2 rounded-md bg-red-100">
          <p className="text-xs text-muted-foreground">Bad Sleep 😔</p>
          <h3 className="text-xl font-bold">{sleepQualityStats.badSleep}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="p-2 rounded-md" style={{ backgroundColor: colors.secondary }}>
        <p className="text-xs text-muted-foreground">Total Completed</p>
        <h3 className="text-xl font-bold">{stats.totalCompleted}</h3>
      </div>
      <div className="p-2 rounded-md" style={{ backgroundColor: colors.secondary }}>
        <p className="text-xs text-muted-foreground">Completion Rate</p>
        <h3 className="text-xl font-bold">{stats.completionRate}%</h3>
      </div>
    </div>
  );
};

export default HabitStatsMetrics;
