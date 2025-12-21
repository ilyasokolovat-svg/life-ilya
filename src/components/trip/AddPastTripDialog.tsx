import React, { useState } from 'react';
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
import { Plus, Trash2, MapPin, Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface DestinationEntry {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  notes: string;
}

interface AddPastTripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (destinations: DestinationEntry[]) => Promise<void>;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const AddPastTripDialog: React.FC<AddPastTripDialogProps> = ({
  open,
  onOpenChange,
  onSave,
}) => {
  const [destinations, setDestinations] = useState<DestinationEntry[]>([
    { id: generateId(), name: '', startDate: '', endDate: '', notes: '' }
  ]);
  const [isSaving, setIsSaving] = useState(false);

  const addDestination = () => {
    setDestinations([
      ...destinations,
      { id: generateId(), name: '', startDate: '', endDate: '', notes: '' }
    ]);
  };

  const removeDestination = (id: string) => {
    if (destinations.length > 1) {
      setDestinations(destinations.filter(d => d.id !== id));
    }
  };

  const updateDestination = (id: string, field: keyof DestinationEntry, value: string) => {
    setDestinations(destinations.map(d => 
      d.id === id ? { ...d, [field]: value } : d
    ));
  };

  const handleSave = async () => {
    // Validate all destinations have required fields
    const validDestinations = destinations.filter(d => 
      d.name.trim() && d.startDate && d.endDate
    );
    
    if (validDestinations.length === 0) return;
    
    setIsSaving(true);
    try {
      await onSave(validDestinations);
      // Reset form
      setDestinations([{ id: generateId(), name: '', startDate: '', endDate: '', notes: '' }]);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const isValid = destinations.some(d => d.name.trim() && d.startDate && d.endDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-amber-500" />
            Add Past Trip
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <p className="text-sm text-muted-foreground">
            Add one or more destinations from your past travels. Each destination will be added as a separate trip in your journey timeline.
          </p>

          {destinations.map((dest, index) => (
            <div 
              key={dest.id} 
              className="p-4 rounded-lg border border-amber-200 bg-amber-50/50 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-amber-700">
                  Destination {index + 1}
                </span>
                {destinations.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDestination(dest.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm">Destination Name</Label>
                  <Input
                    placeholder="e.g., Thailand, Paris, Bali..."
                    value={dest.name}
                    onChange={(e) => updateDestination(dest.id, 'name', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Start Date
                    </Label>
                    <Input
                      type="date"
                      value={dest.startDate}
                      onChange={(e) => updateDestination(dest.id, 'startDate', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      End Date
                    </Label>
                    <Input
                      type="date"
                      value={dest.endDate}
                      onChange={(e) => updateDestination(dest.id, 'endDate', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Notes (optional)</Label>
                  <Textarea
                    placeholder="Memories, highlights, who you traveled with..."
                    value={dest.notes}
                    onChange={(e) => updateDestination(dest.id, 'notes', e.target.value)}
                    className="mt-1 min-h-[80px]"
                  />
                </div>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={addDestination}
            className="w-full border-dashed border-amber-300 text-amber-600 hover:bg-amber-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Destination
          </Button>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!isValid || isSaving}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save to Timeline'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddPastTripDialog;
