import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  SocialContact, 
  SocialExperience, 
  WeeklySocialPlan, 
  WeeklyOutreach,
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
  const [outreachItems, setOutreachItems] = useState<WeeklyOutreach[]>([]);
  const [loading, setLoading] = useState(true);

  const currentWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  // Load all data
  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [contactsRes, experiencesRes, plansRes, outreachRes] = await Promise.all([
        fromTable('social_contacts').select('*').eq('user_id', user.id).order('name'),
        fromTable('social_experiences').select('*').eq('user_id', user.id).order('tier', { ascending: true }),
        fromTable('weekly_social_plans').select('*').eq('user_id', user.id).eq('week_start', currentWeekStart),
        fromTable('weekly_outreach').select('*').eq('user_id', user.id).eq('week_start', currentWeekStart).order('order_index'),
      ]);

      if (contactsRes.data) setContacts(contactsRes.data as unknown as SocialContact[]);
      if (experiencesRes.data) setExperiences(experiencesRes.data as unknown as SocialExperience[]);
      if (plansRes.data) setWeeklyPlans(plansRes.data as unknown as WeeklySocialPlan[]);
      if (outreachRes.data) setOutreachItems(outreachRes.data as unknown as WeeklyOutreach[]);

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
      toast.success('Experience updated!');
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

  // Weekly Outreach (new system)
  const addToOutreach = async (contactId: string) => {
    if (!user) return;
    
    // Check if already in outreach
    if (outreachItems.some(i => i.contact_id === contactId)) {
      toast.info('Already in this week\'s outreach');
      return;
    }

    const orderIndex = outreachItems.length;

    const { data, error } = await fromTable('weekly_outreach')
      .insert({
        user_id: user.id,
        week_start: currentWeekStart,
        contact_id: contactId,
        contacted: false,
        confirmed_for: null,
        order_index: orderIndex,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to add to outreach');
      console.error(error);
    } else if (data) {
      setOutreachItems(prev => [...prev, data as unknown as WeeklyOutreach]);
      toast.success('Added to outreach!');
    }
  };

  const removeFromOutreach = async (outreachId: string) => {
    const { error } = await fromTable('weekly_outreach').delete().eq('id', outreachId);

    if (error) {
      toast.error('Failed to remove from outreach');
    } else {
      setOutreachItems(prev => prev.filter(i => i.id !== outreachId));
    }
  };

  const toggleOutreachContacted = async (outreachId: string, contacted: boolean) => {
    const { error } = await fromTable('weekly_outreach')
      .update({ contacted, updated_at: new Date().toISOString() })
      .eq('id', outreachId);

    if (error) {
      toast.error('Failed to update');
    } else {
      setOutreachItems(prev => prev.map(i => 
        i.id === outreachId ? { ...i, contacted } : i
      ));

      // Update last_contacted on the contact
      if (contacted) {
        const outreachItem = outreachItems.find(i => i.id === outreachId);
        if (outreachItem?.contact_id) {
          await fromTable('social_contacts')
            .update({ last_contacted: new Date().toISOString().split('T')[0] })
            .eq('id', outreachItem.contact_id);
          
          setContacts(prev => prev.map(c => 
            c.id === outreachItem.contact_id 
              ? { ...c, last_contacted: new Date().toISOString().split('T')[0] }
              : c
          ));
        }
      }
    }
  };

  const confirmForEvent = async (outreachId: string, slotType: 'mid_week' | 'weekend') => {
    const { error } = await fromTable('weekly_outreach')
      .update({ confirmed_for: slotType, updated_at: new Date().toISOString() })
      .eq('id', outreachId);

    if (error) {
      toast.error('Failed to confirm');
    } else {
      setOutreachItems(prev => prev.map(i => 
        i.id === outreachId ? { ...i, confirmed_for: slotType } : i
      ));
      toast.success(`Confirmed for ${slotType === 'mid_week' ? 'Mid-Week' : 'Weekend'}!`);
    }
  };

  const removeGuestFromEvent = async (slotType: 'mid_week' | 'weekend', contactId: string) => {
    const outreachItem = outreachItems.find(i => i.contact_id === contactId && i.confirmed_for === slotType);
    if (!outreachItem) return;

    const { error } = await fromTable('weekly_outreach')
      .update({ confirmed_for: null, updated_at: new Date().toISOString() })
      .eq('id', outreachItem.id);

    if (error) {
      toast.error('Failed to remove guest');
    } else {
      setOutreachItems(prev => prev.map(i => 
        i.id === outreachItem.id ? { ...i, confirmed_for: null } : i
      ));
    }
  };

  // Event Slot Plans
  const selectEventExperience = async (slotType: 'mid_week' | 'weekend', experienceId: string | null) => {
    if (!user) return;

    const existing = weeklyPlans.find(p => p.slot_type === slotType);

    if (existing) {
      const { error } = await fromTable('weekly_social_plans')
        .update({ experience_id: experienceId, updated_at: new Date().toISOString() })
        .eq('id', existing.id);

      if (!error) {
        setWeeklyPlans(prev => prev.map(p => 
          p.id === existing.id ? { ...p, experience_id: experienceId } : p
        ));
      }
    } else {
      const { data, error } = await fromTable('weekly_social_plans')
        .insert({
          user_id: user.id,
          week_start: currentWeekStart,
          day_of_week: slotType === 'mid_week' ? 3 : 6, // Wed or Sat
          slot_type: slotType,
          experience_id: experienceId,
          guest_ids: [],
        })
        .select()
        .single();

      if (!error && data) {
        setWeeklyPlans(prev => [...prev, data as unknown as WeeklySocialPlan]);
      }
    }
  };

  const clearEventSlot = async (slotType: 'mid_week' | 'weekend') => {
    // Clear the experience selection
    await selectEventExperience(slotType, null);
    
    // Unconfirm all guests from this slot
    const guestsToUnconfirm = outreachItems.filter(i => i.confirmed_for === slotType);
    for (const guest of guestsToUnconfirm) {
      await fromTable('weekly_outreach')
        .update({ confirmed_for: null })
        .eq('id', guest.id);
    }
    
    setOutreachItems(prev => prev.map(i => 
      i.confirmed_for === slotType ? { ...i, confirmed_for: null } : i
    ));
  };

  // Get event slot data
  const getMidWeekExperienceId = () => {
    return weeklyPlans.find(p => p.slot_type === 'mid_week')?.experience_id || null;
  };

  const getWeekendExperienceId = () => {
    return weeklyPlans.find(p => p.slot_type === 'weekend')?.experience_id || null;
  };

  const getMidWeekGuests = () => {
    return outreachItems
      .filter(i => i.confirmed_for === 'mid_week' && i.contact_id)
      .map(i => contacts.find(c => c.id === i.contact_id))
      .filter(Boolean) as SocialContact[];
  };

  const getWeekendGuests = () => {
    return outreachItems
      .filter(i => i.confirmed_for === 'weekend' && i.contact_id)
      .map(i => contacts.find(c => c.id === i.contact_id))
      .filter(Boolean) as SocialContact[];
  };

  return {
    contacts,
    experiences,
    weeklyPlans,
    outreachItems,
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
    // Outreach operations
    addToOutreach,
    removeFromOutreach,
    toggleOutreachContacted,
    confirmForEvent,
    removeGuestFromEvent,
    // Event slot operations
    selectEventExperience,
    clearEventSlot,
    getMidWeekExperienceId,
    getWeekendExperienceId,
    getMidWeekGuests,
    getWeekendGuests,
    // Refresh
    refresh: loadData,
  };
}
