import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, Heart, Brain, DollarSign, Lightbulb } from 'lucide-react';
import { useGoalsData } from '@/hooks/useGoalsData';
import { useSubcategoryPreferences } from '@/hooks/useSubcategoryPreferences';
import { toast } from 'sonner';

const categoryConfig: Record<string, { icon: React.ElementType; gradient: string; label: string }> = {
  physical: { icon: Heart, gradient: 'from-red-500 to-pink-500', label: 'Physical' },
  mental: { icon: Brain, gradient: 'from-purple-500 to-indigo-500', label: 'Mental' },
  financial: { icon: DollarSign, gradient: 'from-green-500 to-emerald-500', label: 'Financial' },
  skills: { icon: Lightbulb, gradient: 'from-amber-500 to-orange-500', label: 'Skills' }
};

const initialCategories = {
  physical: ["Sport", "Food", "Sleep"],
  mental: ["Networking", "Activities", "Phone usage"],
  financial: ["Spending commitment", "Trading", "Projects"],
  skills: ["Books", "People Management", "Arabic"]
};

function getCurrentQuarter(): string {
  const now = new Date();
  const quarter = Math.ceil((now.getMonth() + 1) / 3);
  return `${now.getFullYear()}-Q${quarter}`;
}

interface QuarterlyGoalsEditDialogProps {
  category: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuarterlyGoalsEditDialog({ category, open, onOpenChange }: QuarterlyGoalsEditDialogProps) {
  const currentQuarter = getCurrentQuarter();
  const { goalsData, saveGoal, isSaving } = useGoalsData(category || '');
  const { categorySubcategories } = useSubcategoryPreferences(initialCategories);
  const [localGoals, setLocalGoals] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const subcategories = category ? (categorySubcategories[category] || initialCategories[category as keyof typeof initialCategories] || []) : [];

  // Load goals into local state
  useEffect(() => {
    if (!category || !goalsData) return;
    
    const loaded: Record<string, string> = {};
    subcategories.forEach(sub => {
      const goal = goalsData.find(
        g => g.subcategory === sub && g.period_key === currentQuarter && g.period_type === 'period_goals'
      );
      loaded[sub] = goal?.planned_goal || '';
    });
    setLocalGoals(loaded);
    setHasChanges(false);
  }, [goalsData, category, subcategories.join(','), currentQuarter]);

  const handleChange = (subcategory: string, value: string) => {
    setLocalGoals(prev => ({ ...prev, [subcategory]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!category) return;

    const promises = subcategories.map(sub => {
      const goalText = localGoals[sub] || '';
      return new Promise<void>((resolve, reject) => {
        saveGoal({
          category,
          subcategory: sub,
          period_key: currentQuarter,
          period_type: 'period_goals',
          planned_goal: goalText,
        }, {
          onSuccess: () => resolve(),
          onError: reject,
        });
      });
    });

    try {
      await Promise.all(promises);
      toast.success('Goals saved!');
      setHasChanges(false);
    } catch {
      toast.error('Failed to save goals');
    }
  };

  if (!category) return null;
  const config = categoryConfig[category];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br ${config.gradient}`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <span>{config.label} — {currentQuarter} Goals</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {subcategories.map(sub => (
            <div key={sub} className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">{sub}</label>
              <Textarea
                placeholder={`Set your ${currentQuarter} goals for ${sub}...\n⭐ Main goal (first line)\n• Supporting goals`}
                value={localGoals[sub] || ''}
                onChange={(e) => handleChange(sub, e.target.value)}
                className="min-h-[80px] text-sm"
                style={{ minHeight: Math.max(80, (localGoals[sub] || '').split('\n').length * 24 + 16) + 'px' }}
              />
            </div>
          ))}

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className={`bg-gradient-to-r ${config.gradient} text-white`}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Goals'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
