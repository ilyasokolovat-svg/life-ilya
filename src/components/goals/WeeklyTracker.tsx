
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import WeeklyTimeline from "./WeeklyTimeline";
import { useParams } from "react-router-dom";
import { useGoalsData } from "@/hooks/useGoalsData";

interface WeeklyTrackerProps {
  subcategories: string[];
}

const WeeklyTracker: React.FC<WeeklyTrackerProps> = ({ subcategories }) => {
  const { category } = useParams<{ category: string }>();
  const { weeklyData } = useGoalsData(category || '');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [satisfactionData, setSatisfactionData] = useState<Record<string, Record<string, boolean>>>({});

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Get weeks in the selected month
  const getWeeksInMonth = (month: number, year: number) => {
    const weeks = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    let currentWeekStart = new Date(firstDay);
    currentWeekStart.setDate(firstDay.getDate() - firstDay.getDay() + 1); // Start from Monday
    
    while (currentWeekStart <= lastDay) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(currentWeekStart.getDate() + 6);
      
      weeks.push({
        weekStart: new Date(currentWeekStart),
        weekEnd,
        weekNumber: weeks.length + 1,
        dateRange: `${currentWeekStart.getDate()}/${currentWeekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`
      });
      
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    
    return weeks;
  };

  const handleSatisfactionToggle = (subcategory: string, weekKey: string) => {
    setSatisfactionData(prev => ({
      ...prev,
      [subcategory]: {
        ...prev[subcategory],
        [weekKey]: !prev[subcategory]?.[weekKey]
      }
    }));
  };

  const weeks = getWeeksInMonth(selectedMonth, selectedYear);

  // Generate color for each subcategory
  const getSubcategoryColor = (index: number) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-8">
      {/* Month/Year Selection */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Weekly Progress Tracking</h3>
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

      {/* Monthly Progress Overview */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-base text-gray-800">
            Monthly Progress Overview - {months[selectedMonth]} {selectedYear}
          </CardTitle>
          <p className="text-sm text-gray-600">Click on each week line to mark if you're satisfied with your progress</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subcategories.map((subcategory, index) => {
              const color = getSubcategoryColor(index);
              return (
                <div key={subcategory} className="bg-white p-4 rounded-lg border shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-800">{subcategory}</h4>
                    <div className="text-xs text-gray-500">
                      {weeks.filter(week => {
                        const weekKey = `${selectedYear}-${selectedMonth}-${week.weekNumber}`;
                        return satisfactionData[subcategory]?.[weekKey];
                      }).length} / {weeks.length} weeks satisfied
                    </div>
                  </div>
                  
                  <div className="w-full">
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mb-2">
                      {weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="text-xs text-gray-500 text-center">
                          W{week.weekNumber}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mb-2">
                      {weeks.map((week, weekIndex) => {
                        const weekKey = `${selectedYear}-${selectedMonth}-${week.weekNumber}`;
                        const isSatisfied = satisfactionData[subcategory]?.[weekKey] || false;
                        
                        return (
                          <button
                            key={weekIndex}
                            onClick={() => handleSatisfactionToggle(subcategory, weekKey)}
                            className={`h-2 w-full transition-all duration-200 hover:h-3 rounded-sm ${
                              isSatisfied 
                                ? 'bg-green-500 hover:bg-green-600' 
                                : 'bg-gray-300 hover:bg-gray-400'
                            }`}
                            title={`Week ${week.weekNumber} (${week.dateRange}) - ${isSatisfied ? 'Satisfied' : 'Not marked'}`}
                          />
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                      {weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="text-xs text-gray-400 text-center" style={{ fontSize: '10px' }}>
                          {week.dateRange}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Timeline */}
      <WeeklyTimeline subcategories={subcategories} />
    </div>
  );
};

export default WeeklyTracker;
