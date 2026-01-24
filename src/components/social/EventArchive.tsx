import React from 'react';
import { Archive, Calendar, Users, MapPin, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SocialEventArchive } from '@/types/social';
import { format, parseISO } from 'date-fns';

interface EventArchiveProps {
  events: SocialEventArchive[];
  loading?: boolean;
}

const SLOT_LABELS: Record<string, { label: string; color: string }> = {
  'mid_week': { label: 'Mid-Week', color: 'text-amber-400' },
  'weekend': { label: 'Weekend', color: 'text-amber-500' },
  'date': { label: 'Date Night', color: 'text-pink-400' },
};

const EventArchive: React.FC<EventArchiveProps> = ({ events, loading }) => {
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
                    
                    return (
                      <div
                        key={event.id}
                        className="bg-slate-800/60 rounded-lg p-3 hover:bg-slate-800 transition-colors"
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
                          
                          <span className="text-[10px] text-slate-600 whitespace-nowrap">
                            {format(parseISO(event.completed_at), 'MMM d')}
                          </span>
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
