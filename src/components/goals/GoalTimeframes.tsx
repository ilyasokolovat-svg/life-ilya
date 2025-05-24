
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface GoalTimeframesProps {
  subcategory: string;
}

const GoalTimeframes: React.FC<GoalTimeframesProps> = ({ subcategory }) => {
  const [goals, setGoals] = useState({
    q1_2025: { planned: "", fact: "" },
    q2_2025: { planned: "", fact: "" },
    q3_2025: { planned: "", fact: "" },
    q4_2025: { planned: "", fact: "" },
    year_2025: "",
    year_2026: "",
    year_2030: ""
  });

  const quarters = [
    { key: "q1_2025", label: "Q1 2025" },
    { key: "q2_2025", label: "Q2 2025" },
    { key: "q3_2025", label: "Q3 2025" },
    { key: "q4_2025", label: "Q4 2025" }
  ];

  const years = [
    { key: "year_2025", label: "2025 Year End" },
    { key: "year_2026", label: "2026 Year End" },
    { key: "year_2030", label: "2030 Year End" }
  ];

  const updateQuarterGoal = (quarter: string, type: 'planned' | 'fact', value: string) => {
    setGoals(prev => ({
      ...prev,
      [quarter]: {
        ...prev[quarter as keyof typeof prev] as { planned: string; fact: string },
        [type]: value
      }
    }));
  };

  const updateYearGoal = (year: string, value: string) => {
    setGoals(prev => ({
      ...prev,
      [year]: value
    }));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Goal Timeframes</h3>
      
      {/* Quarterly Goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quarters.map((quarter) => (
          <Card key={quarter.key}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{quarter.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Planned</label>
                <Textarea
                  placeholder={`Your planned goals for ${quarter.label}...`}
                  value={(goals[quarter.key as keyof typeof goals] as { planned: string; fact: string }).planned}
                  onChange={(e) => updateQuarterGoal(quarter.key, 'planned', e.target.value)}
                  className="min-h-[60px] text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Fact</label>
                <Textarea
                  placeholder={`Actual results for ${quarter.label}...`}
                  value={(goals[quarter.key as keyof typeof goals] as { planned: string; fact: string }).fact}
                  onChange={(e) => updateQuarterGoal(quarter.key, 'fact', e.target.value)}
                  className="min-h-[60px] text-sm"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Yearly Goals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {years.map((year) => (
          <Card key={year.key}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{year.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder={`Your goals for ${year.label}...`}
                value={goals[year.key as keyof typeof goals] as string}
                onChange={(e) => updateYearGoal(year.key, e.target.value)}
                className="min-h-[80px] text-sm"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button size="sm">
          <Save className="w-4 h-4 mr-2" />
          Save Goals
        </Button>
      </div>
    </div>
  );
};

export default GoalTimeframes;
