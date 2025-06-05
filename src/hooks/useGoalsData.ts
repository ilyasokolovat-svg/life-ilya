
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

  // Save goal mutation with better upsert logic
  const saveGoalMutation = useMutation({
    mutationFn: async (goalData: GoalData) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // First, try to find existing record
      const { data: existingData } = await supabase
        .from('goals_data')
        .select('id')
        .eq('user_id', user.id)
        .eq('category', goalData.category)
        .eq('subcategory', goalData.subcategory)
        .eq('period_key', goalData.period_key)
        .single();

      let result;
      if (existingData) {
        // Update existing record
        const { data, error } = await supabase
          .from('goals_data')
          .update({
            planned_goal: goalData.planned_goal,
            actual_result: goalData.actual_result,
            period_type: goalData.period_type,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingData.id)
          .select();
          
        if (error) throw error;
        result = data;
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from('goals_data')
          .insert({
            ...goalData,
            user_id: user.id,
            updated_at: new Date().toISOString(),
          })
          .select();
          
        if (error) throw error;
        result = data;
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals_data', category, user?.id] });
      toast.success('Goal saved successfully!');
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
