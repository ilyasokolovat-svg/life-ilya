
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { HabitsState, DayData, HabitType, HabitData } from '@/types/habit';
import { formatYearMonth, createEmptyDayData, createDefaultMonthlyGoals, formatDateISO } from '@/utils/habitUtils';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

// Types for the database
interface HabitDayRecord {
  id?: string;
  user_id: string;
  date: string;
  habit_data: Json;
  created_at?: string;
  updated_at?: string;
}

interface HabitGoalRecord {
  id?: string;
  user_id: string;
  month_key: string;
  goals_data: Json;
  created_at?: string;
  updated_at?: string;
}

// Main hook for habit data
export default function useSupabaseHabits() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const queryClient = useQueryClient();

  // Initialize anonymous user ID - fixed to use simple string IDs that won't cause UUID errors
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
          data.forEach((record: HabitDayRecord) => {
            // Make sure we handle the JSON conversion properly
            const habitData = typeof record.habit_data === 'string' 
              ? JSON.parse(record.habit_data as unknown as string)
              : record.habit_data;
              
            transformedData[record.date] = habitData as unknown as DayData;
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
          data.forEach((record: HabitGoalRecord) => {
            // Properly handle JSON data
            const goalsData = typeof record.goals_data === 'string'
              ? JSON.parse(record.goals_data as unknown as string)
              : record.goals_data;
              
            transformedGoals[record.month_key] = goalsData;
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
  
  // Update day mutation - fixed the type issue with JSON serialization
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
        // Create a record with proper type casting for Supabase
        const record: HabitDayRecord = {
          user_id: userId,
          date: dateISO,
          habit_data: dayData as unknown as Json // Cast to Json type for Supabase
        };
        
        console.log('Upserting habit day with data:', record);
        
        // Use upsert to create or update the record
        const { error } = await supabase
          .from('habit_days')
          .upsert(record)
          .select('count');
          
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
    },
    onError: (error) => {
      console.error('Update day mutation error:', error);
      toast.error('Failed to save your progress');
    }
  });
  
  // Update goal mutation - with type casting for JSON compatibility
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
        // Create a record with proper type casting
        const record: HabitGoalRecord = {
          user_id: userId,
          month_key: monthKey,
          goals_data: monthGoals as unknown as Json // Cast to Json type for Supabase
        };
        
        console.log('Upserting goal with data:', record);
        
        // Use upsert with 'count' to avoid extra DB calls
        const { error } = await supabase
          .from('habit_goals')
          .upsert(record)
          .select('count');
          
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
