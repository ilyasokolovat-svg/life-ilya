
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { TrendingUp, Sparkles, Zap, Target, Calendar } from "lucide-react";

interface TimelinePeriod {
  id: string;
  label: string;
  type: 'quarter' | 'year';
  year: number;
  quarter?: number;
  isPast: boolean;
}

interface ProgressTrackingProps {
  progressValue: number;
  progressText: string;
  q4Goals: string;
  selectedPeriod: TimelinePeriod | null;
  getPeriodGoals: (periodKey: string) => string;
  onProgressValueChange: (value: number) => void;
  onProgressTextChange: (text: string) => void;
}

const ProgressTracking: React.FC<ProgressTrackingProps> = ({
  progressValue,
  progressText,
  q4Goals,
  selectedPeriod,
  getPeriodGoals,
  onProgressValueChange,
  onProgressTextChange
}) => {
  // Get current quarter for the second box
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
  const currentYear = now.getFullYear();

  // Get current quarter goals
  const getCurrentQuarterGoals = () => {
    if (selectedPeriod && selectedPeriod.type === 'quarter') {
      return getPeriodGoals(selectedPeriod.id);
    }
    return '';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 2025 Progress Box - Primary */}
      <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-400/20 to-purple-500/20 rounded-full blur-3xl transform translate-x-16 -translate-y-16" />
        
        <CardHeader className="relative pb-4">
          <CardTitle className="text-lg flex items-center gap-2 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            2025 Progress Journey
            <Sparkles className="w-4 h-4 text-fuchsia-500 animate-pulse" />
          </CardTitle>
        </CardHeader>
        
        <CardContent className="relative space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-violet-700 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Achievement
              </span>
              <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                {progressValue}%
              </span>
            </div>
            
            <div className="space-y-2">
              <Progress 
                value={progressValue} 
                className="h-3 bg-white/60 backdrop-blur-sm shadow-inner"
              />
              <Slider
                value={[progressValue]}
                onValueChange={(value) => onProgressValueChange(value[0])}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-violet-700 flex items-center gap-2">
              <Target className="w-3 h-3" />
              Journey Update
            </label>
            <Textarea
              placeholder="Progress story, wins, challenges..."
              value={progressText}
              onChange={(e) => onProgressTextChange(e.target.value)}
              className="bg-white/80 backdrop-blur-sm border-violet-200 focus:border-violet-400 focus:ring-violet-400/20 resize-none shadow-sm text-sm"
              rows={3}
            />
          </div>

          {/* 2025 Ultimate Goal Mini Box */}
          {q4Goals && (
            <div className="bg-gradient-to-br from-indigo-100 to-purple-200 border border-indigo-300 rounded-lg p-3 shadow-md">
              <div className="text-xs font-semibold text-indigo-700 mb-2 flex items-center gap-1">
                <Target className="w-3 h-3" />
                2025 Ultimate Goal
              </div>
              <div className="text-xs text-indigo-600 leading-relaxed space-y-1">
                {q4Goals.split('\n').filter(line => line.trim()).slice(0, 3).map((line, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-yellow-500 text-xs animate-pulse">⭐</span>
                    <span>{line.replace(/^•\s*/, '').trim()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Quarter Progress Box - Secondary */}
      <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/8 via-indigo-500/8 to-cyan-500/8" />
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/15 to-indigo-500/15 rounded-full blur-2xl transform translate-x-12 -translate-y-12" />
        
        <CardHeader className="relative pb-4">
          <CardTitle className="text-lg flex items-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            Q{currentQuarter} {currentYear} Focus
          </CardTitle>
        </CardHeader>
        
        <CardContent className="relative space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Quarter Progress
              </span>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {Math.round(progressValue * 0.8)}%
              </span>
            </div>
            
            <div className="space-y-2">
              <Progress 
                value={progressValue * 0.8} 
                className="h-3 bg-white/60 backdrop-blur-sm shadow-inner"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-blue-700 flex items-center gap-2">
              <Target className="w-3 h-3" />
              Quarter Notes
            </label>
            <Textarea
              placeholder="Current quarter focus, milestones..."
              className="bg-white/80 backdrop-blur-sm border-blue-200 focus:border-blue-400 focus:ring-blue-400/20 resize-none shadow-sm text-sm"
              rows={3}
            />
          </div>

          {/* Current Quarter Goals */}
          {getCurrentQuarterGoals() ? (
            <div className="bg-gradient-to-br from-blue-100 to-indigo-200 border border-blue-300 rounded-lg p-3 shadow-md">
              <div className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Q{selectedPeriod?.quarter} Strategic Goals
              </div>
              <div className="text-xs text-blue-600 leading-relaxed space-y-1">
                {getCurrentQuarterGoals().split('\n').filter(line => line.trim()).slice(0, 3).map((line, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-blue-500 text-xs">🎯</span>
                    <span>{line.replace(/^•\s*/, '').trim()}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-blue-100 to-indigo-200 border border-blue-300 rounded-lg p-3 shadow-md">
              <div className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Q{currentQuarter} Key Goals
              </div>
              <div className="text-xs text-blue-600 leading-relaxed space-y-1">
                <div className="flex items-start gap-2">
                  <span className="text-blue-500 text-xs">🎯</span>
                  <span>Complete quarterly objectives</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-500 text-xs">📈</span>
                  <span>Track weekly progress</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-500 text-xs">✅</span>
                  <span>Achieve milestone targets</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressTracking;
