
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Calendar, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import WeeklyTimeline from "./WeeklyTimeline";

interface WeeklyTrackerProps {
  subcategories: string[];
}

const WeeklyTracker: React.FC<WeeklyTrackerProps> = ({ subcategories }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [hiddenMonths, setHiddenMonths] = useState<string[]>([]);
  const [weeklyData, setWeeklyData] = useState<Record<string, Record<string, { plan: string; fact: string }>>>({});

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

  // Group subcategories for better visual separation
  const groupSubcategories = (subcategories: string[]) => {
    const groups: { name: string; items: string[]; color: string }[] = [];
    
    const ttItems = subcategories.filter(sub => sub.startsWith("TT"));
    const otherItems = subcategories.filter(sub => !sub.startsWith("TT"));
    
    if (ttItems.length > 0) {
      groups.push({ name: "TT Projects", items: ttItems, color: "bg-blue-25" });
    }
    
    otherItems.forEach(item => {
      groups.push({ name: item, items: [item], color: "bg-gray-25" });
    });
    
    return groups;
  };

  const subcategoryGroups = groupSubcategories(subcategories);

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
              {subcategoryGroups.map((group, groupIndex) => (
                <div key={groupIndex} className={`p-4 rounded-lg border ${group.color}`}>
                  <h5 className="font-bold text-gray-800 mb-4">{group.name}</h5>
                  {group.items.map((subcategory) => {
                    const progressData = getProgressData(subcategory);
                    return (
                      <div key={subcategory} className="space-y-3 mb-4 last:mb-0">
                        {group.items.length > 1 && (
                          <h6 className="font-medium text-gray-700">{subcategory}</h6>
                        )}
                        <div className="flex items-center space-x-2 bg-white p-4 rounded-lg border">
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
              ))}
            </div>

            {/* Weekly Timeline */}
            <WeeklyTimeline subcategories={subcategories} />
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default WeeklyTracker;
