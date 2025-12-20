import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarDays, Wine, Dumbbell } from 'lucide-react';
import { ItineraryDay, Destination } from '@/types/trip';
import { format, parseISO, isWithinInterval, isSameDay } from 'date-fns';

interface TripItineraryProps {
  itinerary: ItineraryDay[];
  destinations: Destination[];
  onUpdate: (itinerary: ItineraryDay[]) => void;
}

const TripItinerary: React.FC<TripItineraryProps> = ({ itinerary, destinations, onUpdate }) => {
  const updateDay = (date: string, updates: Partial<ItineraryDay>) => {
    onUpdate(itinerary.map(day => 
      day.date === date ? { ...day, ...updates } : day
    ));
  };

  // Get destination for a specific date
  const getDestinationForDate = (dateStr: string): Destination | null => {
    const date = parseISO(dateStr);
    return destinations.find(dest => {
      const start = parseISO(dest.startDate);
      const end = parseISO(dest.endDate);
      return isWithinInterval(date, { start, end }) || isSameDay(date, start) || isSameDay(date, end);
    }) || null;
  };

  // Check if date is a transition day (belongs to two destinations)
  const isTransitionDay = (dateStr: string): boolean => {
    const date = parseISO(dateStr);
    let count = 0;
    destinations.forEach(dest => {
      const start = parseISO(dest.startDate);
      const end = parseISO(dest.endDate);
      if (isWithinInterval(date, { start, end }) || isSameDay(date, start) || isSameDay(date, end)) {
        count++;
      }
    });
    return count > 1;
  };

  // Group itinerary by destination segments
  const getDestinationSegments = () => {
    const segments: { destination: Destination; days: ItineraryDay[] }[] = [];
    let currentDest: Destination | null = null;
    let currentDays: ItineraryDay[] = [];

    itinerary.forEach(day => {
      const dest = getDestinationForDate(day.date);
      if (dest && dest !== currentDest) {
        if (currentDest && currentDays.length > 0) {
          segments.push({ destination: currentDest, days: currentDays });
        }
        currentDest = dest;
        currentDays = [day];
      } else {
        currentDays.push(day);
      }
    });

    if (currentDest && currentDays.length > 0) {
      segments.push({ destination: currentDest, days: currentDays });
    }

    return segments;
  };

  const segments = getDestinationSegments();

  // Color palette for destinations
  const colors = [
    { bg: 'from-teal-500 to-cyan-500', light: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700' },
    { bg: 'from-violet-500 to-purple-500', light: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' },
    { bg: 'from-rose-500 to-pink-500', light: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' },
    { bg: 'from-amber-500 to-orange-500', light: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
    { bg: 'from-emerald-500 to-green-500', light: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  ];

  const getColorForDestination = (destName: string) => {
    const index = destinations.findIndex(d => d.name === destName);
    return colors[index % colors.length];
  };

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-purple-700">
          <CalendarDays className="h-5 w-5" />
          Daily Itinerary
        </CardTitle>
      </CardHeader>
      <CardContent>
        {segments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No itinerary days yet.
          </p>
        ) : (
          <div className="space-y-6">
            {segments.map((segment, segIndex) => {
              const colorScheme = getColorForDestination(segment.destination.name);
              
              return (
                <div key={segIndex} className="flex gap-3">
                  {/* Vertical destination indicator */}
                  <div className="flex flex-col items-center">
                    <div 
                      className={`w-10 rounded-lg bg-gradient-to-b ${colorScheme.bg} flex items-center justify-center shadow-md`}
                      style={{ minHeight: `${segment.days.length * 140}px` }}
                    >
                      <span 
                        className="text-white font-bold text-sm whitespace-nowrap"
                        style={{ 
                          writingMode: 'vertical-rl', 
                          textOrientation: 'mixed',
                          transform: 'rotate(180deg)'
                        }}
                      >
                        {segment.destination.name}
                      </span>
                    </div>
                  </div>

                  {/* Days */}
                  <div className="flex-1 space-y-3">
                    {segment.days.map((day, dayIndex) => {
                      const isTransition = isTransitionDay(day.date);
                      
                      return (
                        <div 
                          key={day.date} 
                          className={`p-4 rounded-lg border transition-all duration-200 ${
                            day.noAlcohol 
                              ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 ring-1 ring-emerald-200' 
                              : 'bg-white ' + colorScheme.border
                          } ${isTransition ? 'ring-2 ring-offset-1 ring-purple-300' : ''}`}
                        >
                        <div className="flex flex-col sm:grid sm:grid-cols-12 gap-3 items-start">
                            {/* Date - always visible at top on mobile */}
                            <div className="w-full sm:w-auto sm:col-span-2">
                              <div className={`text-center p-2 rounded-lg ${day.noAlcohol ? 'bg-emerald-100' : colorScheme.light} sm:block flex items-center justify-between sm:justify-center gap-2`}>
                                <div className="flex sm:flex-col items-center gap-1 sm:gap-0">
                                  <div className={`text-xs font-medium ${day.noAlcohol ? 'text-emerald-700' : colorScheme.text}`}>
                                    {format(parseISO(day.date), 'EEE')}
                                  </div>
                                  <div className={`text-lg font-bold ${day.noAlcohol ? 'text-emerald-700' : colorScheme.text}`}>
                                    {format(parseISO(day.date), 'd')}
                                  </div>
                                  <div className={`text-xs ${day.noAlcohol ? 'text-emerald-700' : colorScheme.text}`}>
                                    {format(parseISO(day.date), 'MMM')}
                                  </div>
                                </div>
                                {/* Mobile-only wellness toggles inline with date */}
                                <div className="flex sm:hidden items-center gap-3">
                                  <div className="flex items-center gap-1">
                                    <Checkbox
                                      id={`no-alcohol-mobile-${day.date}`}
                                      checked={day.noAlcohol || false}
                                      onCheckedChange={(checked) => updateDay(day.date, { noAlcohol: !!checked })}
                                      className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 h-4 w-4"
                                    />
                                    <label 
                                      htmlFor={`no-alcohol-mobile-${day.date}`} 
                                      className="text-xs text-muted-foreground flex items-center gap-1 cursor-pointer"
                                    >
                                      <Wine className="h-3 w-3" />
                                    </label>
                                  </div>
                                  
                                  <div className="flex items-center gap-1">
                                    <Checkbox
                                      id={`sport-mobile-${day.date}`}
                                      checked={day.sport || false}
                                      onCheckedChange={(checked) => {
                                        updateDay(day.date, { 
                                          sport: !!checked, 
                                          sportLocation: checked ? day.sportLocation : '' 
                                        });
                                      }}
                                      className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 h-4 w-4"
                                    />
                                    <label 
                                      htmlFor={`sport-mobile-${day.date}`} 
                                      className="text-xs text-muted-foreground flex items-center gap-1 cursor-pointer"
                                    >
                                      <Dumbbell className="h-3 w-3" />
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Location & Budget row on mobile */}
                            <div className="w-full grid grid-cols-2 gap-2 sm:contents">
                              <div className="sm:col-span-2">
                                <label className="text-xs text-muted-foreground">Location</label>
                                <Input
                                  placeholder="City/Area"
                                  value={day.location}
                                  onChange={(e) => updateDay(day.date, { location: e.target.value })}
                                  className="mt-1 h-9"
                                />
                              </div>

                              <div className="sm:col-span-1 sm:order-last">
                                <label className="text-xs text-muted-foreground">Budget</label>
                                <Input
                                  placeholder="$0"
                                  value={day.budget}
                                  onChange={(e) => updateDay(day.date, { budget: e.target.value })}
                                  className="mt-1 h-9"
                                />
                              </div>
                            </div>

                            {/* Activities */}
                            <div className="w-full sm:col-span-5">
                              <label className="text-xs text-muted-foreground">Activities</label>
                              <Textarea
                                placeholder="What are you doing this day?"
                                value={day.activities}
                                onChange={(e) => updateDay(day.date, { activities: e.target.value })}
                                className="mt-1 min-h-[60px] resize-none"
                              />
                            </div>

                            {/* Sport location on mobile when sport is checked */}
                            {day.sport && (
                              <div className="w-full sm:hidden">
                                <label className="text-xs text-muted-foreground">Sport location</label>
                                <Input
                                  placeholder="Where?"
                                  value={day.sportLocation || ''}
                                  onChange={(e) => updateDay(day.date, { sportLocation: e.target.value })}
                                  className="mt-1 h-9"
                                />
                              </div>
                            )}

                            {/* Desktop-only wellness toggles */}
                            <div className="hidden sm:block sm:col-span-2 space-y-2">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`no-alcohol-${day.date}`}
                                  checked={day.noAlcohol || false}
                                  onCheckedChange={(checked) => updateDay(day.date, { noAlcohol: !!checked })}
                                  className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                                />
                                <label 
                                  htmlFor={`no-alcohol-${day.date}`} 
                                  className="text-xs text-muted-foreground flex items-center gap-1 cursor-pointer"
                                >
                                  <Wine className="h-3 w-3" />
                                  No alcohol
                                </label>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`sport-${day.date}`}
                                  checked={day.sport || false}
                                  onCheckedChange={(checked) => {
                                    updateDay(day.date, { 
                                      sport: !!checked, 
                                      sportLocation: checked ? day.sportLocation : '' 
                                    });
                                  }}
                                  className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                                />
                                <label 
                                  htmlFor={`sport-${day.date}`} 
                                  className="text-xs text-muted-foreground flex items-center gap-1 cursor-pointer"
                                >
                                  <Dumbbell className="h-3 w-3" />
                                  Sport
                                </label>
                              </div>

                              {day.sport && (
                                <Input
                                  placeholder="Where?"
                                  value={day.sportLocation || ''}
                                  onChange={(e) => updateDay(day.date, { sportLocation: e.target.value })}
                                  className="h-7 text-xs mt-1"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TripItinerary;
