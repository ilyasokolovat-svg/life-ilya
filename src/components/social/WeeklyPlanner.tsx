import React, { useState } from 'react';
import { Plus, X, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { SocialContact, SocialExperience, WeeklySocialPlan } from '@/types/social';
import { format, addDays, startOfWeek } from 'date-fns';

interface WeeklyPlannerProps {
  weeklyPlans: WeeklySocialPlan[];
  experiences: SocialExperience[];
  contacts: SocialContact[];
  onUpdatePlan: (dayOfWeek: number, experienceId: string | null, guestIds: string[], customTitle?: string) => Promise<void>;
  onRemovePlan: (dayOfWeek: number) => Promise<void>;
}

const WeeklyPlanner: React.FC<WeeklyPlannerProps> = ({
  weeklyPlans,
  experiences,
  contacts,
  onUpdatePlan,
  onRemovePlan,
}) => {
  const [addingToDay, setAddingToDay] = useState<number | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<string>('');
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  
  const days = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
    { value: 7, label: 'Sunday' },
  ];

  const getPlanForDay = (dayOfWeek: number) => {
    return weeklyPlans.find(p => p.day_of_week === dayOfWeek);
  };

  const getExperienceById = (id: string) => {
    return experiences.find(e => e.id === id);
  };

  const getContactById = (id: string) => {
    return contacts.find(c => c.id === id);
  };

  const getMixingMeter = (guestIds: string[]) => {
    if (guestIds.length === 0) return null;
    
    const guests = guestIds.map(id => getContactById(id)).filter(Boolean) as SocialContact[];
    const circles = new Set(guests.map(g => g.circle));
    
    const isMixed = circles.size >= 2;
    
    return {
      isMixed,
      circleCount: circles.size,
      circles: Array.from(circles),
    };
  };

  const handleAddPlan = async () => {
    if (addingToDay === null || !selectedExperience) return;
    
    await onUpdatePlan(addingToDay, selectedExperience, selectedGuests);
    setAddingToDay(null);
    setSelectedExperience('');
    setSelectedGuests([]);
  };

  const handleGuestToggle = (contactId: string, checked: boolean) => {
    if (checked) {
      setSelectedGuests(prev => [...prev, contactId]);
    } else {
      setSelectedGuests(prev => prev.filter(id => id !== contactId));
    }
  };

  const handleUpdateGuests = async (dayOfWeek: number, guestIds: string[]) => {
    const plan = getPlanForDay(dayOfWeek);
    if (plan) {
      await onUpdatePlan(dayOfWeek, plan.experience_id, guestIds);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Weekly Planner</h2>
          <p className="text-sm text-slate-500">
            Week of {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </p>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {days.map(day => {
          const plan = getPlanForDay(day.value);
          const experience = plan?.experience_id ? getExperienceById(plan.experience_id) : null;
          const guestIds = plan?.guest_ids || [];
          const mixing = getMixingMeter(guestIds);
          const dayDate = addDays(weekStart, day.value - 1);
          const isToday = format(new Date(), 'yyyy-MM-dd') === format(dayDate, 'yyyy-MM-dd');

          return (
            <Card
              key={day.value}
              className={`bg-[#0f0f0f] border p-3 min-h-[200px] ${
                isToday ? 'border-amber-500' : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className={`font-semibold ${isToday ? 'text-amber-500' : 'text-white'}`}>
                    {day.label}
                  </div>
                  <div className="text-xs text-slate-500">{format(dayDate, 'MMM d')}</div>
                </div>
                {plan && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-slate-500 hover:text-red-500"
                    onClick={() => onRemovePlan(day.value)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {plan && experience ? (
                <div className="space-y-3">
                  {/* Experience */}
                  <div className="bg-gradient-to-br from-amber-900/20 to-slate-900 rounded-lg p-2 border border-amber-600/30">
                    <div className="font-medium text-amber-400 text-sm">{experience.title}</div>
                    <div className="text-xs text-slate-400">
                      AED {experience.estimated_cost} • {experience.ideal_group_size || 'Any size'}
                    </div>
                  </div>

                  {/* Mixing Meter */}
                  {guestIds.length > 0 && mixing && (
                    <div className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${
                      mixing.isMixed 
                        ? 'bg-emerald-900/30 text-emerald-400' 
                        : 'bg-amber-900/30 text-amber-400'
                    }`}>
                      {mixing.isMixed ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <AlertCircle className="w-3 h-3" />
                      )}
                      {mixing.isMixed ? 'Mixed Group' : 'Homogeneous'}
                      <span className="text-slate-500">({mixing.circles.join(', ')})</span>
                    </div>
                  )}

                  {/* Guests */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-slate-700 text-slate-400 hover:text-white text-xs"
                      >
                        <Users className="w-3 h-3 mr-1" />
                        {guestIds.length > 0 ? `${guestIds.length} guests` : 'Add guests'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#0f0f0f] border-slate-700 text-white max-w-md max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-amber-500">
                          Select Guests for {day.label}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-2">
                        {contacts.map(contact => {
                          const isSelected = guestIds.includes(contact.id);
                          return (
                            <label
                              key={contact.id}
                              className="flex items-center gap-3 p-2 rounded hover:bg-slate-800 cursor-pointer"
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  const newGuests = checked
                                    ? [...guestIds, contact.id]
                                    : guestIds.filter(id => id !== contact.id);
                                  handleUpdateGuests(day.value, newGuests);
                                }}
                              />
                              <div className="flex-1">
                                <div className="text-sm text-white">{contact.name}</div>
                                <div className="text-xs text-slate-500">{contact.circle}</div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Guest Names Preview */}
                  {guestIds.length > 0 && (
                    <div className="text-xs text-slate-500">
                      {guestIds.slice(0, 3).map(id => getContactById(id)?.name).filter(Boolean).join(', ')}
                      {guestIds.length > 3 && ` +${guestIds.length - 3} more`}
                    </div>
                  )}
                </div>
              ) : (
                <Dialog open={addingToDay === day.value} onOpenChange={(open) => !open && setAddingToDay(null)}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full h-full min-h-[100px] border border-dashed border-slate-700 text-slate-500 hover:text-amber-500 hover:border-amber-500/50"
                      onClick={() => setAddingToDay(day.value)}
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#0f0f0f] border-slate-700 text-white max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-amber-500">
                        Plan {day.label}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-slate-400 mb-1 block">Experience</label>
                        <Select value={selectedExperience} onValueChange={setSelectedExperience}>
                          <SelectTrigger className="bg-[#1a1a1a] border-slate-700 text-white">
                            <SelectValue placeholder="Select an experience" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1a1a] border-slate-700 max-h-[300px]">
                            {experiences.map(exp => (
                              <SelectItem key={exp.id} value={exp.id} className="text-white hover:bg-slate-800">
                                <span className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${
                                    exp.tier === 'Low' ? 'bg-slate-500' :
                                    exp.tier === 'Mid' ? 'bg-blue-500' : 'bg-amber-500'
                                  }`} />
                                  {exp.title}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm text-slate-400 mb-2 block">Guests (optional)</label>
                        <div className="max-h-[200px] overflow-y-auto space-y-1">
                          {contacts.map(contact => (
                            <label
                              key={contact.id}
                              className="flex items-center gap-3 p-2 rounded hover:bg-slate-800 cursor-pointer"
                            >
                              <Checkbox
                                checked={selectedGuests.includes(contact.id)}
                                onCheckedChange={(checked) => handleGuestToggle(contact.id, !!checked)}
                              />
                              <div className="flex-1">
                                <div className="text-sm text-white">{contact.name}</div>
                                <div className="text-xs text-slate-500">{contact.circle}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      <Button
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                        onClick={handleAddPlan}
                        disabled={!selectedExperience}
                      >
                        Add to {day.label}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyPlanner;
