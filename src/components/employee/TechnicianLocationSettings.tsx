import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { MapPin, Loader2, Save, Navigation, Home } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function TechnicianLocationSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [homeAddress, setHomeAddress] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile-location', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('home_address, home_latitude, home_longitude, current_latitude, current_longitude, location_updated_at')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      if (data?.home_address) {
        setHomeAddress(data.home_address);
      }
      return data;
    },
    enabled: !!user?.id,
  });

  // Geocode address using Nominatim
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'User-Agent': 'ServiceBookingApp/1.0'
          }
        }
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  const saveHomeLocationMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !homeAddress.trim()) {
        throw new Error('Please enter your home address');
      }

      setIsGeocoding(true);
      const coords = await geocodeAddress(homeAddress);
      setIsGeocoding(false);

      if (!coords) {
        throw new Error('Could not find coordinates for this address. Please try a more specific address.');
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          home_address: homeAddress,
          home_latitude: coords.lat,
          home_longitude: coords.lng,
          location_updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      return coords;
    },
    onSuccess: (coords) => {
      queryClient.invalidateQueries({ queryKey: ['profile-location', user?.id] });
      toast({
        title: 'Home location saved',
        description: `Location set to ${homeAddress} (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save location',
        variant: 'destructive',
      });
    },
  });

  const updateCurrentLocationMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      return new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is not supported by your browser'));
          return;
        }

        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      }).then(async (position) => {
        const { error } = await supabase
          .from('profiles')
          .update({
            current_latitude: position.coords.latitude,
            current_longitude: position.coords.longitude,
            location_updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) throw error;
        return position;
      });
    },
    onSuccess: (position) => {
      queryClient.invalidateQueries({ queryKey: ['profile-location', user?.id] });
      toast({
        title: 'Current location updated',
        description: `Location set to ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to get current location',
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const formatCoords = (lat: number | null, lng: number | null) => {
    if (lat === null || lng === null) return 'Not set';
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Location Settings
        </CardTitle>
        <CardDescription>
          Set your home base location for optimized job assignments based on proximity to customers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Home Base Location */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4 text-muted-foreground" />
            <Label>Home Base Address</Label>
          </div>
          
          <div className="flex gap-2">
            <Input
              value={homeAddress}
              onChange={(e) => setHomeAddress(e.target.value)}
              placeholder="Enter your home address..."
              className="flex-1"
            />
            <Button
              onClick={() => saveHomeLocationMutation.mutate()}
              disabled={saveHomeLocationMutation.isPending || isGeocoding || !homeAddress.trim()}
            >
              {(saveHomeLocationMutation.isPending || isGeocoding) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
          </div>

          {profile?.home_latitude && profile?.home_longitude && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="font-mono text-xs">
                {formatCoords(profile.home_latitude, profile.home_longitude)}
              </Badge>
              <span>•</span>
              <span>{profile.home_address}</span>
            </div>
          )}
        </div>

        {/* Current Location */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-muted-foreground" />
              <Label>Current Location</Label>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateCurrentLocationMutation.mutate()}
              disabled={updateCurrentLocationMutation.isPending}
            >
              {updateCurrentLocationMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4 mr-2" />
              )}
              Update Location
            </Button>
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <span>Coordinates:</span>
              <Badge variant="outline" className="font-mono text-xs">
                {formatCoords(profile?.current_latitude ?? null, profile?.current_longitude ?? null)}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span>Last updated:</span>
              <span>{formatTime(profile?.location_updated_at ?? null)}</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Your current location is used for real-time distance calculations. Update it when you're in the field 
            for more accurate job assignments.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}