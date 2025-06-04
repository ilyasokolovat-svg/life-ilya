
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Edit2, ChevronLeft, ChevronRight } from "lucide-react";
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

  const handleQuarterClick = (period: string) => {
    if (period.includes("Q")) {
      setSelectedQuarter(period);
    }
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

  const handleWeeklyDataSave = (monthKey: string, weekIndex: number, field: string, value: string) => {
    const data = {
      category,
      subcategory,
      month_key: monthKey,
      week_index: weekIndex,
      [field]: value
    };
    saveWeeklyData(data);
  };

  return (
    <div className="space-y-6">
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
          {timelinePeriods.map((period) => (
            <div
              key={period}
              className="flex-shrink-0 min-w-[200px] cursor-pointer"
              onClick={() => handleQuarterClick(period)}
            >
              <Card className={`h-24 ${period.includes("Q") ? "hover:bg-blue-50 border-blue-200" : "hover:bg-gray-50"} transition-colors`}>
                <CardContent className="p-4 h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between">
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
                  {editingGoal === period ? (
                    <div className="flex gap-1">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-6 text-xs"
                        placeholder="Enter goal..."
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSaveGoal(period)}
                        className="h-6 px-2 text-xs"
                      >
                        Save
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {getGoalForPeriod(period) || "No goal set"}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
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
                          const weekData = getWeeklyData(month, week.weekIndex);
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
                                        value={weekData?.plan_text || ""}
                                        onChange={(e) => handleWeeklyDataSave(month, week.weekIndex, "plan_text", e.target.value)}
                                        className="min-h-[80px]"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Fact
                                      </label>
                                      <Textarea
                                        placeholder="What did you actually achieve?"
                                        value={weekData?.fact_text || ""}
                                        onChange={(e) => handleWeeklyDataSave(month, week.weekIndex, "fact_text", e.target.value)}
                                        className="min-h-[80px]"
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
