
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface GoalData {
  id?: string;
  category: string;
  subcategory: string;
  period_key: string;
  period_type: string;
  planned_goal?: string;
  actual_result?: string;
}

export function useGoalsData(category: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch goals data
  const { data: goalsData = [], isLoading: isLoadingGoals } = useQuery({
    queryKey: ['goals_data', category, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('goals_data')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', category);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Save goal mutation - Fixed to properly handle upserts
  const saveGoalMutation = useMutation({
    mutationFn: async (goalData: GoalData) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Use upsert with proper conflict resolution
      const { data, error } = await supabase
        .from('goals_data')
        .upsert({
          ...goalData,
          user_id: user.id,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,category,subcategory,period_key',
          ignoreDuplicates: false
        })
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals_data', category, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['weekly_summary'] });
    },
    onError: (error) => {
      console.error('Error saving goal:', error);
      toast.error('Failed to save goal');
    },
  });

  return {
    goalsData,
    isLoading: isLoadingGoals,
    saveGoal: saveGoalMutation.mutate,
    isSaving: saveGoalMutation.isPending,
  };
}
