import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Globe } from 'lucide-react';
import { Trip } from '@/types/trip';

interface TravelMapProps {
  trips: Trip[];
  mapboxToken?: string;
  onTokenSubmit?: (token: string) => void;
}

// Simple geocoding cache to avoid repeated lookups
const geocodeCache: Record<string, [number, number]> = {};

// Common city/country coordinates as fallback
const KNOWN_LOCATIONS: Record<string, [number, number]> = {
  'paris': [2.3522, 48.8566],
  'london': [-0.1276, 51.5074],
  'new york': [-74.006, 40.7128],
  'tokyo': [139.6917, 35.6895],
  'dubai': [55.2708, 25.2048],
  'sydney': [151.2093, -33.8688],
  'rome': [12.4964, 41.9028],
  'barcelona': [2.1734, 41.3851],
  'amsterdam': [4.9041, 52.3676],
  'berlin': [13.405, 52.52],
  'los angeles': [-118.2437, 34.0522],
  'san francisco': [-122.4194, 37.7749],
  'miami': [-80.1918, 25.7617],
  'singapore': [103.8198, 1.3521],
  'hong kong': [114.1694, 22.3193],
  'bangkok': [100.5018, 13.7563],
  'bali': [115.0920, -8.3405],
  'maldives': [73.2207, 3.2028],
  'greece': [21.8243, 39.0742],
  'spain': [-3.7038, 40.4168],
  'italy': [12.5674, 41.8719],
  'france': [2.2137, 46.2276],
  'germany': [10.4515, 51.1657],
  'uk': [-3.436, 55.3781],
  'usa': [-95.7129, 37.0902],
  'australia': [133.7751, -25.2744],
  'japan': [138.2529, 36.2048],
};

const TravelMap: React.FC<TravelMapProps> = ({ trips, mapboxToken, onTokenSubmit }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [token, setToken] = useState(mapboxToken || '');
  const [isMapReady, setIsMapReady] = useState(!!mapboxToken);

  // Get approximate coordinates for a destination name
  const getCoordinates = (destinationName: string): [number, number] | null => {
    const lowerName = destinationName.toLowerCase();
    
    // Check cache first
    if (geocodeCache[lowerName]) {
      return geocodeCache[lowerName];
    }

    // Check known locations
    for (const [key, coords] of Object.entries(KNOWN_LOCATIONS)) {
      if (lowerName.includes(key)) {
        geocodeCache[lowerName] = coords;
        return coords;
      }
    }

    // Return null if no match found
    return null;
  };

  // Extract all destinations with coordinates
  const getDestinationsWithCoords = () => {
    const destinations: Array<{ name: string; coords: [number, number]; tripTitle: string; tripId: string }> = [];
    
    trips.forEach(trip => {
      trip.destinations.forEach(dest => {
        const coords = getCoordinates(dest.name);
        if (coords) {
          destinations.push({
            name: dest.name,
            coords,
            tripTitle: trip.title,
            tripId: trip.id
          });
        }
      });
    });

    return destinations;
  };

  useEffect(() => {
    if (!mapContainer.current || !isMapReady || !token) return;

    try {
      mapboxgl.accessToken = token;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        projection: 'globe',
        zoom: 1.5,
        center: [10, 30],
        pitch: 20,
      });

      map.current.addControl(
        new mapboxgl.NavigationControl({ visualizePitch: true }),
        'top-right'
      );

      map.current.scrollZoom.disable();

      map.current.on('style.load', () => {
        map.current?.setFog({
          color: 'rgb(255, 255, 255)',
          'high-color': 'rgb(200, 220, 240)',
          'horizon-blend': 0.2,
        });

        // Add destination markers
        const destinations = getDestinationsWithCoords();
        destinations.forEach(dest => {
          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px;">
              <strong style="color: #0d9488;">${dest.tripTitle}</strong>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">${dest.name}</p>
            </div>
          `);

          const marker = new mapboxgl.Marker({ color: '#0d9488' })
            .setLngLat(dest.coords)
            .setPopup(popup)
            .addTo(map.current!);
        });

        // Fit bounds to show all markers
        if (destinations.length > 0) {
          const bounds = new mapboxgl.LngLatBounds();
          destinations.forEach(dest => bounds.extend(dest.coords));
          map.current?.fitBounds(bounds, { padding: 100, maxZoom: 5 });
        }
      });

      // Globe rotation animation
      const secondsPerRevolution = 180;
      let userInteracting = false;

      const spinGlobe = () => {
        if (!map.current) return;
        const zoom = map.current.getZoom();
        if (!userInteracting && zoom < 3) {
          const center = map.current.getCenter();
          center.lng -= 360 / secondsPerRevolution;
          map.current.easeTo({ center, duration: 1000, easing: n => n });
        }
      };

      map.current.on('mousedown', () => { userInteracting = true; });
      map.current.on('mouseup', () => { userInteracting = false; spinGlobe(); });
      map.current.on('touchend', () => { userInteracting = false; spinGlobe(); });
      map.current.on('moveend', spinGlobe);

      spinGlobe();

    } catch (error) {
      console.error('Map initialization error:', error);
      setIsMapReady(false);
    }

    return () => {
      map.current?.remove();
    };
  }, [isMapReady, token, trips]);

  const handleSubmitToken = () => {
    if (token.trim()) {
      setIsMapReady(true);
      onTokenSubmit?.(token.trim());
    }
  };

  if (!isMapReady) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-8 text-center">
          <Globe className="h-16 w-16 mx-auto text-teal-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Interactive Travel Map</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Enter your Mapbox public token to enable the interactive world map. 
            Get your token at <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-teal-600 underline">mapbox.com</a>
          </p>
          <div className="flex gap-2 max-w-md mx-auto">
            <Input
              placeholder="pk.eyJ1..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSubmitToken} className="bg-teal-600 hover:bg-teal-700">
              Enable Map
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div ref={mapContainer} className="h-[400px] w-full" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-background/10 rounded-lg" />
    </Card>
  );
};

export default TravelMap;
