
import { useState, useEffect } from "react";
import { HabitsState, DayData, HabitType, HabitData, HabitGoal } from "@/types/habit";
import { formatDateISO, createEmptyDayData, createDefaultMonthlyGoals } from "@/utils/habitUtils";
import { toast } from "sonner";
import useLocalStorage from "./useLocalStorage";
import { supabase } from "@/integrations/supabase/client";

// A hook that combines local storage with optional Supabase syncing
export default function useHabits() {
  // Use local storage as the primary data source for immediate responsiveness
  const [habitsState, setHabitsState] = useLocalStorage<HabitsState>("habits_data", {
    days: {},
    currentDate: formatDateISO(new Date()),
    goals: createDefaultMonthlyGoals()
  });

  // Track sync status - store in localStorage too
  const [isSyncing, setIsSyncing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [syncEnabled, setSyncEnabled] = useLocalStorage<boolean>("habits_sync_enabled", false);

  // Check for existing user ID or create anonymous one
  useEffect(() => {
    const checkUser = async () => {
      try {
        // Check if we have an existing session
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData.session?.user) {
          setUserId(sessionData.session.user.id);
          console.log("Authenticated user found:", sessionData.session.user.id);
        } else {
          // Use anonymous ID from localStorage
          let anonId = localStorage.getItem('anon_user_id');
          if (!anonId) {
            anonId = `user_${Math.random().toString(36).substring(2, 15)}`;
            localStorage.setItem('anon_user_id', anonId);
          }
          setUserId(anonId);
          console.log("Using anonymous ID:", anonId);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      }
    };

    checkUser();
  }, []);

  // Sync from Supabase when user ID is available
  useEffect(() => {
    if (!userId || !syncEnabled) return;

    const syncFromSupabase = async () => {
      setIsSyncing(true);
      try {
        console.log('Syncing data from Supabase for user:', userId);
        
        // Fetch habit days
        const { data: dayData, error: dayError } = await supabase
          .from('habit_days')
          .select('*')
          .eq('user_id', userId);
          
        if (dayError) {
          console.error('Failed to fetch habit data:', dayError);
          return;
        }
        
        // Fetch habit goals
        const { data: goalData, error: goalError } = await supabase
          .from('habit_goals')
          .select('*')
          .eq('user_id', userId);
          
        if (goalError) {
          console.error('Failed to fetch goal data:', goalError);
          return;
        }
        
        console.log('Fetched data from Supabase:', { days: dayData, goals: goalData });
        
        // Only update if we got data
        if (dayData?.length > 0 || goalData?.length > 0) {
          // Transform to expected format
          const days: Record<string, DayData> = {};
          if (dayData) {
            dayData.forEach((record: any) => {
              days[record.date] = record.habit_data;
            });
          }
          
          const goals = { ...createDefaultMonthlyGoals() };
          if (goalData) {
            goalData.forEach((record: any) => {
              goals[record.month_key] = record.goals_data;
            });
          }
          
          // Merge with local data - remote data takes precedence
          setHabitsState(prevState => ({
            ...prevState,
            days: { ...prevState.days, ...days },
            goals: { ...prevState.goals, ...goals }
          }));
          
          toast.success("Data synced from cloud", { duration: 1500 });
        }
      } catch (error) {
        console.error('Error syncing from Supabase:', error);
      } finally {
        setIsSyncing(false);
      }
    };
    
    syncFromSupabase();
  }, [userId, syncEnabled]);

  // Ensure today exists in the data
  useEffect(() => {
    const today = new Date();
    const todayISO = formatDateISO(today);
    
    if (!habitsState.days[todayISO]) {
      const updatedDays = {
        ...habitsState.days,
        [todayISO]: createEmptyDayData(today)
      };
      
      setHabitsState({
        ...habitsState,
        days: updatedDays
      });
    }
  }, []);

  // Update a habit for a specific day
  const updateDay = async (date: Date, type: HabitType, data: HabitData) => {
    try {
      const dateISO = formatDateISO(date);
      
      // Get or create the day data
      let dayData: DayData = habitsState.days[dateISO] 
        ? { ...habitsState.days[dateISO] } 
        : createEmptyDayData(date);
      
      // Update the specific habit data
      dayData = {
        ...dayData,
        [type]: data
      };
      
      // Update local state first for immediate feedback
      const updatedDays = {
        ...habitsState.days,
        [dateISO]: dayData
      };
      
      setHabitsState({
        ...habitsState,
        days: updatedDays
      });

      // Then sync to Supabase if enabled
      if (userId && syncEnabled) {
        try {
          const { error } = await supabase
            .from('habit_days')
            .upsert({
              user_id: userId,
              date: dateISO,
              habit_data: dayData as any // Cast to any to avoid TypeScript errors
            });
            
          if (error) {
            console.error('Error syncing to Supabase:', error);
            // Show error but don't revert local change
            toast.error('Failed to sync to cloud', { duration: 1500, id: 'sync-error' });
          }
        } catch (syncError) {
          console.error('Error in Supabase sync:', syncError);
        }
      }
      
      toast.success('Progress saved!', { duration: 1500 });
    } catch (error) {
      console.error('Error updating day:', error);
      toast.error('Failed to save your progress');
    }
  };
  
  // Update a goal for a specific habit type
  const updateGoal = async (type: HabitType, goal: HabitGoal, year: number, month: number) => {
    try {
      const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
      
      // Get current goals or default
      const monthGoals = habitsState.goals[monthKey] || createDefaultMonthlyGoals()[monthKey];
      
      // Create updated goals object
      const updatedGoals = {
        ...habitsState.goals,
        [monthKey]: {
          ...monthGoals,
          [type]: goal
        }
      };
      
      // Update local state first for immediate feedback
      setHabitsState({
        ...habitsState,
        goals: updatedGoals
      });
      
      // Then sync to Supabase if enabled
      if (userId && syncEnabled) {
        try {
          const { error } = await supabase
            .from('habit_goals')
            .upsert({
              user_id: userId,
              month_key: monthKey,
              goals_data: updatedGoals[monthKey] as any  // Cast to any to avoid TypeScript errors
            });
            
          if (error) {
            console.error('Error syncing goal to Supabase:', error);
            // Show error but don't revert local change
            toast.error('Failed to sync to cloud', { duration: 1500, id: 'sync-error' });
          }
        } catch (syncError) {
          console.error('Error in Supabase goal sync:', syncError);
        }
      }

      // Only show toast for completed updates, not during typing
      if (goal.frequency !== undefined) {
        toast.success('Goal updated!', { duration: 1500 });
      }
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error('Failed to save your goal');
    }
  };

  // Function to enable/disable sync
  const toggleSync = (enabled: boolean) => {
    setSyncEnabled(enabled);
    
    if (enabled) {
      toast.success('Cloud sync enabled');
    } else {
      toast.info('Cloud sync disabled');
    }
  };

  return {
    habitsState,
    updateDay,
    updateGoal,
    isSyncing,
    syncEnabled,
    toggleSync,
    isLoading: false
  };
}
