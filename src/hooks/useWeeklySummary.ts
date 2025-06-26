
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
  bullet_point_completions?: boolean[];
  isOverdue?: boolean;
  weekDates?: string; // Added for displaying week dates
}

export function useWeeklySummary() {
  const { user } = useAuth();

  // Helper function to get Monday of any given date (consistent week start)
  const getMondayOfWeek = (date: Date): Date => {
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    result.setDate(diff);
    return result;
  };

  // Get current week key using consistent Monday-based logic
  const getCurrentWeekKey = () => {
    const now = new Date();
    const monday = getMondayOfWeek(now);
    return `${monday.getFullYear()}-${monday.getMonth() + 1}-${monday.getDate()}`;
  };

  // Helper function to get week date range from period_key
  const getWeekDates = (periodKey: string) => {
    const [year, month, day] = periodKey.split('-').map(Number);
    const weekStart = new Date(year, month - 1, day); // month - 1 because Date constructor uses 0-based months
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const formatDate = (date: Date) => {
      return `${date.getDate()}/${date.getMonth() + 1}`;
    };
    
    return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
  };

  // Helper function to check if a week has ended (past week)
  const isWeekEnded = (weekKey: string) => {
    const currentWeekKey = getCurrentWeekKey();
    
    // Parse the week key to get the date
    const [year, month, day] = weekKey.split('-').map(Number);
    const weekStartDate = new Date(year, month - 1, day); // month - 1 because Date constructor uses 0-based months
    
    // Parse current week key
    const [currentYear, currentMonth, currentDay] = currentWeekKey.split('-').map(Number);
    const currentWeekStartDate = new Date(currentYear, currentMonth - 1, currentDay);
    
    // A week has ended if its start date is before the current week's start date
    return weekStartDate < currentWeekStartDate;
  };

  const currentWeekKey = getCurrentWeekKey();

  // Helper function to check if a task is fully completed
  const isTaskFullyCompleted = (item: any): boolean => {
    if (item.actual_result === 'completed') return true;
    
    // Check bullet point completions
    if (item.actual_result && item.actual_result !== 'completed') {
      try {
        const parsed = JSON.parse(item.actual_result);
        if (Array.isArray(parsed.bullet_completions)) {
          const bulletPoints = (item.planned_goal || '').split('\n').filter(line => line.trim());
          return bulletPoints.length > 1 && bulletPoints.every((_, index) => parsed.bullet_completions[index] === true);
        }
      } catch (e) {
        return false;
      }
    }
    
    return false;
  };

  const { data: weeklySummary = [], isLoading } = useQuery({
    queryKey: ['weekly_summary', user?.id, currentWeekKey],
    queryFn: async (): Promise<WeeklySummaryItem[]> => {
      if (!user?.id) return [];
      
      // Fetch current week tasks
      const { data: currentWeekData, error: currentWeekError } = await supabase
        .from('goals_data')
        .select('*')
        .eq('user_id', user.id)
        .eq('period_type', 'week')
        .eq('period_key', currentWeekKey)
        .not('planned_goal', 'is', null)
        .not('planned_goal', 'eq', '');
        
      if (currentWeekError) throw currentWeekError;

      // Fetch all previous week tasks that are not fully completed
      const { data: allPreviousData, error: previousError } = await supabase
        .from('goals_data')
        .select('*')
        .eq('user_id', user.id)
        .eq('period_type', 'week')
        .neq('period_key', currentWeekKey)
        .not('planned_goal', 'is', null)
        .not('planned_goal', 'eq', '');
        
      if (previousError) throw previousError;

      // Filter previous tasks to only include uncompleted ones from weeks that have actually ended
      const incompletePreviousTasks = (allPreviousData || []).filter(item => 
        !isTaskFullyCompleted(item) && isWeekEnded(item.period_key)
      );
      
      // Combine current and overdue tasks
      const allTasks = [
        ...(currentWeekData || []).map(item => ({ ...item, isOverdue: false })),
        ...incompletePreviousTasks.map(item => ({ ...item, isOverdue: true }))
      ];
      
      return allTasks.map(item => {
        // Parse bullet point completions from actual_result if it exists
        let bulletPointCompletions: boolean[] = [];
        if (item.actual_result && item.actual_result !== 'completed') {
          try {
            const parsed = JSON.parse(item.actual_result);
            if (Array.isArray(parsed.bullet_completions)) {
              bulletPointCompletions = parsed.bullet_completions;
            }
          } catch (e) {
            // If parsing fails, assume no bullet point completions
          }
        }

        return {
          id: item.id,
          category: item.category,
          subcategory: item.subcategory,
          period_key: item.period_key,
          planned_goal: item.planned_goal || '',
          actual_result: item.actual_result,
          isCompleted: item.actual_result === 'completed',
          bullet_point_completions: bulletPointCompletions,
          isOverdue: item.isOverdue || false,
          weekDates: item.isOverdue ? getWeekDates(item.period_key) : undefined
        };
      });
    },
    enabled: !!user?.id,
  });

  return {
    weeklySummary,
    isLoading,
    currentWeekKey
  };
}
