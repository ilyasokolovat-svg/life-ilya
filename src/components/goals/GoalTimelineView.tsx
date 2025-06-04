import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

  const { goalsData, weeklyData, saveGoal, saveWeeklyData } = useGoalsData(category);

  // Updated timeline periods
  const timelinePeriods = [
    "Q1", "Q2", "Q3", "Q4", "2026", "2027", "2030"
  ];

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
    // Generate 4-5 weeks for the month
    return Array.from({ length: 4 }, (_, i) => ({
      weekIndex: i + 1,
      label: `Week ${i + 1}`
    }));
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
        <h3 className="text-lg font-semibold mb-4">Goal Timeline</h3>
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
                    <div className="grid gap-4">
                      {getWeeksInMonth(month, "2025").map((week) => {
                        const weekData = getWeeklyData(month, week.weekIndex);
                        return (
                          <Card key={week.weekIndex} className="border-l-4 border-green-500">
                            <CardContent className="p-4">
                              <h5 className="font-medium mb-3">{week.label}</h5>
                              <div className="grid md:grid-cols-2 gap-4">
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
                        );
                      })}
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
