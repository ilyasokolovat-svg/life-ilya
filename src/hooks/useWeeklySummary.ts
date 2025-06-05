
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface WeeklySummaryItem {
  id: string;
  category: string;
  subcategory: string;
  period_key: string;
  planned_goal: string;
  actual_result?: string;
  isCompleted: boolean;
}

export function useWeeklySummary() {
  const { user } = useAuth();

  // Get current week key
  const getCurrentWeekKey = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11, so add 1
    
    // Find the start of the current week (Monday)
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToMonday);
    
    const weekKey = `${currentYear}-${currentMonth}-${weekStart.getDate()}`;
    return weekKey;
  };

  const currentWeekKey = getCurrentWeekKey();

  const { data: weeklySummary = [], isLoading } = useQuery({
    queryKey: ['weekly_summary', user?.id, currentWeekKey],
    queryFn: async (): Promise<WeeklySummaryItem[]> => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('goals_data')
        .select('*')
        .eq('user_id', user.id)
        .eq('period_type', 'week')
        .eq('period_key', currentWeekKey)
        .not('planned_goal', 'is', null)
        .not('planned_goal', 'eq', '');
        
      if (error) throw error;
      
      return (data || []).map(item => ({
        id: item.id,
        category: item.category,
        subcategory: item.subcategory,
        period_key: item.period_key,
        planned_goal: item.planned_goal || '',
        actual_result: item.actual_result,
        isCompleted: item.actual_result === 'completed'
      }));
    },
    enabled: !!user?.id,
  });

  return {
    weeklySummary,
    isLoading,
    currentWeekKey
  };
}
