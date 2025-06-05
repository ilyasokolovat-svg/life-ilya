
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Eye, EyeOff, Target, TrendingUp, Sparkles, Zap } from "lucide-react";
import { useGoalsData } from "@/hooks/useGoalsData";

interface SubcategoryTimelineProps {
  category: string;
  subcategory: string;
}

interface TimelinePeriod {
  id: string;
  label: string;
  type: 'quarter' | 'year';
  year: number;
  quarter?: number;
  isPast: boolean;
}

const SubcategoryTimeline: React.FC<SubcategoryTimelineProps> = ({ category, subcategory }) => {
  const [hidePastPeriods, setHidePastPeriods] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<TimelinePeriod | null>(null);
  const [progressValue, setProgressValue] = useState(0);
  const [progressText, setProgressText] = useState("");
  const { goalsData, saveGoal } = useGoalsData(category);

  // Get current date info
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11
  const currentQuarter = Math.floor(currentMonth / 3) + 1; // 1-4

  // Generate timeline periods
  const generateTimeline = (): TimelinePeriod[] => {
    const periods: TimelinePeriod[] = [];
    
    // Current year quarters
    for (let q = 1; q <= 4; q++) {
      const isPast = q < currentQuarter;
      periods.push({
        id: `${currentYear}-Q${q}`,
        label: `Q${q}`,
        type: 'quarter',
        year: currentYear,
        quarter: q,
        isPast
      });
    }
    
    // Future years
    const futureYears = [currentYear + 1, currentYear + 2, currentYear + 5]; // 2026, 2027, 2030
    futureYears.forEach(year => {
      periods.push({
        id: `${year}`,
        label: `${year}`,
        type: 'year',
        year,
        isPast: false
      });
    });
    
    return periods;
  };

  const timeline = generateTimeline();
  const visiblePeriods = hidePastPeriods ? timeline.filter(p => !p.isPast) : timeline;

  // Generate weeks for a quarter
  const generateWeeksForQuarter = (year: number, quarter: number) => {
    const weeks = [];
    const startMonth = (quarter - 1) * 3; // 0, 3, 6, 9
    
    for (let month = 0; month < 3; month++) {
      const currentMonth = startMonth + month;
      const monthName = new Date(year, currentMonth, 1).toLocaleDateString('en-US', { month: 'long' });
      
      // Get all weeks in this month
      const firstDay = new Date(year, currentMonth, 1);
      const lastDay = new Date(year, currentMonth + 1, 0);
      
      // Find the start of the first week (Monday)
      let weekStart = new Date(firstDay);
      weekStart.setDate(firstDay.getDate() - ((firstDay.getDay() + 6) % 7));
      
      const monthWeeks = [];
      while (weekStart <= lastDay) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        // Only include weeks that overlap with this month
        if (weekEnd >= firstDay) {
          const weekKey = `${year}-${currentMonth + 1}-${weekStart.getDate()}`;
          monthWeeks.push({
            key: weekKey,
            start: new Date(weekStart),
            end: new Date(weekEnd),
            label: `${weekStart.getDate()}-${weekEnd.getDate()}`
          });
        }
        
        weekStart.setDate(weekStart.getDate() + 7);
      }
      
      if (monthWeeks.length > 0) {
        weeks.push({
          month: monthName,
          weeks: monthWeeks
        });
      }
    }
    
    return weeks;
  };

  // Get plan data for a specific week
  const getWeekPlan = (weekKey: string) => {
    const goalData = goalsData.find(g => 
      g.category === category && 
      g.subcategory === subcategory && 
      g.period_key === weekKey
    );
    return goalData?.planned_goal || '';
  };

  // Get completion status for a week
  const getWeekCompleted = (weekKey: string) => {
    const goalData = goalsData.find(g => 
      g.category === category && 
      g.subcategory === subcategory && 
      g.period_key === weekKey
    );
    return goalData?.actual_result === 'completed';
  };

  // Save week plan
  const saveWeekPlan = (weekKey: string, plan: string) => {
    saveGoal({
      category,
      subcategory,
      period_key: weekKey,
      period_type: 'week',
      planned_goal: plan,
      actual_result: getWeekCompleted(weekKey) ? 'completed' : undefined
    });
  };

  // Toggle week completion - Fixed to properly handle unticking
  const toggleWeekCompletion = (weekKey: string, completed: boolean) => {
    saveGoal({
      category,
      subcategory,
      period_key: weekKey,
      period_type: 'week',
      planned_goal: getWeekPlan(weekKey),
      actual_result: completed ? 'completed' : null // Use null instead of undefined for unchecked
    });
  };

  // Get period goals
  const getPeriodGoals = (periodKey: string) => {
    const goalData = goalsData.find(g => 
      g.category === category && 
      g.subcategory === subcategory && 
      g.period_key === periodKey &&
      g.period_type === 'period_goals'
    );
    return goalData?.planned_goal || '';
  };

  // Save period goals
  const savePeriodGoals = (periodKey: string, goals: string) => {
    // Format with bullet points
    const formattedGoals = goals
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.trim().startsWith('•') ? line : `• ${line}`)
      .join('\n');

    saveGoal({
      category,
      subcategory,
      period_key: periodKey,
      period_type: 'period_goals',
      planned_goal: formattedGoals,
      actual_result: undefined
    });
  };

  return (
    <div className="space-y-8">
      {/* Timeline Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{subcategory} Timeline</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setHidePastPeriods(!hidePastPeriods)}
          className="flex items-center gap-2"
        >
          {hidePastPeriods ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          {hidePastPeriods ? 'Show Past' : 'Hide Past'}
        </Button>
      </div>

      {/* Enhanced Progress Tracking Section */}
      <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-400/20 to-purple-500/20 rounded-full blur-3xl transform translate-x-16 -translate-y-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-fuchsia-400/20 to-pink-500/20 rounded-full blur-2xl transform -translate-x-12 translate-y-12" />
        
        <CardHeader className="relative pb-6">
          <CardTitle className="text-xl flex items-center gap-3 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            2025 Progress Journey
            <Sparkles className="w-5 h-5 text-fuchsia-500 animate-pulse" />
          </CardTitle>
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
                onValueChange={(value) => setProgressValue(value[0])}
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
              onChange={(e) => setProgressText(e.target.value)}
              className="bg-white/80 backdrop-blur-sm border-violet-200 focus:border-violet-400 focus:ring-violet-400/20 resize-none shadow-sm"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Timeline Bubbles */}
      <div className="flex flex-wrap gap-3">
        {visiblePeriods.map((period) => (
          <Button
            key={period.id}
            variant={selectedPeriod?.id === period.id ? "default" : "outline"}
            className={`rounded-full px-6 py-2 transition-all duration-300 ${
              period.isPast ? 'opacity-60' : ''
            } ${
              selectedPeriod?.id === period.id 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg scale-105' 
                : 'hover:shadow-md hover:scale-102'
            }`}
            onClick={() => setSelectedPeriod(period)}
          >
            {period.label}
          </Button>
        ))}
      </div>

      {/* Weekly Planner */}
      {selectedPeriod && selectedPeriod.type === 'quarter' && (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
          <CardHeader>
            <CardTitle className="text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {selectedPeriod.label} {selectedPeriod.year} - Weekly Planning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Enhanced Period Goals Section */}
            <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-cyan-500/5" />
              <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-emerald-400/15 to-teal-500/15 rounded-full blur-2xl transform translate-x-12 -translate-y-12" />
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-cyan-400/15 to-blue-500/15 rounded-full blur-xl transform -translate-x-8 translate-y-8" />
              
              <CardHeader className="relative pb-4">
                <CardTitle className="text-lg flex items-center gap-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  {selectedPeriod.label} {selectedPeriod.year} Strategic Goals
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
                  value={getPeriodGoals(selectedPeriod.id)}
                  onChange={(e) => savePeriodGoals(selectedPeriod.id, e.target.value)}
                  className="bg-white/80 backdrop-blur-sm border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400/20 min-h-[120px] shadow-sm"
                  style={{ minHeight: Math.max(120, getPeriodGoals(selectedPeriod.id).split('\n').length * 28) + 'px' }}
                />
              </CardContent>
            </Card>

            {/* Weekly Planning Grid */}
            <div className="overflow-x-auto">
              <div className="flex gap-6 pb-4" style={{ minWidth: 'max-content' }}>
                {generateWeeksForQuarter(selectedPeriod.year, selectedPeriod.quarter!).map((monthData) => (
                  <div key={monthData.month} className="space-y-4">
                    <h4 className="font-medium text-center text-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {monthData.month}
                    </h4>
                    <div className="flex gap-4">
                      {monthData.weeks.map((week) => {
                        const isCompleted = getWeekCompleted(week.key);
                        return (
                          <div 
                            key={week.key} 
                            className={`w-64 border rounded-xl p-4 shadow-md transition-all duration-300 ${
                              isCompleted 
                                ? 'bg-gray-50 border-gray-300 opacity-75' 
                                : 'bg-white border-gray-200 hover:shadow-lg'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className={`text-sm font-medium ${isCompleted ? 'text-gray-500' : 'text-gray-800'}`}>
                                {week.label} {monthData.month.slice(0, 3)}
                              </span>
                              <Checkbox
                                checked={isCompleted}
                                onCheckedChange={(checked) => toggleWeekCompletion(week.key, !!checked)}
                                className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                              />
                            </div>
                            <Textarea
                              placeholder="Enter your plan for this week..."
                              value={getWeekPlan(week.key)}
                              onChange={(e) => saveWeekPlan(week.key, e.target.value)}
                              className={`min-h-[100px] resize-none border-0 shadow-inner ${
                                isCompleted 
                                  ? 'bg-gray-100 text-gray-600 placeholder:text-gray-400' 
                                  : 'bg-gray-50 focus:bg-white'
                              }`}
                              style={{ minHeight: Math.max(100, getWeekPlan(week.key).split('\n').length * 20) + 'px' }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SubcategoryTimeline;
