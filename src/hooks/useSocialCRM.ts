import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  SocialContact, 
  SocialExperience, 
  WeeklySocialPlan, 
  WeeklyOutreach,
  SocialEventArchive,
  DEFAULT_EXPERIENCES,
  DEFAULT_DATE_EXPERIENCES
} from '@/types/social';
import { startOfWeek, format, subWeeks, isBefore, parseISO } from 'date-fns';
import { toast } from 'sonner';

// Type helper to work with tables not yet in generated types
const fromTable = (tableName: string) => {
  return supabase.from(tableName as any);
};

export function useSocialCRM() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<SocialContact[]>([]);
  const [experiences, setExperiences] = useState<SocialExperience[]>([]);
  const [dateExperiences, setDateExperiences] = useState<SocialExperience[]>([]);
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklySocialPlan[]>([]);
  const [outreachItems, setOutreachItems] = useState<WeeklyOutreach[]>([]);
  const [archivedEvents, setArchivedEvents] = useState<SocialEventArchive[]>([]);
  const [pendingCatchupPlans, setPendingCatchupPlans] = useState<WeeklySocialPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Week starts on Sunday (weekStartsOn: 0)
  const currentWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd');
  const previousWeekStart = format(subWeeks(startOfWeek(new Date(), { weekStartsOn: 0 }), 1), 'yyyy-MM-dd');

  // Load all data
  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [contactsRes, experiencesRes, plansRes, outreachRes, archiveRes, previousPlansRes] = await Promise.all([
        fromTable('social_contacts').select('*').eq('user_id', user.id).order('name'),
        fromTable('social_experiences').select('*').eq('user_id', user.id).order('tier', { ascending: true }),
        fromTable('weekly_social_plans').select('*').eq('user_id', user.id).eq('week_start', currentWeekStart),
        fromTable('weekly_outreach').select('*').eq('user_id', user.id).eq('week_start', currentWeekStart).order('order_index'),
        fromTable('social_event_archive').select('*').eq('user_id', user.id).order('completed_at', { ascending: false }).limit(50),
        // Get previous week's plans to check for catchup
        fromTable('weekly_social_plans').select('*').eq('user_id', user.id).eq('week_start', previousWeekStart).eq('completed', false),
      ]);

      if (contactsRes.data) setContacts(contactsRes.data as unknown as SocialContact[]);
      if (experiencesRes.data) {
        const allExperiences = experiencesRes.data as unknown as SocialExperience[];
        const socialExp = allExperiences.filter(e => e.ideal_group_size !== '1' || !e.description?.toLowerCase().includes('date'));
        const dateExp = allExperiences.filter(e => e.ideal_group_size === '1' && (e.description?.toLowerCase().includes('date') || e.title.toLowerCase().includes('date') || e.title.toLowerCase().includes('dinner') || e.title.toLowerCase().includes('coffee')));
        
        if (dateExp.length === 0) {
          setExperiences(allExperiences);
          setDateExperiences([]);
        } else {
          setExperiences(socialExp);
          setDateExperiences(dateExp);
        }
      }
      if (plansRes.data) setWeeklyPlans(plansRes.data as unknown as WeeklySocialPlan[]);
      if (outreachRes.data) setOutreachItems(outreachRes.data as unknown as WeeklyOutreach[]);
      if (archiveRes.data) setArchivedEvents(archiveRes.data as unknown as SocialEventArchive[]);
      
      // Check for uncompleted plans from previous week that had activity
      if (previousPlansRes.data) {
        const plansToCheck = (previousPlansRes.data as unknown as WeeklySocialPlan[]).filter(plan => 
          plan.experience_id || (plan.guest_ids && plan.guest_ids.length > 0)
        );
        setPendingCatchupPlans(plansToCheck);
      }

      // Seed default experiences if none exist
      if (experiencesRes.data?.length === 0) {
        await seedDefaultExperiences();
      }
    } catch (error) {
      console.error('Error loading social data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, currentWeekStart, previousWeekStart]);

  // Seed default experiences
  const seedDefaultExperiences = async () => {
    if (!user) return;

    const socialExperiencesToInsert = DEFAULT_EXPERIENCES.map(exp => ({
      ...exp,
      user_id: user.id,
    }));

    const dateExperiencesToInsert = DEFAULT_DATE_EXPERIENCES.map(exp => ({
      ...exp,
      user_id: user.id,
    }));

    const [socialRes, dateRes] = await Promise.all([
      fromTable('social_experiences').insert(socialExperiencesToInsert).select(),
      fromTable('social_experiences').insert(dateExperiencesToInsert).select(),
    ]);

    if (socialRes.data) {
      setExperiences(socialRes.data as unknown as SocialExperience[]);
    }
    if (dateRes.data) {
      setDateExperiences(dateRes.data as unknown as SocialExperience[]);
    }
    
    toast.success('Default experiences added!');
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
  const addExperience = async (experience: Omit<SocialExperience, 'id' | 'user_id' | 'created_at' | 'updated_at'>, isDateExperience: boolean = false) => {
    if (!user) return;

    const { data, error } = await fromTable('social_experiences')
      .insert({ ...experience, user_id: user.id })
      .select()
      .single();

    if (error) {
      toast.error('Failed to add experience');
      console.error(error);
    } else if (data) {
      if (isDateExperience) {
        setDateExperiences(prev => [...prev, data as unknown as SocialExperience]);
      } else {
        setExperiences(prev => [...prev, data as unknown as SocialExperience]);
      }
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
      setDateExperiences(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
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
      setDateExperiences(prev => prev.filter(e => e.id !== id));
      toast.success('Experience deleted!');
    }
  };

  // Weekly Outreach (new system)
  const addToOutreach = async (contactId: string) => {
    if (!user) return;
    
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

  const confirmForEvent = async (outreachId: string, slotType: 'mid_week' | 'weekend' | 'date') => {
    const { error } = await fromTable('weekly_outreach')
      .update({ confirmed_for: slotType, updated_at: new Date().toISOString() })
      .eq('id', outreachId);

    if (error) {
      toast.error('Failed to confirm');
    } else {
      setOutreachItems(prev => prev.map(i => 
        i.id === outreachId ? { ...i, confirmed_for: slotType } : i
      ));
      const label = slotType === 'mid_week' ? 'Mid-Week' : slotType === 'weekend' ? 'Weekend' : 'Date';
      toast.success(`Confirmed for ${label}!`);
    }
  };

  const removeGuestFromEvent = async (slotType: 'mid_week' | 'weekend' | 'date', contactId: string) => {
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
  const selectEventExperience = async (slotType: 'mid_week' | 'weekend' | 'date', experienceId: string | null) => {
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
      const dayOfWeek = slotType === 'mid_week' ? 3 : slotType === 'weekend' ? 6 : 5;
      const { data, error } = await fromTable('weekly_social_plans')
        .insert({
          user_id: user.id,
          week_start: currentWeekStart,
          day_of_week: dayOfWeek,
          slot_type: slotType,
          experience_id: experienceId,
          guest_ids: [],
          completed: false,
        })
        .select()
        .single();

      if (!error && data) {
        setWeeklyPlans(prev => [...prev, data as unknown as WeeklySocialPlan]);
      }
    }
  };

  const clearEventSlot = async (slotType: 'mid_week' | 'weekend' | 'date') => {
    await selectEventExperience(slotType, null);
    
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

  // Mark event as complete and archive it
  const markEventComplete = async (planId: string, notes?: string) => {
    if (!user) return;

    const plan = weeklyPlans.find(p => p.id === planId) || pendingCatchupPlans.find(p => p.id === planId);
    if (!plan) return;

    const allExperiences = [...experiences, ...dateExperiences];
    const experience = plan.experience_id ? allExperiences.find(e => e.id === plan.experience_id) : null;
    
    // Get guest names from confirmed outreach
    const guestItems = outreachItems.filter(i => i.confirmed_for === plan.slot_type);
    const guestNames = guestItems
      .map(i => contacts.find(c => c.id === i.contact_id)?.name)
      .filter(Boolean) as string[];

    // Create archive entry
    const archiveEntry = {
      user_id: user.id,
      week_start: plan.week_start,
      slot_type: plan.slot_type || 'event',
      experience_title: experience?.title || null,
      experience_location: experience?.location || null,
      experience_cost: experience ? experience.estimated_cost * Math.max(1, guestNames.length) : 0,
      guest_names: guestNames,
      guest_count: guestNames.length,
      notes: notes || null,
    };

    const { data: archiveData, error: archiveError } = await fromTable('social_event_archive')
      .insert(archiveEntry)
      .select()
      .single();

    if (archiveError) {
      toast.error('Failed to archive event');
      console.error(archiveError);
      return;
    }

    // Mark plan as complete
    const { error: updateError } = await fromTable('weekly_social_plans')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('id', planId);

    if (updateError) {
      toast.error('Failed to mark complete');
      console.error(updateError);
      return;
    }

    // Update local state
    if (archiveData) {
      setArchivedEvents(prev => [archiveData as unknown as SocialEventArchive, ...prev]);
    }
    setWeeklyPlans(prev => prev.map(p => 
      p.id === planId ? { ...p, completed: true, completed_at: new Date().toISOString() } : p
    ));
    setPendingCatchupPlans(prev => prev.filter(p => p.id !== planId));
    
    toast.success('Event archived! 🎉');
  };

  // Dismiss a pending catchup without marking complete
  const dismissCatchup = async (planId: string) => {
    // Just mark it as completed without archiving (it didn't happen)
    await fromTable('weekly_social_plans')
      .update({ completed: true })
      .eq('id', planId);
    
    setPendingCatchupPlans(prev => prev.filter(p => p.id !== planId));
  };

  const dismissAllCatchups = async () => {
    for (const plan of pendingCatchupPlans) {
      await fromTable('weekly_social_plans')
        .update({ completed: true })
        .eq('id', plan.id);
    }
    setPendingCatchupPlans([]);
  };

  // Get event slot data
  const getMidWeekExperienceId = () => {
    return weeklyPlans.find(p => p.slot_type === 'mid_week')?.experience_id || null;
  };

  const getWeekendExperienceId = () => {
    return weeklyPlans.find(p => p.slot_type === 'weekend')?.experience_id || null;
  };

  const getDateExperienceId = () => {
    return weeklyPlans.find(p => p.slot_type === 'date')?.experience_id || null;
  };

  const getMidWeekPlan = () => weeklyPlans.find(p => p.slot_type === 'mid_week');
  const getWeekendPlan = () => weeklyPlans.find(p => p.slot_type === 'weekend');
  const getDatePlan = () => weeklyPlans.find(p => p.slot_type === 'date');

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

  const getDateGuests = () => {
    return outreachItems
      .filter(i => i.confirmed_for === 'date' && i.contact_id)
      .map(i => contacts.find(c => c.id === i.contact_id))
      .filter(Boolean) as SocialContact[];
  };

  return {
    contacts,
    experiences,
    dateExperiences,
    weeklyPlans,
    outreachItems,
    archivedEvents,
    pendingCatchupPlans,
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
    markEventComplete,
    getMidWeekExperienceId,
    getWeekendExperienceId,
    getDateExperienceId,
    getMidWeekPlan,
    getWeekendPlan,
    getDatePlan,
    getMidWeekGuests,
    getWeekendGuests,
    getDateGuests,
    // Catchup operations
    dismissCatchup,
    dismissAllCatchups,
    // Refresh
    refresh: loadData,
  };
}
