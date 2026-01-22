import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSocialCRM } from '@/hooks/useSocialCRM';
import useLocalStorage from '@/hooks/useLocalStorage';
import { DEFAULT_CLOSENESS_TAGS, SocialContact } from '@/types/social';
import QuickAddBar from '@/components/social/QuickAddBar';
import PeopleDatabase from '@/components/social/PeopleDatabase';
import EventSlots from '@/components/social/EventSlots';
import WeeklyOutreach from '@/components/social/WeeklyOutreach';

const SocialCRM: React.FC = () => {
  const navigate = useNavigate();
  const {
    contacts, experiences, outreachItems, loading,
    addContact, updateContact, deleteContact,
    addExperience, deleteExperience,
    addToOutreach, removeFromOutreach, toggleOutreachContacted, confirmForEvent, removeGuestFromEvent,
    selectEventExperience, clearEventSlot,
    getMidWeekExperienceId, getWeekendExperienceId, getMidWeekGuests, getWeekendGuests,
  } = useSocialCRM();

  const [closenessTags, setClosenessTags] = useLocalStorage<string[]>('social-closeness-tags', [...DEFAULT_CLOSENESS_TAGS]);
  const outreachContactIds = useMemo(() => new Set(outreachItems.map(i => i.contact_id).filter(Boolean) as string[]), [outreachItems]);

  const handleQuickAdd = async (data: { name: string; instagram: string; interesting_note: string }) => {
    await addContact({
      name: data.name, instagram: data.instagram || null, circle: 'Other', vibe_score: 3, status: 'Lead',
      closeness: 'Just Met', where_met: null, interesting_note: data.interesting_note || null,
      last_contacted: null, next_action: null, notes: null,
    });
  };

  if (loading) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="text-amber-500">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="border-b border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Button>
            <div className="flex items-center gap-2"><Users className="w-5 h-5 text-amber-500" /><h1 className="text-lg font-semibold">Social Command Center</h1></div>
          </div>
          <div className="text-sm text-slate-500">{contacts.length} people • {outreachItems.filter(i => i.contacted).length}/{outreachItems.length} reached</div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        <QuickAddBar onAdd={handleQuickAdd} />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-180px)]">
          <div className="lg:col-span-4 h-full">
            <PeopleDatabase contacts={contacts} closenessTags={closenessTags} onAddToOutreach={addToOutreach} onUpdateContact={updateContact} onDeleteContact={deleteContact} onUpdateClosenessTags={setClosenessTags} outreachContactIds={outreachContactIds} />
          </div>
          <div className="lg:col-span-4 h-full">
            <EventSlots experiences={experiences} contacts={contacts} midWeekExperienceId={getMidWeekExperienceId()} weekendExperienceId={getWeekendExperienceId()} midWeekGuests={getMidWeekGuests()} weekendGuests={getWeekendGuests()} onSelectExperience={selectEventExperience} onRemoveGuest={removeGuestFromEvent} onClearSlot={clearEventSlot} onAddExperience={addExperience} onDeleteExperience={deleteExperience} />
          </div>
          <div className="lg:col-span-4 h-full">
            <WeeklyOutreach outreachItems={outreachItems} contacts={contacts} onToggleContacted={toggleOutreachContacted} onConfirmForEvent={confirmForEvent} onRemoveFromOutreach={removeFromOutreach} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialCRM;
