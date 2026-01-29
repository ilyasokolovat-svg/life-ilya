import React, { useState } from 'react';
import { Archive, Calendar, Users, MapPin, DollarSign, Star, Pencil, X, Check, Undo2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SocialEventArchive } from '@/types/social';
import { format, parseISO } from 'date-fns';

interface EventArchiveProps {
  events: SocialEventArchive[];
  loading?: boolean;
  onUpdateEvent?: (id: string, updates: Partial<SocialEventArchive>) => Promise<void>;
  onUnmarkComplete?: (archiveId: string) => Promise<void>;
}

const SLOT_LABELS: Record<string, { label: string; color: string }> = {
  'mid_week': { label: 'Mid-Week', color: 'text-amber-400' },
  'weekend': { label: 'Weekend', color: 'text-amber-500' },
  'date': { label: 'Date Night', color: 'text-pink-400' },
};

const EventArchive: React.FC<EventArchiveProps> = ({ events, loading, onUpdateEvent, onUnmarkComplete }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SocialEventArchive>>({});

  const startEditing = (event: SocialEventArchive) => {
    setEditingId(event.id);
    setEditForm({
      experience_title: event.experience_title,
      experience_location: event.experience_location,
      experience_cost: event.experience_cost,
      guest_names: event.guest_names,
      vibe_rating: event.vibe_rating,
      notes: event.notes,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEditing = async () => {
    if (!editingId || !onUpdateEvent) return;
    await onUpdateEvent(editingId, {
      ...editForm,
      guest_count: editForm.guest_names?.length || 0,
    });
    setEditingId(null);
    setEditForm({});
  };

  const updateGuestNames = (value: string) => {
    setEditForm(prev => ({
      ...prev,
      guest_names: value.split(',').map(n => n.trim()).filter(Boolean),
    }));
  };

  if (loading) {
    return (
      <Card className="bg-slate-900/50 border-slate-800 p-4">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-6 h-6 bg-slate-700 rounded" />
          <div className="h-5 bg-slate-700 rounded w-32" />
        </div>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-slate-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Archive className="w-5 h-5 text-amber-500" />
          <h2 className="text-sm font-semibold text-amber-500 uppercase tracking-wider">Event Archive</h2>
        </div>
        <p className="text-slate-500 text-sm text-center py-8">
          No completed events yet. Mark events as complete to build your history!
        </p>
      </Card>
    );
  }

  // Group events by week
  const groupedByWeek = events.reduce((acc, event) => {
    const weekKey = event.week_start;
    if (!acc[weekKey]) acc[weekKey] = [];
    acc[weekKey].push(event);
    return acc;
  }, {} as Record<string, SocialEventArchive[]>);

  const sortedWeeks = Object.keys(groupedByWeek).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <Card className="bg-slate-900/50 border-slate-800 p-4">
      <div className="flex items-center gap-3 mb-4">
        <Archive className="w-5 h-5 text-amber-500" />
        <h2 className="text-sm font-semibold text-amber-500 uppercase tracking-wider">Event Archive</h2>
        <span className="text-xs text-slate-500 ml-auto">{events.length} events</span>
      </div>

      <ScrollArea className="max-h-[400px]">
        <div className="space-y-4 pr-2">
          {sortedWeeks.map((weekStart) => {
            const weekEvents = groupedByWeek[weekStart];
            const weekDate = parseISO(weekStart);
            
            return (
              <div key={weekStart} className="border-l-2 border-slate-700 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span className="text-xs text-slate-400 font-medium">
                    Week of {format(weekDate, 'MMM d, yyyy')}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {weekEvents.map((event) => {
                    const slotInfo = SLOT_LABELS[event.slot_type] || { label: event.slot_type, color: 'text-slate-400' };
                    const isEditing = editingId === event.id;
                    
                    if (isEditing) {
                      return (
                        <div
                          key={event.id}
                          className="bg-slate-800 rounded-lg p-4 border border-amber-500/50"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-xs font-medium ${slotInfo.color}`}>
                              {slotInfo.label}
                            </span>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-slate-400 hover:text-white"
                                onClick={cancelEditing}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                className="h-7 w-7 p-0 bg-emerald-600 hover:bg-emerald-700"
                                onClick={saveEditing}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="text-xs text-slate-400 mb-1 block">Event Title</label>
                              <Input
                                value={editForm.experience_title || ''}
                                onChange={(e) => setEditForm(prev => ({ ...prev, experience_title: e.target.value }))}
                                className="bg-slate-900 border-slate-600 text-white h-8 text-sm"
                                placeholder="Event title"
                              />
                            </div>

                            <div>
                              <label className="text-xs text-slate-400 mb-1 block">Location</label>
                              <Input
                                value={editForm.experience_location || ''}
                                onChange={(e) => setEditForm(prev => ({ ...prev, experience_location: e.target.value }))}
                                className="bg-slate-900 border-slate-600 text-white h-8 text-sm"
                                placeholder="Location"
                              />
                            </div>

                            <div>
                              <label className="text-xs text-slate-400 mb-1 block">Guests (comma separated)</label>
                              <Input
                                value={editForm.guest_names?.join(', ') || ''}
                                onChange={(e) => updateGuestNames(e.target.value)}
                                className="bg-slate-900 border-slate-600 text-white h-8 text-sm"
                                placeholder="John, Jane, etc."
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-slate-400 mb-1 block">Vibe (1-5)</label>
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => setEditForm(prev => ({ ...prev, vibe_rating: star }))}
                                      className="p-0.5"
                                    >
                                      <Star
                                        className={`w-5 h-5 ${
                                          star <= (editForm.vibe_rating || 0)
                                            ? 'fill-amber-400 text-amber-400'
                                            : 'text-slate-600'
                                        }`}
                                      />
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <label className="text-xs text-slate-400 mb-1 block">Cost (AED)</label>
                                <Input
                                  type="number"
                                  value={editForm.experience_cost || 0}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, experience_cost: parseInt(e.target.value) || 0 }))}
                                  className="bg-slate-900 border-slate-600 text-white h-8 text-sm"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-xs text-slate-400 mb-1 block">Notes</label>
                              <Textarea
                                value={editForm.notes || ''}
                                onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                                className="bg-slate-900 border-slate-600 text-white text-sm resize-none"
                                rows={2}
                                placeholder="Memorable moments..."
                              />
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={event.id}
                        className="bg-slate-800/60 rounded-lg p-3 hover:bg-slate-800 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-medium ${slotInfo.color}`}>
                                {slotInfo.label}
                              </span>
                              {event.experience_title && (
                                <span className="text-sm text-white font-medium truncate">
                                  {event.experience_title}
                                </span>
                              )}
                              {event.vibe_rating && (
                                <div className="flex items-center gap-0.5 ml-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-3 h-3 ${
                                        star <= event.vibe_rating!
                                          ? 'fill-amber-400 text-amber-400'
                                          : 'text-slate-700'
                                      }`}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                              {event.experience_location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {event.experience_location}
                                </span>
                              )}
                              
                              {event.guest_count > 0 && (
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {event.guest_names.length > 0 
                                    ? event.guest_names.slice(0, 3).join(', ') + (event.guest_names.length > 3 ? ` +${event.guest_names.length - 3}` : '')
                                    : `${event.guest_count} guests`
                                  }
                                </span>
                              )}
                              
                              {event.experience_cost > 0 && (
                                <span className="flex items-center gap-1 text-emerald-400">
                                  <DollarSign className="w-3 h-3" />
                                  {event.experience_cost} AED
                                </span>
                              )}
                            </div>
                            
                            {event.notes && (
                              <p className="text-xs text-slate-500 mt-1 italic">
                                {event.notes}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {onUnmarkComplete && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-amber-400 hover:text-amber-300 hover:bg-amber-900/20"
                                onClick={() => onUnmarkComplete(event.id)}
                                title="Undo completion"
                              >
                                <Undo2 className="w-3 h-3" />
                              </Button>
                            )}
                            {onUpdateEvent && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white"
                                onClick={() => startEditing(event)}
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                            )}
                            <span className="text-[10px] text-slate-600 whitespace-nowrap">
                              {format(parseISO(event.completed_at), 'MMM d')}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default EventArchive;
