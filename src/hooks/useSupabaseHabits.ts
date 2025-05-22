
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { HabitsState, DayData, HabitType, HabitData } from '@/types/habit';
import { formatYearMonth, createEmptyDayData, createDefaultMonthlyGoals, formatDateISO } from '@/utils/habitUtils';
import { toast } from 'sonner';

// Main hook for habit data
export default function useSupabaseHabits() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const queryClient = useQueryClient();

  // Initialize anonymous user ID - fixed to use simple string IDs
  useEffect(() => {
    // Get existing ID or create a new one, ensuring it's not in UUID format to avoid type errors
    let anonId = localStorage.getItem('anon_user_id');
    
    if (!anonId) {
      // Create a simple string ID rather than a UUID to avoid format issues
      anonId = `user_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('anon_user_id', anonId);
    }
    
    setUserId(anonId);
    setIsAuthChecking(false);
    console.log("Using user ID:", anonId);
  }, []);

  // Fetch habit days
  const { data: habitDays = {}, isLoading: isLoadingDays } = useQuery({
    queryKey: ['habit_days', userId],
    queryFn: async (): Promise<Record<string, DayData>> => {
      if (!userId) return {};
      
      try {
        console.log('Fetching habit days for user:', userId);
        const { data, error } = await supabase
          .from('habit_days')
          .select('*')
          .eq('user_id', userId);
          
        if (error) {
          console.error('Failed to fetch habit data:', error);
          toast.error('Could not load your habit data');
          return {};
        }
        
        console.log('Fetched habit days:', data);
        
        // Transform to the format our app expects
        const transformedData: Record<string, DayData> = {};
        if (data && Array.isArray(data)) {
          data.forEach((record) => {
            transformedData[record.date] = record.habit_data as unknown as DayData;
          });
        }
        
        return transformedData;
      } catch (error) {
        console.error('Error in habit days query:', error);
        toast.error('Failed to load habit data');
        return {};
      }
    },
    enabled: !!userId && !isAuthChecking,
  });
  
  // Fetch habit goals
  const { data: habitGoals = {}, isLoading: isLoadingGoals } = useQuery({
    queryKey: ['habit_goals', userId],
    queryFn: async () => {
      if (!userId) return createDefaultMonthlyGoals();
      
      try {
        console.log('Fetching habit goals for user:', userId);
        const { data, error } = await supabase
          .from('habit_goals')
          .select('*')
          .eq('user_id', userId);
          
        if (error) {
          console.error('Failed to fetch habit goals:', error);
          toast.error('Could not load your goals');
          return createDefaultMonthlyGoals();
        }
        
        console.log('Fetched habit goals:', data);
        
        // Transform to the format our app expects
        const transformedGoals: Record<string, any> = {};
        if (data && Array.isArray(data)) {
          data.forEach((record) => {
            transformedGoals[record.month_key] = record.goals_data;
          });
        }
        
        // If empty, return defaults
        if (Object.keys(transformedGoals).length === 0) {
          return createDefaultMonthlyGoals();
        }
        
        return transformedGoals;
      } catch (error) {
        console.error('Error in goals query:', error);
        toast.error('Failed to load goal data');
        return createDefaultMonthlyGoals();
      }
    },
    enabled: !!userId && !isAuthChecking,
  });
  
  // Update day mutation - fixed without using select() and with proper typing
  const updateDay = useMutation({
    mutationFn: async ({ 
      date, 
      habitType, 
      data 
    }: { 
      date: Date, 
      habitType: HabitType, 
      data: HabitData 
    }) => {
      if (!userId) {
        console.error('Cannot update habit: No user ID available');
        throw new Error('User not authenticated');
      }
      
      const dateISO = formatDateISO(date);
      
      // Get or create the day data
      let dayData: DayData = habitDays[dateISO] 
        ? { ...habitDays[dateISO] } 
        : createEmptyDayData(date);
      
      // Update the specific habit data
      dayData = {
        ...dayData,
        [habitType]: data
      };
      
      try {
        console.log('Upserting habit day with data:', {
          user_id: userId,
          date: dateISO,
          habit_data: dayData
        });
        
        const { error } = await supabase
          .from('habit_days')
          .upsert({
            user_id: userId,
            date: dateISO,
            habit_data: dayData as any  // Cast to any to avoid TypeScript errors
          });
          
        if (error) {
          console.error('Database error updating habit:', error);
          throw error;
        }
        
        console.log('Successfully updated habit day');
        return { success: true, data: dayData };
      } catch (error) {
        console.error('Error in update day mutation:', error);
        throw error;
      }
    },
    onSuccess: (result, variables) => {
      const dateISO = formatDateISO(variables.date);
      
      // Update local cache
      queryClient.setQueryData(['habit_days', userId], (oldData: any) => {
        const newData = { ...(oldData || {}) };
        newData[dateISO] = result.data || {
          ...createEmptyDayData(variables.date),
          [variables.habitType]: variables.data
        };
        return newData;
      });
      
      toast.success('Progress saved!', { duration: 1500 });
    },
    onError: (error) => {
      console.error('Update day mutation error:', error);
      toast.error('Failed to save your progress');
    }
  });
  
  // Update goal mutation - fixed without using select() and with proper typing
  const updateGoal = useMutation({
    mutationFn: async ({
      year,
      month,
      habitType,
      goal
    }: {
      year: number,
      month: number,
      habitType: HabitType,
      goal: any
    }) => {
      if (!userId) {
        console.error('Cannot update goal: No user ID available');
        throw new Error('User not authenticated');
      }
      
      const monthKey = formatYearMonth(year, month);
      
      // Get current goals or default
      let monthGoals = habitGoals[monthKey] || createDefaultMonthlyGoals()[monthKey];
      
      // Update specific habit goal
      monthGoals = {
        ...monthGoals,
        [habitType]: goal
      };
      
      try {
        console.log('Upserting goal with data:', {
          user_id: userId,
          month_key: monthKey,
          goals_data: monthGoals
        });
        
        const { error } = await supabase
          .from('habit_goals')
          .upsert({
            user_id: userId,
            month_key: monthKey,
            goals_data: monthGoals as any  // Cast to any to avoid TypeScript errors
          });
          
        if (error) {
          console.error('Database error updating goal:', error);
          throw error;
        }
        
        console.log('Successfully updated goal');
        return { success: true, data: monthGoals };
      } catch (error) {
        console.error('Error in update goal mutation:', error);
        throw error;
      }
    },
    onSuccess: (result, variables) => {
      const monthKey = formatYearMonth(variables.year, variables.month);
      
      // Update local cache
      queryClient.setQueryData(['habit_goals', userId], (oldData: any) => {
        const newGoals = { ...(oldData || {}) };
        if (!newGoals[monthKey]) {
          newGoals[monthKey] = createDefaultMonthlyGoals()[monthKey];
        }
        newGoals[monthKey] = {
          ...newGoals[monthKey],
          [variables.habitType]: variables.goal
        };
        return newGoals;
      });
      
      toast.success('Goal updated!', { duration: 1500 });
    },
    onError: (error) => {
      console.error('Update goal mutation error:', error);
      toast.error('Failed to save your goal');
    }
  });

  const isLoading = isLoadingDays || isLoadingGoals || isAuthChecking || !userId;

  // Combine into the format our app expects
  const habitsState: HabitsState = {
    days: habitDays,
    currentDate: formatDateISO(new Date()),
    goals: habitGoals
  };

  return {
    habitsState,
    updateDay: (date: Date, type: HabitType, data: HabitData) => updateDay.mutate({ date, habitType: type, data }),
    updateGoal: (type: HabitType, goal: any, year: number, month: number) => updateGoal.mutate({ habitType: type, goal, year, month }),
    isLoading,
    userId
  };
}
