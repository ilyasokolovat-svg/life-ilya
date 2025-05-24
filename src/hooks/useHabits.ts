
import { useState, useEffect } from "react";
import { HabitsState, DayData, HabitType, HabitData, HabitGoal } from "@/types/habit";
import { formatDateISO, createEmptyDayData, createDefaultMonthlyGoals } from "@/utils/habitUtils";
import { toast } from "sonner";
import useLocalStorage from "./useLocalStorage";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// A hook that combines local storage with Supabase syncing for authenticated users
export default function useHabits() {
  const { user } = useAuth();
  
  // Use local storage as the primary data source for immediate responsiveness
  const [habitsState, setHabitsState] = useLocalStorage<HabitsState>("habits_data", {
    days: {},
    currentDate: formatDateISO(new Date()),
    goals: createDefaultMonthlyGoals()
  });

  // Track sync status
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncEnabled, setSyncEnabled] = useLocalStorage<boolean>("habits_sync_enabled", false);

  // Sync from Supabase when user is authenticated
  useEffect(() => {
    if (!user || !syncEnabled) return;

    const syncFromSupabase = async () => {
      setIsSyncing(true);
      try {
        console.log('Syncing data from Supabase for user:', user.id);
        
        // Fetch habit days
        const { data: dayData, error: dayError } = await supabase
          .from('habit_days')
          .select('*')
          .eq('user_id', user.id);
          
        if (dayError) {
          console.error('Failed to fetch habit data:', dayError);
          return;
        }
        
        // Fetch habit goals
        const { data: goalData, error: goalError } = await supabase
          .from('habit_goals')
          .select('*')
          .eq('user_id', user.id);
          
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
  }, [user, syncEnabled]);

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

      // Then sync to Supabase if enabled and user is authenticated
      if (user && syncEnabled) {
        try {
          const { error } = await supabase
            .from('habit_days')
            .upsert({
              user_id: user.id,
              date: dateISO,
              habit_data: dayData as any
            });
            
          if (error) {
            console.error('Error syncing to Supabase:', error);
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
      
      // Then sync to Supabase if enabled and user is authenticated
      if (user && syncEnabled) {
        try {
          const { error } = await supabase
            .from('habit_goals')
            .upsert({
              user_id: user.id,
              month_key: monthKey,
              goals_data: updatedGoals[monthKey] as any
            });
            
          if (error) {
            console.error('Error syncing goal to Supabase:', error);
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
