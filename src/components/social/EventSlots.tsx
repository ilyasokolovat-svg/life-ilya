import React, { useState } from 'react';
import { Calendar, Users, DollarSign, Settings, Plus, X, Trash2, Edit2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SocialExperience, SocialContact, TIERS } from '@/types/social';

interface EventSlotProps {
  slotType: 'mid_week' | 'weekend';
  title: string;
  experienceId: string | null;
  experiences: SocialExperience[];
  confirmedGuests: SocialContact[];
  onSelectExperience: (experienceId: string | null) => void;
  onRemoveGuest: (contactId: string) => void;
  onClear: () => void;
}

const EventSlot: React.FC<EventSlotProps> = ({
  slotType,
  title,
  experienceId,
  experiences,
  confirmedGuests,
  onSelectExperience,
  onRemoveGuest,
  onClear,
}) => {
  const selectedExperience = experiences.find(e => e.id === experienceId);
  const totalCost = selectedExperience 
    ? selectedExperience.estimated_cost * Math.max(1, confirmedGuests.length)
    : 0;

  return (
    <Card className="bg-slate-900/80 border-slate-700 p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-500" />
          <h3 className="font-semibold text-white">{title}</h3>
        </div>
        {(experienceId || confirmedGuests.length > 0) && (
          <Button variant="ghost" size="sm" onClick={onClear} className="h-6 px-2 text-slate-400 hover:text-red-400">
            Clear
          </Button>
        )}
      </div>

      <Select value={experienceId || ''} onValueChange={(val) => onSelectExperience(val || null)}>
        <SelectTrigger className="bg-slate-800 border-slate-700 text-white mb-4">
          <SelectValue placeholder="Select an experience..." />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-700">
          {experiences.map(exp => (
            <SelectItem key={exp.id} value={exp.id} className="text-white">
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
        <div className="text-xs text-slate-400 mb-4 space-y-1">
          <div>{selectedExperience.location}</div>
          <div>Best for: {selectedExperience.ideal_group_size} people</div>
        </div>
      )}

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400 uppercase tracking-wider">Confirmed ({confirmedGuests.length})</span>
        </div>
        
        {confirmedGuests.length === 0 ? (
          <div className="text-sm text-slate-600 italic py-4 text-center border border-dashed border-slate-700 rounded">
            Click "Confirm" on contacted people
          </div>
        ) : (
          <div className="space-y-1">
            {confirmedGuests.map(guest => (
              <div key={guest.id} className="flex items-center justify-between bg-slate-800/50 rounded px-2 py-1.5 group">
                <span className="text-sm text-white">{guest.name}</span>
                <button onClick={() => onRemoveGuest(guest.id)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-400">
          <DollarSign className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wider">Est. Cost</span>
        </div>
        <span className="text-lg font-bold text-amber-400">{totalCost > 0 ? `${totalCost} AED` : '—'}</span>
      </div>
    </Card>
  );
};

interface EventSlotsProps {
  experiences: SocialExperience[];
  contacts: SocialContact[];
  midWeekExperienceId: string | null;
  weekendExperienceId: string | null;
  midWeekGuests: SocialContact[];
  weekendGuests: SocialContact[];
  onSelectExperience: (slotType: 'mid_week' | 'weekend', experienceId: string | null) => void;
  onRemoveGuest: (slotType: 'mid_week' | 'weekend', contactId: string) => void;
  onClearSlot: (slotType: 'mid_week' | 'weekend') => void;
  onAddExperience: (experience: Omit<SocialExperience, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
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
  contacts,
  midWeekExperienceId,
  weekendExperienceId,
  midWeekGuests,
  weekendGuests,
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

  const openAddForm = () => {
    setEditingId(null);
    setFormData(emptyFormData);
    setFormOpen(true);
  };

  const openEditForm = (exp: SocialExperience) => {
    setEditingId(exp.id);
    setFormData({
      title: exp.title,
      tier: exp.tier,
      estimated_cost: exp.estimated_cost,
      location: exp.location || '',
      ideal_group_size: exp.ideal_group_size || '',
      description: exp.description || '',
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) return;
    
    if (editingId) {
      await onUpdateExperience(editingId, formData);
    } else {
      await onAddExperience({ ...formData, is_default: false });
    }
    
    setFormOpen(false);
    setFormData(emptyFormData);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    await onDeleteExperience(id);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-amber-500 uppercase tracking-wider">Events</h2>
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white">
              <Settings className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center justify-between">
                Manage Experiences
                <Button onClick={openAddForm} size="sm" className="bg-amber-600 hover:bg-amber-700">
                  <Plus className="w-4 h-4 mr-1" /> Add New
                </Button>
              </DialogTitle>
            </DialogHeader>
            
            {formOpen && (
              <div className="bg-slate-800 rounded-lg p-4 mb-4 space-y-3">
                <div className="text-sm font-medium text-white mb-2">
                  {editingId ? 'Edit Experience' : 'New Experience'}
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
                    placeholder="Group size (e.g., 4-6)"
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

            <div className="space-y-4">
              {TIERS.map(tier => {
                const tierExperiences = experiences.filter(e => e.tier === tier);
                if (tierExperiences.length === 0) return null;
                
                return (
                  <div key={tier}>
                    <h4 className={`text-xs uppercase tracking-wider mb-2 ${
                      tier === 'Low' ? 'text-emerald-400' : tier === 'Mid' ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {tier} Tier
                    </h4>
                    <div className="space-y-1">
                      {tierExperiences.map(exp => (
                        <div key={exp.id} className="flex items-center justify-between bg-slate-800 rounded px-3 py-2 group">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white">{exp.title}</div>
                            <div className="text-xs text-slate-500">{exp.location} • {exp.estimated_cost} AED • {exp.ideal_group_size || '?'} people</div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEditForm(exp)} className="text-slate-500 hover:text-amber-400 p-1">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {!exp.is_default && (
                              <button onClick={() => handleDelete(exp.id)} className="text-slate-500 hover:text-red-400 p-1">
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
          </DialogContent>
        </Dialog>
      </div>

      <EventSlot
        slotType="mid_week"
        title="Mid-Week"
        experienceId={midWeekExperienceId}
        experiences={experiences}
        confirmedGuests={midWeekGuests}
        onSelectExperience={(id) => onSelectExperience('mid_week', id)}
        onRemoveGuest={(id) => onRemoveGuest('mid_week', id)}
        onClear={() => onClearSlot('mid_week')}
      />

      <EventSlot
        slotType="weekend"
        title="Weekend"
        experienceId={weekendExperienceId}
        experiences={experiences}
        confirmedGuests={weekendGuests}
        onSelectExperience={(id) => onSelectExperience('weekend', id)}
        onRemoveGuest={(id) => onRemoveGuest('weekend', id)}
        onClear={() => onClearSlot('weekend')}
      />
    </div>
  );
};

export default EventSlots;
