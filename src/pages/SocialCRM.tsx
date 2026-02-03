import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSocialCRM } from '@/hooks/useSocialCRM';
import useLocalStorage from '@/hooks/useLocalStorage';
import { DEFAULT_CLOSENESS_TAGS, SocialContact, WeeklySocialPlan, EventCompletionData } from '@/types/social';
import QuickAddBar from '@/components/social/QuickAddBar';
import PeopleDatabase from '@/components/social/PeopleDatabase';
import EventSlots from '@/components/social/EventSlots';
import WeeklyOutreach from '@/components/social/WeeklyOutreach';
import MonthlyStats from '@/components/social/MonthlyStats';
import HostPlaybook from '@/components/social/HostPlaybook';
import EventArchive from '@/components/social/EventArchive';
import WeekCatchupDialog from '@/components/social/WeekCatchupDialog';

const SocialCRM: React.FC = () => {
  const navigate = useNavigate();
  const {
    contacts, experiences, dateExperiences, outreachItems, weeklyPlans, archivedEvents, pendingCatchupPlans, loading,
    addContact, updateContact, deleteContact,
    addExperience, updateExperience, deleteExperience,
    addToOutreach, removeFromOutreach, toggleOutreachContacted, confirmForEvent, confirmForMultipleEvents, removeGuestFromEvent,
    selectEventExperience, clearEventSlot, markEventComplete,
    getMidWeekExperienceId, getWeekendExperienceId, getDateExperienceId,
    getMidWeekPlan, getWeekendPlan, getDatePlan,
    getMidWeekGuests, getWeekendGuests, getDateGuests,
    dismissCatchup, dismissAllCatchups,
    updateArchivedEvent, unmarkEventComplete,
  } = useSocialCRM();

  const [closenessTags, setClosenessTags] = useLocalStorage<string[]>('social-closeness-tags', [...DEFAULT_CLOSENESS_TAGS]);
  const [catchupOpen, setCatchupOpen] = useState(true);
  const outreachContactIds = useMemo(() => new Set(outreachItems.map(i => i.contact_id).filter(Boolean) as string[]), [outreachItems]);

  const handleQuickAdd = async (data: { name: string; instagram: string; interesting_note: string }) => {
    await addContact({
      name: data.name, instagram: data.instagram || null, circle: 'Other', vibe_score: 3, status: 'Lead',
      closeness: 'Just Met', where_met: null, interesting_note: data.interesting_note || null,
      last_contacted: null, next_action: null, notes: null,
    });
  };

  const handleMarkComplete = async (slotType: 'mid_week' | 'weekend' | 'date', completionData: EventCompletionData) => {
    const plan = slotType === 'mid_week' ? getMidWeekPlan() : slotType === 'weekend' ? getWeekendPlan() : getDatePlan();
    if (plan) await markEventComplete(plan.id, completionData);
  };

  const handleCatchupComplete = async (planId: string, completionData: EventCompletionData) => {
    await markEventComplete(planId, completionData);
  };

  // Prepare catchup events with experience and guest data
  const catchupEventsWithData = useMemo(() => {
    return pendingCatchupPlans.map(plan => ({
      plan,
      experience: plan.experience_id ? [...experiences, ...dateExperiences].find(e => e.id === plan.experience_id) || null : null,
      guests: [] as SocialContact[], // Previous week's outreach data not loaded
    }));
  }, [pendingCatchupPlans, experiences, dateExperiences]);

  const midWeekGuests = getMidWeekGuests();
  const weekendGuests = getWeekendGuests();
  const dateGuests = getDateGuests();

  if (loading) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="text-amber-500">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Catchup Dialog */}
      <WeekCatchupDialog
        open={catchupOpen && pendingCatchupPlans.length > 0}
        onOpenChange={setCatchupOpen}
        pendingEvents={catchupEventsWithData}
        onMarkComplete={handleCatchupComplete}
        onDismiss={dismissCatchup}
        onDismissAll={dismissAllCatchups}
      />

      {/* Header */}
      <div className="border-b border-slate-800 px-4 py-3 sticky top-0 bg-[#0a0a0a] z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Button>
            <div className="flex items-center gap-2"><Users className="w-5 h-5 text-amber-500" /><h1 className="text-lg font-semibold">Social Command Center</h1></div>
          </div>
          <div className="text-sm text-slate-500">{contacts.length} people • {outreachItems.filter(i => i.contacted).length}/{outreachItems.length} reached</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 space-y-4 pb-8">
        {/* Monthly Stats */}
        <MonthlyStats 
          contacts={contacts} 
          outreachItems={outreachItems}
          midWeekGuestCount={midWeekGuests.length}
          weekendGuestCount={weekendGuests.length}
          dateGuestCount={dateGuests.length}
        />

        {/* Quick Add */}
        <QuickAddBar onAdd={handleQuickAdd} />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* People Database - 5 cols */}
          <div className="lg:col-span-5 min-h-[600px]">
            <PeopleDatabase 
              contacts={contacts} 
              closenessTags={closenessTags} 
              onAddToOutreach={addToOutreach} 
              onUpdateContact={updateContact} 
              onDeleteContact={deleteContact} 
              onUpdateClosenessTags={setClosenessTags} 
              outreachContactIds={outreachContactIds} 
            />
          </div>

          {/* Event Slots - 4 cols */}
          <div className="lg:col-span-4">
            <EventSlots 
              experiences={experiences} 
              dateExperiences={dateExperiences}
              contacts={contacts} 
              midWeekExperienceId={getMidWeekExperienceId()} 
              weekendExperienceId={getWeekendExperienceId()} 
              dateExperienceId={getDateExperienceId()}
              midWeekPlan={getMidWeekPlan()}
              weekendPlan={getWeekendPlan()}
              datePlan={getDatePlan()}
              midWeekGuests={midWeekGuests} 
              weekendGuests={weekendGuests} 
              dateGuests={dateGuests}
              onSelectExperience={selectEventExperience} 
              onRemoveGuest={removeGuestFromEvent} 
              onClearSlot={clearEventSlot}
              onMarkComplete={handleMarkComplete}
              onAddExperience={addExperience} 
              onUpdateExperience={updateExperience} 
              onDeleteExperience={deleteExperience} 
            />
          </div>

          {/* Weekly Outreach - 3 cols */}
          <div className="lg:col-span-3 min-h-[600px]">
            <WeeklyOutreach 
              outreachItems={outreachItems} 
              contacts={contacts} 
              onToggleContacted={toggleOutreachContacted} 
              onConfirmForEvent={confirmForEvent}
              onConfirmForMultipleEvents={confirmForMultipleEvents}
              onRemoveFromOutreach={removeFromOutreach} 
            />
          </div>
        </div>

        {/* Host's Playbook */}
        <HostPlaybook />

        {/* Event Archive */}
        <EventArchive events={archivedEvents} loading={loading} onUpdateEvent={updateArchivedEvent} onUnmarkComplete={unmarkEventComplete} />
      </div>
    </div>
  );
};

export default SocialCRM;
