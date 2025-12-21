import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Trash2,
  Edit,
  Check,
  X
} from 'lucide-react';
import { Trip, Destination, ItineraryDay } from '@/types/trip';
import { format, parseISO } from 'date-fns';

interface PastTripSummaryProps {
  trip: Trip;
  onUpdate: (updates: Partial<Trip>) => void;
}

const PastTripSummary: React.FC<PastTripSummaryProps> = ({ trip, onUpdate }) => {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [editingDestination, setEditingDestination] = useState<number | null>(null);
  const [newCity, setNewCity] = useState('');

  const toggleDay = (date: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDays(newExpanded);
  };

  const expandAll = () => {
    setExpandedDays(new Set(trip.itinerary.map(day => day.date)));
  };

  const collapseAll = () => {
    setExpandedDays(new Set());
  };

  // City/Destination management
  const addCity = () => {
    if (!newCity.trim()) return;
    
    const newDestination: Destination = {
      name: newCity.trim(),
      startDate: trip.startDate,
      endDate: trip.endDate,
    };
    
    onUpdate({
      destinations: [...trip.destinations, newDestination]
    });
    setNewCity('');
  };

  const updateDestination = (index: number, updates: Partial<Destination>) => {
    const newDestinations = [...trip.destinations];
    newDestinations[index] = { ...newDestinations[index], ...updates };
    onUpdate({ destinations: newDestinations });
  };

  const removeDestination = (index: number) => {
    const newDestinations = trip.destinations.filter((_, i) => i !== index);
    onUpdate({ destinations: newDestinations });
  };

  // Itinerary day updates
  const updateDay = (date: string, updates: Partial<ItineraryDay>) => {
    const newItinerary = trip.itinerary.map(day =>
      day.date === date ? { ...day, ...updates } : day
    );
    onUpdate({ itinerary: newItinerary });
  };

  // Get trip notes from planned activities
  const tripNotes = trip.plannedActivities?.find(a => 
    a.category === 'notes' || a.category === 'note'
  )?.text || '';

  const updateTripNotes = (notes: string) => {
    const existingNoteIndex = trip.plannedActivities?.findIndex(a => 
      a.category === 'notes' || a.category === 'note'
    );
    
    let newActivities = [...(trip.plannedActivities || [])];
    
    if (existingNoteIndex !== undefined && existingNoteIndex >= 0) {
      newActivities[existingNoteIndex] = {
        ...newActivities[existingNoteIndex],
        text: notes
      };
    } else {
      newActivities.push({
        id: crypto.randomUUID(),
        category: 'notes',
        text: notes
      });
    }
    
    onUpdate({ plannedActivities: newActivities });
  };

  // Color palette for destinations
  const colors = [
    { bg: 'bg-teal-500', light: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', badge: 'bg-teal-100 text-teal-700' },
    { bg: 'bg-violet-500', light: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-700' },
    { bg: 'bg-rose-500', light: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-700' },
    { bg: 'bg-amber-500', light: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
    { bg: 'bg-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
  ];

  const getColorForIndex = (index: number) => colors[index % colors.length];

  return (
    <div className="space-y-6">
      {/* Cities/Destinations Section */}
      <Card className="border-2 border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-gray-700">
            <MapPin className="h-5 w-5" />
            Cities Visited
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing destinations */}
          <div className="flex flex-wrap gap-2">
            {trip.destinations.map((dest, index) => {
              const colorScheme = getColorForIndex(index);
              const isEditing = editingDestination === index;
              
              return (
                <div 
                  key={index}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full ${colorScheme.badge} transition-all`}
                >
                  {isEditing ? (
                    <>
                      <Input
                        value={dest.name}
                        onChange={(e) => updateDestination(index, { name: e.target.value })}
                        className="h-6 w-32 text-sm"
                        autoFocus
                      />
                      <button
                        onClick={() => setEditingDestination(null)}
                        className="hover:opacity-70"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="font-medium">{dest.name}</span>
                      <button
                        onClick={() => setEditingDestination(index)}
                        className="hover:opacity-70"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => removeDestination(index)}
                        className="hover:opacity-70 text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add new city */}
          <div className="flex gap-2">
            <Input
              placeholder="Add a city..."
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCity()}
              className="flex-1"
            />
            <Button
              onClick={addCity}
              variant="outline"
              size="icon"
              className="shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trip Notes/Memories */}
      <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-amber-700">
            <Calendar className="h-5 w-5" />
            Trip Memories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Write about your trip memories, highlights, feelings..."
            value={tripNotes}
            onChange={(e) => updateTripNotes(e.target.value)}
            className="min-h-[100px] bg-white/50"
          />
        </CardContent>
      </Card>

      {/* Day-by-Day Breakdown */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Calendar className="h-5 w-5" />
              Day-by-Day Summary
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={expandAll}
                className="text-xs text-purple-600 hover:text-purple-700"
              >
                Expand All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={collapseAll}
                className="text-xs text-purple-600 hover:text-purple-700"
              >
                Collapse All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {trip.itinerary.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No daily itinerary recorded for this trip.
            </p>
          ) : (
            <div className="space-y-2">
              {trip.itinerary.map((day) => {
                const isExpanded = expandedDays.has(day.date);
                const hasContent = day.activities || day.location || day.budget;
                
                return (
                  <div 
                    key={day.date}
                    className="border rounded-lg overflow-hidden bg-white"
                  >
                    {/* Day Header - Always visible */}
                    <button
                      onClick={() => toggleDay(day.date)}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-center min-w-[50px]">
                          <div className="text-xs text-muted-foreground">
                            {format(parseISO(day.date), 'EEE')}
                          </div>
                          <div className="text-lg font-bold text-purple-700">
                            {format(parseISO(day.date), 'd')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(parseISO(day.date), 'MMM')}
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-gray-800">
                            {day.location || 'No location set'}
                          </div>
                          {!isExpanded && day.activities && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {day.activities}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {day.budget && (
                          <span className="text-sm font-medium text-green-600">
                            {day.budget}
                          </span>
                        )}
                        {day.noAlcohol && (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                            🍵
                          </span>
                        )}
                        {day.sport && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            💪
                          </span>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="p-4 pt-0 space-y-3 border-t bg-gray-50/50">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-muted-foreground">Location</label>
                            <Input
                              placeholder="City/Area"
                              value={day.location}
                              onChange={(e) => updateDay(day.date, { location: e.target.value })}
                              className="mt-1 h-9"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Budget Spent</label>
                            <Input
                              placeholder="$0"
                              value={day.budget}
                              onChange={(e) => updateDay(day.date, { budget: e.target.value })}
                              className="mt-1 h-9"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">What did you do?</label>
                          <Textarea
                            placeholder="Describe your activities, experiences, memories..."
                            value={day.activities}
                            onChange={(e) => updateDay(day.date, { activities: e.target.value })}
                            className="mt-1 min-h-[80px]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PastTripSummary;
