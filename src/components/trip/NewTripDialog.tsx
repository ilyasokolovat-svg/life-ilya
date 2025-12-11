import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { Destination } from '@/types/trip';
import { format } from 'date-fns';

interface NewTripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTrip: (
    title: string,
    startDate: string,
    endDate: string,
    destinations: Destination[],
    budget: string
  ) => void;
}

const NewTripDialog: React.FC<NewTripDialogProps> = ({
  open,
  onOpenChange,
  onCreateTrip
}) => {
  const [destinations, setDestinations] = useState<Destination[]>([
    { name: '', startDate: '', endDate: '' }
  ]);
  const [budget, setBudget] = useState('');

  const addDestination = () => {
    setDestinations(prev => [...prev, { name: '', startDate: '', endDate: '' }]);
  };

  const removeDestination = (index: number) => {
    if (destinations.length > 1) {
      setDestinations(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateDestination = (index: number, field: keyof Destination, value: string) => {
    setDestinations(prev => prev.map((dest, i) => 
      i === index ? { ...dest, [field]: value } : dest
    ));
  };

  const handleSubmit = () => {
    const validDestinations = destinations.filter(d => d.name && d.startDate && d.endDate);
    if (validDestinations.length === 0) return;

    const allDates = validDestinations.flatMap(d => [d.startDate, d.endDate]);
    const startDate = allDates.sort()[0];
    const endDate = allDates.sort().reverse()[0];
    
    const title = validDestinations.map(d => d.name).join(' → ');
    const year = new Date(startDate).getFullYear();

    onCreateTrip(`${title} ${year}`, startDate, endDate, validDestinations, budget);
    
    // Reset form
    setDestinations([{ name: '', startDate: '', endDate: '' }]);
    setBudget('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Plan a New Trip</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Destinations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Destinations</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addDestination}
                className="gap-1"
              >
                <Plus className="h-4 w-4" /> Add Destination
              </Button>
            </div>

            {destinations.map((dest, index) => (
              <div 
                key={index} 
                className="p-4 border rounded-lg bg-gradient-to-r from-teal-50 to-cyan-50 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-teal-700">
                    Destination {index + 1}
                  </span>
                  {destinations.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDestination(index)}
                      className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div>
                  <Label className="text-sm">Location</Label>
                  <Input
                    placeholder="e.g., South Africa"
                    value={dest.name}
                    onChange={(e) => updateDestination(index, 'name', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Start Date</Label>
                    <Input
                      type="date"
                      value={dest.startDate}
                      onChange={(e) => updateDestination(index, 'startDate', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">End Date</Label>
                    <Input
                      type="date"
                      value={dest.endDate}
                      onChange={(e) => updateDestination(index, 'endDate', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Budget */}
          <div>
            <Label className="text-lg font-semibold">Total Budget</Label>
            <Input
              placeholder="e.g., $5,000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* Submit */}
          <Button 
            onClick={handleSubmit} 
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
            disabled={!destinations.some(d => d.name && d.startDate && d.endDate)}
          >
            Create Trip Plan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewTripDialog;
