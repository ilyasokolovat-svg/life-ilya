
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useLastUpdateDate(category: string, subcategory: string) {
  const { user } = useAuth();

  const { data: lastUpdateDate } = useQuery({
    queryKey: ['last_update_date', user?.id, category, subcategory],
    queryFn: async (): Promise<Date | null> => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('goals_data')
        .select('updated_at')
        .eq('user_id', user.id)
        .eq('category', category)
        .eq('subcategory', subcategory)
        .order('updated_at', { ascending: false })
        .limit(1);
        
      if (error) throw error;
      
      return data && data.length > 0 ? new Date(data[0].updated_at) : null;
    },
    enabled: !!user?.id,
  });

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return {
    lastUpdateDate,
    formattedDate: formatDate(lastUpdateDate)
  };
}
