import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Plus, 
  Plane, 
  Save, 
  Archive,
  MapPin,
  DollarSign,
  Calendar,
  Edit,
  Trash2,
  Clock,
  Loader2,
  Download
} from 'lucide-react';
import { useSupabaseTrips } from '@/hooks/useSupabaseTrips';
import NewTripDialog from '@/components/trip/NewTripDialog';
import FlightSection from '@/components/trip/FlightSection';
import AccommodationSection from '@/components/trip/AccommodationSection';
import TripItinerary from '@/components/trip/TripItinerary';
import ActivitiesPlanning from '@/components/trip/ActivitiesPlanning';
import { format, parseISO } from 'date-fns';
import { Trip, Destination } from '@/types/trip';

const TripPlanning = () => {
  const navigate = useNavigate();
  const { 
    upcomingTrips,
    pastTrips,
    isLoading,
    createTrip, 
    updateTrip,
    deleteTrip,
    moveToPast,
    hasPendingLocalData,
    forceMigrateFromLocalStorage,
  } = useSupabaseTrips();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [flightsEditMode, setFlightsEditMode] = useState(false);
  const [accommodationsEditMode, setAccommodationsEditMode] = useState(false);

  const handleCreateTrip = async (
    title: string,
    startDate: string,
    endDate: string,
    destinations: Destination[],
    budget: string
  ) => {
    const newTrip = await createTrip(title, startDate, endDate, destinations, budget);
    setCurrentTrip(newTrip);
    setFlightsEditMode(true);
    setAccommodationsEditMode(true);
  };

  const updateCurrentTrip = (updates: Partial<Trip>) => {
    if (currentTrip) {
      setCurrentTrip({ ...currentTrip, ...updates });
    }
  };

  const handleSave = async () => {
    if (currentTrip) {
      await updateTrip(currentTrip.id, currentTrip);
      setFlightsEditMode(false);
      setAccommodationsEditMode(false);
      setCurrentTrip(null);
    }
  };

  const handleLoadTrip = (trip: Trip) => {
    setCurrentTrip(trip);
    setFlightsEditMode(false);
    setAccommodationsEditMode(false);
  };

  const handleMoveToPast = async (tripId: string) => {
    await moveToPast(tripId);
    if (currentTrip?.id === tripId) {
      setCurrentTrip(null);
    }
  };

  const handleDelete = async (tripId: string) => {
    await deleteTrip(tripId);
    if (currentTrip?.id === tripId) {
      setCurrentTrip(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-sky-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-sky-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/')}
                className="hover:bg-teal-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  Trip Planning
                </h1>
                <p className="text-sm text-muted-foreground">Plan your adventures</p>
              </div>
            </div>

            {currentTrip && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentTrip(null)}
                  className="border-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSave}
                  className="border-teal-300 text-teal-600 hover:bg-teal-50 gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save
                </Button>
                {!currentTrip.isPastTrip && (
                  <Button
                    onClick={() => handleMoveToPast(currentTrip.id)}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 gap-2"
                  >
                    <Archive className="h-4 w-4" />
                    Move to Past Trips
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!currentTrip ? (
          /* Empty state / Start planning */
          <div className="flex flex-col items-center py-12">
            <div className="text-center mb-8">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-teal-400 to-cyan-400 rounded-full flex items-center justify-center shadow-xl">
                <Plane className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Ready for your next adventure?</h2>
              <p className="text-gray-600 max-w-md">
                Plan every detail of your trip - from flights and accommodations to daily activities.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                onClick={() => setDialogOpen(true)}
                className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-lg px-8 py-6 gap-2 shadow-lg"
              >
                <Plus className="h-5 w-5" />
                Plan a New Trip
              </Button>

              {hasPendingLocalData && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={forceMigrateFromLocalStorage}
                  className="border-amber-400 text-amber-600 hover:bg-amber-50 text-lg px-8 py-6 gap-2"
                >
                  <Download className="h-5 w-5" />
                  Recover Local Trips
                </Button>
              )}
            </div>

            {/* Upcoming Trips */}
            {upcomingTrips.length > 0 && (
              <div className="mt-12 w-full max-w-2xl">
                <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-teal-600" />
                  Upcoming Trips
                </h3>
                <div className="grid gap-3">
                  {upcomingTrips.map(trip => (
                    <Card 
                      key={trip.id} 
                      className="border-teal-200 hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div 
                          className="flex items-center gap-3 flex-1 cursor-pointer"
                          onClick={() => handleLoadTrip(trip)}
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{trip.title}</p>
                            <p className="text-sm text-gray-500">
                              {format(parseISO(trip.startDate), 'MMM d')} - {format(parseISO(trip.endDate), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-teal-600 font-medium mr-2">{trip.totalBudget}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleLoadTrip(trip)}
                            className="h-8 w-8 text-gray-500 hover:text-teal-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveToPast(trip.id)}
                            className="h-8 w-8 text-gray-500 hover:text-amber-600"
                            title="Move to past trips"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(trip.id)}
                            className="h-8 w-8 text-gray-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Past Trips */}
            {pastTrips.length > 0 && (
              <div className="mt-8 w-full max-w-2xl">
                <h3 className="text-xl font-semibold text-gray-500 mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-400" />
                  Past Trips
                </h3>
                <div className="grid gap-3">
                  {pastTrips.map(trip => (
                    <Card 
                      key={trip.id} 
                      className="border-gray-200 bg-gray-50/50 hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div 
                          className="flex items-center gap-3 flex-1 cursor-pointer"
                          onClick={() => handleLoadTrip(trip)}
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">{trip.title}</p>
                            <p className="text-sm text-gray-400">
                              {format(parseISO(trip.startDate), 'MMM d')} - {format(parseISO(trip.endDate), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 font-medium mr-2">{trip.totalBudget}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleLoadTrip(trip)}
                            className="h-8 w-8 text-gray-400 hover:text-gray-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(trip.id)}
                            className="h-8 w-8 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Trip Planning View */
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Trip Header */}
            <Card className="border-2 border-teal-200 bg-gradient-to-r from-teal-500 to-cyan-500 text-white">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <Input
                      value={currentTrip.title}
                      onChange={(e) => updateCurrentTrip({ title: e.target.value })}
                      className="text-2xl font-bold bg-white/20 border-white/30 text-white placeholder:text-white/70 mb-2"
                    />
                    <div className="flex items-center gap-4 text-white/90">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(parseISO(currentTrip.startDate), 'MMM d')} - {format(parseISO(currentTrip.endDate), 'MMM d, yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {currentTrip.destinations.length} destination{currentTrip.destinations.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    <Input
                      value={currentTrip.totalBudget}
                      onChange={(e) => updateCurrentTrip({ totalBudget: e.target.value })}
                      placeholder="Total Budget"
                      className="w-32 bg-white/20 border-white/30 text-white placeholder:text-white/70"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activities Planning */}
            <ActivitiesPlanning
              activities={currentTrip.plannedActivities || []}
              onUpdate={(plannedActivities) => updateCurrentTrip({ plannedActivities })}
            />

            {/* Flights */}
            <FlightSection 
              flights={currentTrip.flights}
              onUpdate={(flights) => updateCurrentTrip({ flights })}
              isEditMode={flightsEditMode}
              onEditModeChange={setFlightsEditMode}
            />

            {/* Accommodations */}
            <AccommodationSection
              accommodations={currentTrip.accommodations}
              onUpdate={(accommodations) => updateCurrentTrip({ accommodations })}
              isEditMode={accommodationsEditMode}
              onEditModeChange={setAccommodationsEditMode}
            />

            {/* Itinerary */}
            <TripItinerary
              itinerary={currentTrip.itinerary}
              destinations={currentTrip.destinations}
              onUpdate={(itinerary) => updateCurrentTrip({ itinerary })}
            />
          </div>
        )}
      </main>

      <NewTripDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreateTrip={handleCreateTrip}
      />
    </div>
  );
};

export default TripPlanning;
