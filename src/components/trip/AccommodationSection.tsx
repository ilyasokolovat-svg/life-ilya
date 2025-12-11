import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Building2 } from 'lucide-react';
import { Accommodation } from '@/types/trip';

interface AccommodationSectionProps {
  accommodations: Accommodation[];
  onUpdate: (accommodations: Accommodation[]) => void;
}

const AccommodationSection: React.FC<AccommodationSectionProps> = ({ accommodations, onUpdate }) => {
  const addAccommodation = () => {
    const newAccommodation: Accommodation = {
      id: Date.now().toString(),
      name: '',
      location: '',
      checkIn: '',
      checkOut: '',
      confirmationNumber: '',
      notes: ''
    };
    onUpdate([...accommodations, newAccommodation]);
  };

  const removeAccommodation = (id: string) => {
    onUpdate(accommodations.filter(a => a.id !== id));
  };

  const updateAccommodation = (id: string, field: keyof Accommodation, value: string) => {
    onUpdate(accommodations.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  return (
    <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-amber-700">
            <Building2 className="h-5 w-5" />
            Accommodations
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={addAccommodation}
            className="gap-1 border-amber-300 text-amber-600 hover:bg-amber-100"
          >
            <Plus className="h-4 w-4" /> Add Accommodation
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {accommodations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No accommodations added yet. Click "Add Accommodation" to begin.
          </p>
        ) : (
          accommodations.map((acc, index) => (
            <div 
              key={acc.id} 
              className="p-4 bg-white rounded-lg border border-amber-100 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-amber-700">Accommodation {index + 1}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAccommodation(acc.id)}
                  className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Hotel/Property Name</Label>
                  <Input
                    placeholder="e.g., Marriott Downtown"
                    value={acc.name}
                    onChange={(e) => updateAccommodation(acc.id, 'name', e.target.value)}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Location</Label>
                  <Input
                    placeholder="City or address"
                    value={acc.location}
                    onChange={(e) => updateAccommodation(acc.id, 'location', e.target.value)}
                    className="mt-1 h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">Check-in</Label>
                  <Input
                    type="date"
                    value={acc.checkIn}
                    onChange={(e) => updateAccommodation(acc.id, 'checkIn', e.target.value)}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Check-out</Label>
                  <Input
                    type="date"
                    value={acc.checkOut}
                    onChange={(e) => updateAccommodation(acc.id, 'checkOut', e.target.value)}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Confirmation #</Label>
                  <Input
                    placeholder="Booking reference"
                    value={acc.confirmationNumber}
                    onChange={(e) => updateAccommodation(acc.id, 'confirmationNumber', e.target.value)}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Notes</Label>
                  <Input
                    placeholder="Optional notes"
                    value={acc.notes}
                    onChange={(e) => updateAccommodation(acc.id, 'notes', e.target.value)}
                    className="mt-1 h-9"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default AccommodationSection;
