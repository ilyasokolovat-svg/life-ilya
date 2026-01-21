import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SubcategoryMainGoal {
  subcategory: string;
  mainGoal: string; // First line (starred goal)
}

export interface CategoryGoals {
  category: string;
  subcategoryGoals: SubcategoryMainGoal[];
}

function getCurrentQuarter(): string {
  const now = new Date();
  const quarter = Math.ceil((now.getMonth() + 1) / 3);
  return `${now.getFullYear()}-Q${quarter}`;
}

// Extract main goal (first line) from the goals text
function extractMainGoal(goalsText: string): string {
  if (!goalsText) return '';
  
  const firstLine = goalsText.split('\n')[0] || '';
  // Remove bullet/star prefix and trim
  return firstLine.replace(/^[•⭐]\s*/, '').trim();
}

// Get subcategory display order
const subcategoryOrder: Record<string, string[]> = {
  physical: ['Sport', 'Food', 'Sleep'],
  mental: ['Networking', 'Activities', 'Phone usage'],
  financial: ['Spending commitment', 'Trading'],
  skills: ['Projects', 'Books', 'People Management', 'Arabic']
};

export function useQuarterlyGoalsOverview() {
  const { user } = useAuth();
  const currentQuarter = getCurrentQuarter();

  const { data: goalsData = [], isLoading } = useQuery({
    queryKey: ['quarterly_goals_overview', user?.id, currentQuarter],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('goals_data')
        .select('category, subcategory, planned_goal')
        .eq('user_id', user.id)
        .eq('period_type', 'period_goals')
        .eq('period_key', currentQuarter)
        .not('planned_goal', 'is', null);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Group goals by category with subcategory details
  const groupedGoals: CategoryGoals[] = ['physical', 'mental', 'financial', 'skills'].map(category => {
    const categoryData = goalsData.filter(g => g.category === category && g.planned_goal);
    
    // Get ordered subcategories for this category
    const orderedSubcategories = subcategoryOrder[category] || [];
    
    // Map subcategories with their main goals
    const subcategoryGoals: SubcategoryMainGoal[] = orderedSubcategories
      .map(subcategory => {
        const goal = categoryData.find(g => g.subcategory === subcategory);
        if (!goal) return null;
        
        const mainGoal = extractMainGoal(goal.planned_goal!);
        if (!mainGoal) return null;
        
        return {
          subcategory,
          mainGoal
        };
      })
      .filter((g): g is SubcategoryMainGoal => g !== null);

    return {
      category,
      subcategoryGoals
    };
  });

  const hasAnyGoals = groupedGoals.some(cg => cg.subcategoryGoals.length > 0);

  return {
    groupedGoals,
    isLoading,
    currentQuarter,
    hasAnyGoals
  };
}
