
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { TrendingUp, Sparkles, Zap, Target } from "lucide-react";

interface ProgressTrackingProps {
  progressValue: number;
  progressText: string;
  q4Goals: string;
  onProgressValueChange: (value: number) => void;
  onProgressTextChange: (text: string) => void;
}

const ProgressTracking: React.FC<ProgressTrackingProps> = ({
  progressValue,
  progressText,
  q4Goals,
  onProgressValueChange,
  onProgressTextChange
}) => {
  return (
    <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-400/20 to-purple-500/20 rounded-full blur-3xl transform translate-x-16 -translate-y-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-fuchsia-400/20 to-pink-500/20 rounded-full blur-2xl transform -translate-x-12 translate-y-12" />
      
      <CardHeader className="relative pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-3 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            2025 Progress Journey
            <Sparkles className="w-5 h-5 text-fuchsia-500 animate-pulse" />
          </CardTitle>
          
          {/* Q4 Goals Mini Box */}
          {q4Goals && (
            <div className="bg-gradient-to-br from-indigo-100 to-purple-200 border border-indigo-300 rounded-lg p-3 max-w-xs shadow-md">
              <div className="text-xs font-semibold text-indigo-700 mb-2 flex items-center gap-1">
                <Target className="w-3 h-3" />
                Q4 Goals Snapshot
              </div>
              <div className="text-xs text-indigo-600 line-clamp-3 leading-relaxed">
                {q4Goals.split('\n').slice(0, 2).join(' ').replace(/•/g, '').trim()}
                {q4Goals.split('\n').length > 2 && '...'}
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="relative space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-violet-700 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Current Achievement
            </span>
            <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              {progressValue}%
            </span>
          </div>
          
          <div className="space-y-3">
            <Progress 
              value={progressValue} 
              className="h-4 bg-white/60 backdrop-blur-sm shadow-inner"
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
        
        <div className="space-y-3">
          <label className="text-sm font-semibold text-violet-700 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Journey Update & Reflections
          </label>
          <Textarea
            placeholder="Share your progress story, wins, challenges, and next steps..."
            value={progressText}
            onChange={(e) => onProgressTextChange(e.target.value)}
            className="bg-white/80 backdrop-blur-sm border-violet-200 focus:border-violet-400 focus:ring-violet-400/20 resize-none shadow-sm"
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressTracking;
