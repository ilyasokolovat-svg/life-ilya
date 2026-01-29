import React, { useState } from 'react';
import { Check, X, Calendar, UserCheck, Heart, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { SocialContact, WeeklyOutreach as WeeklyOutreachType, ROMANTIC_CLOSENESS } from '@/types/social';

interface WeeklyOutreachProps {
  outreachItems: WeeklyOutreachType[];
  contacts: SocialContact[];
  onToggleContacted: (outreachId: string, contacted: boolean) => void;
  onConfirmForEvent: (outreachId: string, slotType: 'mid_week' | 'weekend' | 'date') => void;
  onConfirmForMultipleEvents: (outreachId: string, slotTypes: ('mid_week' | 'weekend' | 'date')[]) => void;
  onRemoveFromOutreach: (outreachId: string) => void;
}

const WeeklyOutreach: React.FC<WeeklyOutreachProps> = ({
  outreachItems,
  contacts,
  onToggleContacted,
  onConfirmForEvent,
  onConfirmForMultipleEvents,
  onRemoveFromOutreach,
}) => {
  const [confirmDialog, setConfirmDialog] = useState<{ 
    open: boolean; 
    outreachId: string; 
    contactName: string;
    isRomantic: boolean;
  }>({
    open: false,
    outreachId: '',
    contactName: '',
    isRomantic: false,
  });
  
  // Track selected slots for multi-select
  const [selectedSlots, setSelectedSlots] = useState<Set<'mid_week' | 'weekend' | 'date'>>(new Set());

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

  const openConfirmDialog = (outreachId: string, contact: SocialContact) => {
    const isRomantic = ROMANTIC_CLOSENESS.includes(contact.closeness as any);
    setConfirmDialog({ open: true, outreachId, contactName: contact.name, isRomantic });
    setSelectedSlots(new Set());
  };

  const toggleSlot = (slot: 'mid_week' | 'weekend' | 'date') => {
    setSelectedSlots(prev => {
      const next = new Set(prev);
      if (next.has(slot)) {
        next.delete(slot);
      } else {
        next.add(slot);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    if (selectedSlots.size === 0) return;
    
    const slots = Array.from(selectedSlots);
    if (slots.length === 1) {
      onConfirmForEvent(confirmDialog.outreachId, slots[0]);
    } else {
      onConfirmForMultipleEvents(confirmDialog.outreachId, slots);
    }
    setConfirmDialog({ open: false, outreachId: '', contactName: '', isRomantic: false });
    setSelectedSlots(new Set());
  };

  const getConfirmedLabel = (confirmedFor: string | null) => {
    if (!confirmedFor) return '';
    
    // Handle multiple slots (comma-separated)
    const slots = confirmedFor.split(',').map(s => s.trim());
    const labels = slots.map(slot => {
      switch (slot) {
        case 'mid_week': return 'Mid-Week';
        case 'weekend': return 'Weekend';
        case 'date': return 'Date';
        default: return slot;
      }
    });
    return labels.join(' + ');
  };

  const getConfirmedColor = (confirmedFor: string | null) => {
    if (!confirmedFor) return 'text-amber-400';
    if (confirmedFor.includes('date')) return 'text-pink-400';
    return 'text-amber-400';
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden">
      <div className="p-3 border-b border-slate-800">
        <h2 className="text-sm font-semibold text-amber-500 uppercase tracking-wider mb-3">Weekly Outreach</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Contacted</span>
            <span className="text-amber-400 font-medium">{contactedCount}/{totalCount}</span>
          </div>
          <Progress value={progress} className="h-2 bg-slate-800" />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-3">
          {outreachItems.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              Click on people in the database to add them to your weekly outreach
            </div>
          ) : (
            <>
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
                        <div key={item.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg p-2 group">
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              onClick={() => onToggleContacted(item.id, true)}
                              className="w-5 h-5 rounded border border-slate-600 flex items-center justify-center hover:border-amber-500 hover:bg-amber-500/10 transition-colors shrink-0"
                            >
                              <Check className="w-3 h-3 text-transparent" />
                            </button>
                            <span className="text-sm text-white truncate">{contact.name}</span>
                            {ROMANTIC_CLOSENESS.includes(contact.closeness as any) && (
                              <Heart className="w-3 h-3 text-pink-500 shrink-0" />
                            )}
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

              {contactedItems.length > 0 && (
                <div>
                  <h4 className="text-[10px] uppercase tracking-wider text-emerald-500 mb-2 px-1">
                    Contacted ({contactedItems.length})
                  </h4>
                  <div className="space-y-1">
                    {contactedItems.map(item => {
                      const contact = getContactById(item.contact_id);
                      if (!contact) return null;
                      
                      return (
                        <div key={item.id} className="flex items-center justify-between bg-emerald-900/20 border border-emerald-800/30 rounded-lg p-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              onClick={() => onToggleContacted(item.id, false)}
                              className="w-5 h-5 rounded bg-emerald-600 flex items-center justify-center shrink-0"
                            >
                              <Check className="w-3 h-3 text-white" />
                            </button>
                            <span className="text-sm text-white truncate">{contact.name}</span>
                            {ROMANTIC_CLOSENESS.includes(contact.closeness as any) && (
                              <Heart className="w-3 h-3 text-pink-500 shrink-0" />
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => openConfirmDialog(item.id, contact)}
                            className="h-6 px-2 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                          >
                            <UserCheck className="w-3 h-3 mr-1" />
                            Confirm
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {confirmedItems.length > 0 && (
                <div>
                  <h4 className="text-[10px] uppercase tracking-wider text-amber-500 mb-2 px-1">
                    Confirmed for Events ({confirmedItems.length})
                  </h4>
                  <div className="space-y-1">
                    {confirmedItems.map(item => {
                      const contact = getContactById(item.contact_id);
                      if (!contact) return null;
                      
                      const hasDate = item.confirmed_for?.includes('date');
                      
                      return (
                        <div key={item.id} className={`flex items-center justify-between rounded-lg p-2 ${
                          hasDate 
                            ? 'bg-pink-900/20 border border-pink-700/30' 
                            : 'bg-amber-900/20 border border-amber-700/30'
                        }`}>
                          <div className="flex items-center gap-2 min-w-0">
                            {hasDate ? (
                              <Heart className="w-4 h-4 text-pink-500 shrink-0" />
                            ) : (
                              <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                            )}
                            <span className="text-sm text-white truncate">{contact.name}</span>
                          </div>
                          <span className={`text-[10px] uppercase shrink-0 ${getConfirmedColor(item.confirmed_for)}`}>
                            {getConfirmedLabel(item.confirmed_for)}
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

      <div className="p-2 border-t border-slate-800 text-xs text-slate-500 text-center">
        {totalCount === 0 
          ? 'Start by adding people from your database'
          : progress === 100 
            ? '🎉 All reached out!' 
            : `${totalCount - contactedCount} left to contact`
        }
      </div>

      {/* Confirm Event Dialog - Multi-select */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, outreachId: '', contactName: '', isRomantic: false })}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Confirm for Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              Which event(s) is <span className="text-white font-medium">{confirmDialog.contactName}</span> attending?
            </p>
            <p className="text-xs text-slate-500">
              Select multiple if they're joining both a social event and a date!
            </p>
            
            <div className="space-y-2">
              {/* Mid-Week Option */}
              <button
                onClick={() => toggleSlot('mid_week')}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  selectedSlots.has('mid_week')
                    ? 'bg-amber-600/20 border-amber-500'
                    : 'bg-slate-800 border-slate-600 hover:border-slate-500'
                }`}
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                  selectedSlots.has('mid_week') ? 'bg-amber-500 border-amber-500' : 'border-slate-500'
                }`}>
                  {selectedSlots.has('mid_week') && <Check className="w-3 h-3 text-white" />}
                </div>
                <Users className="w-5 h-5 text-amber-500" />
                <span className="text-white">Mid-Week</span>
              </button>

              {/* Weekend Option */}
              <button
                onClick={() => toggleSlot('weekend')}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  selectedSlots.has('weekend')
                    ? 'bg-amber-600/20 border-amber-500'
                    : 'bg-slate-800 border-slate-600 hover:border-slate-500'
                }`}
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                  selectedSlots.has('weekend') ? 'bg-amber-500 border-amber-500' : 'border-slate-500'
                }`}>
                  {selectedSlots.has('weekend') && <Check className="w-3 h-3 text-white" />}
                </div>
                <Users className="w-5 h-5 text-amber-500" />
                <span className="text-white">Weekend</span>
              </button>

              {/* Date Option */}
              <button
                onClick={() => toggleSlot('date')}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  selectedSlots.has('date')
                    ? 'bg-pink-600/20 border-pink-500'
                    : 'bg-slate-800 border-slate-600 hover:border-slate-500'
                }`}
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                  selectedSlots.has('date') ? 'bg-pink-500 border-pink-500' : 'border-slate-500'
                }`}>
                  {selectedSlots.has('date') && <Check className="w-3 h-3 text-white" />}
                </div>
                <Heart className="w-5 h-5 text-pink-500" />
                <span className="text-white">Date Night</span>
              </button>
            </div>

            {selectedSlots.size > 1 && (
              <div className="text-xs text-amber-400 bg-amber-900/20 border border-amber-700/30 rounded p-2">
                ✨ This person will appear in {selectedSlots.size} event slots!
              </div>
            )}

            <Button
              onClick={handleConfirm}
              disabled={selectedSlots.size === 0}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
            >
              Confirm ({selectedSlots.size} selected)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WeeklyOutreach;
