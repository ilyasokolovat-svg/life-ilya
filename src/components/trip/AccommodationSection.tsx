import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Building2, Edit, MapPin, Calendar, Hash } from 'lucide-react';
import { Accommodation } from '@/types/trip';
import { format, parseISO, differenceInDays } from 'date-fns';

interface AccommodationSectionProps {
  accommodations: Accommodation[];
  onUpdate: (accommodations: Accommodation[]) => void;
  isEditMode: boolean;
  onEditModeChange: (editMode: boolean) => void;
}

const AccommodationSection: React.FC<AccommodationSectionProps> = ({ accommodations, onUpdate, isEditMode, onEditModeChange }) => {
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'TBD';
    try {
      return format(parseISO(dateStr), 'EEE, MMM d');
    } catch {
      return dateStr;
    }
  };

  const getNights = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return null;
    try {
      const nights = differenceInDays(parseISO(checkOut), parseISO(checkIn));
      return nights > 0 ? nights : null;
    } catch {
      return null;
    }
  };

  // Display Mode
  if (!isEditMode) {
    return (
      <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <Building2 className="h-5 w-5" />
              Accommodations
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onEditModeChange(true)}
              className="gap-1 border-amber-300 text-amber-600 hover:bg-amber-100"
            >
              <Edit className="h-4 w-4" /> Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {accommodations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No accommodations added yet.
            </p>
          ) : (
            accommodations.map((acc) => {
              const nights = getNights(acc.checkIn, acc.checkOut);
              return (
                <div 
                  key={acc.id} 
                  className="relative bg-white rounded-xl border border-amber-100 shadow-sm overflow-hidden"
                >
                  {/* Hotel card styling */}
                  <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-b from-amber-400 to-orange-500" />
                  
                  <div className="pl-6 pr-4 py-4">
                    {/* Hotel Name and Confirmation */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-amber-800 text-lg">{acc.name || 'Hotel TBD'}</h3>
                        <div className="flex items-center gap-1 text-gray-500 text-sm mt-0.5">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{acc.location || 'Location TBD'}</span>
                        </div>
                      </div>
                      {acc.confirmationNumber && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 rounded text-amber-700 text-sm">
                          <Hash className="h-3.5 w-3.5" />
                          <span className="font-mono">{acc.confirmationNumber}</span>
                        </div>
                      )}
                    </div>

                    {/* Check-in/out Display */}
                    <div className="flex items-center gap-6 mt-4">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Check-in</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4 text-amber-500" />
                          <span className="font-semibold text-gray-800">{formatDate(acc.checkIn)}</span>
                        </div>
                      </div>

                      {nights && (
                        <div className="flex flex-col items-center px-4">
                          <div className="w-16 border-t-2 border-dashed border-amber-300 relative">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-100 px-2 py-0.5 rounded-full text-xs font-medium text-amber-700">
                              {nights} night{nights > 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex-1 text-right">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Check-out</p>
                        <div className="flex items-center gap-2 mt-1 justify-end">
                          <span className="font-semibold text-gray-800">{formatDate(acc.checkOut)}</span>
                          <Calendar className="h-4 w-4 text-amber-500" />
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {acc.notes && (
                      <p className="mt-3 text-sm text-gray-500 italic border-t border-amber-100 pt-2">
                        {acc.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    );
  }

  // Edit Mode
  return (
    <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-amber-700">
            <Building2 className="h-5 w-5" />
            Accommodations
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={addAccommodation}
              className="gap-1 border-amber-300 text-amber-600 hover:bg-amber-100"
            >
              <Plus className="h-4 w-4" /> Add Accommodation
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => onEditModeChange(false)}
              className="gap-1 bg-amber-600 hover:bg-amber-700"
            >
              Done
            </Button>
          </div>
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
