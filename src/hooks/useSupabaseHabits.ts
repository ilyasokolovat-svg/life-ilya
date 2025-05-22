
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { HabitsState, DayData, HabitType, HabitData } from '@/types/habit';
import { formatYearMonth, createEmptyDayData, createDefaultMonthlyGoals, formatDateISO } from '@/utils/habitUtils';
import { toast } from 'sonner';

// Types for the database
interface HabitDayRecord {
  id?: string;
  user_id: string;
  date: string;
  habit_data: DayData;
  created_at?: string;
  updated_at?: string;
}

interface HabitGoalRecord {
  id?: string;
  user_id: string;
  month_key: string;
  goals_data: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

// Main hook for habit data
export default function useSupabaseHabits() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const queryClient = useQueryClient();

  // Check auth status on load
  useEffect(() => {
    const checkUser = async () => {
      try {
        setIsAuthChecking(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUserId(session.user.id);
          console.log("User is authenticated:", session.user.id);
        } else {
          console.log("No authenticated user, creating anonymous session");
          // Create anonymous session
          const { data: { user }, error } = await supabase.auth.signUp({
            email: `anon_${crypto.randomUUID()}@example.com`,
            password: crypto.randomUUID(),
          });
          
          if (error) {
            console.error('Failed to create anonymous session:', error);
            toast.error('Failed to create user session. Try refreshing the page.');
            return;
          }
          
          setUserId(user?.id ?? null);
          console.log("Created anonymous user:", user?.id);
        }
      } catch (error) {
        console.error('Error checking authentication status:', error);
        toast.error('Error checking user session');
      } finally {
        setIsAuthChecking(false);
      }
    };
    
    checkUser();
    
    // Setup auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      if (event === 'SIGNED_IN' && session?.user) {
        setUserId(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUserId(null);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Ensure tables exist
  useEffect(() => {
    const createTables = async () => {
      if (!userId) return;
      
      try {
        // Check and create habit_days table
        const { error: daysError } = await supabase.rpc('create_habit_days_table') as any;
        
        if (daysError && !daysError.message.includes('already exists')) {
          console.error('Error creating habit_days table:', daysError);
          toast.error('Failed to set up habit tracking');
        }
        
        // Check and create habit_goals table
        const { error: goalsError } = await supabase.rpc('create_habit_goals_table') as any;
        
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
          .eq('user_id', userId) as any;
          
        if (error) {
          console.error('Failed to fetch habit data:', error);
          toast.error('Could not load your habit data');
          return {};
        }
        
        // Transform to the format our app expects
        const transformedData: Record<string, DayData> = {};
        data.forEach((record: HabitDayRecord) => {
          transformedData[record.date] = record.habit_data;
        });
        
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
          .eq('user_id', userId) as any;
          
        if (error) {
          console.error('Failed to fetch habit goals:', error);
          toast.error('Could not load your goals');
          return createDefaultMonthlyGoals();
        }
        
        // Transform to the format our app expects
        const transformedGoals: Record<string, any> = {};
        data.forEach((record: HabitGoalRecord) => {
          transformedGoals[record.month_key] = record.goals_data;
        });
        
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
        // Fixed: Pass the object directly, not wrapped in an array
        const { error } = await supabase
          .from('habit_days')
          .upsert({
            user_id: userId,
            date: dateISO,
            habit_data: dayData,
            updated_at: new Date().toISOString() // Fixed: Convert Date to string
          }, { onConflict: 'user_id,date' }) as any;
          
        if (error) {
          console.error('Failed to update habit:', error);
          toast.error('Failed to save your progress');
          return false;
        }
        
        return true;
      } catch (error) {
        console.error('Error in update day mutation:', error);
        toast.error('Could not update habit');
        return false;
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
        // Fixed: Pass the object directly, not wrapped in an array
        const { error } = await supabase
          .from('habit_goals')
          .upsert({
            user_id: userId,
            month_key: monthKey,
            goals_data: monthGoals,
            updated_at: new Date().toISOString() // Fixed: Convert Date to string
          }, { onConflict: 'user_id,month_key' }) as any;
          
        if (error) {
          console.error('Failed to update goal:', error);
          toast.error('Failed to save your goal');
          return false;
        }
        
        return true;
      } catch (error) {
        console.error('Error in update goal mutation:', error);
        toast.error('Could not update goal');
        return false;
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
