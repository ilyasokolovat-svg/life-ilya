import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Plane } from 'lucide-react';
import { Flight } from '@/types/trip';

interface FlightSectionProps {
  flights: Flight[];
  onUpdate: (flights: Flight[]) => void;
}

const FlightSection: React.FC<FlightSectionProps> = ({ flights, onUpdate }) => {
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

  return (
    <Card className="border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sky-700">
            <Plane className="h-5 w-5" />
            Flights
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={addFlight}
            className="gap-1 border-sky-300 text-sky-600 hover:bg-sky-100"
          >
            <Plus className="h-4 w-4" /> Add Flight
          </Button>
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

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
