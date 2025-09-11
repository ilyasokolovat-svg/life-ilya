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

  const getCategoryTheme = (category: string) => {
    const themes = {
      physical: {
        card: 'from-physical-light to-physical-medium',
        icon: 'bg-physical-medium',
        iconText: 'text-orange-800',
        text: 'text-orange-700',
        border: 'border-physical-medium focus:border-physical-dark',
        savedBg: 'bg-physical-medium/70 text-orange-900',
        button: 'bg-physical-dark hover:bg-orange-600'
      },
      mental: {
        card: 'from-mental-light to-mental-medium',
        icon: 'bg-mental-medium',
        iconText: 'text-blue-800',
        text: 'text-blue-700',
        border: 'border-mental-medium focus:border-mental-dark',
        savedBg: 'bg-mental-medium/70 text-blue-900',
        button: 'bg-mental-dark hover:bg-blue-600'
      },
      financial: {
        card: 'from-financial-light to-financial-medium',
        icon: 'bg-financial-medium',
        iconText: 'text-green-800',
        text: 'text-green-700',
        border: 'border-financial-medium focus:border-financial-dark',
        savedBg: 'bg-financial-medium/70 text-green-900',
        button: 'bg-financial-dark hover:bg-green-600'
      },
      skills: {
        card: 'from-skills-light to-skills-medium',
        icon: 'bg-skills-medium',
        iconText: 'text-red-800',
        text: 'text-red-700',
        border: 'border-skills-medium focus:border-skills-dark',
        savedBg: 'bg-skills-medium/70 text-red-900',
        button: 'bg-skills-dark hover:bg-red-600'
      }
    };
    return themes[category as keyof typeof themes] || themes.physical;
  };

  const theme = getCategoryTheme(category);

  return (
    <Card className={`border-0 shadow-md bg-gradient-to-r ${theme.card}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${theme.icon} flex-shrink-0`}>
            <Lightbulb className={`w-4 h-4 ${theme.iconText}`} />
          </div>
          <div className="flex-1 space-y-3">
            <div className={`text-sm font-medium ${theme.text}`}>Category Guidance & Philosophy</div>
            <div className="relative">
              <Textarea
                placeholder={getThesisPlaceholder(category)}
                value={localThesis}
                onChange={(e) => handleChange(e.target.value)}
                className={`${theme.border} text-sm resize-none transition-all duration-300 ${
                  getCurrentThesis() && !hasChanges 
                    ? `${theme.savedBg} italic font-medium pl-6 pr-6` 
                    : 'bg-white/70 italic'
                }`}
                style={{ minHeight: Math.max(60, localThesis.split('\n').length * 20) + 'px' }}
              />
              {getCurrentThesis() && !hasChanges && (
                <>
                  <span className={`absolute top-2 left-2 ${theme.text} text-lg pointer-events-none`}>"</span>
                  <span className={`absolute bottom-2 right-2 ${theme.text} text-lg pointer-events-none`}>"</span>
                  <div className={`absolute top-2 right-8 ${theme.iconText}`}>
                    <Lightbulb className="w-4 h-4" />
                  </div>
                </>
              )}
            </div>
            {hasChanges && (
              <Button 
                onClick={handleSave}
                className={`${theme.button} text-white`}
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