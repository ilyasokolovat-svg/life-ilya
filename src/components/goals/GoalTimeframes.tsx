
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, Calendar, Target } from "lucide-react";

interface GoalTimeframesProps {
  subcategories: string[];
}

const GoalTimeframes: React.FC<GoalTimeframesProps> = ({ subcategories }) => {
  const [goals, setGoals] = useState<Record<string, Record<string, any>>>({});

  const quarters = [
    { key: "q1_2025", label: "Q1 2025", color: "border-blue-200 bg-blue-50" },
    { key: "q2_2025", label: "Q2 2025", color: "border-green-200 bg-green-50" },
    { key: "q3_2025", label: "Q3 2025", color: "border-yellow-200 bg-yellow-50" },
    { key: "q4_2025", label: "Q4 2025", color: "border-purple-200 bg-purple-50" }
  ];

  const years = [
    { key: "year_2025", label: "2025 Year End", color: "border-indigo-200 bg-indigo-50" },
    { key: "year_2026", label: "2026 Year End", color: "border-pink-200 bg-pink-50" },
    { key: "year_2030", label: "2030 Year End", color: "border-gray-200 bg-gray-50" }
  ];

  const updateGoal = (subcategory: string, period: string, type: string, value: string) => {
    setGoals(prev => ({
      ...prev,
      [subcategory]: {
        ...prev[subcategory],
        [period]: {
          ...prev[subcategory]?.[period],
          [type]: value
        }
      }
    }));
  };

  return (
    <div className="space-y-8">
      {/* Quarterly Goals */}
      <div>
        <h3 className="text-lg font-bold mb-6 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-blue-600" />
          Quarterly Goals 2025
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {quarters.map((quarter) => (
            <Card key={quarter.key} className={`${quarter.color} border-2`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold">{quarter.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {subcategories.map((subcategory) => (
                  <div key={`${quarter.key}-${subcategory}`} className="space-y-2">
                    <h4 className="text-xs font-semibold text-gray-700 border-b pb-1">
                      {subcategory}
                    </h4>
                    <div>
                      <label className="text-xs font-medium text-gray-600">Planned</label>
                      <Textarea
                        placeholder="Goal..."
                        value={goals[subcategory]?.[quarter.key]?.planned || ""}
                        onChange={(e) => updateGoal(subcategory, quarter.key, 'planned', e.target.value)}
                        className="min-h-[50px] text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">Fact</label>
                      <Textarea
                        placeholder="Result..."
                        value={goals[subcategory]?.[quarter.key]?.fact || ""}
                        onChange={(e) => updateGoal(subcategory, quarter.key, 'fact', e.target.value)}
                        className="min-h-[50px] text-xs bg-white"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Yearly Goals */}
      <div>
        <h3 className="text-lg font-bold mb-6 flex items-center">
          <Target className="w-5 h-5 mr-2 text-purple-600" />
          Long-term Vision
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {years.map((year) => (
            <Card key={year.key} className={`${year.color} border-2`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold">{year.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {subcategories.map((subcategory) => (
                  <div key={`${year.key}-${subcategory}`} className="space-y-2">
                    <h4 className="text-xs font-semibold text-gray-700 border-b pb-1">
                      {subcategory}
                    </h4>
                    <Textarea
                      placeholder="Long-term goal..."
                      value={goals[subcategory]?.[year.key] || ""}
                      onChange={(e) => updateGoal(subcategory, year.key, 'goal', e.target.value)}
                      className="min-h-[60px] text-xs bg-white"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Save className="w-4 h-4 mr-2" />
          Save All Goals
        </Button>
      </div>
    </div>
  );
};

export default GoalTimeframes;
