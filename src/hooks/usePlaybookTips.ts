import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type PlaybookSection = 'timeline' | 'alchemy' | 'scripts';

export interface PlaybookTip {
  id: string;
  user_id: string;
  section: PlaybookSection;
  title: string;
  content: Record<string, any>;
  order_index: number;
  created_at: string;
  updated_at: string;
}

// Default tips to seed for new users
const DEFAULT_TIPS: Omit<PlaybookTip, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] = [
  // Timeline tips
  {
    section: 'timeline',
    title: 'The Elevated Closer',
    content: {
      timing: 'Sunday / Monday',
      examples: 'Saturday Dinners, House Parties',
      notice: '5-6 days\' notice',
      color: 'amber'
    },
    order_index: 0
  },
  {
    section: 'timeline',
    title: 'The Active Connector',
    content: {
      timing: 'Tuesday / Wednesday',
      examples: 'Padel, Golf, Gym Sessions',
      notice: '2-3 days\' notice',
      color: 'emerald'
    },
    order_index: 1
  },
  {
    section: 'timeline',
    title: 'The Low-Stakes Lead',
    content: {
      timing: '1 Day Before',
      examples: 'Coffee, Walks, Sunset Sessions',
      notice: 'Keep it spontaneous',
      color: 'blue'
    },
    order_index: 2
  },
  // Alchemy tips
  {
    section: 'alchemy',
    title: 'The 4-2-2 Rule',
    content: {
      type: 'rule',
      items: [
        { number: '4', label: 'Core Friends', desc: 'Reliability' },
        { number: '2', label: 'New Flavors', desc: 'Different circles' },
        { number: '2', label: 'Wildcards', desc: 'High-status / Romantic' }
      ]
    },
    order_index: 0
  },
  {
    section: 'alchemy',
    title: 'The Producer Mindset',
    content: {
      type: 'mindset',
      text: 'Never just invite people — curate them.',
      quote: 'I\'m bringing together a few people who are doing [X].'
    },
    order_index: 1
  },
  {
    section: 'alchemy',
    title: 'The Seat Swap',
    content: {
      type: 'tip',
      text: 'During dinners, move seats before dessert to keep the energy fresh and talk to everyone.'
    },
    order_index: 2
  },
  // Script tips
  {
    section: 'scripts',
    title: 'For the High-Value Acquaintance',
    content: {
      script: 'I\'m putting together a small dinner on Saturday with a few high-energy people from [YP/Cape Town]. Would love to have you in the mix.',
      color: 'amber'
    },
    order_index: 0
  },
  {
    section: 'scripts',
    title: 'For the Romantic Lead',
    content: {
      script: 'I\'m heading to [Venue] with a few friends on Saturday. You should join us for a bit.',
      color: 'pink'
    },
    order_index: 1
  },
  {
    section: 'scripts',
    title: 'The Detox Frame',
    content: {
      script: 'I\'m on a health kick/sober stint right now—looking forward to actually remembering our conversations for once!',
      color: 'emerald'
    },
    order_index: 2
  }
];

// Helper for untyped table access
const fromTable = (tableName: string) => {
  return supabase.from(tableName as any);
};

export function usePlaybookTips() {
  const { user } = useAuth();
  const [tips, setTips] = useState<PlaybookTip[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTips = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await fromTable('playbook_tips')
        .select('*')
        .eq('user_id', user.id)
        .order('section')
        .order('order_index');

      if (error) throw error;

      if (data && data.length > 0) {
        setTips(data as unknown as PlaybookTip[]);
      } else {
        // Seed default tips for new users
        await seedDefaultTips();
      }
    } catch (error) {
      console.error('Error loading playbook tips:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const seedDefaultTips = async () => {
    if (!user) return;

    const tipsToInsert = DEFAULT_TIPS.map(tip => ({
      ...tip,
      user_id: user.id
    }));

    const { data, error } = await fromTable('playbook_tips')
      .insert(tipsToInsert)
      .select();

    if (error) {
      console.error('Error seeding default tips:', error);
    } else if (data) {
      setTips(data as unknown as PlaybookTip[]);
      toast.success('Playbook initialized with default tips!');
    }
  };

  useEffect(() => {
    loadTips();
  }, [loadTips]);

  const addTip = async (tip: Omit<PlaybookTip, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    const { data, error } = await fromTable('playbook_tips')
      .insert({ ...tip, user_id: user.id })
      .select()
      .single();

    if (error) {
      toast.error('Failed to add tip');
      console.error(error);
    } else if (data) {
      setTips(prev => [...prev, data as unknown as PlaybookTip]);
      toast.success('Tip added!');
    }
  };

  const updateTip = async (id: string, updates: Partial<PlaybookTip>) => {
    const { error } = await fromTable('playbook_tips')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update tip');
      console.error(error);
    } else {
      setTips(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      toast.success('Tip updated!');
    }
  };

  const deleteTip = async (id: string) => {
    const { error } = await fromTable('playbook_tips').delete().eq('id', id);

    if (error) {
      toast.error('Failed to delete tip');
      console.error(error);
    } else {
      setTips(prev => prev.filter(t => t.id !== id));
      toast.success('Tip deleted!');
    }
  };

  const getTipsBySection = (section: PlaybookSection) => {
    return tips.filter(t => t.section === section).sort((a, b) => a.order_index - b.order_index);
  };

  return {
    tips,
    loading,
    addTip,
    updateTip,
    deleteTip,
    getTipsBySection,
    refresh: loadTips
  };
}