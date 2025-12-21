import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MapPin, Calendar } from 'lucide-react';
import { Trip } from '@/types/trip';
import { format, parseISO, getYear } from 'date-fns';

interface TravelTimelineProps {
  trips: Trip[];
  onTripClick?: (trip: Trip) => void;
}

const TravelTimeline: React.FC<TravelTimelineProps> = ({ trips, onTripClick }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Sort trips by date (newest first)
  const sortedTrips = [...trips].sort((a, b) => 
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  // Group trips by year
  const tripsByYear = sortedTrips.reduce((acc, trip) => {
    const year = getYear(parseISO(trip.startDate));
    if (!acc[year]) acc[year] = [];
    acc[year].push(trip);
    return acc;
  }, {} as Record<number, Trip[]>);

  const years = Object.keys(tripsByYear).map(Number).sort((a, b) => b - a);

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
        {years.map(year => (
          <div key={year} className="flex-shrink-0">
            {/* Year marker */}
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px bg-gradient-to-r from-teal-500 to-transparent w-8" />
              <span className="text-lg font-bold text-teal-600">{year}</span>
              <div className="h-px bg-gradient-to-l from-teal-500 to-transparent w-8" />
            </div>

            {/* Trips for this year */}
            <div className="flex gap-4">
              {tripsByYear[year].map(trip => (
                <Card
                  key={trip.id}
                  className="flex-shrink-0 w-64 cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1 border-teal-100 overflow-hidden group"
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

                    {trip.totalBudget && (
                      <div className="mt-3 pt-3 border-t border-muted">
                        <span className="text-sm font-medium text-teal-600">{trip.totalBudget}</span>
                      </div>
                    )}

                    {trip.isPastTrip && (
                      <div className="mt-2">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          Past trip
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Timeline line */}
      <div className="absolute bottom-0 left-8 right-8 h-0.5 bg-gradient-to-r from-teal-200 via-cyan-200 to-teal-200" />
    </div>
  );
};

export default TravelTimeline;
