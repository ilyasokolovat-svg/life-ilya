
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Target } from "lucide-react";

interface TimelinePeriod {
  id: string;
  label: string;
  type: 'quarter' | 'year';
  year: number;
  quarter?: number;
  isPast: boolean;
}

interface PeriodGoalsProps {
  period: TimelinePeriod;
  goals: string;
  onGoalsChange: (goals: string) => void;
}

const PeriodGoals: React.FC<PeriodGoalsProps> = ({
  period,
  goals,
  onGoalsChange
}) => {
  const getStrategicGoalsTitle = (period: TimelinePeriod) => {
    if (period.type === 'quarter') {
      return `${period.label} ${period.year} Strategic Goals`;
    } else {
      return `${period.label} Strategic Goals`;
    }
  };

  return (
    <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-cyan-500/5" />
      <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-emerald-400/15 to-teal-500/15 rounded-full blur-2xl transform translate-x-12 -translate-y-12" />
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-cyan-400/15 to-blue-500/15 rounded-full blur-xl transform -translate-x-8 translate-y-8" />
      
      <CardHeader className="relative pb-4">
        <CardTitle className="text-lg flex items-center gap-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
            <Target className="w-4 h-4 text-white" />
          </div>
          {getStrategicGoalsTitle(period)}
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse delay-75"></div>
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-150"></div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="relative">
        <Textarea
          placeholder="✨ Define your ambitious goals for this period (each line becomes a focused objective)..."
          value={goals}
          onChange={(e) => onGoalsChange(e.target.value)}
          className="bg-white/80 backdrop-blur-sm border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400/20 min-h-[120px] shadow-sm"
          style={{ minHeight: Math.max(120, goals.split('\n').length * 28) + 'px' }}
        />
      </CardContent>
    </Card>
  );
};

export default PeriodGoals;
