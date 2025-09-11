
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

  // Get current quarter goals - ALWAYS for the actual current quarter, not selected period
  const getCurrentQuarterGoals = () => {
    const currentQuarterKey = `${currentYear}-Q${currentQuarter}`;
    return getPeriodGoals(currentQuarterKey);
  };

  // Get 2025 strategic goals - check both Q4 and the year 2025
  const get2025Goals = () => {
    const q4Key = `${currentYear}-Q4`;
    const year2025Key = '2025';
    return q4Goals || getPeriodGoals(q4Key) || getPeriodGoals(year2025Key);
  };

  return (
    <div className="space-y-3">
      {/* 2025 Strategic Goal Box */}
      <div className="bg-gradient-to-br from-indigo-100 to-purple-200 border border-indigo-300 rounded-lg p-3 shadow-sm">
        <div className="text-xs font-semibold text-indigo-700 mb-2 flex items-center gap-1">
          <Target className="w-3 h-3" />
          2025 Strategic Goal
        </div>
        <div className="text-xs text-indigo-600 leading-relaxed">
          {get2025Goals() ? (
            <div className="space-y-1">
              {get2025Goals().split('\n').filter(line => line.trim()).slice(0, 2).map((line, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-yellow-500 text-xs">⭐</span>
                  <span>{line.replace(/^•\s*/, '').trim()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 italic">Set your 2025 strategic goal...</div>
          )}
        </div>
      </div>

      {/* Q3 Goal Box - Lighter version */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-lg p-3 shadow-sm">
        <div className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Q{currentQuarter} {currentYear} Goal
        </div>
        <div className="text-xs text-blue-600 leading-relaxed">
          {getCurrentQuarterGoals() ? (
            <div className="space-y-1">
              {getCurrentQuarterGoals().split('\n').filter(line => line.trim()).slice(0, 2).map((line, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-blue-500 text-xs">🎯</span>
                  <span>{line.replace(/^•\s*/, '').trim()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 italic">Set your Q{currentQuarter} goal...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressTracking;
