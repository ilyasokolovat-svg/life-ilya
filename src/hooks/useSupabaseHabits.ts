
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

  // Initialize anonymous user ID
  useEffect(() => {
    const initUserId = () => {
      try {
        // Look for existing anonymous ID in localStorage
        let anonId = localStorage.getItem('anon_user_id');
        
        if (!anonId) {
          // Create new anonymous ID and store it
          anonId = `anon_${crypto.randomUUID()}`;
          localStorage.setItem('anon_user_id', anonId);
        }
        
        // Use the anonymous ID directly
        setUserId(anonId);
        console.log("Using anonymous ID:", anonId);
        setIsAuthChecking(false);
      } catch (error) {
        console.error('Error initializing user ID:', error);
        toast.error('Error initializing user session');
        
        // Fallback to a random ID if everything fails
        const fallbackId = `fallback_${crypto.randomUUID()}`;
        setUserId(fallbackId);
        localStorage.setItem('anon_user_id', fallbackId);
        console.log("Using fallback ID:", fallbackId);
        setIsAuthChecking(false);
      }
    };
    
    initUserId();
  }, []);
  
  // Ensure tables exist
  useEffect(() => {
    const createTables = async () => {
      if (!userId) return;
      
      try {
        // Check and create habit_days table
        const { error: daysError } = await supabase.rpc('create_habit_days_table');
        
        if (daysError && !daysError.message.includes('already exists')) {
          console.error('Error creating habit_days table:', daysError);
          toast.error('Failed to set up habit tracking');
        }
        
        // Check and create habit_goals table
        const { error: goalsError } = await supabase.rpc('create_habit_goals_table');
        
        if (goalsError && !goalsError.message.includes('already exists')) {
          console.error('Error creating habit_goals table:', goalsError);
          toast.error('Failed to set up goal tracking');
        }
      } catch (error) {
        console.error('Failed to create tables:', error);
        toast.error('Failed to set up database tables');
      }
    };
    
    if (userId) {
      createTables();
    }
  }, [userId]);

  // Fetch habit days
  const { data: habitDays = {}, isLoading: isLoadingDays } = useQuery({
    queryKey: ['habit_days', userId],
    queryFn: async (): Promise<Record<string, DayData>> => {
      if (!userId) return {};
      
      try {
        const { data, error } = await supabase
          .from('habit_days')
          .select('*')
          .eq('user_id', userId);
          
        if (error) {
          console.error('Failed to fetch habit data:', error);
          toast.error('Could not load your habit data');
          return {};
        }
        
        // Transform to the format our app expects
        const transformedData: Record<string, DayData> = {};
        if (data) {
          data.forEach((record: HabitDayRecord) => {
            // Cast Json to DayData since we know the structure matches
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
        const { data, error } = await supabase
          .from('habit_goals')
          .select('*')
          .eq('user_id', userId);
          
        if (error) {
          console.error('Failed to fetch habit goals:', error);
          toast.error('Could not load your goals');
          return createDefaultMonthlyGoals();
        }
        
        // Transform to the format our app expects
        const transformedGoals: Record<string, any> = {};
        if (data) {
          data.forEach((record: HabitGoalRecord) => {
            // Cast Json to our expected structure
            transformedGoals[record.month_key] = record.goals_data as any;
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
  
  // Update day mutation
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
      if (!userId) throw new Error('User not authenticated');
      
      const dateISO = formatDateISO(date);
      
      // Get or create the day data
      let dayData: DayData;
      
      if (habitDays[dateISO]) {
        dayData = {
          ...habitDays[dateISO],
          [habitType]: data
        };
      } else {
        dayData = createEmptyDayData(date);
        dayData[habitType] = data;
      }
      
      try {
        // Create a proper JSON object for Supabase
        const habitDataJson = JSON.parse(JSON.stringify(dayData));
        
        // Create a record for upsert
        const record: HabitDayRecord = {
          user_id: userId,
          date: dateISO,
          habit_data: habitDataJson as unknown as Json,
          updated_at: new Date().toISOString()
        };
        
        console.log('Upserting habit day record:', record);
        
        const { error } = await supabase
          .from('habit_days')
          .upsert(record)
          .select()
          .single();
          
        if (error) {
          console.error('Failed to update habit:', error);
          toast.error('Failed to save your progress');
          throw error;
        }
        
        return true;
      } catch (error) {
        console.error('Error in update day mutation:', error);
        toast.error('Failed to save your progress');
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      const dateISO = formatDateISO(variables.date);
      
      // Update local cache
      queryClient.setQueryData(['habit_days', userId], (oldData: any) => {
        const newData = { ...oldData };
        if (!newData[dateISO]) {
          newData[dateISO] = createEmptyDayData(variables.date);
        }
        newData[dateISO] = {
          ...newData[dateISO],
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
  
  // Update goal mutation
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
      if (!userId) throw new Error('User not authenticated');
      
      const monthKey = formatYearMonth(year, month);
      
      // Get current goals or default
      let monthGoals = habitGoals[monthKey] || createDefaultMonthlyGoals()[monthKey];
      
      // Update specific habit goal
      monthGoals = {
        ...monthGoals,
        [habitType]: goal
      };
      
      try {
        // Create a proper JSON object for Supabase
        const goalsDataJson = JSON.parse(JSON.stringify(monthGoals));
        
        // Create a record for upsert
        const record: HabitGoalRecord = {
          user_id: userId,
          month_key: monthKey,
          goals_data: goalsDataJson as unknown as Json,
          updated_at: new Date().toISOString()
        };
        
        console.log('Upserting goal record:', record);
        
        const { error } = await supabase
          .from('habit_goals')
          .upsert(record)
          .select()
          .single();
          
        if (error) {
          console.error('Failed to update goal:', error);
          toast.error('Failed to save your goal');
          throw error;
        }
        
        return true;
      } catch (error) {
        console.error('Error in update goal mutation:', error);
        toast.error('Failed to save your goal');
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      const monthKey = formatYearMonth(variables.year, variables.month);
      
      // Update local cache
      queryClient.setQueryData(['habit_goals', userId], (oldData: any) => {
        const newGoals = { ...oldData };
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
