import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Locate, MapPin, Navigation, Route as RouteIcon, Search, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Fix Leaflet default marker icon issue in Vite
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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

export function TechnicianMap({
  jobs = [],
  onRouteCalculated,
  selectedJobId,
  onJobSelect,
}: TechnicianMapProps) {
  const { toast } = useToast();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routingRef = useRef<any>(null);
  const jobMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const currentMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);

  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [searchAddress, setSearchAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  const defaultCenter: [number, number] = useMemo(() => {
    return currentPosition || [39.8283, -98.5795];
  }, [currentPosition]);

  const ensureMap = useCallback(() => {
    if (!containerRef.current) return null;
    if (mapRef.current) return mapRef.current;

    const map = L.map(containerRef.current, {
      center: defaultCenter,
      zoom: currentPosition ? 14 : 4,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    return map;
  }, [currentPosition, defaultCenter]);

  // Init map once
  useEffect(() => {
    const map = ensureMap();
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [ensureMap]);

  // Get user location once (best-effort)
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCurrentPosition([pos.coords.latitude, pos.coords.longitude]),
      () => {
        // Silent fail; user can still search / use job pins
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // Keep map centered if we get a location
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (currentPosition) {
      map.setView(currentPosition, 14, { animate: true });
    }
  }, [currentPosition]);

  const clearRoute = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    if (routingRef.current) {
      try {
        map.removeControl(routingRef.current);
      } catch {
        // ignore
      }
      routingRef.current = null;
    }

    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove();
      destinationMarkerRef.current = null;
    }

    setDestination(null);
    setSearchAddress('');
    setRouteInfo(null);
  }, []);

  const setRoute = useCallback(
    (to: [number, number], addressLabel?: string) => {
      const map = mapRef.current;
      if (!map) return;

      setDestination(to);
      if (addressLabel) setSearchAddress(addressLabel);

      // Destination marker
      if (destinationMarkerRef.current) destinationMarkerRef.current.remove();
      destinationMarkerRef.current = L.marker(to).addTo(map);

      // Routing
      if (!currentPosition) {
        toast({
          title: 'Location Needed',
          description: 'Enable location services to calculate routes and ETA.',
          variant: 'destructive',
        });
        return;
      }

      // Remove old
      if (routingRef.current) {
        try {
          map.removeControl(routingRef.current);
        } catch {
          // ignore
        }
      }

      const primaryColor = 'hsl(var(--primary))';
      const RoutingModule = (L as any).Routing;
      if (!RoutingModule) {
        toast({
          title: 'Routing Unavailable',
          description: 'Routing module failed to load.',
          variant: 'destructive',
        });
        return;
      }

      const ctrl = RoutingModule.control({
        waypoints: [L.latLng(currentPosition[0], currentPosition[1]), L.latLng(to[0], to[1])],
        routeWhileDragging: false,
        addWaypoints: false,
        fitSelectedRoutes: true,
        showAlternatives: false,
        show: false,
        lineOptions: {
          styles: [{ color: primaryColor, weight: 5, opacity: 0.85 }],
        },
        router: RoutingModule.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' }),
        createMarker: () => null,
      });

      ctrl.on('routesfound', (e: any) => {
        const routes = e.routes;
        if (!routes?.length) return;
        const route = routes[0];
        const distanceMiles = (route.summary.totalDistance / 1609.34).toFixed(1);
        const durationMins = Math.round(route.summary.totalTime / 60);
        const nextInfo = { distance: `${distanceMiles} mi`, duration: `${durationMins} min` };
        setRouteInfo(nextInfo);
        onRouteCalculated?.(nextInfo.distance, nextInfo.duration);
      });

      ctrl.addTo(map);
      routingRef.current = ctrl;
    },
    [currentPosition, onRouteCalculated, toast]
  );

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentPosition([pos.coords.latitude, pos.coords.longitude]);
      },
      () => {
        toast({
          title: 'Location Access',
          description: 'Enable location services for navigation features.',
          variant: 'destructive',
        });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [toast]);

  const handleSearch = useCallback(async () => {
    const raw = searchAddress.trim();
    if (!raw) return;

    // Basic client-side validation (avoid huge requests / abuse)
    if (raw.length > 200) {
      toast({
        title: 'Address Too Long',
        description: 'Please shorten the address (max 200 characters).',
        variant: 'destructive',
      });
      return;
    }

    const buildUrl = (q: string) =>
      `https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=1&countrycodes=us&q=${encodeURIComponent(q)}`;

    const stripUnit = (q: string) =>
      q
        .replace(/\b(apt|apartment|unit|ste|suite|#)\s*\w+\b/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim();

    setIsSearching(true);
    try {
      // Try full query first
      let resp = await fetch(buildUrl(raw), {
        headers: {
          // Nominatim recommends identifying the app; harmless if ignored
          'Accept': 'application/json',
        },
      });
      let data = await resp.json();

      // Fallback: strip apartment/unit info which often causes no-match
      if (!data?.length) {
        const simplified = stripUnit(raw);
        if (simplified && simplified !== raw) {
          resp = await fetch(buildUrl(simplified), { headers: { Accept: 'application/json' } });
          data = await resp.json();
        }
      }

      if (data?.length) {
        const best = data[0];
        const lat = parseFloat(best.lat);
        const lng = parseFloat(best.lon);
        setRoute([lat, lng], best.display_name);
        toast({
          title: 'Address Found',
          description: (best.display_name as string).slice(0, 80),
        });
      } else {
        toast({
          title: 'Address Not Found',
          description: 'Try removing the apartment/unit (e.g., “6350 Meadowvista Dr, Corpus Christi, TX 78414”).',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Search Failed',
        description: 'Could not search for address.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  }, [searchAddress, setRoute, toast]);

  // Render/update current position marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!currentPosition) return;

    if (currentMarkerRef.current) {
      currentMarkerRef.current.setLatLng(currentPosition);
    } else {
      currentMarkerRef.current = L.marker(currentPosition).addTo(map).bindPopup('Your current location');
    }
  }, [currentPosition]);

  // Render/update job markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove markers that no longer exist
    for (const [id, marker] of jobMarkersRef.current.entries()) {
      if (!jobs.some((j) => j.id === id)) {
        marker.remove();
        jobMarkersRef.current.delete(id);
      }
    }

    // Add/update markers
    for (const job of jobs) {
      const existing = jobMarkersRef.current.get(job.id);
      if (existing) {
        existing.setLatLng([job.lat, job.lng]);
      } else {
        const marker = L.marker([job.lat, job.lng]).addTo(map);
        marker.on('click', () => {
          onJobSelect?.(job.id);
          setRoute([job.lat, job.lng], job.address);
        });
        marker.bindPopup(
          `<div style="min-width:180px">
            <div style="font-weight:600">${job.customerName}</div>
            <div style="font-size:12px;opacity:.8">${job.serviceType}</div>
            <div style="font-size:12px;opacity:.9">${job.address}</div>
          </div>`
        );
        jobMarkersRef.current.set(job.id, marker);
      }
    }
  }, [jobs, onJobSelect, setRoute]);

  // Highlight selected job marker (simple bounce)
  useEffect(() => {
    if (!selectedJobId) return;
    const marker = jobMarkersRef.current.get(selectedJobId);
    if (!marker) return;

    marker.openPopup();
  }, [selectedJobId]);

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <Card className="rounded-none border-x-0 border-t-0">
        <CardContent className="p-3">
          <div className="flex gap-2">
            <Button variant="outline" onClick={locateMe} size="sm" className="h-10 w-10 p-0 shrink-0">
              <Locate className="h-4 w-4" />
            </Button>
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

      {/* Map canvas */}
      <div className="flex-1 relative">
        <div ref={containerRef} className="absolute inset-0" />
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
                  onClick={() => {
                    onJobSelect?.(job.id);
                    setRoute([job.lat, job.lng], job.address);
                  }}
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
