import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation, MapPin, Search, X, Clock, Route as RouteIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Extend L namespace for routing machine
declare module 'leaflet' {
  namespace Routing {
    interface ControlOptions {
      waypoints: L.LatLng[];
      routeWhileDragging?: boolean;
      addWaypoints?: boolean;
      fitSelectedRoutes?: boolean;
      showAlternatives?: boolean;
      lineOptions?: any;
      router?: any;
      show?: boolean;
    }
    
    function control(options: ControlOptions): Control;
    function osrmv1(options?: { serviceUrl?: string }): any;
    
    interface Control extends L.Control {
      on(type: string, fn: (e: any) => void): this;
    }
  }
}

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const technicianIcon = createCustomIcon('#3b82f6');
const jobIcon = createCustomIcon('#22c55e');
const destinationIcon = createCustomIcon('#ef4444');

interface JobLocation {
  id: string;
  lat: number;
  lng: number;
  customerName: string;
  address: string;
  serviceType: string;
  status: string;
  datetime: string;
}

interface TechnicianMapProps {
  jobs?: JobLocation[];
  onRouteCalculated?: (distance: string, duration: string) => void;
  selectedJobId?: string;
  onJobSelect?: (jobId: string) => void;
}

interface RoutingControlProps {
  from: [number, number];
  to: [number, number];
  onRouteFound?: (distance: string, duration: string) => void;
}

function RoutingControl({ from, to, onRouteFound }: RoutingControlProps) {
  const map = useMap();
  const routingControlRef = useRef<L.Routing.Control | null>(null);

  useEffect(() => {
    if (!map || !from || !to) return;

    // Remove existing routing control
    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
    }

    // Create new routing control using any type to avoid TS issues
    const RoutingModule = (L as any).Routing;
    
    const routingControl = RoutingModule.control({
      waypoints: [
        L.latLng(from[0], from[1]),
        L.latLng(to[0], to[1])
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
      lineOptions: {
        styles: [{ color: '#3b82f6', weight: 5, opacity: 0.8 }],
        extendToWaypoints: true,
        missingRouteTolerance: 0
      },
      router: RoutingModule.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1'
      }),
      show: false,
    });

    routingControl.on('routesfound', (e: any) => {
      const routes = e.routes;
      if (routes && routes.length > 0) {
        const route = routes[0];
        const distanceMiles = (route.summary.totalDistance / 1609.34).toFixed(1);
        const durationMins = Math.round(route.summary.totalTime / 60);
        onRouteFound?.(`${distanceMiles} mi`, `${durationMins} min`);
      }
    });

    routingControl.addTo(map);
    routingControlRef.current = routingControl;

    return () => {
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
      }
    };
  }, [map, from, to, onRouteFound]);

  return null;
}

function LocationMarker({ position, onLocationFound }: { position: [number, number] | null; onLocationFound: (pos: [number, number]) => void }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 14);
    }
  }, [map, position]);

  useEffect(() => {
    map.locate().on('locationfound', (e) => {
      onLocationFound([e.latlng.lat, e.latlng.lng]);
      map.flyTo(e.latlng, 14);
    });
  }, [map, onLocationFound]);

  return position ? (
    <Marker position={position} icon={technicianIcon}>
      <Popup>Your current location</Popup>
    </Marker>
  ) : null;
}

export function TechnicianMap({ jobs = [], onRouteCalculated, selectedJobId, onJobSelect }: TechnicianMapProps) {
  const { toast } = useToast();
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [searchAddress, setSearchAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentPosition([pos.coords.latitude, pos.coords.longitude]);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: 'Location Access',
            description: 'Enable location services for navigation features.',
            variant: 'destructive',
          });
        }
      );
    }
  }, [toast]);

  // Handle address search using Nominatim
  const handleSearch = async () => {
    if (!searchAddress.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setDestination([parseFloat(lat), parseFloat(lon)]);
        toast({
          title: 'Address Found',
          description: data[0].display_name.substring(0, 60) + '...',
        });
      } else {
        toast({
          title: 'Address Not Found',
          description: 'Try a more specific address.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Search Failed',
        description: 'Could not search for address.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Navigate to a job location
  const navigateToJob = (job: JobLocation) => {
    setDestination([job.lat, job.lng]);
    setSearchAddress(job.address);
    onJobSelect?.(job.id);
  };

  // Clear route
  const clearRoute = () => {
    setDestination(null);
    setSearchAddress('');
    setRouteInfo(null);
  };

  const handleRouteFound = (distance: string, duration: string) => {
    setRouteInfo({ distance, duration });
    onRouteCalculated?.(distance, duration);
  };

  const defaultCenter: [number, number] = currentPosition || [39.8283, -98.5795];

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <Card className="rounded-none border-x-0 border-t-0">
        <CardContent className="p-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter address for directions..."
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9 h-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching} size="sm" className="h-10">
              <Navigation className="h-4 w-4 mr-1" />
              Go
            </Button>
            {destination && (
              <Button variant="outline" onClick={clearRoute} size="sm" className="h-10">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Route Info */}
          {routeInfo && (
            <div className="flex items-center gap-4 mt-3 p-2 bg-primary/10 rounded-lg">
              <div className="flex items-center gap-1 text-sm">
                <RouteIcon className="h-4 w-4 text-primary" />
                <span className="font-medium">{routeInfo.distance}</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-medium">{routeInfo.duration}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={defaultCenter}
          zoom={currentPosition ? 14 : 4}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <LocationMarker position={currentPosition} onLocationFound={setCurrentPosition} />
          
          {/* Job markers */}
          {jobs.map((job) => (
            <Marker
              key={job.id}
              position={[job.lat, job.lng]}
              icon={selectedJobId === job.id ? destinationIcon : jobIcon}
              eventHandlers={{
                click: () => navigateToJob(job),
              }}
            >
              <Popup>
                <div className="p-1">
                  <p className="font-semibold">{job.customerName}</p>
                  <p className="text-xs text-muted-foreground">{job.serviceType}</p>
                  <p className="text-xs">{job.address}</p>
                  <Button 
                    size="sm" 
                    className="w-full mt-2 h-7 text-xs"
                    onClick={() => navigateToJob(job)}
                  >
                    <Navigation className="h-3 w-3 mr-1" />
                    Get Directions
                  </Button>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Destination marker */}
          {destination && !jobs.some(j => j.lat === destination[0] && j.lng === destination[1]) && (
            <Marker position={destination} icon={destinationIcon}>
              <Popup>Destination</Popup>
            </Marker>
          )}

          {/* Routing */}
          {currentPosition && destination && (
            <RoutingControl
              from={currentPosition}
              to={destination}
              onRouteFound={handleRouteFound}
            />
          )}
        </MapContainer>
      </div>

      {/* Jobs List */}
      {jobs.length > 0 && (
        <Card className="rounded-none border-x-0 border-b-0 max-h-[200px] overflow-auto">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Today's Jobs ({jobs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 pt-0">
            <div className="space-y-2">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => navigateToJob(job)}
                  className={`p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedJobId === job.id 
                      ? 'bg-primary/10 border border-primary/30' 
                      : 'bg-muted/50 hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{job.customerName}</p>
                      <p className="text-xs text-muted-foreground truncate">{job.address}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 shrink-0">
                      <Navigation className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
