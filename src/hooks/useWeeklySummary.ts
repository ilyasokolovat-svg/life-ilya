import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  bullet_point_day_assignments?: string; // JSON string storing day assignments for each bullet point
  isOverdue?: boolean;
  weekDates?: string;
  order_index?: number;
  priority?: 'high' | 'medium' | 'low';
  assigned_day?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  assigned_time_slot?: 'morning' | 'afternoon' | 'evening';
}

// Extended type for database items that includes all new fields
interface DatabaseGoalItem {
  id: string;
  category: string;
  subcategory: string;
  period_key: string;
  period_type: string;
  planned_goal: string | null;
  actual_result: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  order_index: number | null;
  priority: string | null;
  assigned_day: string | null;
  assigned_time_slot: string | null;
  bullet_point_day_assignments: string | null; // Added for bullet point day assignments
}

export function useWeeklySummary() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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
      
      // Combine current and overdue tasks - cast to our extended type
      const allTasks = [
        ...(currentWeekData || []).map(item => ({ ...(item as DatabaseGoalItem), isOverdue: false })),
        ...incompletePreviousTasks.map(item => ({ ...(item as DatabaseGoalItem), isOverdue: true }))
      ];
      
      // Sort by priority first (high > medium > low), then by order_index
      const sortedTasks = allTasks.sort((a, b) => {
        // Priority sorting
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 2;
        const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 2;
        
        if (priorityA !== priorityB) {
          return priorityB - priorityA; // Higher priority first
        }
        
        // If priority is the same, sort by order_index
        const orderA = a.order_index ?? 999999;
        const orderB = b.order_index ?? 999999;
        return orderA - orderB;
      });
      
      return sortedTasks.map(item => {
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
          bullet_point_day_assignments: item.bullet_point_day_assignments || undefined,
          isOverdue: item.isOverdue || false,
          weekDates: item.isOverdue ? getWeekDates(item.period_key) : undefined,
          order_index: item.order_index,
          priority: (item.priority as 'high' | 'medium' | 'low') || 'medium',
          assigned_day: item.assigned_day as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' | undefined,
          assigned_time_slot: item.assigned_time_slot as 'morning' | 'afternoon' | 'evening' | undefined
        };
      });
    },
    enabled: !!user?.id,
  });

  // Mutation to update task assignment and priority
  const updateTaskAssignment = useMutation({
    mutationFn: async ({
      taskId,
      assigned_day,
      assigned_time_slot,
      priority,
      bullet_point_day_assignments
    }: {
      taskId: string;
      assigned_day?: string | null;
      assigned_time_slot?: string | null;
      priority?: string;
      bullet_point_day_assignments?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const updates: any = {};
      if (assigned_day !== undefined) updates.assigned_day = assigned_day;
      if (assigned_time_slot !== undefined) updates.assigned_time_slot = assigned_time_slot;
      if (priority !== undefined) updates.priority = priority;
      if (bullet_point_day_assignments !== undefined) updates.bullet_point_day_assignments = bullet_point_day_assignments;
      
      const { error } = await supabase
        .from('goals_data')
        .update(updates)
        .eq('id', taskId)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      return { taskId, ...updates };
    },
    onSuccess: () => {
      // Invalidate and refetch the weekly summary
      queryClient.invalidateQueries({ queryKey: ['weekly_summary', user?.id, currentWeekKey] });
    },
    onError: (error) => {
      console.error('Failed to update task assignment:', error);
    }
  });

  // Mutation to update task order
  const updateTaskOrder = useMutation({
    mutationFn: async (orderedTasks: WeeklySummaryItem[]) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Update each task with its new order index
      const updates = orderedTasks.map((task, index) => ({
        id: task.id,
        order_index: index
      }));
      
      for (const update of updates) {
        const { error } = await supabase
          .from('goals_data')
          .update({ order_index: update.order_index })
          .eq('id', update.id)
          .eq('user_id', user.id);
          
        if (error) throw error;
      }
      
      return updates;
    },
    onSuccess: () => {
      // Invalidate and refetch the weekly summary
      queryClient.invalidateQueries({ queryKey: ['weekly_summary', user?.id, currentWeekKey] });
    },
    onError: (error) => {
      console.error('Failed to update task order:', error);
    }
  });

  return {
    weeklySummary,
    isLoading,
    currentWeekKey,
    updateTaskOrder: updateTaskOrder.mutate,
    updateTaskAssignment: updateTaskAssignment.mutate
  };
}
