
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, Calendar, Eye, EyeOff } from "lucide-react";
import GoalInputs from "./GoalInputs";
import WeeklyPlanning from "./WeeklyPlanning";

interface GoalPeriodsProps {
  category: string;
  subcategory: string;
}

const GoalPeriods: React.FC<GoalPeriodsProps> = ({ category, subcategory }) => {
  const [expandedPeriod, setExpandedPeriod] = useState<string | null>(null);
  const [showWeeklyPlanning, setShowWeeklyPlanning] = useState<string | null>(null);
  const [hidePastQuarters, setHidePastQuarters] = useState(false);

  const currentDate = new Date();
  const currentQuarter = Math.floor(currentDate.getMonth() / 3) + 1;
  const currentYear = currentDate.getFullYear();

  const quarters = [
    { key: "q1_2025", label: "Q1 2025", quarter: 1, year: 2025, color: "border-blue-200 bg-blue-50" },
    { key: "q2_2025", label: "Q2 2025", quarter: 2, year: 2025, color: "border-green-200 bg-green-50" },
    { key: "q3_2025", label: "Q3 2025", quarter: 3, year: 2025, color: "border-yellow-200 bg-yellow-50" },
    { key: "q4_2025", label: "Q4 2025", quarter: 4, year: 2025, color: "border-purple-200 bg-purple-50" }
  ];

  const years = [
    { key: "year_2025", label: "2025", color: "border-indigo-200 bg-indigo-50" },
    { key: "year_2026", label: "2026", color: "border-pink-200 bg-pink-50" },
    { key: "year_2030", label: "2030", color: "border-gray-200 bg-gray-50" }
  ];

  const isPastQuarter = (quarter: number, year: number) => {
    if (year < currentYear) return true;
    if (year === currentYear && quarter < currentQuarter) return true;
    return false;
  };

  const filteredQuarters = hidePastQuarters 
    ? quarters.filter(q => !isPastQuarter(q.quarter, q.year))
    : quarters;

  const allPeriods = [...filteredQuarters, ...years];

  const togglePeriod = (periodKey: string) => {
    setExpandedPeriod(expandedPeriod === periodKey ? null : periodKey);
    setShowWeeklyPlanning(null); // Close weekly planning when switching periods
  };

  const toggleWeeklyPlanning = (periodKey: string) => {
    setShowWeeklyPlanning(showWeeklyPlanning === periodKey ? null : periodKey);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-blue-600" />
          Time Periods for {subcategory}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setHidePastQuarters(!hidePastQuarters)}
          className="flex items-center space-x-2"
        >
          {hidePastQuarters ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          <span className="text-xs">{hidePastQuarters ? "Show" : "Hide"} Past</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allPeriods.map((period) => (
          <div key={period.key} className="space-y-2">
            {/* Period Card */}
            <Card className={`border-2 ${period.color} hover:shadow-md transition-shadow cursor-pointer`}>
              <CardHeader 
                className="pb-2 cursor-pointer"
                onClick={() => togglePeriod(period.key)}
              >
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  {period.label}
                  {expandedPeriod === period.key ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </CardTitle>
              </CardHeader>
              
              {expandedPeriod === period.key && (
                <CardContent className="pt-0 space-y-3">
                  <GoalInputs 
                    category={category}
                    subcategory={subcategory}
                    periodKey={period.key}
                    periodType={years.some(y => y.key === period.key) ? 'year' : 'quarter'}
                  />
                  
                  {/* Weekly Planning Toggle - only for quarters */}
                  {!years.some(y => y.key === period.key) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleWeeklyPlanning(period.key)}
                      className="w-full text-xs"
                    >
                      {showWeeklyPlanning === period.key ? "Hide" : "Show"} Weekly Planning
                    </Button>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Weekly Planning */}
            {showWeeklyPlanning === period.key && !years.some(y => y.key === period.key) && (
              <Card className="border border-gray-300 bg-gray-50">
                <CardContent className="p-4">
                  <WeeklyPlanning 
                    category={category}
                    subcategory={subcategory}
                    periodKey={period.key}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GoalPeriods;
