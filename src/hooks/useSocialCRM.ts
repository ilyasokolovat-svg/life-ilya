import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  SocialContact, 
  SocialExperience, 
  WeeklySocialPlan, 
  SundayOutreachTask,
  DEFAULT_EXPERIENCES 
} from '@/types/social';
import { startOfWeek, format } from 'date-fns';
import { toast } from 'sonner';

// Type helper to work with tables not yet in generated types
const fromTable = (tableName: string) => {
  return supabase.from(tableName as any);
};

export function useSocialCRM() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<SocialContact[]>([]);
  const [experiences, setExperiences] = useState<SocialExperience[]>([]);
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklySocialPlan[]>([]);
  const [outreachTasks, setOutreachTasks] = useState<SundayOutreachTask[]>([]);
  const [loading, setLoading] = useState(true);

  const currentWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  // Load all data
  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [contactsRes, experiencesRes, plansRes, tasksRes] = await Promise.all([
        fromTable('social_contacts').select('*').eq('user_id', user.id).order('name'),
        fromTable('social_experiences').select('*').eq('user_id', user.id).order('tier', { ascending: true }),
        fromTable('weekly_social_plans').select('*').eq('user_id', user.id).eq('week_start', currentWeekStart),
        fromTable('sunday_outreach_tasks').select('*').eq('user_id', user.id).eq('week_start', currentWeekStart),
      ]);

      if (contactsRes.data) setContacts(contactsRes.data as unknown as SocialContact[]);
      if (experiencesRes.data) setExperiences(experiencesRes.data as unknown as SocialExperience[]);
      if (plansRes.data) setWeeklyPlans(plansRes.data as unknown as WeeklySocialPlan[]);
      if (tasksRes.data) setOutreachTasks(tasksRes.data as unknown as SundayOutreachTask[]);

      // Seed default experiences if none exist
      if (experiencesRes.data?.length === 0) {
        await seedDefaultExperiences();
      }
    } catch (error) {
      console.error('Error loading social data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, currentWeekStart]);

  // Seed default experiences
  const seedDefaultExperiences = async () => {
    if (!user) return;

    const experiencesToInsert = DEFAULT_EXPERIENCES.map(exp => ({
      ...exp,
      user_id: user.id,
    }));

    const { data, error } = await fromTable('social_experiences')
      .insert(experiencesToInsert)
      .select();

    if (error) {
      console.error('Error seeding experiences:', error);
    } else if (data) {
      setExperiences(data as unknown as SocialExperience[]);
      toast.success('Default experiences added!');
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Contact CRUD
  const addContact = async (contact: Omit<SocialContact, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    const { data, error } = await fromTable('social_contacts')
      .insert({ ...contact, user_id: user.id })
      .select()
      .single();

    if (error) {
      toast.error('Failed to add contact');
      console.error(error);
    } else if (data) {
      setContacts(prev => [...prev, data as unknown as SocialContact].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success('Contact added!');
    }
  };

  const updateContact = async (id: string, updates: Partial<SocialContact>) => {
    const { error } = await fromTable('social_contacts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update contact');
      console.error(error);
    } else {
      setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
      toast.success('Contact updated!');
    }
  };

  const deleteContact = async (id: string) => {
    const { error } = await fromTable('social_contacts').delete().eq('id', id);

    if (error) {
      toast.error('Failed to delete contact');
      console.error(error);
    } else {
      setContacts(prev => prev.filter(c => c.id !== id));
      toast.success('Contact deleted!');
    }
  };

  // Experience CRUD
  const addExperience = async (experience: Omit<SocialExperience, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    const { data, error } = await fromTable('social_experiences')
      .insert({ ...experience, user_id: user.id })
      .select()
      .single();

    if (error) {
      toast.error('Failed to add experience');
      console.error(error);
    } else if (data) {
      setExperiences(prev => [...prev, data as unknown as SocialExperience]);
      toast.success('Experience added!');
    }
  };

  const updateExperience = async (id: string, updates: Partial<SocialExperience>) => {
    const { error } = await fromTable('social_experiences')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update experience');
      console.error(error);
    } else {
      setExperiences(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    }
  };

  const deleteExperience = async (id: string) => {
    const { error } = await fromTable('social_experiences').delete().eq('id', id);

    if (error) {
      toast.error('Failed to delete experience');
      console.error(error);
    } else {
      setExperiences(prev => prev.filter(e => e.id !== id));
      toast.success('Experience deleted!');
    }
  };

  // Weekly Plan CRUD
  const addOrUpdateWeeklyPlan = async (dayOfWeek: number, experienceId: string | null, guestIds: string[], customTitle?: string) => {
    if (!user) return;

    const existing = weeklyPlans.find(p => p.day_of_week === dayOfWeek);

    if (existing) {
      const { error } = await fromTable('weekly_social_plans')
        .update({ 
          experience_id: experienceId, 
          guest_ids: guestIds,
          custom_title: customTitle || null,
          updated_at: new Date().toISOString() 
        })
        .eq('id', existing.id);

      if (error) {
        toast.error('Failed to update plan');
      } else {
        setWeeklyPlans(prev => prev.map(p => 
          p.id === existing.id ? { ...p, experience_id: experienceId, guest_ids: guestIds, custom_title: customTitle || null } : p
        ));
      }
    } else {
      const { data, error } = await fromTable('weekly_social_plans')
        .insert({
          user_id: user.id,
          week_start: currentWeekStart,
          day_of_week: dayOfWeek,
          experience_id: experienceId,
          guest_ids: guestIds,
          custom_title: customTitle || null,
        })
        .select()
        .single();

      if (error) {
        toast.error('Failed to create plan');
      } else if (data) {
        setWeeklyPlans(prev => [...prev, data as unknown as WeeklySocialPlan]);
      }
    }
  };

  const removeWeeklyPlan = async (dayOfWeek: number) => {
    const existing = weeklyPlans.find(p => p.day_of_week === dayOfWeek);
    if (!existing) return;

    const { error } = await fromTable('weekly_social_plans').delete().eq('id', existing.id);

    if (error) {
      toast.error('Failed to remove plan');
    } else {
      setWeeklyPlans(prev => prev.filter(p => p.id !== existing.id));
    }
  };

  // Outreach Tasks
  const generateOutreachTasks = async () => {
    if (!user) return;

    // Delete existing tasks for this week
    await fromTable('sunday_outreach_tasks').delete().eq('user_id', user.id).eq('week_start', currentWeekStart);

    const innerCircle = contacts.filter(c => c.status === 'Inner Circle').slice(0, 5);
    const leads = contacts.filter(c => c.status === 'Lead').slice(0, 5);
    const romantic = contacts.filter(c => c.circle === 'Romantic').slice(0, 5);

    const tasks: any[] = [
      ...innerCircle.map(c => ({ user_id: user.id, week_start: currentWeekStart, contact_id: c.id, outreach_type: 'Inner Circle', completed: false })),
      ...leads.map(c => ({ user_id: user.id, week_start: currentWeekStart, contact_id: c.id, outreach_type: 'New Leads', completed: false })),
      ...romantic.map(c => ({ user_id: user.id, week_start: currentWeekStart, contact_id: c.id, outreach_type: 'Romantic', completed: false })),
    ];

    // Pad with empty tasks if needed
    const innerCircleCount = innerCircle.length;
    const leadsCount = leads.length;
    const romanticCount = romantic.length;

    for (let i = innerCircleCount; i < 5; i++) {
      tasks.push({ user_id: user.id, week_start: currentWeekStart, contact_id: null, outreach_type: 'Inner Circle', completed: false });
    }
    for (let i = leadsCount; i < 5; i++) {
      tasks.push({ user_id: user.id, week_start: currentWeekStart, contact_id: null, outreach_type: 'New Leads', completed: false });
    }
    for (let i = romanticCount; i < 5; i++) {
      tasks.push({ user_id: user.id, week_start: currentWeekStart, contact_id: null, outreach_type: 'Romantic', completed: false });
    }

    const { data, error } = await fromTable('sunday_outreach_tasks')
      .insert(tasks)
      .select();

    if (error) {
      toast.error('Failed to generate tasks');
      console.error(error);
    } else if (data) {
      setOutreachTasks(data as unknown as SundayOutreachTask[]);
      toast.success('Outreach tasks generated!');
    }
  };

  const toggleOutreachTask = async (id: string, completed: boolean) => {
    const { error } = await fromTable('sunday_outreach_tasks')
      .update({ completed, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update task');
    } else {
      setOutreachTasks(prev => prev.map(t => t.id === id ? { ...t, completed } : t));
    }
  };

  return {
    contacts,
    experiences,
    weeklyPlans,
    outreachTasks,
    loading,
    currentWeekStart,
    // Contact operations
    addContact,
    updateContact,
    deleteContact,
    // Experience operations
    addExperience,
    updateExperience,
    deleteExperience,
    // Weekly plan operations
    addOrUpdateWeeklyPlan,
    removeWeeklyPlan,
    // Outreach operations
    generateOutreachTasks,
    toggleOutreachTask,
    // Refresh
    refresh: loadData,
  };
}
