
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { EyeOff, Eye, Save } from "lucide-react";
import { useParams } from "react-router-dom";
import { useGoalsData } from "@/hooks/useGoalsData";
import { useAuth } from "@/contexts/AuthContext";

interface GoalTimeframesProps {
  subcategories: string[];
}

const GoalTimeframes: React.FC<GoalTimeframesProps> = ({ subcategories }) => {
  const { user } = useAuth();
  const { category } = useParams<{ category: string }>();
  const { goalsData, saveGoal, isSaving } = useGoalsData(category || '');
  const [hidePastPeriods, setHidePastPeriods] = useState(false);
  const [localData, setLocalData] = useState<Record<string, Record<string, { planned: string; actual: string }>>>({});

  // Initialize local data from database
  React.useEffect(() => {
    const loadedData: Record<string, Record<string, { planned: string; actual: string }>> = {};
    
    subcategories.forEach(subcategory => {
      loadedData[subcategory] = {};
      
      goalsData.forEach(goal => {
        if (goal.subcategory === subcategory) {
          loadedData[subcategory][goal.period_key] = {
            planned: goal.planned_goal || '',
            actual: goal.actual_result || ''
          };
        }
      });
    });
    
    setLocalData(loadedData);
  }, [goalsData, subcategories]);

  const updateData = (subcategory: string, period: string, field: 'planned' | 'actual', value: string) => {
    setLocalData(prev => ({
      ...prev,
      [subcategory]: {
        ...prev[subcategory],
        [period]: {
          ...prev[subcategory]?.[period],
          [field]: value
        }
      }
    }));
  };

  const handleSaveProgress = async () => {
    if (!category) return;
    
    const savePromises: Promise<void>[] = [];
    
    Object.entries(localData).forEach(([subcategory, periods]) => {
      Object.entries(periods).forEach(([periodKey, data]) => {
        if (data.planned || data.actual) {
          savePromises.push(
            new Promise<void>((resolve, reject) => {
              saveGoal({
                category,
                subcategory,
                period_key: periodKey,
                period_type: periodKey.includes('Q') ? 'quarterly' : 'monthly',
                planned_goal: data.planned,
                actual_result: data.actual,
              }, {
                onSuccess: () => resolve(),
                onError: reject
              });
            })
          );
        }
      });
    });
    
    try {
      await Promise.all(savePromises);
    } catch (error) {
      console.error('Error saving goals:', error);
    }
  };

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const currentQuarter = Math.ceil(currentMonth / 3);

  const timeframes = [
    { key: "2024-Q4", label: "Q4 2024", type: "quarterly" },
    { key: "2025-Q1", label: "Q1 2025", type: "quarterly" },
    { key: "2025-Q2", label: "Q2 2025", type: "quarterly" },
    { key: "2025-Q3", label: "Q3 2025", type: "quarterly" },
    { key: "2025-Q4", label: "Q4 2025", type: "quarterly" },
    { key: "2025-05", label: "May 2025", type: "monthly" },
    { key: "2025-06", label: "June 2025", type: "monthly" },
    { key: "2025-07", label: "July 2025", type: "monthly" },
    { key: "2025-08", label: "August 2025", type: "monthly" },
    { key: "2025-09", label: "September 2025", type: "monthly" },
    { key: "2025-10", label: "October 2025", type: "monthly" },
    { key: "2025-11", label: "November 2025", type: "monthly" },
    { key: "2025-12", label: "December 2025", type: "monthly" },
  ];

  const isCurrentOrFuturePeriod = (periodKey: string) => {
    if (periodKey.includes('Q')) {
      const year = parseInt(periodKey.split('-')[0]);
      const quarter = parseInt(periodKey.split('Q')[1]);
      
      // Only hide quarters that are fully past
      if (year > currentYear) return true;
      if (year === currentYear && quarter >= currentQuarter) return true;
      return false;
    } else {
      // Monthly periods
      const [year, month] = periodKey.split('-').map(Number);
      
      // Show current and future months
      if (year > currentYear) return true;
      if (year === currentYear && month >= currentMonth) return true;
      return false;
    }
  };

  const visibleTimeframes = hidePastPeriods 
    ? timeframes.filter(tf => isCurrentOrFuturePeriod(tf.key))
    : timeframes;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-800 border-b pb-2">Goal Planning & Review</h4>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHidePastPeriods(!hidePastPeriods)}
            className="flex items-center space-x-2"
          >
            {hidePastPeriods ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>{hidePastPeriods ? 'Show' : 'Hide'} Past Periods</span>
          </Button>
          <Button 
            onClick={handleSaveProgress}
            disabled={isSaving}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Progress'}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-max space-y-6">
          {/* Headers */}
          <div className="flex items-center">
            <div className="w-48 flex-shrink-0 text-sm font-medium text-gray-600 pr-4">
              Subcategory
            </div>
            <div className="flex space-x-4">
              {visibleTimeframes.map((timeframe) => (
                <div key={timeframe.key} className="w-64 text-center">
                  <div className={`text-sm font-bold p-2 rounded-lg ${
                    timeframe.type === 'quarterly' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {timeframe.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          {subcategories.map((subcategory) => (
            <div key={subcategory} className="border-b border-gray-200 pb-4">
              <div className="flex items-start">
                <div className="w-48 flex-shrink-0 pr-4">
                  <div className="text-sm font-semibold text-gray-700 py-2 bg-gray-50 rounded px-3">
                    {subcategory}
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  {visibleTimeframes.map((timeframe) => {
                    const data = localData[subcategory]?.[timeframe.key] || { planned: "", actual: "" };
                    
                    return (
                      <div key={timeframe.key} className="w-64 space-y-2">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                          <div className="text-xs font-medium text-green-700 mb-1">Planned Goal</div>
                          <Textarea
                            placeholder="What do you want to achieve?"
                            value={data.planned}
                            onChange={(e) => updateData(subcategory, timeframe.key, 'planned', e.target.value)}
                            className="min-h-[80px] text-sm bg-white border-green-300 focus:border-green-500"
                          />
                        </div>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                          <div className="text-xs font-medium text-blue-700 mb-1">Actual Result</div>
                          <Textarea
                            placeholder="What did you actually achieve?"
                            value={data.actual}
                            onChange={(e) => updateData(subcategory, timeframe.key, 'actual', e.target.value)}
                            className="min-h-[80px] text-sm bg-white border-blue-300 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GoalTimeframes;
