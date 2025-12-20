import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Trip, Destination, ItineraryDay } from '@/types/trip';
import { format, eachDayOfInterval, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

const mapDbToTrip = (dbTrip: {
  id: string;
  user_id: string;
  title: string;
  start_date: string;
  end_date: string;
  destinations: Json;
  total_budget: string | null;
  flights: Json;
  accommodations: Json;
  itinerary: Json;
  planned_activities: Json;
  is_past_trip: boolean;
  created_at: string;
  updated_at: string;
}): Trip => ({
  id: dbTrip.id,
  title: dbTrip.title,
  startDate: dbTrip.start_date,
  endDate: dbTrip.end_date,
  destinations: (dbTrip.destinations as unknown as Destination[]) || [],
  totalBudget: dbTrip.total_budget || '',
  flights: (dbTrip.flights as unknown as Trip['flights']) || [],
  accommodations: (dbTrip.accommodations as unknown as Trip['accommodations']) || [],
  itinerary: (dbTrip.itinerary as unknown as ItineraryDay[]) || [],
  plannedActivities: (dbTrip.planned_activities as unknown as Trip['plannedActivities']) || [],
  isPastTrip: dbTrip.is_past_trip,
  createdAt: dbTrip.created_at,
  updatedAt: dbTrip.updated_at,
});

export const useSupabaseTrips = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all trips
  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['trips', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: true });
        
      if (error) throw error;
      return (data || []).map(mapDbToTrip);
    },
    enabled: !!user?.id,
  });

  const upcomingTrips = trips.filter(t => !t.isPastTrip);
  const pastTrips = trips.filter(t => t.isPastTrip);

  const generateItinerary = (destinations: Destination[]): ItineraryDay[] => {
    const itinerary: ItineraryDay[] = [];
    
    destinations.forEach(dest => {
      const days = eachDayOfInterval({
        start: parseISO(dest.startDate),
        end: parseISO(dest.endDate)
      });
      
      days.forEach(day => {
        itinerary.push({
          date: format(day, 'yyyy-MM-dd'),
          location: dest.name,
          activities: '',
          budget: ''
        });
      });
    });

    const uniqueDays = new Map<string, ItineraryDay>();
    itinerary.forEach(day => {
      if (!uniqueDays.has(day.date)) {
        uniqueDays.set(day.date, day);
      }
    });

    return Array.from(uniqueDays.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  // Create trip mutation
  const createMutation = useMutation({
    mutationFn: async (tripData: {
      title: string;
      startDate: string;
      endDate: string;
      destinations: Destination[];
      totalBudget: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const itinerary = generateItinerary(tripData.destinations);
      
      const { data, error } = await supabase
        .from('trips')
        .insert({
          user_id: user.id,
          title: tripData.title,
          start_date: tripData.startDate,
          end_date: tripData.endDate,
          destinations: tripData.destinations as unknown as Json,
          total_budget: tripData.totalBudget,
          itinerary: itinerary as unknown as Json,
          flights: [] as unknown as Json,
          accommodations: [] as unknown as Json,
          planned_activities: [] as unknown as Json,
        })
        .select()
        .single();
        
      if (error) throw error;
      return mapDbToTrip(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips', user?.id] });
      toast.success('Trip created!');
    },
    onError: (error) => {
      console.error('Error creating trip:', error);
      toast.error('Failed to create trip');
    },
  });

  // Update trip mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Trip> }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const dbUpdates: Record<string, unknown> = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
      if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
      if (updates.destinations !== undefined) dbUpdates.destinations = updates.destinations;
      if (updates.totalBudget !== undefined) dbUpdates.total_budget = updates.totalBudget;
      if (updates.flights !== undefined) dbUpdates.flights = updates.flights;
      if (updates.accommodations !== undefined) dbUpdates.accommodations = updates.accommodations;
      if (updates.itinerary !== undefined) dbUpdates.itinerary = updates.itinerary;
      if (updates.plannedActivities !== undefined) dbUpdates.planned_activities = updates.plannedActivities;
      if (updates.isPastTrip !== undefined) dbUpdates.is_past_trip = updates.isPastTrip;
      
      const { error } = await supabase
        .from('trips')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips', user?.id] });
    },
    onError: (error) => {
      console.error('Error updating trip:', error);
      toast.error('Failed to update trip');
    },
  });

  // Delete trip mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips', user?.id] });
      toast.success('Trip deleted');
    },
    onError: (error) => {
      console.error('Error deleting trip:', error);
      toast.error('Failed to delete trip');
    },
  });

  const createTrip = (
    title: string,
    startDate: string,
    endDate: string,
    destinations: Destination[],
    totalBudget: string
  ) => {
    return createMutation.mutateAsync({ title, startDate, endDate, destinations, totalBudget });
  };

  const updateTrip = (id: string, updates: Partial<Trip>) => {
    return updateMutation.mutateAsync({ id, updates });
  };

  const deleteTrip = (id: string) => {
    return deleteMutation.mutateAsync(id);
  };

  const moveToPast = (id: string) => {
    return updateMutation.mutateAsync({ id, updates: { isPastTrip: true } });
  };

  return {
    trips,
    upcomingTrips,
    pastTrips,
    isLoading,
    createTrip,
    updateTrip,
    deleteTrip,
    moveToPast,
    generateItinerary,
  };
};
