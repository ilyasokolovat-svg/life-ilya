
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Calendar, Save } from "lucide-react";

interface WeeklyTrackerProps {
  subcategory: string;
}

const WeeklyTracker: React.FC<WeeklyTrackerProps> = ({ subcategory }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [hiddenMonths, setHiddenMonths] = useState<string[]>([]);
  const [weeklyData, setWeeklyData] = useState<Record<string, { plan: string; fact: string }>>({});
  const [monthlyReview, setMonthlyReview] = useState<Record<string, string>>({});

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

  const updateWeeklyData = (weekIndex: number, type: 'plan' | 'fact', value: string) => {
    const weekKey = `${monthKey}-week-${weekIndex}`;
    setWeeklyData(prev => ({
      ...prev,
      [weekKey]: {
        ...prev[weekKey],
        [type]: value
      }
    }));
  };

  const updateMonthlyReview = (value: string) => {
    setMonthlyReview(prev => ({
      ...prev,
      [monthKey]: value
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Weekly Progress Tracker</h3>
        <div className="flex items-center space-x-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-1 border rounded text-sm"
          >
            {months.map((month, index) => (
              <option key={index} value={index}>{month}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
        </div>
      </div>

      <Card>
        <CardHeader 
          className="cursor-pointer hover:bg-gray-50"
          onClick={toggleMonthVisibility}
        >
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              {months[selectedMonth]} {selectedYear}
            </span>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={toggleMonthVisibility}>
                {isMonthHidden ? "Show" : "Hide"} Past Weeks
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
          <CardContent className="space-y-4">
            {/* Weekly Tracking */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {weeks.map((week, index) => {
                const weekKey = `${monthKey}-week-${index}`;
                const weekData = weeklyData[weekKey] || { plan: "", fact: "" };
                
                return (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-medium text-sm mb-3">{week.label}</h4>
                    <div className="text-xs text-gray-500 mb-3">
                      {week.start.toLocaleDateString()} - {week.end.toLocaleDateString()}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600">Plan</label>
                        <Textarea
                          placeholder="Weekly plan..."
                          value={weekData.plan}
                          onChange={(e) => updateWeeklyData(index, 'plan', e.target.value)}
                          className="min-h-[50px] text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Fact</label>
                        <Textarea
                          placeholder="Actual results..."
                          value={weekData.fact}
                          onChange={(e) => updateWeeklyData(index, 'fact', e.target.value)}
                          className="min-h-[50px] text-sm"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Monthly Review */}
            <div className="border-t pt-4">
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Monthly Review - {months[selectedMonth]} {selectedYear}
              </label>
              <Textarea
                placeholder="Monthly reflection and key insights..."
                value={monthlyReview[monthKey] || ""}
                onChange={(e) => updateMonthlyReview(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <div className="flex justify-end">
              <Button size="sm">
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
