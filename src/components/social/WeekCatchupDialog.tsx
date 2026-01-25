import React, { useState } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Calendar, Users, Star, DollarSign } from 'lucide-react';
import { WeeklySocialPlan, SocialContact, SocialExperience, EventCompletionData } from '@/types/social';

interface PendingEvent {
  plan: WeeklySocialPlan;
  experience: SocialExperience | null;
  guests: SocialContact[];
}

interface WeekCatchupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingEvents: PendingEvent[];
  onMarkComplete: (planId: string, completionData: EventCompletionData) => Promise<void>;
  onDismiss: (planId: string) => void;
  onDismissAll: () => void;
}

const SLOT_LABELS: Record<string, { label: string; color: string }> = {
  'mid_week': { label: 'Mid-Week Event', color: 'text-amber-400' },
  'weekend': { label: 'Weekend Event', color: 'text-amber-500' },
  'date': { label: 'Date Night', color: 'text-pink-400' },
};

const WeekCatchupDialog: React.FC<WeekCatchupDialogProps> = ({
  open,
  onOpenChange,
  pendingEvents,
  onMarkComplete,
  onDismiss,
  onDismissAll,
}) => {
  const [processing, setProcessing] = useState<string | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [completionData, setCompletionData] = useState<Record<string, EventCompletionData>>({});

  const getEventData = (planId: string, experience: SocialExperience | null): EventCompletionData => {
    return completionData[planId] || {
      vibeRating: 0,
      actualCost: experience?.estimated_cost || 0,
      notes: '',
    };
  };

  const updateEventData = (planId: string, field: keyof EventCompletionData, value: number | string) => {
    setCompletionData(prev => ({
      ...prev,
      [planId]: {
        ...getEventData(planId, null),
        [field]: value,
      },
    }));
  };

  const handleComplete = async (planId: string, experience: SocialExperience | null) => {
    const data = getEventData(planId, experience);
    if (data.vibeRating === 0) {
      // Expand to show the form if no rating
      setExpandedEvent(planId);
      return;
    }
    
    setProcessing(planId);
    try {
      await onMarkComplete(planId, data);
    } finally {
      setProcessing(null);
      setExpandedEvent(null);
    }
  };

  const handleExpandAndFill = (planId: string, experience: SocialExperience | null) => {
    if (!completionData[planId]) {
      setCompletionData(prev => ({
        ...prev,
        [planId]: {
          vibeRating: 0,
          actualCost: experience?.estimated_cost || 0,
          notes: '',
        },
      }));
    }
    setExpandedEvent(expandedEvent === planId ? null : planId);
  };

  if (pendingEvents.length === 0) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-slate-900 border-slate-700 max-w-lg max-h-[85vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            Weekly Catchup
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-400">
            You had {pendingEvents.length} planned event{pendingEvents.length > 1 ? 's' : ''} last week. Did {pendingEvents.length > 1 ? 'they' : 'it'} happen?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 my-4">
          {pendingEvents.map(({ plan, experience, guests }) => {
            const slotInfo = SLOT_LABELS[plan.slot_type || ''] || { label: 'Event', color: 'text-slate-400' };
            const isProcessing = processing === plan.id;
            const isExpanded = expandedEvent === plan.id;
            const eventData = getEventData(plan.id, experience);

            return (
              <div
                key={plan.id}
                className="bg-slate-800 rounded-lg p-3 border border-slate-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-medium ${slotInfo.color}`}>
                      {slotInfo.label}
                    </span>
                    {experience && (
                      <p className="text-sm text-white font-medium mt-0.5">
                        {experience.title}
                      </p>
                    )}
                    {guests.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                        <Users className="w-3 h-3" />
                        {guests.map(g => g.name).join(', ')}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      onClick={() => onDismiss(plan.id)}
                      disabled={isProcessing}
                    >
                      <XCircle className="w-5 h-5" />
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleExpandAndFill(plan.id, experience)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Yes
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Expanded completion form */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-700 space-y-4">
                    {/* Vibe Rating */}
                    <div>
                      <label className="text-xs text-slate-400 mb-2 block">How was the vibe?</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => updateEventData(plan.id, 'vibeRating', star)}
                            className="p-1 transition-transform hover:scale-110"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                star <= eventData.vibeRating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-600'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Actual Cost */}
                    <div>
                      <label className="text-xs text-slate-400 mb-2 block">Actual money spent (AED)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                          type="number"
                          value={eventData.actualCost}
                          onChange={(e) => updateEventData(plan.id, 'actualCost', parseInt(e.target.value) || 0)}
                          className="pl-9 bg-slate-900 border-slate-600 text-white"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="text-xs text-slate-400 mb-2 block">Anything memorable?</label>
                      <Textarea
                        value={eventData.notes}
                        onChange={(e) => updateEventData(plan.id, 'notes', e.target.value)}
                        className="bg-slate-900 border-slate-600 text-white resize-none"
                        placeholder="Key moments, insights, or things to remember..."
                        rows={2}
                      />
                    </div>

                    {/* Submit Button */}
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleComplete(plan.id, experience)}
                      disabled={isProcessing || eventData.vibeRating === 0}
                    >
                      {isProcessing ? (
                        <span className="animate-pulse">Saving...</span>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Complete & Archive
                        </>
                      )}
                    </Button>
                    {eventData.vibeRating === 0 && (
                      <p className="text-xs text-amber-400 text-center">Please rate the vibe to continue</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            onClick={onDismissAll}
            className="text-slate-400 hover:text-white"
          >
            Dismiss All
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            I'll review later
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default WeekCatchupDialog;
