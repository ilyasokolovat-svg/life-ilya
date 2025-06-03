
import React, { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useGoalsData } from "@/hooks/useGoalsData";

interface GoalInputsProps {
  category: string;
  subcategory: string;
  periodKey: string;
  periodType: 'quarter' | 'year';
}

const GoalInputs: React.FC<GoalInputsProps> = ({ category, subcategory, periodKey, periodType }) => {
  const { goalsData, saveGoal, isSaving } = useGoalsData(category);
  const [plan, setPlan] = useState("");
  const [fact, setFact] = useState("");

  // Load existing data
  useEffect(() => {
    const existingGoal = goalsData.find(
      goal => goal.subcategory === subcategory && goal.period_key === periodKey
    );
    
    if (existingGoal) {
      setPlan(existingGoal.planned_goal || "");
      setFact(existingGoal.actual_result || "");
    } else {
      setPlan("");
      setFact("");
    }
  }, [goalsData, subcategory, periodKey]);

  const handleSave = () => {
    saveGoal({
      category,
      subcategory,
      period_key: periodKey,
      period_type: periodType,
      planned_goal: plan,
      actual_result: fact,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
          <Textarea
            placeholder="What do you plan to achieve?"
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="min-h-[80px] text-sm"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {periodType === 'year' ? 'Progress' : 'Fact'}
          </label>
          <Textarea
            placeholder={periodType === 'year' ? "Current progress..." : "What actually happened?"}
            value={fact}
            onChange={(e) => setFact(e.target.value)}
            className="min-h-[80px] text-sm"
          />
        </div>
      </div>
      
      <Button 
        onClick={handleSave}
        disabled={isSaving || (!plan.trim() && !fact.trim())}
        size="sm"
        className="w-full"
      >
        <Save className="w-4 h-4 mr-1" />
        {isSaving ? 'Saving...' : 'Save'}
      </Button>
    </div>
  );
};

export default GoalInputs;
