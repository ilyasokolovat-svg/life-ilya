import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, MapPin, Calendar } from 'lucide-react';
import { CountryVisitData, useVisitedCountries } from '@/hooks/useVisitedCountries';
import { Trip } from '@/types/trip';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

interface VisitedCountriesListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitedCountries: Map<string, CountryVisitData>;
  manualCountryCodes: Set<string>;
  pastTrips: Trip[];
}

const VisitedCountriesList: React.FC<VisitedCountriesListProps> = ({
  open,
  onOpenChange,
  visitedCountries,
  manualCountryCodes,
  pastTrips,
}) => {
  const { removeCountry, isRemovingCountry } = useVisitedCountries(pastTrips);

  const sortedCountries = Array.from(visitedCountries.values()).sort((a, b) => {
    // Sort by visit count (desc), then by name
    if (b.visitCount !== a.visitCount) return b.visitCount - a.visitCount;
    return a.countryName.localeCompare(b.countryName);
  });

  const handleRemoveCountry = async (countryCode: string, countryName: string) => {
    try {
      await removeCountry(countryCode);
      toast.success(`Removed ${countryName} from manual list`);
    } catch (error) {
      toast.error('Failed to remove country');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-teal-600" />
            Countries I've Been To ({visitedCountries.size})
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {sortedCountries.map((country) => {
              const isManualOnly = country.isManualOnly;
              const canRemove = manualCountryCodes.has(country.countryCode);

              return (
                <div
                  key={country.countryCode}
                  className={`p-4 rounded-lg border ${
                    isManualOnly
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-teal-50 border-teal-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">
                        {country.countryName}
                      </h3>
                      
                      {isManualOnly ? (
                        <p className="text-sm text-gray-500 italic mt-1">
                          No trip data yet
                        </p>
                      ) : (
                        <>
                          <div className="flex items-center gap-3 text-sm mt-1">
                            <span className="text-teal-600 font-medium">
                              {country.visitCount} {country.visitCount === 1 ? 'visit' : 'visits'}
                            </span>
                            <span className="text-gray-500">
                              {country.totalDays} days total
                            </span>
                          </div>

                          <div className="mt-2 space-y-1">
                            {country.trips.map((trip, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 text-xs text-gray-600"
                              >
                                <Calendar className="h-3 w-3 text-teal-500" />
                                <span className="font-medium">{trip.tripTitle}</span>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-400">
                                  {format(parseISO(trip.startDate), 'MMM yyyy')}
                                </span>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-400">{trip.days}d</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {canRemove && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCountry(country.countryCode, country.countryName)}
                        disabled={isRemovingCountry}
                        className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                        title="Remove from manual list"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}

            {sortedCountries.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p>No countries visited yet</p>
                <p className="text-sm">Add past trips or manually add countries</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default VisitedCountriesList;
