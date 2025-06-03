
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useGoalsData } from "@/hooks/useGoalsData";

interface GoalEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  subcategory: string;
  periodKey: string;
  periodType: 'quarter' | 'year';
}

const GoalEditDialog: React.FC<GoalEditDialogProps> = ({
  isOpen,
  onClose,
  category,
  subcategory,
  periodKey,
  periodType,
}) => {
  const { goalsData, saveGoal, isSaving } = useGoalsData(category);
  const [plan, setPlan] = useState("");
  const [fact, setFact] = useState("");

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
  }, [goalsData, subcategory, periodKey, isOpen]);

  const handleSave = () => {
    saveGoal({
      category,
      subcategory,
      period_key: periodKey,
      period_type: periodType,
      planned_goal: plan,
      actual_result: fact,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Edit {periodKey.replace('_', ' ').toUpperCase()} - {subcategory}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Plan</label>
            <Textarea
              placeholder="What do you plan to achieve?"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {periodType === 'year' ? 'Progress' : 'Fact'}
            </label>
            <Textarea
              placeholder={periodType === 'year' ? "Current progress..." : "What actually happened?"}
              value={fact}
              onChange={(e) => setFact(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GoalEditDialog;
