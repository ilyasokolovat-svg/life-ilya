
import { useState, useEffect } from "react";
import { HabitsState, DayData, HabitType, HabitData, HabitGoal } from "@/types/habit";
import { formatDateISO, createEmptyDayData, createDefaultMonthlyGoals } from "@/utils/habitUtils";
import { toast } from "sonner";
import useLocalStorage from "./useLocalStorage";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

// A hook that combines local storage with Supabase syncing for authenticated users
export default function useHabits() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Use local storage as the primary data source for immediate responsiveness
  const [habitsState, setHabitsState] = useLocalStorage<HabitsState>("habits_data", {
    days: {},
    currentDate: formatDateISO(new Date()),
    goals: createDefaultMonthlyGoals()
  });

  // Track sync status
  const [isSyncing, setIsSyncing] = useState(false);
  // Auto-enable sync for authenticated users so every consumer stays in step.
  const [syncEnabled, setSyncEnabled] = useLocalStorage<boolean>("habits_sync_enabled", true);

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

        // Merge with local data — remote days take precedence for keys they cover
        setHabitsState(prevState => ({
          ...prevState,
          days: { ...prevState.days, ...days },
          goals: { ...prevState.goals, ...goals }
        }));

        // If cloud is empty but we have local data, push it up so other
        // consumers (HeaderStreakStrip / HabitStreakSummary) see it.
        const localDayKeys = Object.keys(habitsState.days || {});
        if ((dayData?.length ?? 0) === 0 && localDayKeys.length > 0) {
          for (const iso of localDayKeys) {
            await supabase.from('habit_days').upsert({
              user_id: user.id,
              date: iso,
              habit_data: habitsState.days[iso] as any,
            }, { onConflict: 'user_id,date' });
          }
        }

        queryClient.invalidateQueries({ queryKey: ["habit_days"] });
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

  // Update a habit for a specific day — race-safe via functional setState
  const updateDay = async (date: Date, type: HabitType, data: HabitData) => {
    try {
      const dateISO = formatDateISO(date);
      let mergedDay: DayData = createEmptyDayData(date);

      setHabitsState(prev => {
        const existing = prev.days[dateISO]
          ? { ...prev.days[dateISO] }
          : createEmptyDayData(date);
        mergedDay = { ...existing, [type]: data };
        return {
          ...prev,
          days: { ...prev.days, [dateISO]: mergedDay },
        };
      });

      // Sync to Supabase if enabled — uses the merged snapshot so
      // parallel updateDay calls don't clobber each other's fields.
      if (user && syncEnabled) {
        try {
          const { error } = await supabase
            .from('habit_days')
            .upsert({
              user_id: user.id,
              date: dateISO,
              habit_data: mergedDay as any
            }, {
              onConflict: 'user_id,date'
            });

          if (error) {
            console.error('Error syncing to Supabase:', error);
            toast.error('Failed to sync to cloud', { duration: 1500, id: 'sync-error' });
          } else {
            // Broadcast to any react-query consumer reading habit_days
            queryClient.invalidateQueries({ queryKey: ["habit_days"] });
          }
        } catch (syncError) {
          console.error('Error in Supabase sync:', syncError);
        }
      }

      // Always broadcast locally too, so query consumers with cached rows re-run
      // their selectors even when Supabase sync is off.
      queryClient.invalidateQueries({ queryKey: ["habit_days"] });

      toast.success('Progress saved!', { duration: 1500 });
    } catch (error) {
      console.error('Error updating day:', error);
      toast.error('Failed to save your progress');
    }
  };
  
  // Update a goal for a specific habit type
  const updateGoal = async (type: HabitType, goal: HabitGoal, year: number, month: number) => {
    try {
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      
      // Get current goals or default
      const currentMonthGoals = habitsState.goals[monthKey] || createDefaultMonthlyGoals()[Object.keys(createDefaultMonthlyGoals())[0]];
      
      // Create updated goals object for this month
      const updatedMonthGoals = {
        ...currentMonthGoals,
        [type]: goal
      };
      
      // Create updated goals object for the entire state
      const updatedGoals = {
        ...habitsState.goals,
        [monthKey]: updatedMonthGoals
      };
      
      // Update local state first for immediate feedback
      setHabitsState(prevState => ({
        ...prevState,
        goals: updatedGoals
      }));
      
      // Then sync to Supabase if enabled and user is authenticated
      if (user && syncEnabled) {
        try {
          const { error } = await supabase
            .from('habit_goals')
            .upsert({
              user_id: user.id,
              month_key: monthKey,
              goals_data: updatedMonthGoals as any
            }, {
              onConflict: 'user_id,month_key'
            });
            
          if (error) {
            console.error('Error syncing goal to Supabase:', error);
            toast.error('Failed to sync to cloud', { duration: 1500, id: 'sync-error' });
          }
        } catch (syncError) {
          console.error('Error in Supabase goal sync:', syncError);
        }
      }

      console.log('Goal updated successfully for', type, 'in', monthKey);
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

  // Force sync all local data to cloud (overrides cloud data)
  const forceSyncToCloud = async () => {
    if (!user || !syncEnabled) {
      toast.error('Cloud sync is not enabled');
      return;
    }

    setIsSyncing(true);
    try {
      console.log('Force syncing all local data to cloud...');
      console.log('Current habits state:', habitsState);
      
      // Sync all habit days using upsert with proper conflict resolution
      for (const [dateISO, dayData] of Object.entries(habitsState.days)) {
        const { error } = await supabase
          .from('habit_days')
          .upsert({
            user_id: user.id,
            date: dateISO,
            habit_data: dayData as any
          }, {
            onConflict: 'user_id,date'
          });
          
        if (error) {
          console.error(`Error syncing day ${dateISO}:`, error);
          throw error;
        }
      }

      // Sync all goals using upsert with proper conflict resolution
      for (const [monthKey, monthGoals] of Object.entries(habitsState.goals)) {
        console.log(`Syncing goals for ${monthKey}:`, monthGoals);
        const { error } = await supabase
          .from('habit_goals')
          .upsert({
            user_id: user.id,
            month_key: monthKey,
            goals_data: monthGoals as any
          }, {
            onConflict: 'user_id,month_key'
          });
          
        if (error) {
          console.error(`Error syncing goals for ${monthKey}:`, error);
          throw error;
        }
      }
      
      toast.success('All changes saved to cloud!', { duration: 2000 });
      console.log('Force sync completed successfully');
    } catch (error) {
      console.error('Error during force sync:', error);
      toast.error('Failed to save changes to cloud');
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    habitsState,
    updateDay,
    updateGoal,
    isSyncing,
    syncEnabled,
    toggleSync,
    forceSyncToCloud,
    isLoading: false
  };
}
