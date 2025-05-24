
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, Calendar, Target, Eye, EyeOff } from "lucide-react";

interface GoalTimeframesProps {
  subcategories: string[];
}

const GoalTimeframes: React.FC<GoalTimeframesProps> = ({ subcategories }) => {
  const [goals, setGoals] = useState<Record<string, Record<string, any>>>({});
  const [hidePastQuarters, setHidePastQuarters] = useState(false);

  const currentDate = new Date();
  const currentQuarter = Math.floor(currentDate.getMonth() / 3) + 1;
  const currentYear = currentDate.getFullYear();

  const quarters = [
    { key: "q1_2025", label: "Q1 2025", color: "border-blue-200 bg-blue-50", quarter: 1, year: 2025 },
    { key: "q2_2025", label: "Q2 2025", color: "border-green-200 bg-green-50", quarter: 2, year: 2025 },
    { key: "q3_2025", label: "Q3 2025", color: "border-yellow-200 bg-yellow-50", quarter: 3, year: 2025 },
    { key: "q4_2025", label: "Q4 2025", color: "border-purple-200 bg-purple-50", quarter: 4, year: 2025 }
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

  const isPastQuarter = (quarter: number, year: number) => {
    if (year < currentYear) return true;
    if (year === currentYear && quarter < currentQuarter) return true;
    return false;
  };

  const filteredQuarters = hidePastQuarters 
    ? quarters.filter(q => !isPastQuarter(q.quarter, q.year))
    : quarters;

  // Group subcategories for better visual separation
  const groupSubcategories = (subcategories: string[]) => {
    const groups: { name: string; items: string[]; color: string }[] = [];
    
    // Check if this is the business category (has TT subcategories)
    const ttItems = subcategories.filter(sub => sub.startsWith("TT"));
    const otherItems = subcategories.filter(sub => !sub.startsWith("TT"));
    
    if (ttItems.length > 0) {
      groups.push({ name: "TT Projects", items: ttItems, color: "bg-blue-25 border-blue-100" });
    }
    
    // Group other items individually for better separation
    otherItems.forEach(item => {
      groups.push({ name: item, items: [item], color: "bg-gray-25 border-gray-100" });
    });
    
    return groups;
  };

  const subcategoryGroups = groupSubcategories(subcategories);

  return (
    <div className="space-y-8">
      {/* Quarterly Goals */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            Quarterly Goals 2025
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHidePastQuarters(!hidePastQuarters)}
            className="flex items-center space-x-2"
          >
            {hidePastQuarters ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>{hidePastQuarters ? "Show" : "Hide"} Past Quarters</span>
          </Button>
        </div>
        
        <div className="space-y-6">
          {filteredQuarters.map((quarter) => (
            <Card key={quarter.key} className={`${quarter.color} border-2`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold">{quarter.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {subcategoryGroups.map((group, groupIndex) => (
                  <div key={groupIndex} className={`p-4 rounded-lg border-2 ${group.color}`}>
                    <h4 className="text-sm font-bold text-gray-800 mb-3 border-b border-gray-300 pb-2">
                      {group.name}
                    </h4>
                    <div className="space-y-4">
                      {group.items.map((subcategory) => (
                        <div key={`${quarter.key}-${subcategory}`} className="space-y-2">
                          {group.items.length > 1 && (
                            <h5 className="text-xs font-semibold text-gray-600">{subcategory}</h5>
                          )}
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
              <CardContent className="space-y-6">
                {subcategoryGroups.map((group, groupIndex) => (
                  <div key={groupIndex} className={`p-4 rounded-lg border-2 ${group.color}`}>
                    <h4 className="text-sm font-bold text-gray-800 mb-3 border-b border-gray-300 pb-2">
                      {group.name}
                    </h4>
                    <div className="space-y-3">
                      {group.items.map((subcategory) => (
                        <div key={`${year.key}-${subcategory}`} className="space-y-2">
                          {group.items.length > 1 && (
                            <h5 className="text-xs font-semibold text-gray-600">{subcategory}</h5>
                          )}
                          <Textarea
                            placeholder="Long-term goal..."
                            value={goals[subcategory]?.[year.key] || ""}
                            onChange={(e) => updateGoal(subcategory, year.key, 'goal', e.target.value)}
                            className="min-h-[60px] text-xs bg-white"
                          />
                        </div>
                      ))}
                    </div>
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
