import React from 'react';
import { Check, X, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { SocialContact, WeeklyOutreach as WeeklyOutreachType } from '@/types/social';

interface WeeklyOutreachProps {
  outreachItems: WeeklyOutreachType[];
  contacts: SocialContact[];
  onToggleContacted: (outreachId: string, contacted: boolean) => void;
  onConfirmForEvent: (outreachId: string, slotType: 'mid_week' | 'weekend') => void;
  onRemoveFromOutreach: (outreachId: string) => void;
}

const WeeklyOutreach: React.FC<WeeklyOutreachProps> = ({
  outreachItems,
  contacts,
  onToggleContacted,
  onConfirmForEvent,
  onRemoveFromOutreach,
}) => {
  const getContactById = (id: string | null) => {
    if (!id) return null;
    return contacts.find(c => c.id === id);
  };

  const contactedCount = outreachItems.filter(i => i.contacted).length;
  const totalCount = outreachItems.length;
  const progress = totalCount > 0 ? (contactedCount / totalCount) * 100 : 0;

  const pendingItems = outreachItems.filter(i => !i.contacted);
  const contactedItems = outreachItems.filter(i => i.contacted && !i.confirmed_for);
  const confirmedItems = outreachItems.filter(i => i.confirmed_for);

  return (
    <div className="flex flex-col h-full bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-slate-800">
        <h2 className="text-sm font-semibold text-amber-500 uppercase tracking-wider mb-3">
          Weekly Outreach
        </h2>
        
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Contacted</span>
            <span className="text-amber-400 font-medium">{contactedCount}/{totalCount}</span>
          </div>
          <Progress value={progress} className="h-2 bg-slate-800" />
        </div>
      </div>

      {/* Outreach List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-3">
          {outreachItems.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              Click on people in the database to add them to your weekly outreach
            </div>
          ) : (
            <>
              {/* Pending */}
              {pendingItems.length > 0 && (
                <div>
                  <h4 className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 px-1">
                    To Reach Out ({pendingItems.length})
                  </h4>
                  <div className="space-y-1">
                    {pendingItems.map(item => {
                      const contact = getContactById(item.contact_id);
                      if (!contact) return null;
                      
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between bg-slate-800/50 rounded-lg p-2 group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              onClick={() => onToggleContacted(item.id, true)}
                              className="w-5 h-5 rounded border border-slate-600 flex items-center justify-center hover:border-amber-500 hover:bg-amber-500/10 transition-colors shrink-0"
                            >
                              <Check className="w-3 h-3 text-transparent" />
                            </button>
                            <span className="text-sm text-white truncate">{contact.name}</span>
                          </div>
                          <button
                            onClick={() => onRemoveFromOutreach(item.id)}
                            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Contacted (ready to confirm) */}
              {contactedItems.length > 0 && (
                <div>
                  <h4 className="text-[10px] uppercase tracking-wider text-emerald-500 mb-2 px-1">
                    Contacted - Confirm for Event ({contactedItems.length})
                  </h4>
                  <div className="space-y-1">
                    {contactedItems.map(item => {
                      const contact = getContactById(item.contact_id);
                      if (!contact) return null;
                      
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between bg-emerald-900/20 border border-emerald-800/30 rounded-lg p-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              onClick={() => onToggleContacted(item.id, false)}
                              className="w-5 h-5 rounded bg-emerald-600 flex items-center justify-center shrink-0"
                            >
                              <Check className="w-3 h-3 text-white" />
                            </button>
                            <span className="text-sm text-white truncate">{contact.name}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onConfirmForEvent(item.id, 'mid_week')}
                              className="h-6 px-2 text-xs text-slate-400 hover:text-amber-400"
                            >
                              Mid
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onConfirmForEvent(item.id, 'weekend')}
                              className="h-6 px-2 text-xs text-slate-400 hover:text-amber-400"
                            >
                              Wknd
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Confirmed for events */}
              {confirmedItems.length > 0 && (
                <div>
                  <h4 className="text-[10px] uppercase tracking-wider text-amber-500 mb-2 px-1">
                    Confirmed for Events ({confirmedItems.length})
                  </h4>
                  <div className="space-y-1">
                    {confirmedItems.map(item => {
                      const contact = getContactById(item.contact_id);
                      if (!contact) return null;
                      
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between bg-amber-900/20 border border-amber-700/30 rounded-lg p-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                            <span className="text-sm text-white truncate">{contact.name}</span>
                          </div>
                          <span className="text-[10px] text-amber-400 uppercase shrink-0">
                            {item.confirmed_for === 'mid_week' ? 'Mid-Week' : 'Weekend'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-2 border-t border-slate-800 text-xs text-slate-500 text-center">
        {totalCount === 0 
          ? 'Start by adding people from your database'
          : progress === 100 
            ? '🎉 All reached out!' 
            : `${totalCount - contactedCount} left to contact`
        }
      </div>
    </div>
  );
};

export default WeeklyOutreach;
