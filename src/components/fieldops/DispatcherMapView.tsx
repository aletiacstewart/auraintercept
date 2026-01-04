import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, MapPin, Navigation, Play, Clock, CheckCircle, User, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

// Fix Leaflet default marker icon issue in Vite
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface JobAssignment {
  id: string;
  status: string;
  customer_address: string | null;
  customer_lat: number | null;
  customer_lng: number | null;
  estimated_arrival_minutes: number | null;
  appointments: {
    customer_name: string;
    service_type: string;
    datetime: string;
  } | null;
  employee: {
    full_name: string | null;
  } | null;
}

// Aura Intercept theme colors for markers
const STATUS_COLORS: Record<string, string> = {
  pending_acceptance: '#f59e0b', // Yellow
  accepted: '#3b82f6', // Blue
  en_route: '#00d4ff', // Neon Cyan (accent)
  arrived: '#00d4ff', // Neon Cyan
  in_progress: '#f97316', // Orange
  completed: '#22c55e', // Green
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType }> = {
  pending_acceptance: { label: 'Pending', icon: Clock },
  accepted: { label: 'Accepted', icon: CheckCircle },
  en_route: { label: 'En Route', icon: Navigation },
  arrived: { label: 'On Site', icon: MapPin },
  in_progress: { label: 'In Progress', icon: Play },
};

interface DispatcherMapViewProps {
  jobs: JobAssignment[];
  isLoading: boolean;
  onJobSelect?: (jobId: string) => void;
}

export function DispatcherMapView({ jobs, isLoading, onJobSelect }: DispatcherMapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  // Jobs with valid coordinates
  const jobsWithCoords = useMemo(() => {
    return jobs.filter(j => j.customer_lat && j.customer_lng);
  }, [jobs]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [39.8283, -98.5795], // Center of US
      zoom: 4,
      zoomControl: true,
    });

    // Dark tile layer for Aura Intercept theme
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CartoDB',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Create custom marker icon
  const createMarkerIcon = useCallback((status: string, isSelected: boolean) => {
    const color = STATUS_COLORS[status] || STATUS_COLORS.pending_acceptance;
    const size = isSelected ? 40 : 32;
    const pulseClass = status === 'en_route' || status === 'in_progress' ? 'pulse' : '';
    
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          border: 3px solid ${isSelected ? '#fff' : 'rgba(255,255,255,0.3)'};
          border-radius: 50%;
          box-shadow: 0 0 ${isSelected ? '20px' : '10px'} ${color}80;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          ${pulseClass === 'pulse' ? `animation: marker-pulse 2s infinite;` : ''}
        ">
          <svg width="${size * 0.5}" height="${size * 0.5}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            ${status === 'en_route' ? '<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>' :
              status === 'arrived' || status === 'in_progress' ? '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>' :
              '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'}
          </svg>
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }, []);

  // Update markers when jobs change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove markers that no longer exist
    for (const [id, marker] of markersRef.current.entries()) {
      if (!jobs.find(j => j.id === id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    }

    // Add/update markers
    const bounds: L.LatLngBounds | null = jobsWithCoords.length > 0 
      ? L.latLngBounds(jobsWithCoords.map(j => [j.customer_lat!, j.customer_lng!]))
      : null;

    for (const job of jobs) {
      if (!job.customer_lat || !job.customer_lng) continue;

      const isSelected = selectedJob === job.id;
      const icon = createMarkerIcon(job.status, isSelected);
      
      const existing = markersRef.current.get(job.id);
      if (existing) {
        existing.setLatLng([job.customer_lat, job.customer_lng]);
        existing.setIcon(icon);
      } else {
        const marker = L.marker([job.customer_lat, job.customer_lng], { icon }).addTo(map);
        
        // Popup content
        marker.bindPopup(`
          <div style="min-width: 200px; font-family: system-ui, sans-serif;">
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">
              ${job.appointments?.service_type || 'Service'}
            </div>
            <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
              ${job.appointments?.customer_name || 'Customer'}
            </div>
            ${job.employee ? `
              <div style="font-size: 12px; color: #888; margin-bottom: 4px;">
                Tech: ${job.employee.full_name || 'Assigned'}
              </div>
            ` : ''}
            ${job.customer_address ? `
              <div style="font-size: 11px; color: #999;">
                ${job.customer_address}
              </div>
            ` : ''}
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
              <span style="
                background: ${STATUS_COLORS[job.status]}20;
                color: ${STATUS_COLORS[job.status]};
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 500;
              ">
                ${STATUS_CONFIG[job.status]?.label || job.status}
              </span>
              ${job.estimated_arrival_minutes && job.status === 'en_route' ? `
                <span style="margin-left: 8px; font-size: 11px; color: #666;">
                  ETA: ${job.estimated_arrival_minutes} min
                </span>
              ` : ''}
            </div>
          </div>
        `);

        marker.on('click', () => {
          setSelectedJob(job.id);
          onJobSelect?.(job.id);
        });

        markersRef.current.set(job.id, marker);
      }
    }

    // Fit bounds if we have jobs
    if (bounds && jobsWithCoords.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [jobs, jobsWithCoords, selectedJob, createMarkerIcon, onJobSelect]);

  // Add CSS for pulse animation
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes marker-pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.8; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-primary">
        <RefreshCw className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="h-full relative">
      {/* Map Container */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <Card className="bg-primary/90 border-border/30 backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="text-xs font-medium text-primary-foreground/70 mb-2">Status Legend</div>
            <div className="flex flex-wrap gap-3">
              {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                <div key={status} className="flex items-center gap-1.5">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[status] }}
                  />
                  <span className="text-xs text-primary-foreground/80">{config.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Job Count */}
      <div className="absolute top-4 left-4 z-[1000]">
        <Badge className="bg-primary/90 text-accent border-accent/50 backdrop-blur-sm">
          <MapPin className="h-3 w-3 mr-1" />
          {jobsWithCoords.length} jobs on map
        </Badge>
      </div>
    </div>
  );
}
