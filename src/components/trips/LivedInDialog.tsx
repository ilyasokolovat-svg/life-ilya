import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Home, Loader2, Trash2 } from 'lucide-react';

interface LivedInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  countryName: string;
  countryCode: string;
  existingData?: {
    startYear?: number;
    endYear?: number;
    notes?: string;
  };
  onSave: (data: { startYear?: number; endYear?: number; notes?: string }) => Promise<void>;
  onRemove: () => Promise<void>;
  isRemoving: boolean;
}

const LivedInDialog: React.FC<LivedInDialogProps> = ({
  open,
  onOpenChange,
  countryName,
  countryCode,
  existingData,
  onSave,
  onRemove,
  isRemoving,
}) => {
  const [startYear, setStartYear] = useState<string>('');
  const [endYear, setEndYear] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setStartYear(existingData?.startYear?.toString() || '');
      setEndYear(existingData?.endYear?.toString() || '');
      setNotes(existingData?.notes || '');
    }
  }, [open, existingData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        startYear: startYear ? parseInt(startYear) : undefined,
        endYear: endYear ? parseInt(endYear) : undefined,
        notes: notes || undefined,
      });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    await onRemove();
    onOpenChange(false);
  };

  const currentYear = new Date().getFullYear();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="h-5 w-5 text-rose-500" />
            Lived in {countryName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            Add details about when you lived in {countryName}.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">From Year</Label>
              <Input
                type="number"
                placeholder="e.g. 2015"
                value={startYear}
                onChange={(e) => setStartYear(e.target.value)}
                min={1900}
                max={currentYear}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">To Year</Label>
              <Input
                type="number"
                placeholder={`e.g. ${currentYear}`}
                value={endYear}
                onChange={(e) => setEndYear(e.target.value)}
                min={1900}
                max={currentYear + 10}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty if still living there
              </p>
            </div>
          </div>

          <div>
            <Label className="text-sm">Notes (optional)</Label>
            <Textarea
              placeholder="e.g. Moved for work, studied at university..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 min-h-[80px]"
            />
          </div>

          <div className="flex justify-between gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleRemove}
              disabled={isRemoving || isSaving}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              {isRemoving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </>
              )}
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving || isRemoving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || isRemoving}
                className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LivedInDialog;
