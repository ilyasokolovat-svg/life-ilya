import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Plus, 
  Plane, 
  Save, 
  Archive,
  MapPin,
  DollarSign,
  Calendar
} from 'lucide-react';
import { useTripPlanning } from '@/hooks/useTripPlanning';
import NewTripDialog from '@/components/trip/NewTripDialog';
import FlightSection from '@/components/trip/FlightSection';
import AccommodationSection from '@/components/trip/AccommodationSection';
import TripItinerary from '@/components/trip/TripItinerary';
import { format, parseISO } from 'date-fns';

const TripPlanning = () => {
  const navigate = useNavigate();
  const { 
    trips, 
    currentTrip, 
    createTrip, 
    updateCurrentTrip, 
    saveToPastTrips, 
    loadTrip,
    clearCurrentTrip 
  } = useTripPlanning();
  
  const [dialogOpen, setDialogOpen] = useState(false);

  const pastTrips = trips.filter(t => t.isPastTrip);

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
                  onClick={clearCurrentTrip}
                  className="border-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveToPastTrips}
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 gap-2"
                >
                  <Archive className="h-4 w-4" />
                  Save to Past Trips
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!currentTrip ? (
          /* Empty state / Start planning */
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-center mb-8">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-teal-400 to-cyan-400 rounded-full flex items-center justify-center shadow-xl">
                <Plane className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Ready for your next adventure?</h2>
              <p className="text-gray-600 max-w-md">
                Plan every detail of your trip - from flights and accommodations to daily activities.
              </p>
            </div>

            <Button
              size="lg"
              onClick={() => setDialogOpen(true)}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-lg px-8 py-6 gap-2 shadow-lg"
            >
              <Plus className="h-5 w-5" />
              Plan a New Trip
            </Button>

            {/* Past Trips */}
            {pastTrips.length > 0 && (
              <div className="mt-16 w-full max-w-2xl">
                <h3 className="text-xl font-semibold text-gray-700 mb-4 text-center">Past Trips</h3>
                <div className="grid gap-3">
                  {pastTrips.map(trip => (
                    <Card 
                      key={trip.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow border-teal-100"
                      onClick={() => loadTrip(trip.id)}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
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
                        <span className="text-teal-600 font-medium">{trip.totalBudget}</span>
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

            {/* Flights */}
            <FlightSection 
              flights={currentTrip.flights}
              onUpdate={(flights) => updateCurrentTrip({ flights })}
            />

            {/* Accommodations */}
            <AccommodationSection
              accommodations={currentTrip.accommodations}
              onUpdate={(accommodations) => updateCurrentTrip({ accommodations })}
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
        onCreateTrip={createTrip}
      />
    </div>
  );
};

export default TripPlanning;
