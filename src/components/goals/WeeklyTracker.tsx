
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Calendar, Save, TrendingUp } from "lucide-react";

interface WeeklyTrackerProps {
  subcategories: string[];
}

const WeeklyTracker: React.FC<WeeklyTrackerProps> = ({ subcategories }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [hiddenMonths, setHiddenMonths] = useState<string[]>([]);
  const [weeklyData, setWeeklyData] = useState<Record<string, Record<string, { plan: string; fact: string }>>>({});
  const [monthlyReview, setMonthlyReview] = useState<Record<string, Record<string, string>>>({});

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getWeeksInMonth = (month: number, year: number) => {
    const weeks = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    let currentWeekStart = new Date(firstDay);
    currentWeekStart.setDate(firstDay.getDate() - firstDay.getDay());

    while (currentWeekStart <= lastDay) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(currentWeekStart.getDate() + 6);
      
      weeks.push({
        start: new Date(currentWeekStart),
        end: weekEnd,
        label: `Week ${weeks.length + 1}`
      });
      
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    
    return weeks;
  };

  const monthKey = `${selectedYear}-${selectedMonth}`;
  const isMonthHidden = hiddenMonths.includes(monthKey);
  const weeks = getWeeksInMonth(selectedMonth, selectedYear);

  const toggleMonthVisibility = () => {
    setHiddenMonths(prev => 
      isMonthHidden 
        ? prev.filter(key => key !== monthKey)
        : [...prev, monthKey]
    );
  };

  const updateWeeklyData = (subcategory: string, weekIndex: number, type: 'plan' | 'fact', value: string) => {
    const weekKey = `${monthKey}-week-${weekIndex}`;
    setWeeklyData(prev => ({
      ...prev,
      [subcategory]: {
        ...prev[subcategory],
        [weekKey]: {
          ...prev[subcategory]?.[weekKey],
          [type]: value
        }
      }
    }));
  };

  const updateMonthlyReview = (subcategory: string, value: string) => {
    setMonthlyReview(prev => ({
      ...prev,
      [subcategory]: {
        ...prev[subcategory],
        [monthKey]: value
      }
    }));
  };

  // Generate progress data for visualization
  const getProgressData = (subcategory: string) => {
    return weeks.map((week, index) => {
      const weekKey = `${monthKey}-week-${index}`;
      const weekData = weeklyData[subcategory]?.[weekKey];
      return {
        week: index + 1,
        planned: weekData?.plan ? 1 : 0,
        completed: weekData?.fact ? 1 : 0
      };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
          Weekly Progress Tracking
        </h3>
        <div className="flex items-center space-x-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-2 border rounded-lg text-sm bg-white shadow-sm"
          >
            {months.map((month, index) => (
              <option key={index} value={index}>{month}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 border rounded-lg text-sm bg-white shadow-sm"
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
        </div>
      </div>

      <Card className="border-2 border-gray-200">
        <CardHeader 
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={toggleMonthVisibility}
        >
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              {months[selectedMonth]} {selectedYear}
            </span>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                {isMonthHidden ? "Show" : "Hide"} Details
              </Button>
              {isMonthHidden ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </CardTitle>
        </CardHeader>
        
        {!isMonthHidden && (
          <CardContent className="space-y-8">
            {/* Progress Visualization */}
            <div className="space-y-6">
              <h4 className="font-semibold text-gray-800 border-b pb-2">Monthly Progress Overview</h4>
              {subcategories.map((subcategory) => {
                const progressData = getProgressData(subcategory);
                return (
                  <div key={subcategory} className="space-y-3">
                    <h5 className="font-medium text-gray-700">{subcategory}</h5>
                    <div className="flex items-center space-x-2 bg-gray-50 p-4 rounded-lg">
                      <span className="text-xs font-medium text-gray-600 w-16">Progress:</span>
                      <div className="flex-1 flex items-center space-x-1">
                        {progressData.map((data, index) => (
                          <div key={index} className="flex-1 flex flex-col items-center space-y-1">
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-300 ${
                                  data.completed ? 'bg-green-500' : data.planned ? 'bg-blue-400' : 'bg-gray-200'
                                }`}
                                style={{ width: data.completed ? '100%' : data.planned ? '50%' : '0%' }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">W{data.week}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center space-x-4 text-xs">
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                          <span>Planned</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span>Completed</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Weekly Input Grid */}
            <div className="space-y-6">
              <h4 className="font-semibold text-gray-800 border-b pb-2">Weekly Details</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {weeks.map((week, weekIndex) => (
                  <Card key={weekIndex} className="border border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">
                        {week.label} ({week.start.toLocaleDateString()} - {week.end.toLocaleDateString()})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {subcategories.map((subcategory) => {
                        const weekKey = `${monthKey}-week-${weekIndex}`;
                        const weekData = weeklyData[subcategory]?.[weekKey] || { plan: "", fact: "" };
                        
                        return (
                          <div key={subcategory} className="space-y-2 p-3 bg-gray-50 rounded-lg">
                            <h5 className="text-xs font-semibold text-gray-700">{subcategory}</h5>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-xs font-medium text-gray-600">Plan</label>
                                <Textarea
                                  placeholder="Plan..."
                                  value={weekData.plan}
                                  onChange={(e) => updateWeeklyData(subcategory, weekIndex, 'plan', e.target.value)}
                                  className="min-h-[40px] text-xs bg-white"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-600">Fact</label>
                                <Textarea
                                  placeholder="Result..."
                                  value={weekData.fact}
                                  onChange={(e) => updateWeeklyData(subcategory, weekIndex, 'fact', e.target.value)}
                                  className="min-h-[40px] text-xs bg-white"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Monthly Review */}
            <div className="space-y-4 border-t pt-6">
              <h4 className="font-semibold text-gray-800">Monthly Review - {months[selectedMonth]} {selectedYear}</h4>
              {subcategories.map((subcategory) => (
                <div key={subcategory} className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">{subcategory} - Key Insights</label>
                  <Textarea
                    placeholder="Monthly reflection and key insights..."
                    value={monthlyReview[subcategory]?.[monthKey] || ""}
                    onChange={(e) => updateMonthlyReview(subcategory, e.target.value)}
                    className="min-h-[60px] bg-white"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                <Save className="w-4 h-4 mr-2" />
                Save Progress
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default WeeklyTracker;
