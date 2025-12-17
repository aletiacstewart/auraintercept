import React, { useState, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { FieldOpsAgentConsole } from '@/components/employee/FieldOpsAgentConsole';
import { TechnicianMap } from '@/components/employee/TechnicianMap';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Map, Navigation, Clock, CheckCircle, Truck } from 'lucide-react';
import { format } from 'date-fns';

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

export default function EmployeeFieldOps() {
  const { user, companyId } = useAuth();
  const [activeTab, setActiveTab] = useState('console');
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>();
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [pendingAddress, setPendingAddress] = useState<string | null>(null);
  const mapRef = useRef<{ searchAddress: (address: string) => void } | null>(null);

  // Fetch today's job assignments with coordinates
  const { data: jobs = [] } = useQuery({
    queryKey: ['field-ops-jobs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('job_assignments')
        .select(`
          id,
          status,
          customer_address,
          customer_lat,
          customer_lng,
          appointments (
            id,
            customer_name,
            service_type,
            datetime,
            customer_address
          )
        `)
        .eq('employee_id', user.id)
        .in('status', ['pending_acceptance', 'accepted', 'en_route', 'arrived', 'in_progress'])
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching jobs:', error);
        return [];
      }

      // Transform data and geocode addresses if needed
      const jobLocations: JobLocation[] = [];
      
      for (const job of data || []) {
        const appointment = job.appointments as any;
        const address = job.customer_address || appointment?.customer_address;
        
        // Use stored coordinates or geocode the address
        let lat = job.customer_lat;
        let lng = job.customer_lng;
        
        if ((!lat || !lng) && address) {
          // Geocode the address using Nominatim
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=us`
            );
            const geoData = await response.json();
            if (geoData && geoData.length > 0) {
              lat = parseFloat(geoData[0].lat);
              lng = parseFloat(geoData[0].lon);
              
              // Update the job with coordinates
              await supabase
                .from('job_assignments')
                .update({ customer_lat: lat, customer_lng: lng })
                .eq('id', job.id);
            }
          } catch (e) {
            console.error('Geocoding error:', e);
          }
        }
        
        if (lat && lng) {
          jobLocations.push({
            id: job.id,
            lat,
            lng,
            customerName: appointment?.customer_name || 'Customer',
            address: address || 'Address not available',
            serviceType: appointment?.service_type || 'Service',
            status: job.status,
            datetime: appointment?.datetime || new Date().toISOString(),
          });
        }
      }
      
      return jobLocations;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const handleRouteCalculated = useCallback((distance: string, duration: string) => {
    setRouteInfo({ distance, duration });
  }, []);

  const handleJobSelect = useCallback((jobId: string) => {
    setSelectedJobId(jobId);
  }, []);

  const handleNavigateRequest = useCallback((address: string) => {
    // Switch to map tab when navigation is requested (mobile)
    setActiveTab('map');
    // Store address to trigger search in map
    setPendingAddress(address);
  }, []);

  // Find job by address and select it, or trigger address search
  const handleMapReady = useCallback((searchFn: (address: string) => void) => {
    if (pendingAddress) {
      // Find if there's a matching job
      const matchingJob = jobs.find(j => 
        j.address.toLowerCase().includes(pendingAddress.toLowerCase()) ||
        pendingAddress.toLowerCase().includes(j.address.toLowerCase())
      );
      
      if (matchingJob) {
        setSelectedJobId(matchingJob.id);
      }
      
      // Always search for the address
      searchFn(pendingAddress);
      setPendingAddress(null);
    }
  }, [pendingAddress, jobs]);

  const activeJobsCount = jobs.filter(j => ['en_route', 'arrived', 'in_progress'].includes(j.status)).length;
  const pendingJobsCount = jobs.filter(j => j.status === 'pending_acceptance' || j.status === 'accepted').length;

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="shrink-0 p-4 border-b bg-background">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                Field Operations
              </h1>
              <p className="text-sm text-muted-foreground">
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Navigation className="h-3 w-3" />
                {pendingJobsCount} Pending
              </Badge>
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {activeJobsCount} Active
              </Badge>
            </div>
          </div>
          
          {/* Route Info Banner */}
          {routeInfo && (
            <div className="mt-3 p-2 bg-primary/10 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-sm">
                  <Navigation className="h-4 w-4 text-primary" />
                  <span className="font-medium">{routeInfo.distance}</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="font-medium">{routeInfo.duration}</span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">to next job</span>
            </div>
          )}
        </div>

        {/* Mobile Tabs / Desktop Split View */}
        <div className="flex-1 overflow-hidden">
          {/* Mobile View */}
          <div className="md:hidden h-full">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2 rounded-none border-b shrink-0">
                <TabsTrigger value="console" className="flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4" />
                  Console
                </TabsTrigger>
                <TabsTrigger value="map" className="flex items-center gap-1.5">
                  <Map className="h-4 w-4" />
                  Map
                </TabsTrigger>
              </TabsList>
              <TabsContent value="console" className="flex-1 m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <FieldOpsAgentConsole 
                  companyId={companyId || undefined} 
                  onNavigateRequest={handleNavigateRequest}
                  className="flex-1"
                />
              </TabsContent>
              <TabsContent value="map" className="flex-1 m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <TechnicianMap 
                  jobs={jobs}
                  onRouteCalculated={handleRouteCalculated}
                  selectedJobId={selectedJobId}
                  onJobSelect={handleJobSelect}
                  initialAddress={pendingAddress}
                  onAddressSearched={() => setPendingAddress(null)}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Desktop View - Split Panels */}
          <div className="hidden md:flex h-full">
            {/* Left Panel - Console */}
            <div className="w-[400px] border-r flex flex-col">
              <FieldOpsAgentConsole 
                companyId={companyId || undefined}
                onNavigateRequest={handleNavigateRequest}
                className="flex-1"
              />
            </div>

            {/* Right Panel - Map */}
            <div className="flex-1 flex flex-col">
              <TechnicianMap 
                jobs={jobs}
                onRouteCalculated={handleRouteCalculated}
                selectedJobId={selectedJobId}
                onJobSelect={handleJobSelect}
                initialAddress={pendingAddress}
                onAddressSearched={() => setPendingAddress(null)}
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
