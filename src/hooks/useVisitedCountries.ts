import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Trip } from '@/types/trip';
import { getCountryFromDestination, COUNTRY_NAMES } from '@/utils/countryUtils';
import { differenceInDays, parseISO } from 'date-fns';
import { Json } from '@/integrations/supabase/types';

export interface LivedInPeriod {
  id: string;
  startYear?: number;
  endYear?: number;
  notes?: string;
}

export interface CountryVisitData {
  countryCode: string;
  countryName: string;
  visitCount: number;
  totalDays: number;
  trips: Array<{
    tripTitle: string;
    startDate: string;
    endDate: string;
    days: number;
  }>;
  isManualOnly: boolean;
  isLivedIn: boolean;
  livedInPeriods: LivedInPeriod[];
  totalYearsLived: number;
}

export function useVisitedCountries(pastTrips: Trip[]) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch manually added countries from Supabase
  const { data: manualCountries = [], isLoading } = useQuery({
    queryKey: ['visited-countries', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('visited_countries')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Get lived-in country codes and their data
  const livedInCountryCodes = new Set(
    manualCountries.filter(c => c.lived_in).map(c => c.country_code)
  );
  
  const livedInData = new Map(
    manualCountries
      .filter(c => c.lived_in)
      .map(c => {
        const periods = (c.lived_in_periods as unknown as LivedInPeriod[]) || [];
        // Calculate total years from all periods
        const totalYears = Array.isArray(periods) ? periods.reduce((sum, p) => {
          const start = p.startYear || 0;
          const end = p.endYear || new Date().getFullYear();
          return sum + Math.max(0, end - start);
        }, 0) : 0;
        return [c.country_code, { periods: Array.isArray(periods) ? periods : [], totalYears }];
      })
  );

  // Compute visited countries from past trips
  const computeCountriesFromTrips = (): Map<string, CountryVisitData> => {
    const countryMap = new Map<string, CountryVisitData>();
    
    pastTrips.forEach(trip => {
      // Get unique countries from this trip's destinations
      const tripCountries = new Set<string>();
      
      trip.destinations.forEach(dest => {
        // Use stored countryCode if available, otherwise try to detect from name
        let country: { code: string; name: string } | null = null;
        
        if (dest.countryCode) {
          // Use the stored country code - look up the name from COUNTRY_NAMES
          const countryName = COUNTRY_NAMES[dest.countryCode] || dest.name;
          country = { code: dest.countryCode, name: countryName };
        } else {
          // Fall back to detection from destination name
          country = getCountryFromDestination(dest.name);
        }
        
        if (country && !tripCountries.has(country.code)) {
          tripCountries.add(country.code);
          
          const days = differenceInDays(
            parseISO(dest.endDate),
            parseISO(dest.startDate)
          ) + 1;
          
          const existing = countryMap.get(country.code);
          if (existing) {
            existing.visitCount += 1;
            existing.totalDays += days;
            existing.trips.push({
              tripTitle: trip.title,
              startDate: dest.startDate,
              endDate: dest.endDate,
              days,
            });
          } else {
            countryMap.set(country.code, {
              countryCode: country.code,
              countryName: country.name,
              visitCount: 1,
              totalDays: days,
              trips: [{
                tripTitle: trip.title,
                startDate: dest.startDate,
                endDate: dest.endDate,
                days,
              }],
              isManualOnly: false,
              isLivedIn: livedInCountryCodes.has(country.code),
              livedInPeriods: livedInData.get(country.code)?.periods || [],
              totalYearsLived: livedInData.get(country.code)?.totalYears || 0,
            });
          }
        }
      });
    });
    
    return countryMap;
  };

  // Merge trip-computed countries with manual countries
  const getVisitedCountries = (): Map<string, CountryVisitData> => {
    const countryMap = computeCountriesFromTrips();
    
    // Update lived-in status and data for countries with trip data
    countryMap.forEach((data, code) => {
      data.isLivedIn = livedInCountryCodes.has(code);
      const livedData = livedInData.get(code);
      if (livedData) {
        data.livedInPeriods = livedData.periods;
        data.totalYearsLived = livedData.totalYears;
      }
    });
    
    // Add manual countries that don't have trip data
    manualCountries.forEach((manual) => {
      if (!countryMap.has(manual.country_code)) {
        const periods = (manual.lived_in_periods as unknown as LivedInPeriod[]) || [];
        const periodsArray = Array.isArray(periods) ? periods : [];
        const totalYears = periodsArray.reduce((sum, p) => {
          const start = p.startYear || 0;
          const end = p.endYear || new Date().getFullYear();
          return sum + Math.max(0, end - start);
        }, 0);
        
        countryMap.set(manual.country_code, {
          countryCode: manual.country_code,
          countryName: manual.country_name,
          visitCount: 0,
          totalDays: 0,
          trips: [],
          isManualOnly: true,
          isLivedIn: manual.lived_in || false,
          livedInPeriods: periodsArray,
          totalYearsLived: totalYears,
        });
      }
    });
    
    return countryMap;
  };

  // Add a country manually
  const addCountryMutation = useMutation({
    mutationFn: async ({ countryCode, countryName }: { countryCode: string; countryName: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('visited_countries')
        .insert({
          user_id: user.id,
          country_code: countryCode,
          country_name: countryName,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visited-countries', user?.id] });
    },
  });

  // Remove a manually added country
  const removeCountryMutation = useMutation({
    mutationFn: async (countryCode: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('visited_countries')
        .delete()
        .eq('user_id', user.id)
        .eq('country_code', countryCode);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visited-countries', user?.id] });
    },
  });

  // Set lived-in status with periods for a country
  const setLivedInMutation = useMutation({
    mutationFn: async ({ 
      countryCode, 
      countryName, 
      livedIn,
      periods,
    }: { 
      countryCode: string; 
      countryName: string; 
      livedIn: boolean;
      periods: LivedInPeriod[];
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // Check if country already exists in manual countries
      const existing = manualCountries.find(c => c.country_code === countryCode);
      
      if (existing) {
        if (!livedIn) {
          // Remove lived-in status
          const { error } = await supabase
            .from('visited_countries')
            .update({ 
              lived_in: false,
              lived_in_periods: [],
            })
            .eq('user_id', user.id)
            .eq('country_code', countryCode);
          
          if (error) throw error;
        } else {
          // Update existing record
          const { error } = await supabase
            .from('visited_countries')
            .update({ 
              lived_in: true,
              lived_in_periods: periods as unknown as Json,
            })
            .eq('user_id', user.id)
            .eq('country_code', countryCode);
          
          if (error) throw error;
        }
      } else {
        // Insert new record with lived_in set
        const { error } = await supabase
          .from('visited_countries')
          .insert({
            user_id: user.id,
            country_code: countryCode,
            country_name: countryName,
            lived_in: livedIn,
            lived_in_periods: periods as unknown as Json,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visited-countries', user?.id] });
    },
  });

  const visitedCountries = getVisitedCountries();
  const manualCountryCodes = new Set(manualCountries.map(c => c.country_code));

  return {
    visitedCountries,
    manualCountryCodes,
    livedInCountryCodes,
    livedInData,
    isLoading,
    addCountry: (countryCode: string, countryName: string) => 
      addCountryMutation.mutateAsync({ countryCode, countryName }),
    removeCountry: (countryCode: string) => 
      removeCountryMutation.mutateAsync(countryCode),
    setLivedIn: (
      countryCode: string, 
      countryName: string, 
      livedIn: boolean,
      periods: LivedInPeriod[] = []
    ) => setLivedInMutation.mutateAsync({ countryCode, countryName, livedIn, periods }),
    isAddingCountry: addCountryMutation.isPending,
    isRemovingCountry: removeCountryMutation.isPending,
    isSettingLivedIn: setLivedInMutation.isPending,
  };
}
