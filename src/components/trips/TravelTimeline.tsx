import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MapPin, Calendar, Plane, PercentIcon } from 'lucide-react';
import { Trip } from '@/types/trip';
import { format, parseISO, getYear, differenceInDays, startOfYear, endOfYear, isWithinInterval } from 'date-fns';

interface TravelTimelineProps {
  trips: Trip[];
  onTripClick?: (trip: Trip) => void;
  showYearStats?: boolean;
}

const TravelTimeline: React.FC<TravelTimelineProps> = ({ trips, onTripClick, showYearStats = true }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Sort trips by date (oldest first for timeline)
  const sortedTrips = [...trips].sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  // Group trips by year
  const tripsByYear = sortedTrips.reduce((acc, trip) => {
    const year = getYear(parseISO(trip.startDate));
    if (!acc[year]) acc[year] = [];
    acc[year].push(trip);
    return acc;
  }, {} as Record<number, Trip[]>);

  const years = Object.keys(tripsByYear).map(Number).sort((a, b) => a - b);

  // Calculate travel stats for a year
  const calculateYearStats = (year: number) => {
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 0, 1));
    const now = new Date();
    const effectiveEnd = now < yearEnd ? now : yearEnd;
    
    let totalDays = 0;
    tripsByYear[year]?.forEach(trip => {
      const tripStart = parseISO(trip.startDate);
      const tripEnd = parseISO(trip.endDate);
      totalDays += differenceInDays(tripEnd, tripStart) + 1;
    });

    const daysInYear = year === now.getFullYear() 
      ? differenceInDays(effectiveEnd, yearStart) + 1
      : 365;
    const percentage = Math.round((totalDays / daysInYear) * 100);

    return { totalDays, percentage };
  };

  // Get notes from trip
  const getTripNotes = (trip: Trip): string | null => {
    const noteActivity = trip.plannedActivities?.find(a => a.category === 'notes' || a.category === 'note');
    return noteActivity?.text || null;
  };

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScroll);
      return () => ref.removeEventListener('scroll', checkScroll);
    }
  }, [trips]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (trips.length === 0) {
    return (
      <Card className="border-dashed border-2 border-muted">
        <CardContent className="p-8 text-center">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No trips yet. Start planning your adventures!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative">
      {/* Navigation buttons */}
      {canScrollLeft && (
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm shadow-lg"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}
      {canScrollRight && (
        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm shadow-lg"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}

      {/* Timeline scroll container */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto pb-4 px-8 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {years.map(year => {
          const stats = showYearStats ? calculateYearStats(year) : null;
          return (
          <div key={year} className="flex-shrink-0">
            {/* Year marker with stats */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg font-bold text-teal-600">{year}</span>
              {stats && (
                <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Plane className="h-3 w-3" />
                  {stats.totalDays}d ({stats.percentage}%)
                </span>
              )}
              <div className="h-px bg-gradient-to-r from-teal-400 to-teal-200 flex-1 min-w-[200px]" />
            </div>

            {/* Trips for this year */}
            <div className="flex gap-4">
              {tripsByYear[year].map(trip => {
                const notes = getTripNotes(trip);
                return (
                <Card
                  key={trip.id}
                  className="flex-shrink-0 w-72 cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1 border-teal-100 overflow-hidden group"
                  onClick={() => onTripClick?.(trip)}
                >
                  {/* Gradient header */}
                  <div className={`h-2 bg-gradient-to-r ${trip.isPastTrip ? 'from-gray-400 to-gray-500' : 'from-teal-400 to-cyan-400'}`} />
                  
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-foreground group-hover:text-teal-600 transition-colors line-clamp-1">
                      {trip.title}
                    </h4>
                    
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(parseISO(trip.startDate), 'MMM d')} - {format(parseISO(trip.endDate), 'MMM d')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      <span className="line-clamp-1">
                        {trip.destinations.map(d => d.name).join(', ') || 'No destinations'}
                      </span>
                    </div>

                    {notes && (
                      <div className="mt-3 pt-3 border-t border-muted">
                        <p className="text-xs text-muted-foreground italic line-clamp-3">
                          "{notes}"
                        </p>
                      </div>
                    )}

                    {trip.isPastTrip && !notes && (
                      <div className="mt-2">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          Past trip
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
              })}
            </div>
          </div>
        );
        })}
      </div>

      {/* Timeline line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-300 via-cyan-400 to-teal-300" />
    </div>
  );
};

export default TravelTimeline;
