import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Check } from 'lucide-react';
import { ALL_COUNTRIES } from '@/utils/countryUtils';
import { useVisitedCountries, CountryVisitData } from '@/hooks/useVisitedCountries';
import { Trip } from '@/types/trip';
import { toast } from 'sonner';

interface AddCountryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitedCountries: Map<string, CountryVisitData>;
  pastTrips: Trip[];
}

const AddCountryDialog: React.FC<AddCountryDialogProps> = ({
  open,
  onOpenChange,
  visitedCountries,
  pastTrips,
}) => {
  const [search, setSearch] = useState('');
  const { addCountry, isAddingCountry } = useVisitedCountries(pastTrips);

  const filteredCountries = useMemo(() => {
    const searchLower = search.toLowerCase();
    return ALL_COUNTRIES.filter(country =>
      country.name.toLowerCase().includes(searchLower)
    );
  }, [search]);

  const handleAddCountry = async (country: { code: string; name: string }) => {
    try {
      await addCountry(country.code, country.name);
      toast.success(`Added ${country.name} to your visited countries`);
    } catch (error) {
      toast.error('Failed to add country');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Visited Country</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search countries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-1">
            {filteredCountries.map((country) => {
              const isVisited = visitedCountries.has(country.code);
              
              return (
                <div
                  key={country.code}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    isVisited
                      ? 'bg-teal-50 border border-teal-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <span className={`font-medium ${isVisited ? 'text-teal-700' : 'text-gray-700'}`}>
                    {country.name}
                  </span>
                  {isVisited ? (
                    <div className="flex items-center gap-1 text-teal-600">
                      <Check className="h-4 w-4" />
                      <span className="text-sm">Visited</span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAddCountry(country)}
                      disabled={isAddingCountry}
                      className="h-8 px-3 text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AddCountryDialog;
