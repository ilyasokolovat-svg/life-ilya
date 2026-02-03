import React, { useState } from 'react';
import { Star, DollarSign, MessageSquare, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EventCompletionData, SocialExperience, SocialContact } from '@/types/social';

interface EventCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slotType: 'mid_week' | 'weekend' | 'date';
  experience: SocialExperience | null;
  guests: SocialContact[];
  onComplete: (data: EventCompletionData) => void;
}

const EventCompletionDialog: React.FC<EventCompletionDialogProps> = ({
  open,
  onOpenChange,
  slotType,
  experience,
  guests,
  onComplete,
}) => {
  const estimatedCost = experience ? experience.estimated_cost * Math.max(1, guests.length) : 0;
  
  const [vibeRating, setVibeRating] = useState(4);
  const [actualCost, setActualCost] = useState(estimatedCost.toString());
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    onComplete({
      vibeRating,
      actualCost: parseInt(actualCost) || 0,
      notes,
    });
    // Reset form
    setVibeRating(4);
    setActualCost(estimatedCost.toString());
    setNotes('');
    onOpenChange(false);
  };

  const slotLabel = slotType === 'mid_week' ? 'Mid-Week Event' : slotType === 'weekend' ? 'Weekend Event' : 'Date Night';
  const accentColor = slotType === 'date' ? 'pink' : 'amber';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <span>Complete {slotLabel}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Event Summary */}
          {experience && (
            <div className={`bg-slate-800 rounded-lg p-3 border border-slate-700`}>
              <div className="font-medium text-white">{experience.title}</div>
              {experience.location && (
                <div className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  {experience.location}
                </div>
              )}
              {guests.length > 0 && (
                <div className="text-sm text-slate-400 mt-1">
                  With: {guests.map(g => g.name).join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Vibe Rating */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              How was the vibe? ✨
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setVibeRating(star)}
                  className={`p-1 transition-colors ${
                    star <= vibeRating 
                      ? `text-${accentColor}-400` 
                      : 'text-slate-600 hover:text-slate-400'
                  }`}
                >
                  <Star 
                    className={`w-8 h-8 ${star <= vibeRating ? 'fill-current' : ''}`} 
                  />
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {vibeRating === 1 && "Meh, not great"}
              {vibeRating === 2 && "Could've been better"}
              {vibeRating === 3 && "Decent time"}
              {vibeRating === 4 && "Really good!"}
              {vibeRating === 5 && "Absolutely amazing! 🔥"}
            </div>
          </div>

          {/* Actual Cost */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Actual Cost (AED)
            </label>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="0"
              value={actualCost}
              onChange={(e) => setActualCost(e.target.value.replace(/[^0-9]/g, ''))}
              className="bg-slate-800 border-slate-600 text-white"
            />
            {estimatedCost > 0 && (
              <div className="text-xs text-slate-500 mt-1">
                Estimated was {estimatedCost} AED
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Memorable moments / Notes
            </label>
            <Textarea
              placeholder="What made this event special? Any memorable conversations?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-slate-800 border-slate-600 text-white min-h-[80px]"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              className={`flex-1 ${slotType === 'date' ? 'bg-pink-600 hover:bg-pink-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
            >
              Complete Event 🎉
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventCompletionDialog;
