import { useState, useEffect } from 'react';
import { Trip, Destination, ItineraryDay } from '@/types/trip';
import { format, eachDayOfInterval, parseISO } from 'date-fns';

const STORAGE_KEY = 'trip-planning-data';

export const useTripPlanning = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      setTrips(data.trips || []);
      setCurrentTrip(data.currentTrip || null);
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ trips, currentTrip }));
  }, [trips, currentTrip]);

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

    // Sort by date and remove duplicates (for overlapping days)
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

  const createTrip = (
    title: string,
    startDate: string,
    endDate: string,
    destinations: Destination[],
    totalBudget: string
  ) => {
    const newTrip: Trip = {
      id: Date.now().toString(),
      title,
      startDate,
      endDate,
      destinations,
      totalBudget,
      flights: [],
      accommodations: [],
      itinerary: generateItinerary(destinations),
      isPastTrip: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setCurrentTrip(newTrip);
    return newTrip;
  };

  const updateCurrentTrip = (updates: Partial<Trip>) => {
    if (currentTrip) {
      const updated = { ...currentTrip, ...updates, updatedAt: new Date().toISOString() };
      setCurrentTrip(updated);
    }
  };

  const saveToPastTrips = () => {
    if (currentTrip) {
      const pastTrip = { ...currentTrip, isPastTrip: true };
      setTrips(prev => [...prev, pastTrip]);
      setCurrentTrip(null);
    }
  };

  const loadTrip = (tripId: string) => {
    const trip = trips.find(t => t.id === tripId);
    if (trip) {
      setCurrentTrip({ ...trip, isPastTrip: false });
    }
  };

  const deleteTrip = (tripId: string) => {
    setTrips(prev => prev.filter(t => t.id !== tripId));
  };

  const clearCurrentTrip = () => {
    setCurrentTrip(null);
  };

  return {
    trips,
    currentTrip,
    createTrip,
    updateCurrentTrip,
    saveToPastTrips,
    loadTrip,
    deleteTrip,
    clearCurrentTrip
  };
};
