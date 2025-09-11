import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, Lightbulb } from "lucide-react";
import { useGoalsData } from "@/hooks/useGoalsData";

interface CategoryThesisProps {
  category: string;
}

const CategoryThesis: React.FC<CategoryThesisProps> = ({ category }) => {
  const { goalsData, saveGoal } = useGoalsData(category);
  const [localThesis, setLocalThesis] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  // Get current thesis from goals data
  const getCurrentThesis = () => {
    const thesisData = goalsData.find(g => 
      g.category === category && 
      g.subcategory === 'category_thesis' && 
      g.period_key === 'thesis'
    );
    return thesisData?.planned_goal || '';
  };

  // Initialize local thesis when data loads
  React.useEffect(() => {
    if (!hasChanges) {
      setLocalThesis(getCurrentThesis());
    }
  }, [goalsData, hasChanges]);

  const handleChange = (value: string) => {
    setLocalThesis(value);
    setHasChanges(value !== getCurrentThesis());
  };

  const handleSave = () => {
    saveGoal({
      category,
      subcategory: 'category_thesis',
      period_key: 'thesis',
      period_type: 'thesis',
      planned_goal: localThesis,
      actual_result: undefined
    });
    setHasChanges(false);
  };

  const getThesisPlaceholder = (category: string) => {
    const placeholders = {
      physical: "Write your physical wellness philosophy... e.g., 'Consistency over intensity. Move daily, fuel mindfully, rest deeply.'",
      mental: "Define your mental growth approach... e.g., 'Expand horizons through connections, experiences, and mindful consumption.'",
      financial: "Outline your financial strategy... e.g., 'Disciplined spending, strategic investing, diversified income streams.'",
      skills: "Describe your learning methodology... e.g., 'Learn by doing, teach by leading, grow through reading and real application.'"
    };
    return placeholders[category as keyof typeof placeholders] || "Write your guiding principles for this category...";
  };

  return (
    <Card className="border-0 shadow-md bg-gradient-to-r from-amber-50 to-orange-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-100 flex-shrink-0">
            <Lightbulb className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="text-sm font-medium text-amber-700">Category Guidance & Philosophy</div>
            <Textarea
              placeholder={getThesisPlaceholder(category)}
              value={localThesis}
              onChange={(e) => handleChange(e.target.value)}
              className={`border-amber-200 focus:border-amber-400 italic text-sm resize-none ${
                getCurrentThesis() && !hasChanges 
                  ? 'bg-amber-100/50 text-amber-800' 
                  : 'bg-white/70'
              }`}
              style={{ minHeight: Math.max(60, localThesis.split('\n').length * 20) + 'px' }}
            />
            {hasChanges && (
              <Button 
                onClick={handleSave}
                className="bg-amber-500 hover:bg-amber-600 text-white"
                size="sm"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Philosophy
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryThesis;