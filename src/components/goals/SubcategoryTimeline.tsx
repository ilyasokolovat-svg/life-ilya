
import React, { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGoalsData } from "@/hooks/useGoalsData";
import ProgressTracking from "./ProgressTracking";
import TimelineControls from "./TimelineControls";
import TimelineBubbles from "./TimelineBubbles";
import PeriodGoals from "./PeriodGoals";
import WeeklyPlanning from "./WeeklyPlanning";

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
  
  // Local state for text inputs to prevent slow typing
  const [localWeekPlans, setLocalWeekPlans] = useState<Record<string, string>>({});
  const [localPeriodGoals, setLocalPeriodGoals] = useState<Record<string, string>>({});
  
  const { goalsData, saveGoal } = useGoalsData(category);

  // Get current date info
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11
  const currentQuarter = Math.floor(currentMonth / 3) + 1; // 1-4

  // Debounced save function
  const debounce = useCallback((func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(null, args), wait);
    };
  }, []);

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

  // Get plan data for a specific week
  const getWeekPlan = (weekKey: string) => {
    // Check local state first, then fallback to saved data
    if (localWeekPlans[weekKey] !== undefined) {
      return localWeekPlans[weekKey];
    }
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

  // Debounced save for week plans
  const debouncedSaveWeekPlan = useCallback(
    debounce((weekKey: string, plan: string) => {
      saveGoal({
        category,
        subcategory,
        period_key: weekKey,
        period_type: 'week',
        planned_goal: plan,
        actual_result: getWeekCompleted(weekKey) ? 'completed' : null
      });
    }, 500),
    [category, subcategory, saveGoal]
  );

  // Handle week plan changes with local state
  const handleWeekPlanChange = (weekKey: string, plan: string) => {
    setLocalWeekPlans(prev => ({ ...prev, [weekKey]: plan }));
    debouncedSaveWeekPlan(weekKey, plan);
  };

  // Toggle week completion
  const toggleWeekCompletion = (weekKey: string, completed: boolean) => {
    saveGoal({
      category,
      subcategory,
      period_key: weekKey,
      period_type: 'week',
      planned_goal: getWeekPlan(weekKey),
      actual_result: completed ? 'completed' : null
    });
  };

  // Get period goals
  const getPeriodGoals = (periodKey: string) => {
    // Check local state first, then fallback to saved data
    if (localPeriodGoals[periodKey] !== undefined) {
      return localPeriodGoals[periodKey];
    }
    const goalData = goalsData.find(g => 
      g.category === category && 
      g.subcategory === subcategory && 
      g.period_key === periodKey &&
      g.period_type === 'period_goals'
    );
    return goalData?.planned_goal || '';
  };

  // Debounced save for period goals
  const debouncedSavePeriodGoals = useCallback(
    debounce((periodKey: string, goals: string) => {
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
    }, 500),
    [category, subcategory, saveGoal]
  );

  // Handle period goals changes with local state
  const handlePeriodGoalsChange = (periodKey: string, goals: string) => {
    setLocalPeriodGoals(prev => ({ ...prev, [periodKey]: goals }));
    debouncedSavePeriodGoals(periodKey, goals);
  };

  // Get Q4 strategic goals text for the mini box
  const getQ4Goals = () => {
    const q4Key = `${currentYear}-Q4`;
    return getPeriodGoals(q4Key);
  };

  // Generate the period title without duplication
  const getPeriodTitle = (period: TimelinePeriod) => {
    if (period.type === 'quarter') {
      return `${period.label} ${period.year} - Weekly Planning`;
    } else {
      return `${period.label} - Goals Planning`;
    }
  };

  // Initialize local state when goalsData changes
  useEffect(() => {
    const weekPlans: Record<string, string> = {};
    const periodGoals: Record<string, string> = {};
    
    goalsData.forEach(goal => {
      if (goal.category === category && goal.subcategory === subcategory) {
        if (goal.period_type === 'week') {
          weekPlans[goal.period_key] = goal.planned_goal || '';
        } else if (goal.period_type === 'period_goals') {
          periodGoals[goal.period_key] = goal.planned_goal || '';
        }
      }
    });
    
    setLocalWeekPlans(weekPlans);
    setLocalPeriodGoals(periodGoals);
  }, [goalsData, category, subcategory]);

  return (
    <div className="space-y-8">
      {/* Timeline Controls */}
      <TimelineControls
        subcategory={subcategory}
        hidePastPeriods={hidePastPeriods}
        onToggleHidePast={() => setHidePastPeriods(!hidePastPeriods)}
      />

      {/* Enhanced Progress Tracking Section */}
      <ProgressTracking
        progressValue={progressValue}
        progressText={progressText}
        q4Goals={getQ4Goals()}
        onProgressValueChange={setProgressValue}
        onProgressTextChange={setProgressText}
      />

      {/* Timeline Bubbles */}
      <TimelineBubbles
        periods={visiblePeriods}
        selectedPeriod={selectedPeriod}
        onPeriodSelect={setSelectedPeriod}
      />

      {/* Period Content */}
      {selectedPeriod && (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
          <CardHeader>
            <CardTitle className="text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {getPeriodTitle(selectedPeriod)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Enhanced Period Goals Section */}
            <PeriodGoals
              period={selectedPeriod}
              goals={getPeriodGoals(selectedPeriod.id)}
              onGoalsChange={(goals) => handlePeriodGoalsChange(selectedPeriod.id, goals)}
            />

            {/* Weekly Planning Grid - Only for quarters */}
            {selectedPeriod.type === 'quarter' && (
              <WeeklyPlanning
                year={selectedPeriod.year}
                quarter={selectedPeriod.quarter!}
                getWeekPlan={getWeekPlan}
                getWeekCompleted={getWeekCompleted}
                onWeekPlanChange={handleWeekPlanChange}
                onToggleWeekCompletion={toggleWeekCompletion}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SubcategoryTimeline;
