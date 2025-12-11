import { useState, useEffect } from 'react';
import { Trip, Destination, ItineraryDay } from '@/types/trip';
import { format, eachDayOfInterval, parseISO } from 'date-fns';

const STORAGE_KEY = 'trip-planning-data';

export const useTripPlanning = () => {
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([]);
  const [pastTrips, setPastTrips] = useState<Trip[]>([]);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [isEditing, setIsEditing] = useState(false); // Track if editing an existing trip

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      setUpcomingTrips(data.upcomingTrips || []);
      setPastTrips(data.pastTrips || []);
      setCurrentTrip(data.currentTrip || null);
      setIsEditing(data.isEditing || false);
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
      upcomingTrips, 
      pastTrips, 
      currentTrip,
      isEditing 
    }));
  }, [upcomingTrips, pastTrips, currentTrip, isEditing]);

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
    setIsEditing(false);
    return newTrip;
  };

  const updateCurrentTrip = (updates: Partial<Trip>) => {
    if (currentTrip) {
      const updated = { ...currentTrip, ...updates, updatedAt: new Date().toISOString() };
      setCurrentTrip(updated);
    }
  };

  // Save to upcoming trips (new or update existing)
  const saveToUpcoming = () => {
    if (currentTrip) {
      const tripToSave = { ...currentTrip, isPastTrip: false };
      
      if (isEditing) {
        // Update existing trip
        setUpcomingTrips(prev => prev.map(t => 
          t.id === tripToSave.id ? tripToSave : t
        ));
      } else {
        // Add new trip
        setUpcomingTrips(prev => [...prev, tripToSave]);
      }
      
      setCurrentTrip(null);
      setIsEditing(false);
    }
  };

  // Move from upcoming to past trips
  const moveToPastTrips = (tripId?: string) => {
    const id = tripId || currentTrip?.id;
    if (!id) return;

    // Find the trip in upcoming
    const trip = tripId 
      ? upcomingTrips.find(t => t.id === tripId)
      : currentTrip;
    
    if (trip) {
      const pastTrip = { ...trip, isPastTrip: true };
      setPastTrips(prev => [...prev, pastTrip]);
      setUpcomingTrips(prev => prev.filter(t => t.id !== id));
      
      if (currentTrip?.id === id) {
        setCurrentTrip(null);
        setIsEditing(false);
      }
    }
  };

  const loadTrip = (tripId: string, fromPast: boolean = false) => {
    const trips = fromPast ? pastTrips : upcomingTrips;
    const trip = trips.find(t => t.id === tripId);
    if (trip) {
      setCurrentTrip({ ...trip });
      setIsEditing(!fromPast); // Only set editing if from upcoming
    }
  };

  const deleteTrip = (tripId: string, fromPast: boolean = false) => {
    if (fromPast) {
      setPastTrips(prev => prev.filter(t => t.id !== tripId));
    } else {
      setUpcomingTrips(prev => prev.filter(t => t.id !== tripId));
    }
  };

  const clearCurrentTrip = () => {
    setCurrentTrip(null);
    setIsEditing(false);
  };

  return {
    upcomingTrips,
    pastTrips,
    currentTrip,
    isEditing,
    createTrip,
    updateCurrentTrip,
    saveToUpcoming,
    moveToPastTrips,
    loadTrip,
    deleteTrip,
    clearCurrentTrip
  };
};
