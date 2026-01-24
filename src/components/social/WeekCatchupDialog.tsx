import React, { useState } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Calendar, Users } from 'lucide-react';
import { WeeklySocialPlan, SocialContact, SocialExperience } from '@/types/social';

interface PendingEvent {
  plan: WeeklySocialPlan;
  experience: SocialExperience | null;
  guests: SocialContact[];
}

interface WeekCatchupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingEvents: PendingEvent[];
  onMarkComplete: (planId: string) => Promise<void>;
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

  const handleComplete = async (planId: string) => {
    setProcessing(planId);
    try {
      await onMarkComplete(planId);
    } finally {
      setProcessing(null);
    }
  };

  if (pendingEvents.length === 0) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-slate-900 border-slate-700 max-w-md">
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
                      onClick={() => handleComplete(plan.id)}
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
