import React, { useState, useMemo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, Plus, List, ZoomIn, ZoomOut, RotateCcw, Home } from 'lucide-react';
import { Trip } from '@/types/trip';
import { useVisitedCountries, CountryVisitData } from '@/hooks/useVisitedCountries';
import AddCountryDialog from './AddCountryDialog';
import VisitedCountriesList from './VisitedCountriesList';
import { format, parseISO } from 'date-fns';
import { COUNTRY_NAMES } from '@/utils/countryUtils';
import { toast } from 'sonner';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// ISO Alpha-3 to numeric ID mapping for world-atlas
const COUNTRY_CODE_MAP: Record<string, string> = {
  'AFG': '004', 'ALB': '008', 'DZA': '012', 'AND': '020', 'AGO': '024',
  'ARG': '032', 'ARM': '051', 'AUS': '036', 'AUT': '040', 'AZE': '031',
  'BHS': '044', 'BHR': '048', 'BGD': '050', 'BRB': '052', 'BLR': '112',
  'BEL': '056', 'BLZ': '084', 'BEN': '204', 'BTN': '064', 'BOL': '068',
  'BIH': '070', 'BWA': '072', 'BRA': '076', 'BRN': '096', 'BGR': '100',
  'BFA': '854', 'BDI': '108', 'KHM': '116', 'CMR': '120', 'CAN': '124',
  'CPV': '132', 'CAF': '140', 'TCD': '148', 'CHL': '152', 'CHN': '156',
  'COL': '170', 'COM': '174', 'COG': '178', 'CRI': '188', 'HRV': '191',
  'CUB': '192', 'CYP': '196', 'CZE': '203', 'DNK': '208', 'DJI': '262',
  'DMA': '212', 'DOM': '214', 'ECU': '218', 'EGY': '818', 'SLV': '222',
  'GNQ': '226', 'ERI': '232', 'EST': '233', 'ETH': '231', 'FJI': '242',
  'FIN': '246', 'FRA': '250', 'GAB': '266', 'GMB': '270', 'GEO': '268',
  'DEU': '276', 'GHA': '288', 'GRC': '300', 'GRD': '308', 'GTM': '320',
  'GIN': '324', 'GNB': '624', 'GUY': '328', 'HTI': '332', 'HND': '340',
  'HKG': '344', 'HUN': '348', 'ISL': '352', 'IND': '356', 'IDN': '360',
  'IRN': '364', 'IRQ': '368', 'IRL': '372', 'ISR': '376', 'ITA': '380',
  'CIV': '384', 'JAM': '388', 'JPN': '392', 'JOR': '400', 'KAZ': '398',
  'KEN': '404', 'KWT': '414', 'KGZ': '417', 'LAO': '418', 'LVA': '428',
  'LBN': '422', 'LSO': '426', 'LBR': '430', 'LBY': '434', 'LIE': '438',
  'LTU': '440', 'LUX': '442', 'MKD': '807', 'MDG': '450', 'MWI': '454',
  'MYS': '458', 'MDV': '462', 'MLI': '466', 'MLT': '470', 'MRT': '478',
  'MUS': '480', 'MEX': '484', 'MDA': '498', 'MCO': '492', 'MNG': '496',
  'MNE': '499', 'MAR': '504', 'MOZ': '508', 'MMR': '104', 'NAM': '516',
  'NPL': '524', 'NLD': '528', 'NZL': '554', 'NIC': '558', 'NER': '562',
  'NGA': '566', 'PRK': '408', 'NOR': '578', 'OMN': '512', 'PAK': '586',
  'PAN': '591', 'PNG': '598', 'PRY': '600', 'PER': '604', 'PHL': '608',
  'POL': '616', 'PRT': '620', 'QAT': '634', 'ROU': '642', 'RUS': '643',
  'RWA': '646', 'SAU': '682', 'SEN': '686', 'SRB': '688', 'SYC': '690',
  'SLE': '694', 'SGP': '702', 'SVK': '703', 'SVN': '705', 'SOM': '706',
  'ZAF': '710', 'KOR': '410', 'SSD': '728', 'ESP': '724', 'LKA': '144',
  'SDN': '729', 'SUR': '740', 'SWZ': '748', 'SWE': '752', 'CHE': '756',
  'SYR': '760', 'TWN': '158', 'TJK': '762', 'TZA': '834', 'THA': '764',
  'TGO': '768', 'TTO': '780', 'TUN': '788', 'TUR': '792', 'TKM': '795',
  'UGA': '800', 'UKR': '804', 'ARE': '784', 'GBR': '826', 'USA': '840',
  'URY': '858', 'UZB': '860', 'VUT': '548', 'VEN': '862', 'VNM': '704',
  'YEM': '887', 'ZMB': '894', 'ZWE': '716',
};

// Reverse mapping for getting country code from numeric ID
const NUMERIC_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRY_CODE_MAP).map(([code, num]) => [num, code])
);

interface WorldMapProps {
  trips: Trip[];
}

const WorldMap: React.FC<WorldMapProps> = ({ trips }) => {
  const pastTrips = useMemo(() => trips.filter(t => t.isPastTrip), [trips]);
  const { visitedCountries, manualCountryCodes, livedInCountryCodes, isLoading, toggleLivedIn, isTogglingLivedIn } = useVisitedCountries(pastTrips);
  
  const [position, setPosition] = useState({ coordinates: [0, 20] as [number, number], zoom: 1 });
  const [tooltipContent, setTooltipContent] = useState<CountryVisitData | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [listDialogOpen, setListDialogOpen] = useState(false);

  // Get max visit count for gradient calculation
  const maxVisits = useMemo(() => {
    let max = 1;
    visitedCountries.forEach(country => {
      if (country.visitCount > max) max = country.visitCount;
    });
    return max;
  }, [visitedCountries]);

  // Get color based on visit count and lived-in status
  const getCountryColor = (countryCode: string): string => {
    const data = visitedCountries.get(countryCode);
    const isLivedIn = livedInCountryCodes.has(countryCode);
    
    // Lived-in countries get a beautiful rose/coral color
    if (isLivedIn) {
      return 'hsl(350, 70%, 55%)'; // Rose/coral color
    }
    
    if (!data) return '#e5e7eb'; // gray-200
    
    if (data.isManualOnly) {
      return '#99f6e4'; // teal-200 for manual-only countries
    }
    
    // Gradient from light teal to dark teal based on visits
    const intensity = Math.min(data.visitCount / maxVisits, 1);
    const baseHue = 174; // teal
    const lightness = 85 - (intensity * 45); // 85% to 40%
    return `hsl(${baseHue}, 70%, ${lightness}%)`;
  };

  const handleZoomIn = () => {
    if (position.zoom < 8) {
      setPosition(pos => ({ ...pos, zoom: pos.zoom * 1.5 }));
    }
  };

  const handleZoomOut = () => {
    if (position.zoom > 1) {
      setPosition(pos => ({ ...pos, zoom: pos.zoom / 1.5 }));
    }
  };

  const handleReset = () => {
    setPosition({ coordinates: [0, 20], zoom: 1 });
  };

  const handleMoveEnd = (position: { coordinates: [number, number]; zoom: number }) => {
    setPosition(position);
  };

  const handleMouseEnter = (
    geo: any,
    event: React.MouseEvent<SVGPathElement>
  ) => {
    const countryCode = NUMERIC_TO_CODE[geo.id];
    
    if (countryCode) {
      const data = visitedCountries.get(countryCode);
      if (data) {
        setTooltipContent(data);
        setTooltipPosition({ x: event.clientX, y: event.clientY });
      }
    }
  };

  const handleMouseLeave = () => {
    setTooltipContent(null);
  };

  const handleMouseMove = (event: React.MouseEvent<SVGPathElement>) => {
    if (tooltipContent) {
      setTooltipPosition({ x: event.clientX, y: event.clientY });
    }
  };

  const handleCountryClick = async (geo: any) => {
    const countryCode = NUMERIC_TO_CODE[geo.id];
    if (!countryCode) return;
    
    const countryName = COUNTRY_NAMES[countryCode] || geo.properties?.name || 'Unknown';
    const isCurrentlyLivedIn = livedInCountryCodes.has(countryCode);
    
    try {
      await toggleLivedIn(countryCode, countryName, !isCurrentlyLivedIn);
      toast.success(
        !isCurrentlyLivedIn 
          ? `Marked ${countryName} as a country you lived in` 
          : `Removed ${countryName} from lived-in countries`
      );
    } catch (error) {
      toast.error('Failed to update country');
    }
  };

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-8 text-center">
          <Globe className="h-16 w-16 mx-auto text-teal-500 mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading map...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden relative">
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomIn}
          className="bg-white/90 hover:bg-white shadow-md"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomOut}
          className="bg-white/90 hover:bg-white shadow-md"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleReset}
          className="bg-white/90 hover:bg-white shadow-md"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-4 left-4 z-10 flex gap-2">
        <Button
          onClick={() => setAddDialogOpen(true)}
          className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 gap-2 shadow-md"
        >
          <Plus className="h-4 w-4" />
          Add Country
        </Button>
        <Button
          variant="secondary"
          onClick={() => setListDialogOpen(true)}
          className="bg-white/90 hover:bg-white shadow-md gap-2"
        >
          <List className="h-4 w-4" />
          Countries ({visitedCountries.size})
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-10 bg-white/90 rounded-lg p-3 shadow-md">
        <p className="text-xs font-medium text-gray-600 mb-2">Legend</p>
        <div className="flex items-center gap-1 mb-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(174, 70%, 85%)' }} />
          <span className="text-xs text-gray-500">1 visit</span>
          <div className="w-8 h-4 rounded mx-1" style={{ background: 'linear-gradient(to right, hsl(174, 70%, 75%), hsl(174, 70%, 50%))' }} />
          <span className="text-xs text-gray-500">{maxVisits}+</span>
        </div>
        <div className="flex items-center gap-1 mb-1">
          <div className="w-4 h-4 rounded bg-teal-200" />
          <span className="text-xs text-gray-500">Manual only</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(350, 70%, 55%)' }} />
          <span className="text-xs text-gray-500">Lived in</span>
        </div>
        <p className="text-xs text-gray-400 mt-2 italic">Click country to mark as lived-in</p>
      </div>

      {/* Map */}
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 140,
          center: [0, 20],
        }}
        className="h-[500px] w-full bg-gradient-to-b from-sky-100 to-sky-50"
      >
        <ZoomableGroup
          zoom={position.zoom}
          center={position.coordinates}
          onMoveEnd={handleMoveEnd}
          maxZoom={8}
          minZoom={1}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const countryCode = NUMERIC_TO_CODE[geo.id];
                const isVisited = countryCode && visitedCountries.has(countryCode);
                const isLivedIn = countryCode && livedInCountryCodes.has(countryCode);
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => handleCountryClick(geo)}
                    onMouseEnter={(event) => handleMouseEnter(geo, event)}
                    onMouseLeave={handleMouseLeave}
                    onMouseMove={handleMouseMove}
                    style={{
                      default: {
                        fill: countryCode ? getCountryColor(countryCode) : '#e5e7eb',
                        stroke: '#fff',
                        strokeWidth: 0.5,
                        outline: 'none',
                      },
                      hover: {
                        fill: isLivedIn ? 'hsl(350, 70%, 45%)' : isVisited ? '#0d9488' : '#d1d5db',
                        stroke: '#fff',
                        strokeWidth: 0.5,
                        outline: 'none',
                        cursor: 'pointer',
                      },
                      pressed: {
                        fill: isLivedIn ? 'hsl(350, 70%, 35%)' : isVisited ? '#0f766e' : '#9ca3af',
                        stroke: '#fff',
                        strokeWidth: 0.5,
                        outline: 'none',
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Tooltip */}
      {tooltipContent && (
        <div
          className="fixed z-50 bg-white rounded-lg shadow-xl p-4 max-w-xs pointer-events-none"
          style={{
            left: tooltipPosition.x + 15,
            top: tooltipPosition.y - 10,
          }}
        >
          <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            {tooltipContent.countryName}
            {tooltipContent.isLivedIn && (
              <span className="text-xs bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Home className="h-3 w-3" />
                Lived here
              </span>
            )}
          </h3>
          {tooltipContent.isManualOnly ? (
            <p className="text-sm text-gray-500 italic">
              No trip data yet - add a past journey to see stats
            </p>
          ) : (
            <>
              <div className="flex items-center gap-4 text-sm mb-2">
                <span className="text-teal-600 font-medium">
                  {tooltipContent.visitCount} {tooltipContent.visitCount === 1 ? 'visit' : 'visits'}
                </span>
                <span className="text-gray-500">
                  {tooltipContent.totalDays} days total
                </span>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {tooltipContent.trips.map((trip, idx) => (
                  <div key={idx} className="text-xs text-gray-600 border-l-2 border-teal-400 pl-2">
                    <span className="font-medium">{trip.tripTitle}</span>
                    <br />
                    <span className="text-gray-400">
                      {format(parseISO(trip.startDate), 'MMM d')} - {format(parseISO(trip.endDate), 'MMM d, yyyy')}
                      {' '}({trip.days}d)
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Dialogs */}
      <AddCountryDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        visitedCountries={visitedCountries}
        pastTrips={pastTrips}
      />
      <VisitedCountriesList
        open={listDialogOpen}
        onOpenChange={setListDialogOpen}
        visitedCountries={visitedCountries}
        manualCountryCodes={manualCountryCodes}
        pastTrips={pastTrips}
      />
    </Card>
  );
};

export default WorldMap;
