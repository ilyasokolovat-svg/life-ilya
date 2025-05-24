
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

export interface WeeklyData {
  id?: string;
  category: string;
  subcategory: string;
  month_key: string;
  week_index: number;
  plan_text?: string;
  fact_text?: string;
}

export interface MonthlyReview {
  id?: string;
  category: string;
  subcategory: string;
  month_key: string;
  review_text?: string;
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

  // Fetch weekly tracking data
  const { data: weeklyData = [], isLoading: isLoadingWeekly } = useQuery({
    queryKey: ['weekly_tracking', category, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('weekly_tracking')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', category);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch monthly reviews
  const { data: monthlyReviews = [], isLoading: isLoadingReviews } = useQuery({
    queryKey: ['monthly_reviews', category, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('monthly_reviews')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', category);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Save goal mutation
  const saveGoalMutation = useMutation({
    mutationFn: async (goalData: GoalData) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('goals_data')
        .upsert({
          ...goalData,
          user_id: user.id,
          updated_at: new Date().toISOString(),
        });
        
      if (error) throw error;
      return data;
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

  // Save weekly data mutation
  const saveWeeklyMutation = useMutation({
    mutationFn: async (weeklyData: WeeklyData) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('weekly_tracking')
        .upsert({
          ...weeklyData,
          user_id: user.id,
          updated_at: new Date().toISOString(),
        });
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly_tracking', category, user?.id] });
      toast.success('Weekly data saved!');
    },
    onError: (error) => {
      console.error('Error saving weekly data:', error);
      toast.error('Failed to save weekly data');
    },
  });

  // Save monthly review mutation
  const saveMonthlyReviewMutation = useMutation({
    mutationFn: async (reviewData: MonthlyReview) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('monthly_reviews')
        .upsert({
          ...reviewData,
          user_id: user.id,
          updated_at: new Date().toISOString(),
        });
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly_reviews', category, user?.id] });
      toast.success('Monthly review saved!');
    },
    onError: (error) => {
      console.error('Error saving monthly review:', error);
      toast.error('Failed to save monthly review');
    },
  });

  return {
    goalsData,
    weeklyData,
    monthlyReviews,
    isLoading: isLoadingGoals || isLoadingWeekly || isLoadingReviews,
    saveGoal: saveGoalMutation.mutate,
    saveWeeklyData: saveWeeklyMutation.mutate,
    saveMonthlyReview: saveMonthlyReviewMutation.mutate,
    isSaving: saveGoalMutation.isPending || saveWeeklyMutation.isPending || saveMonthlyReviewMutation.isPending,
  };
}
