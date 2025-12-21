import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Plane, MapPin, Calendar, Globe } from 'lucide-react';
import { Trip } from '@/types/trip';
import { differenceInDays, parseISO } from 'date-fns';
import { getCountryFromDestination } from '@/utils/countryUtils';

interface TravelStatsProps {
  trips: Trip[];
}

const TravelStats: React.FC<TravelStatsProps> = ({ trips }) => {
  // Only count past trips for stats
  const pastTrips = trips.filter(t => t.isPastTrip);

  // Calculate total days traveled (past trips only)
  const totalDays = pastTrips.reduce((acc, trip) => {
    const days = differenceInDays(parseISO(trip.endDate), parseISO(trip.startDate)) + 1;
    return acc + days;
  }, 0);

  // Get unique destinations
  const uniqueDestinations = new Set<string>();
  pastTrips.forEach(trip => {
    trip.destinations.forEach(dest => {
      uniqueDestinations.add(dest.name);
    });
  });

  // Get unique countries using proper country extraction
  const countries = new Set<string>();
  pastTrips.forEach(trip => {
    trip.destinations.forEach(dest => {
      const country = getCountryFromDestination(dest.name);
      if (country) {
        countries.add(country.code);
      }
    });
  });

  const stats = [
    {
      icon: Plane,
      value: pastTrips.length,
      label: 'Total Trips',
      color: 'from-teal-500 to-cyan-500'
    },
    {
      icon: Calendar,
      value: totalDays,
      label: 'Days Traveled',
      color: 'from-blue-500 to-indigo-500'
    },
    {
      icon: MapPin,
      value: uniqueDestinations.size,
      label: 'Destinations',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Globe,
      value: countries.size,
      label: 'Countries Visited',
      color: 'from-amber-500 to-orange-500'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="border-none shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <div className={`bg-gradient-to-br ${stat.color} p-4 text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="text-sm opacity-90">{stat.label}</p>
                </div>
                <stat.icon className="h-8 w-8 opacity-80" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TravelStats;
