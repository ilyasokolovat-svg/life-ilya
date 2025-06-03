
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, Target } from "lucide-react";
import GoalPeriods from "./GoalPeriods";

interface SubcategoryTreeProps {
  subcategories: string[];
  category: string;
}

const SubcategoryTree: React.FC<SubcategoryTreeProps> = ({ subcategories, category }) => {
  const [expandedSubcategory, setExpandedSubcategory] = useState<string | null>(null);

  const toggleSubcategory = (subcategory: string) => {
    setExpandedSubcategory(expandedSubcategory === subcategory ? null : subcategory);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <Target className="w-6 h-6 mr-2 text-blue-600" />
        Select a focus area to plan your goals
      </h2>
      
      <div className="space-y-3">
        {subcategories.map((subcategory) => (
          <div key={subcategory} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
            {/* Subcategory Header */}
            <Button
              variant="ghost"
              className="w-full justify-between p-4 h-auto hover:bg-gray-50 text-left"
              onClick={() => toggleSubcategory(subcategory)}
            >
              <span className="text-lg font-medium text-gray-800">{subcategory}</span>
              {expandedSubcategory === subcategory ? (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-500" />
              )}
            </Button>

            {/* Expanded Goal Periods */}
            {expandedSubcategory === subcategory && (
              <div className="border-t border-gray-100 bg-gray-50">
                <GoalPeriods category={category} subcategory={subcategory} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubcategoryTree;
