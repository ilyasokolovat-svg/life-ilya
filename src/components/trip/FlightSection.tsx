import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Plane, Edit, PlaneTakeoff, PlaneLanding, DollarSign } from 'lucide-react';
import { Flight } from '@/types/trip';
import { format, parseISO } from 'date-fns';

interface FlightSectionProps {
  flights: Flight[];
  onUpdate: (flights: Flight[]) => void;
  isEditMode: boolean;
  onEditModeChange: (editMode: boolean) => void;
}

const FlightSection: React.FC<FlightSectionProps> = ({ flights, onUpdate, isEditMode, onEditModeChange }) => {
  const addFlight = () => {
    const newFlight: Flight = {
      id: Date.now().toString(),
      date: '',
      from: '',
      to: '',
      airline: '',
      flightNumber: '',
      departureTime: '',
      arrivalTime: '',
      cost: '',
      notes: ''
    };
    onUpdate([...flights, newFlight]);
  };

  const removeFlight = (id: string) => {
    onUpdate(flights.filter(f => f.id !== id));
  };

  const updateFlight = (id: string, field: keyof Flight, value: string) => {
    onUpdate(flights.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const formatTime = (time: string) => {
    if (!time) return '--:--';
    return time;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Date TBD';
    try {
      return format(parseISO(dateStr), 'EEE, MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  // Display Mode
  if (!isEditMode) {
    return (
      <Card className="border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sky-700">
              <Plane className="h-5 w-5" />
              Flights
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onEditModeChange(true)}
              className="gap-1 border-sky-300 text-sky-600 hover:bg-sky-100"
            >
              <Edit className="h-4 w-4" /> Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {flights.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No flights added yet.
            </p>
          ) : (
            flights.map((flight) => (
              <div 
                key={flight.id} 
                className="relative bg-white rounded-xl border border-sky-100 shadow-sm overflow-hidden"
              >
                {/* Ticket styling with dashed edge */}
                <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-b from-sky-400 to-blue-500" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-sky-50 rounded-l-full border-l border-y border-sky-100" />
                
                <div className="pl-6 pr-8 py-4">
                  {/* Airline and Flight Number */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sky-700 text-lg">{flight.airline || 'Airline TBD'}</span>
                      {flight.flightNumber && (
                        <span className="px-2 py-0.5 bg-sky-100 rounded text-sky-600 text-sm font-medium">
                          {flight.flightNumber}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {flight.cost && (
                        <span className="flex items-center gap-1 text-green-600 font-semibold">
                          <DollarSign className="h-4 w-4" />
                          {flight.cost}
                        </span>
                      )}
                      <span className="text-sm text-gray-500">{formatDate(flight.date)}</span>
                    </div>
                  </div>

                  {/* Route Display */}
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <PlaneTakeoff className="h-5 w-5 text-sky-500 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-gray-800">{formatTime(flight.departureTime)}</p>
                      <p className="text-lg font-semibold text-gray-700">{flight.from || 'Origin'}</p>
                    </div>

                    <div className="flex-1 px-4">
                      <div className="relative flex items-center justify-center">
                        <div className="absolute w-full border-t-2 border-dashed border-sky-300" />
                        <Plane className="relative h-6 w-6 text-sky-500 bg-white px-1 transform rotate-90" />
                      </div>
                    </div>

                    <div className="text-center">
                      <PlaneLanding className="h-5 w-5 text-sky-500 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-gray-800">{formatTime(flight.arrivalTime)}</p>
                      <p className="text-lg font-semibold text-gray-700">{flight.to || 'Destination'}</p>
                    </div>
                  </div>

                  {/* Notes */}
                  {flight.notes && (
                    <p className="mt-3 text-sm text-gray-500 italic border-t border-sky-100 pt-2">
                      {flight.notes}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    );
  }

  // Edit Mode
  return (
    <Card className="border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sky-700">
            <Plane className="h-5 w-5" />
            Flights
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={addFlight}
              className="gap-1 border-sky-300 text-sky-600 hover:bg-sky-100"
            >
              <Plus className="h-4 w-4" /> Add Flight
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => onEditModeChange(false)}
              className="gap-1 bg-sky-600 hover:bg-sky-700"
            >
              Done
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {flights.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No flights added yet. Click "Add Flight" to begin.
          </p>
        ) : (
          flights.map((flight, index) => (
            <div 
              key={flight.id} 
              className="p-4 bg-white rounded-lg border border-sky-100 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sky-700">Flight {index + 1}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFlight(flight.id)}
                  className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">Date</Label>
                  <Input
                    type="date"
                    value={flight.date}
                    onChange={(e) => updateFlight(flight.id, 'date', e.target.value)}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">From</Label>
                  <Input
                    placeholder="City/Airport"
                    value={flight.from}
                    onChange={(e) => updateFlight(flight.id, 'from', e.target.value)}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">To</Label>
                  <Input
                    placeholder="City/Airport"
                    value={flight.to}
                    onChange={(e) => updateFlight(flight.id, 'to', e.target.value)}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Airline</Label>
                  <Input
                    placeholder="Airline name"
                    value={flight.airline}
                    onChange={(e) => updateFlight(flight.id, 'airline', e.target.value)}
                    className="mt-1 h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                  <Label className="text-xs">Flight #</Label>
                  <Input
                    placeholder="e.g., EK123"
                    value={flight.flightNumber}
                    onChange={(e) => updateFlight(flight.id, 'flightNumber', e.target.value)}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Departure</Label>
                  <Input
                    type="time"
                    value={flight.departureTime}
                    onChange={(e) => updateFlight(flight.id, 'departureTime', e.target.value)}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Arrival</Label>
                  <Input
                    type="time"
                    value={flight.arrivalTime}
                    onChange={(e) => updateFlight(flight.id, 'arrivalTime', e.target.value)}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Cost</Label>
                  <Input
                    placeholder="e.g., $350"
                    value={flight.cost}
                    onChange={(e) => updateFlight(flight.id, 'cost', e.target.value)}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Notes</Label>
                  <Input
                    placeholder="Optional notes"
                    value={flight.notes}
                    onChange={(e) => updateFlight(flight.id, 'notes', e.target.value)}
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

export default FlightSection;
