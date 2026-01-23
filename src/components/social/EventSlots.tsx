import React, { useState } from 'react';
import { Calendar, Users, DollarSign, Settings, Plus, X, Trash2, Edit2, Heart } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SocialExperience, SocialContact, TIERS } from '@/types/social';

interface EventSlotProps {
  slotType: 'mid_week' | 'weekend' | 'date';
  title: string;
  icon: React.ReactNode;
  experienceId: string | null;
  experiences: SocialExperience[];
  confirmedGuests: SocialContact[];
  onSelectExperience: (experienceId: string | null) => void;
  onRemoveGuest: (contactId: string) => void;
  onClear: () => void;
  accentColor: string;
}

const EventSlot: React.FC<EventSlotProps> = ({
  slotType,
  title,
  icon,
  experienceId,
  experiences,
  confirmedGuests,
  onSelectExperience,
  onRemoveGuest,
  onClear,
  accentColor,
}) => {
  const selectedExperience = experiences.find(e => e.id === experienceId);
  const totalCost = selectedExperience 
    ? selectedExperience.estimated_cost * Math.max(1, confirmedGuests.length)
    : 0;

  return (
    <Card className="bg-slate-900/80 border-slate-700 p-3 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className={`font-semibold text-sm ${accentColor}`}>{title}</h3>
        </div>
        {(experienceId || confirmedGuests.length > 0) && (
          <Button variant="ghost" size="sm" onClick={onClear} className="h-6 px-2 text-slate-400 hover:text-red-400 text-xs">
            Clear
          </Button>
        )}
      </div>

      <Select value={experienceId || ''} onValueChange={(val) => onSelectExperience(val || null)}>
        <SelectTrigger className="bg-slate-800 border-slate-700 text-white mb-3 h-9 text-sm">
          <SelectValue placeholder="Select experience..." />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-700">
          {experiences.map(exp => (
            <SelectItem key={exp.id} value={exp.id} className="text-white text-sm">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  exp.tier === 'Low' ? 'bg-emerald-500' : exp.tier === 'Mid' ? 'bg-amber-500' : 'bg-red-500'
                }`} />
                {exp.title} ({exp.estimated_cost} AED)
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedExperience && (
        <div className="text-[10px] text-slate-400 mb-3 space-y-0.5">
          <div>{selectedExperience.location}</div>
          <div>Best for: {selectedExperience.ideal_group_size} people</div>
        </div>
      )}

      <div className="flex-1 min-h-0">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-3 h-3 text-slate-400" />
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Confirmed ({confirmedGuests.length})</span>
        </div>
        
        {confirmedGuests.length === 0 ? (
          <div className="text-[10px] text-slate-600 italic py-3 text-center border border-dashed border-slate-700 rounded">
            {slotType === 'date' ? 'Confirm from Romantic contacts' : 'Click "Confirm" on contacted people'}
          </div>
        ) : (
          <div className="space-y-1">
            {confirmedGuests.map(guest => (
              <div key={guest.id} className="flex items-center justify-between bg-slate-800/50 rounded px-2 py-1 group">
                <span className="text-xs text-white">{guest.name}</span>
                <button onClick={() => onRemoveGuest(guest.id)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-400">
          <DollarSign className="w-3 h-3" />
          <span className="text-[10px] uppercase tracking-wider">Est. Cost</span>
        </div>
        <span className={`text-base font-bold ${accentColor}`}>{totalCost > 0 ? `${totalCost} AED` : '—'}</span>
      </div>
    </Card>
  );
};

interface EventSlotsProps {
  experiences: SocialExperience[];
  dateExperiences: SocialExperience[];
  contacts: SocialContact[];
  midWeekExperienceId: string | null;
  weekendExperienceId: string | null;
  dateExperienceId: string | null;
  midWeekGuests: SocialContact[];
  weekendGuests: SocialContact[];
  dateGuests: SocialContact[];
  onSelectExperience: (slotType: 'mid_week' | 'weekend' | 'date', experienceId: string | null) => void;
  onRemoveGuest: (slotType: 'mid_week' | 'weekend' | 'date', contactId: string) => void;
  onClearSlot: (slotType: 'mid_week' | 'weekend' | 'date') => void;
  onAddExperience: (experience: Omit<SocialExperience, 'id' | 'user_id' | 'created_at' | 'updated_at'>, isDateExperience?: boolean) => Promise<void>;
  onUpdateExperience: (id: string, updates: Partial<SocialExperience>) => Promise<void>;
  onDeleteExperience: (id: string) => Promise<void>;
}

const emptyFormData = {
  title: '',
  tier: 'Mid' as 'Low' | 'Mid' | 'High',
  estimated_cost: 0,
  location: '',
  ideal_group_size: '',
  description: '',
};

const EventSlots: React.FC<EventSlotsProps> = ({
  experiences,
  dateExperiences,
  contacts,
  midWeekExperienceId,
  weekendExperienceId,
  dateExperienceId,
  midWeekGuests,
  weekendGuests,
  dateGuests,
  onSelectExperience,
  onRemoveGuest,
  onClearSlot,
  onAddExperience,
  onUpdateExperience,
  onDeleteExperience,
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyFormData);
  const [isDateForm, setIsDateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'events' | 'dates'>('events');

  const openAddForm = (forDates: boolean = false) => {
    setEditingId(null);
    setFormData(emptyFormData);
    setIsDateForm(forDates);
    setFormOpen(true);
  };

  const openEditForm = (exp: SocialExperience, forDates: boolean = false) => {
    setEditingId(exp.id);
    setFormData({
      title: exp.title,
      tier: exp.tier,
      estimated_cost: exp.estimated_cost,
      location: exp.location || '',
      ideal_group_size: exp.ideal_group_size || '',
      description: exp.description || '',
    });
    setIsDateForm(forDates);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) return;
    
    if (editingId) {
      await onUpdateExperience(editingId, formData);
    } else {
      await onAddExperience({ ...formData, is_default: false }, isDateForm);
    }
    
    setFormOpen(false);
    setFormData(emptyFormData);
    setEditingId(null);
  };

  const ExperienceList: React.FC<{ expList: SocialExperience[]; forDates: boolean }> = ({ expList, forDates }) => (
    <div className="space-y-3">
      {TIERS.map(tier => {
        const tierExperiences = expList.filter(e => e.tier === tier);
        if (tierExperiences.length === 0) return null;
        
        return (
          <div key={tier}>
            <h4 className={`text-xs uppercase tracking-wider mb-1.5 ${
              tier === 'Low' ? 'text-emerald-400' : tier === 'Mid' ? 'text-amber-400' : 'text-red-400'
            }`}>
              {tier} Tier
            </h4>
            <div className="space-y-1">
              {tierExperiences.map(exp => (
                <div key={exp.id} className="flex items-center justify-between bg-slate-800 rounded px-3 py-2 group">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white">{exp.title}</div>
                    <div className="text-xs text-slate-500">{exp.location} • {exp.estimated_cost} AED</div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditForm(exp, forDates)} className="text-slate-500 hover:text-amber-400 p-1">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {!exp.is_default && (
                      <button onClick={() => onDeleteExperience(exp.id)} className="text-slate-500 hover:text-red-400 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-amber-500 uppercase tracking-wider">Events</h2>
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white">
              <Settings className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-white">Manage Experiences</DialogTitle>
            </DialogHeader>
            
            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-700 pb-2">
              <button
                onClick={() => setActiveTab('events')}
                className={`px-3 py-1.5 rounded-t text-sm ${activeTab === 'events' ? 'bg-slate-800 text-amber-400' : 'text-slate-400'}`}
              >
                Social Events
              </button>
              <button
                onClick={() => setActiveTab('dates')}
                className={`px-3 py-1.5 rounded-t text-sm ${activeTab === 'dates' ? 'bg-slate-800 text-pink-400' : 'text-slate-400'}`}
              >
                Date Experiences
              </button>
            </div>
            
            {formOpen && (
              <div className="bg-slate-800 rounded-lg p-4 mb-3 space-y-3">
                <div className="text-sm font-medium text-white mb-2">
                  {editingId ? 'Edit Experience' : `New ${isDateForm ? 'Date' : 'Social'} Experience`}
                </div>
                <Input
                  placeholder="Experience title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <div className="grid grid-cols-3 gap-2">
                  <Select value={formData.tier} onValueChange={(v: 'Low' | 'Mid' | 'High') => setFormData({ ...formData, tier: v })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {TIERS.map(t => (
                        <SelectItem key={t} value={t} className="text-white">{t} Tier</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Cost (AED)"
                    value={formData.estimated_cost || ''}
                    onChange={(e) => setFormData({ ...formData, estimated_cost: parseInt(e.target.value) || 0 })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <Input
                    placeholder="Group size"
                    value={formData.ideal_group_size}
                    onChange={(e) => setFormData({ ...formData, ideal_group_size: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <Input
                  placeholder="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <Textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
                  <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700">
                    {editingId ? 'Update' : 'Save'}
                  </Button>
                </div>
              </div>
            )}

            <ScrollArea className="flex-1">
              <div className="pr-4">
                {activeTab === 'events' ? (
                  <>
                    <div className="flex justify-end mb-3">
                      <Button onClick={() => openAddForm(false)} size="sm" className="bg-amber-600 hover:bg-amber-700">
                        <Plus className="w-4 h-4 mr-1" /> Add Event
                      </Button>
                    </div>
                    <ExperienceList expList={experiences} forDates={false} />
                  </>
                ) : (
                  <>
                    <div className="flex justify-end mb-3">
                      <Button onClick={() => openAddForm(true)} size="sm" className="bg-pink-600 hover:bg-pink-700">
                        <Plus className="w-4 h-4 mr-1" /> Add Date
                      </Button>
                    </div>
                    <ExperienceList expList={dateExperiences} forDates={true} />
                  </>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-3 flex-1">
        <EventSlot
          slotType="mid_week"
          title="Mid-Week"
          icon={<Calendar className="w-4 h-4 text-amber-500" />}
          experienceId={midWeekExperienceId}
          experiences={experiences}
          confirmedGuests={midWeekGuests}
          onSelectExperience={(id) => onSelectExperience('mid_week', id)}
          onRemoveGuest={(id) => onRemoveGuest('mid_week', id)}
          onClear={() => onClearSlot('mid_week')}
          accentColor="text-amber-400"
        />

        <EventSlot
          slotType="weekend"
          title="Weekend"
          icon={<Calendar className="w-4 h-4 text-amber-500" />}
          experienceId={weekendExperienceId}
          experiences={experiences}
          confirmedGuests={weekendGuests}
          onSelectExperience={(id) => onSelectExperience('weekend', id)}
          onRemoveGuest={(id) => onRemoveGuest('weekend', id)}
          onClear={() => onClearSlot('weekend')}
          accentColor="text-amber-400"
        />

        <EventSlot
          slotType="date"
          title="Date Night"
          icon={<Heart className="w-4 h-4 text-pink-500" />}
          experienceId={dateExperienceId}
          experiences={dateExperiences}
          confirmedGuests={dateGuests}
          onSelectExperience={(id) => onSelectExperience('date', id)}
          onRemoveGuest={(id) => onRemoveGuest('date', id)}
          onClear={() => onClearSlot('date')}
          accentColor="text-pink-400"
        />
      </div>
    </div>
  );
};

export default EventSlots;