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
import { Home, Loader2, Trash2, Plus } from 'lucide-react';
import { LivedInPeriod } from '@/hooks/useVisitedCountries';

interface LivedInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  countryName: string;
  countryCode: string;
  existingPeriods: LivedInPeriod[];
  onSave: (periods: LivedInPeriod[]) => Promise<void>;
  onRemove: () => Promise<void>;
  isRemoving: boolean;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const LivedInDialog: React.FC<LivedInDialogProps> = ({
  open,
  onOpenChange,
  countryName,
  countryCode,
  existingPeriods,
  onSave,
  onRemove,
  isRemoving,
}) => {
  const [periods, setPeriods] = useState<LivedInPeriod[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (existingPeriods.length > 0) {
        setPeriods(existingPeriods);
      } else {
        setPeriods([{ id: generateId(), startYear: undefined, endYear: undefined, notes: '' }]);
      }
    }
  }, [open, existingPeriods]);

  const addPeriod = () => {
    setPeriods([...periods, { id: generateId(), startYear: undefined, endYear: undefined, notes: '' }]);
  };

  const removePeriod = (id: string) => {
    if (periods.length > 1) {
      setPeriods(periods.filter(p => p.id !== id));
    }
  };

  const updatePeriod = (id: string, field: keyof LivedInPeriod, value: string | number | undefined) => {
    setPeriods(periods.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const handleSave = async () => {
    // Filter out empty periods
    const validPeriods = periods.filter(p => p.startYear || p.endYear || p.notes);
    
    if (validPeriods.length === 0) {
      // If no valid periods, just remove
      await onRemove();
      onOpenChange(false);
      return;
    }
    
    setIsSaving(true);
    try {
      await onSave(validPeriods);
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

  // Calculate total years across all periods
  const totalYears = periods.reduce((sum, p) => {
    const start = p.startYear || 0;
    const end = p.endYear || currentYear;
    return sum + Math.max(0, end - start);
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="h-5 w-5 text-amber-600" />
            Lived in {countryName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            Add the periods when you lived in {countryName}. You can add multiple periods.
          </p>

          {periods.map((period, index) => (
            <div 
              key={period.id} 
              className="p-4 rounded-lg border border-amber-200 bg-amber-50/50 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-amber-700">
                  Period {index + 1}
                </span>
                {periods.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePeriod(period.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">From Year</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 2015"
                    value={period.startYear || ''}
                    onChange={(e) => updatePeriod(period.id, 'startYear', e.target.value ? parseInt(e.target.value) : undefined)}
                    min={1900}
                    max={currentYear}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">To Year</Label>
                  <Input
                    type="number"
                    placeholder="Present"
                    value={period.endYear || ''}
                    onChange={(e) => updatePeriod(period.id, 'endYear', e.target.value ? parseInt(e.target.value) : undefined)}
                    min={1900}
                    max={currentYear + 10}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm">Notes (optional)</Label>
                <Textarea
                  placeholder="e.g. Studied at university, worked at..."
                  value={period.notes || ''}
                  onChange={(e) => updatePeriod(period.id, 'notes', e.target.value)}
                  className="mt-1 min-h-[60px]"
                />
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={addPeriod}
            className="w-full border-dashed border-amber-300 text-amber-600 hover:bg-amber-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Period
          </Button>

          {totalYears > 0 && (
            <div className="text-center p-3 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-lg">
              <span className="text-amber-700 font-medium">
                Total: ~{totalYears} years in {countryName}
              </span>
            </div>
          )}

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
                className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
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
