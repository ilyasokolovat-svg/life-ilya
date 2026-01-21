import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, startOfDay, endOfDay } from 'date-fns';

export interface FocusBlock {
  id: string;
  user_id: string;
  goal: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  completed: boolean;
  created_at: string;
}

export function useFocusBlocks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = new Date();

  // Fetch today's focus blocks
  const { data: todayBlocks = [], isLoading } = useQuery({
    queryKey: ['focus_blocks', user?.id, format(today, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('focus_blocks')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startOfDay(today).toISOString())
        .lte('created_at', endOfDay(today).toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as FocusBlock[];
    },
    enabled: !!user?.id,
  });

  // Start a new focus block
  const startBlockMutation = useMutation({
    mutationFn: async (goal: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('focus_blocks')
        .insert({
          user_id: user.id,
          goal,
          started_at: new Date().toISOString(),
          completed: false
        })
        .select()
        .single();

      if (error) throw error;
      return data as FocusBlock;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus_blocks'] });
    }
  });

  // Complete a focus block
  const completeBlockMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const endedAt = new Date();
      const block = todayBlocks.find(b => b.id === id);
      const startedAt = block ? new Date(block.started_at) : endedAt;
      const durationMinutes = Math.round((endedAt.getTime() - startedAt.getTime()) / 60000);

      const { error } = await supabase
        .from('focus_blocks')
        .update({
          ended_at: endedAt.toISOString(),
          duration_minutes: durationMinutes,
          completed
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus_blocks'] });
    }
  });

  // Calculate stats
  const completedBlocks = todayBlocks.filter(b => b.completed);
  const totalFocusMinutes = completedBlocks.reduce((acc, b) => acc + (b.duration_minutes || 0), 0);

  return {
    todayBlocks,
    isLoading,
    startBlock: startBlockMutation.mutateAsync,
    completeBlock: completeBlockMutation.mutate,
    isStarting: startBlockMutation.isPending,
    completedCount: completedBlocks.length,
    totalFocusMinutes
  };
}
