
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import WeeklyTimeline from "./WeeklyTimeline";
import GoalsWeeklyChart from "./GoalsWeeklyChart";

interface WeeklyTrackerProps {
  subcategories: string[];
}

interface WeeklyGoalStats {
  weekStart: Date;
  planned: number;
  completed: number;
}

const WeeklyTracker: React.FC<WeeklyTrackerProps> = ({ subcategories }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [satisfactionData, setSatisfactionData] = useState<Record<string, Record<string, boolean>>>({});

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Generate mock data for subcategories
  const generateMockData = (subcategory: string): WeeklyGoalStats[] => {
    const weeks = [];
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    
    let currentWeekStart = new Date(firstDay);
    currentWeekStart.setDate(firstDay.getDate() - firstDay.getDay() + 1); // Start from Monday
    
    while (currentWeekStart <= lastDay) {
      const planned = Math.floor(Math.random() * 5) + 3;
      const completed = Math.floor(Math.random() * planned);
      
      weeks.push({
        weekStart: new Date(currentWeekStart),
        planned,
        completed
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

  // Generate color for each subcategory
  const getSubcategoryColor = (index: number) => {
    const colors = [
      { primary: '#3b82f6', secondary: '#dbeafe' }, // Blue
      { primary: '#10b981', secondary: '#d1fae5' }, // Green
      { primary: '#f59e0b', secondary: '#fef3c7' }, // Amber
      { primary: '#ef4444', secondary: '#fee2e2' }, // Red
      { primary: '#8b5cf6', secondary: '#ede9fe' }, // Violet
      { primary: '#06b6d4', secondary: '#cffafe' }, // Cyan
    ];
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
          <p className="text-sm text-gray-600">Click on the bars to mark weeks where you're satisfied with your progress</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subcategories.map((subcategory, index) => (
              <GoalsWeeklyChart
                key={subcategory}
                subcategory={subcategory}
                data={generateMockData(subcategory)}
                viewMonth={selectedMonth}
                viewYear={selectedYear}
                satisfactionData={satisfactionData[subcategory]}
                onSatisfactionToggle={(weekKey) => handleSatisfactionToggle(subcategory, weekKey)}
                colors={getSubcategoryColor(index)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Timeline */}
      <WeeklyTimeline subcategories={subcategories} />
    </div>
  );
};

export default WeeklyTracker;
