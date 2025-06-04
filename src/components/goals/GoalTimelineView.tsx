import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Edit2, ChevronLeft, ChevronRight, Target, TrendingUp } from "lucide-react";
import { useGoalsData } from "@/hooks/useGoalsData";

interface GoalTimelineViewProps {
  category: string;
  subcategory: string;
}

const GoalTimelineView: React.FC<GoalTimelineViewProps> = ({ category, subcategory }) => {
  const [selectedQuarter, setSelectedQuarter] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [hidePastPeriods, setHidePastPeriods] = useState(false);
  const [weeklyInputs, setWeeklyInputs] = useState<Record<string, { plan_text: string; fact_text: string }>>({});
  const [currentStatus, setCurrentStatus] = useState("");
  const [editingStatus, setEditingStatus] = useState(false);

  const { goalsData, weeklyData, saveGoal, saveWeeklyData } = useGoalsData(category);

  // All timeline periods
  const allTimelinePeriods = [
    "Q1", "Q2", "Q3", "Q4", "2026", "2027", "2030"
  ];

  // Define which periods are considered "past"
  const pastPeriods = ["Q1", "Q2"]; // You can adjust this based on current time

  // Filter timeline periods based on hide setting
  const timelinePeriods = hidePastPeriods 
    ? allTimelinePeriods.filter(period => !pastPeriods.includes(period))
    : allTimelinePeriods;

  const quarters = {
    "Q1": { months: ["January", "February", "March"], key: "Q1" },
    "Q2": { months: ["April", "May", "June"], key: "Q2" },
    "Q3": { months: ["July", "August", "September"], key: "Q3" },
    "Q4": { months: ["October", "November", "December"], key: "Q4" }
  };

  const getGoalForPeriod = (period: string) => {
    const goal = goalsData.find(g => 
      g.subcategory === subcategory && g.period_key === period
    );
    return goal?.planned_goal || "";
  };

  const formatGoalsDisplay = (goalsText: string) => {
    if (!goalsText.trim()) return "No goal set";
    
    const lines = goalsText.split('\n').filter(line => line.trim());
    if (lines.length <= 1) return goalsText;
    
    return lines.map((line, index) => `${index + 1}. ${line.trim()}`).join('\n');
  };

  const handleEditGoal = (period: string) => {
    setEditingGoal(period);
    setEditValue(getGoalForPeriod(period));
  };

  const handleSaveGoal = (period: string) => {
    saveGoal({
      category,
      subcategory,
      period_key: period,
      period_type: period.includes("Q") ? "quarter" : "year",
      planned_goal: editValue
    });
    setEditingGoal(null);
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditingGoal(null);
    setEditValue("");
  };

  const handleQuarterClick = (period: string) => {
    if (period.includes("Q")) {
      setSelectedQuarter(period);
    }
  };

  const handleStatusSave = () => {
    // Here you could save the status to database if needed
    // For now, we'll just update the local state
    setEditingStatus(false);
  };

  const getWeeksInMonth = (month: string, year: string) => {
    const monthIndex = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"].indexOf(month);
    
    const weeks = [];
    const firstDay = new Date(parseInt(year), monthIndex, 1);
    const lastDay = new Date(parseInt(year), monthIndex + 1, 0);
    
    // Start from the first Monday of the month or the Monday before if month doesn't start on Monday
    let currentWeekStart = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, Monday = 1
    currentWeekStart.setDate(firstDay.getDate() - daysToMonday);
    
    while (currentWeekStart <= lastDay) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(currentWeekStart.getDate() + 6);
      
      // Format dates
      const startDay = currentWeekStart.getDate();
      const endDay = weekEnd.getDate();
      const startMonth = currentWeekStart.toLocaleString('default', { month: 'short' });
      const endMonth = weekEnd.toLocaleString('default', { month: 'short' });
      
      let dateRange;
      if (startMonth === endMonth) {
        dateRange = `${startMonth} ${startDay}-${endDay}`;
      } else {
        dateRange = `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
      }
      
      weeks.push({
        weekIndex: weeks.length + 1,
        label: dateRange,
        startDate: new Date(currentWeekStart),
        endDate: new Date(weekEnd)
      });
      
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    
    return weeks;
  };

  const getWeeklyData = (monthKey: string, weekIndex: number) => {
    return weeklyData.find(w => 
      w.subcategory === subcategory && 
      w.month_key === monthKey && 
      w.week_index === weekIndex
    );
  };

  const getWeeklyInputKey = (monthKey: string, weekIndex: number) => {
    return `${monthKey}-${weekIndex}`;
  };

  const getWeeklyInputValue = (monthKey: string, weekIndex: number, field: 'plan_text' | 'fact_text') => {
    const inputKey = getWeeklyInputKey(monthKey, weekIndex);
    const localValue = weeklyInputs[inputKey]?.[field];
    if (localValue !== undefined) {
      return localValue;
    }
    
    const weekData = getWeeklyData(monthKey, weekIndex);
    return weekData?.[field] || "";
  };

  const handleWeeklyInputChange = (monthKey: string, weekIndex: number, field: 'plan_text' | 'fact_text', value: string) => {
    const inputKey = getWeeklyInputKey(monthKey, weekIndex);
    
    setWeeklyInputs(prev => ({
      ...prev,
      [inputKey]: {
        ...prev[inputKey],
        [field]: value
      }
    }));

    // Debounced save - save after user stops typing
    const timeoutKey = `${inputKey}-${field}`;
    if ((window as any)[timeoutKey]) {
      clearTimeout((window as any)[timeoutKey]);
    }
    
    (window as any)[timeoutKey] = setTimeout(() => {
      handleWeeklyDataSave(monthKey, weekIndex, field, value);
    }, 1000);
  };

  const handleWeeklyDataSave = (monthKey: string, weekIndex: number, field: string, value: string) => {
    const existingData = getWeeklyData(monthKey, weekIndex);
    
    const data = {
      category,
      subcategory,
      month_key: monthKey,
      week_index: weekIndex,
      plan_text: field === 'plan_text' ? value : (existingData?.plan_text || ""),
      fact_text: field === 'fact_text' ? value : (existingData?.fact_text || "")
    };
    
    saveWeeklyData(data);
  };

  const autoResize = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = Math.max(80, element.scrollHeight) + 'px';
  };

  return (
    <div className="space-y-6">
      {/* Current Status Section */}
      <Card className="border-2 border-gradient-to-r from-blue-500 to-purple-500 bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
                <Target className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Current Status - {subcategory}</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingStatus(!editingStatus)}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              {editingStatus ? "Cancel" : "Edit"}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Text */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                Where I Stand Now
              </label>
              {editingStatus ? (
                <div className="space-y-3">
                  <Textarea
                    value={currentStatus}
                    onChange={(e) => setCurrentStatus(e.target.value)}
                    placeholder="Describe your current progress, achievements, and status for this goal area..."
                    className="min-h-[100px] border-2 border-blue-300 focus:border-blue-500 bg-white"
                    onInput={(e) => autoResize(e.target as HTMLTextAreaElement)}
                  />
                  <Button
                    onClick={handleStatusSave}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                  >
                    Save Status
                  </Button>
                </div>
              ) : (
                <div className="p-4 bg-white rounded-lg border-2 border-blue-200 min-h-[100px]">
                  {currentStatus || (
                    <span className="text-gray-500 italic">
                      Click edit to add your current status and progress...
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Visual Progress Indicator */}
            <div className="space-y-4">
              <label className="text-sm font-semibold text-gray-700">Overall Progress Feel</label>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Just Started</span>
                  <span>Making Progress</span>
                  <span>Almost There</span>
                </div>
                <Progress value={65} className="h-3 bg-gray-200" />
                <div className="text-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    🎯 On Track
                  </span>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-lg font-bold text-green-700">65%</div>
                  <div className="text-xs text-green-600">Progress</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-lg font-bold text-blue-700">📈</div>
                  <div className="text-xs text-blue-600">Trending Up</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Scrollable View */}
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Goal Timeline</h3>
          <div className="flex items-center space-x-2">
            <label htmlFor="hide-past" className="text-sm text-gray-600">
              Hide past periods
            </label>
            <Switch
              id="hide-past"
              checked={hidePastPeriods}
              onCheckedChange={setHidePastPeriods}
            />
          </div>
        </div>
        <div className="flex overflow-x-auto pb-4 space-x-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {timelinePeriods.map((period) => {
            const goalText = getGoalForPeriod(period);
            const hasMultipleLines = goalText && goalText.split('\n').filter(line => line.trim()).length > 1;
            const isEditing = editingGoal === period;
            
            return (
              <div
                key={period}
                className="flex-shrink-0 min-w-[250px] cursor-pointer"
                onClick={() => !isEditing && handleQuarterClick(period)}
              >
                <Card className={`${hasMultipleLines || isEditing ? 'min-h-[160px]' : 'h-24'} ${period.includes("Q") ? "hover:bg-blue-50 border-blue-200" : "hover:bg-gray-50"} transition-colors ${isEditing ? 'ring-2 ring-blue-400' : ''}`}>
                  <CardContent className="p-4 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{period}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditGoal(period);
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                    {isEditing ? (
                      <div className="flex flex-col gap-2 flex-1">
                        <Textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="text-xs resize-none flex-1 min-h-[80px] overflow-hidden"
                          placeholder="Enter goals (one per line)..."
                          onClick={(e) => e.stopPropagation()}
                          onInput={(e) => autoResize(e.target as HTMLTextAreaElement)}
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveGoal(period);
                            }}
                            className="h-6 px-2 text-xs flex-1"
                          >
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelEdit();
                            }}
                            className="h-6 px-2 text-xs flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-600 flex-1">
                        {goalText ? (
                          <div className="whitespace-pre-line">
                            {formatGoalsDisplay(goalText)}
                          </div>
                        ) : (
                          "No goal set"
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quarter Details */}
      {selectedQuarter && (
        <Card className="border-t-4 border-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{selectedQuarter} Monthly Planning</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedQuarter(null)}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedMonth || undefined} onValueChange={setSelectedMonth}>
              <TabsList className="grid w-full grid-cols-3">
                {quarters[selectedQuarter as keyof typeof quarters]?.months.map((month) => (
                  <TabsTrigger key={month} value={month}>
                    {month}
                  </TabsTrigger>
                ))}
              </TabsList>

              {quarters[selectedQuarter as keyof typeof quarters]?.months.map((month) => (
                <TabsContent key={month} value={month} className="mt-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-md">{month} Weekly Planning</h4>
                    <div className="relative">
                      <div className="flex overflow-x-auto pb-4 space-x-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        {getWeeksInMonth(month, "2025").map((week) => {
                          return (
                            <div key={week.weekIndex} className="flex-shrink-0 min-w-[300px]">
                              <Card className="border-l-4 border-green-500 h-full">
                                <CardContent className="p-4">
                                  <h5 className="font-medium mb-3 text-center">{week.label}</h5>
                                  <div className="space-y-4">
                                    <div>
                                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Plan
                                      </label>
                                      <Textarea
                                        placeholder="What do you plan to achieve this week?"
                                        value={getWeeklyInputValue(month, week.weekIndex, 'plan_text')}
                                        onChange={(e) => {
                                          handleWeeklyInputChange(month, week.weekIndex, 'plan_text', e.target.value);
                                          autoResize(e.target);
                                        }}
                                        onInput={(e) => autoResize(e.target as HTMLTextAreaElement)}
                                        className="min-h-[80px] resize-none overflow-hidden"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Fact
                                      </label>
                                      <Textarea
                                        placeholder="What did you actually achieve?"
                                        value={getWeeklyInputValue(month, week.weekIndex, 'fact_text')}
                                        onChange={(e) => {
                                          handleWeeklyInputChange(month, week.weekIndex, 'fact_text', e.target.value);
                                          autoResize(e.target);
                                        }}
                                        onInput={(e) => autoResize(e.target as HTMLTextAreaElement)}
                                        className="min-h-[80px] resize-none overflow-hidden"
                                      />
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GoalTimelineView;
