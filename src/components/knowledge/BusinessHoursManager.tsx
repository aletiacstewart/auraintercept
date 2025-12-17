import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Save, Clock, Building2, Truck, AlertTriangle, CalendarHeart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BusinessHour {
  id?: string;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
  hour_type: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const HOUR_TYPES = [
  { value: 'office', label: 'Office Hours', icon: Building2, description: 'Regular office/business hours' },
  { value: 'field', label: 'Field Hours', icon: Truck, description: 'Service/field technician hours' },
  { value: 'emergency', label: 'Emergency Hours', icon: AlertTriangle, description: '24/7 emergency availability' },
  { value: 'holiday', label: 'Holiday Hours', icon: CalendarHeart, description: 'Special holiday schedule' },
];

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  const time = `${hour.toString().padStart(2, '0')}:${minute}:00`;
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return { value: time, label: `${displayHour}:${minute} ${ampm}` };
});

const getDefaultHours = (hourType: string): BusinessHour[] => {
  if (hourType === 'emergency') {
    // Emergency hours default to 24/7
    return DAYS.map((_, index) => ({
      day_of_week: index,
      open_time: '00:00:00',
      close_time: '23:30:00',
      is_closed: false,
      hour_type: hourType,
    }));
  }
  
  if (hourType === 'holiday') {
    // Holiday hours default to closed
    return DAYS.map((_, index) => ({
      day_of_week: index,
      open_time: null,
      close_time: null,
      is_closed: true,
      hour_type: hourType,
    }));
  }

  // Office and Field hours default to weekdays 9-5
  return DAYS.map((_, index) => ({
    day_of_week: index,
    open_time: index === 0 || index === 6 ? null : '09:00:00',
    close_time: index === 0 || index === 6 ? null : '17:00:00',
    is_closed: index === 0 || index === 6,
    hour_type: hourType,
  }));
};

export function BusinessHoursManager() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('office');
  const [hoursByType, setHoursByType] = useState<Record<string, BusinessHour[]>>({
    office: getDefaultHours('office'),
    field: getDefaultHours('field'),
    emergency: getDefaultHours('emergency'),
    holiday: getDefaultHours('holiday'),
  });

  const { data: savedHours, isLoading } = useQuery({
    queryKey: ['business-hours', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('business_hours')
        .select('*')
        .eq('company_id', companyId)
        .order('day_of_week');
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  useEffect(() => {
    if (savedHours && savedHours.length > 0) {
      const newHoursByType: Record<string, BusinessHour[]> = {
        office: getDefaultHours('office'),
        field: getDefaultHours('field'),
        emergency: getDefaultHours('emergency'),
        holiday: getDefaultHours('holiday'),
      };

      // Group saved hours by type and merge
      HOUR_TYPES.forEach(({ value: hourType }) => {
        const savedForType = savedHours.filter((h) => (h.hour_type || 'office') === hourType);
        if (savedForType.length > 0) {
          newHoursByType[hourType] = getDefaultHours(hourType).map((defaultHour) => {
            const saved = savedForType.find((h) => h.day_of_week === defaultHour.day_of_week);
            return saved ? { ...saved, hour_type: hourType } : defaultHour;
          });
        }
      });

      setHoursByType(newHoursByType);
    }
  }, [savedHours]);

  const saveMutation = useMutation({
    mutationFn: async (hourType: string) => {
      if (!companyId) throw new Error('No company ID');

      const hours = hoursByType[hourType];
      
      for (const hour of hours) {
        const payload = {
          company_id: companyId,
          day_of_week: hour.day_of_week,
          open_time: hour.is_closed ? null : hour.open_time,
          close_time: hour.is_closed ? null : hour.close_time,
          is_closed: hour.is_closed,
          hour_type: hourType,
        };

        const { error } = await supabase
          .from('business_hours')
          .upsert(payload, { onConflict: 'company_id,day_of_week,hour_type' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-hours'] });
      toast.success('Hours saved successfully!');
    },
    onError: (error) => {
      console.error('Error saving hours:', error);
      toast.error('Failed to save hours');
    },
  });

  const updateHour = (hourType: string, dayIndex: number, field: keyof BusinessHour, value: unknown) => {
    setHoursByType((prev) => ({
      ...prev,
      [hourType]: prev[hourType].map((h) =>
        h.day_of_week === dayIndex ? { ...h, [field]: value } : h
      ),
    }));
  };

  const toggleDay = (hourType: string, dayIndex: number) => {
    setHoursByType((prev) => ({
      ...prev,
      [hourType]: prev[hourType].map((h) =>
        h.day_of_week === dayIndex
          ? {
              ...h,
              is_closed: !h.is_closed,
              open_time: h.is_closed ? '09:00:00' : null,
              close_time: h.is_closed ? '17:00:00' : null,
            }
          : h
      ),
    }));
  };

  const renderHoursGrid = (hourType: string) => {
    const hours = hoursByType[hourType];
    
    return (
      <div className="space-y-3">
        {hours.map((hour) => (
          <div
            key={hour.day_of_week}
            className={cn(
              'flex items-center gap-4 p-3 rounded-lg border transition-colors',
              hour.is_closed ? 'bg-muted/30 border-transparent' : 'bg-card border-border'
            )}
          >
            <div className="w-28 flex items-center gap-2">
              <Switch
                checked={!hour.is_closed}
                onCheckedChange={() => toggleDay(hourType, hour.day_of_week)}
              />
              <Label className={cn('font-medium', hour.is_closed && 'text-muted-foreground')}>
                {DAYS[hour.day_of_week]}
              </Label>
            </div>

            {hour.is_closed ? (
              <span className="text-muted-foreground text-sm">Closed</span>
            ) : (
              <div className="flex items-center gap-2">
                <Select
                  value={hour.open_time || '09:00:00'}
                  onValueChange={(value) => updateHour(hourType, hour.day_of_week, 'open_time', value)}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((time) => (
                      <SelectItem key={time.value} value={time.value}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground">to</span>
                <Select
                  value={hour.close_time || '17:00:00'}
                  onValueChange={(value) => updateHour(hourType, hour.day_of_week, 'close_time', value)}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((time) => (
                      <SelectItem key={time.value} value={time.value}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        ))}

        <div className="flex justify-end pt-4">
          <Button 
            onClick={() => saveMutation.mutate(hourType)} 
            disabled={saveMutation.isPending} 
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? 'Saving...' : 'Save Hours'}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Business Hours
        </CardTitle>
        <CardDescription>Set your operating hours for different scenarios</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              {HOUR_TYPES.map(({ value, label, icon: Icon }) => (
                <TabsTrigger key={value} value={value} className="gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {HOUR_TYPES.map(({ value, description }) => (
              <TabsContent key={value} value={value}>
                <p className="text-sm text-muted-foreground mb-4">{description}</p>
                {renderHoursGrid(value)}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
