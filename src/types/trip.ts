export interface Destination {
  name: string;
  startDate: string;
  endDate: string;
  countryCode?: string;
}

export interface Flight {
  id: string;
  date: string;
  from: string;
  to: string;
  airline?: string;
  flightNumber?: string;
  departureTime?: string;
  arrivalTime?: string;
  cost?: string;
  notes?: string;
}

export interface Accommodation {
  id: string;
  name: string;
  location: string;
  checkIn: string;
  checkOut: string;
  cost?: string;
  link?: string;
  notes?: string;
}

export interface ItineraryDay {
  date: string;
  location: string;
  activities: string;
  budget: string;
  noAlcohol?: boolean;
  sport?: boolean;
  sportLocation?: string;
}

export interface PlannedActivity {
  id: string;
  name: string;
  cost: string;
  assignedDay?: string;
}

export interface Trip {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  destinations: Destination[];
  totalBudget: string;
  flights: Flight[];
  accommodations: Accommodation[];
  itinerary: ItineraryDay[];
  plannedActivities: PlannedActivity[];
  isPastTrip: boolean;
  createdAt: string;
  updatedAt: string;
}
