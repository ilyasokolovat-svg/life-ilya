import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface QuarterlyGoal {
  category: string;
  subcategory: string;
  planned_goal: string | null;
}

export interface CategoryGoals {
  category: string;
  goals: { subcategory: string; goal: string }[];
}

function getCurrentQuarter(): string {
  const now = new Date();
  const quarter = Math.ceil((now.getMonth() + 1) / 3);
  return `${now.getFullYear()}-Q${quarter}`;
}

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

  // Group goals by category
  const groupedGoals: CategoryGoals[] = ['physical', 'mental', 'financial', 'skills'].map(category => {
    const categoryGoals = goalsData
      .filter(g => g.category === category && g.planned_goal)
      .map(g => ({
        subcategory: g.subcategory,
        goal: g.planned_goal!
      }));

    return {
      category,
      goals: categoryGoals
    };
  });

  return {
    groupedGoals,
    isLoading,
    currentQuarter
  };
}
