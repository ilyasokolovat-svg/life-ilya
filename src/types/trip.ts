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
  notes?: string;
}

export interface Accommodation {
  id: string;
  name: string;
  location: string;
  checkIn: string;
  checkOut: string;
  confirmationNumber?: string;
  notes?: string;
}

export interface ItineraryDay {
  date: string;
  location: string;
  activities: string;
  budget: string;
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
  isPastTrip: boolean;
  createdAt: string;
  updatedAt: string;
}
