import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Save, ExternalLink, Clock, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BusinessHour {
  id?: string;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'America/Phoenix', label: 'Arizona Time (MST)' },
  { value: 'UTC', label: 'UTC' },
];

const TIME_OPTIONS = [
  { value: '24hours', label: '24 Hours' },
  ...Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    const time = `${hour.toString().padStart(2, '0')}:${minute}:00`;
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const ampm = hour < 12 ? 'AM' : 'PM';
    return { value: time, label: `${displayHour}:${minute} ${ampm}` };
  }),
];

const getDefaultHours = (): BusinessHour[] => {
  return DAYS.map((_, index) => ({
    day_of_week: index,
    open_time: index === 0 || index === 6 ? null : '09:00:00',
    close_time: index === 0 || index === 6 ? null : '17:00:00',
    is_closed: index === 0 || index === 6,
  }));
};

export function SmartWebsiteHoursEditor() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [hours, setHours] = useState<BusinessHour[]>(getDefaultHours());
  const [selectedTimezone, setSelectedTimezone] = useState('America/New_York');

  // Fetch company timezone
  const { data: companyData } = useQuery({
    queryKey: ['company-timezone', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('weekly_digest_timezone')
        .eq('id', companyId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Fetch saved hours (office hours only)
  const { data: savedHours, isLoading } = useQuery({
    queryKey: ['business-hours-office', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('business_hours')
        .select('*')
        .eq('company_id', companyId)
        .eq('hour_type', 'office')
        .order('day_of_week');
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  useEffect(() => {
    if (companyData?.weekly_digest_timezone) {
      setSelectedTimezone(companyData.weekly_digest_timezone);
    }
  }, [companyData]);

  useEffect(() => {
    if (savedHours && savedHours.length > 0) {
      const newHours = getDefaultHours().map((defaultHour) => {
        const saved = savedHours.find((h) => h.day_of_week === defaultHour.day_of_week);
        if (saved) {
          // Detect 24-hour mode
          const is24Hours = saved.open_time?.startsWith('00:00') && saved.close_time?.startsWith('23:59');
          return {
            ...saved,
            open_time: is24Hours ? '24hours' : saved.open_time,
          };
        }
        return defaultHour;
      });
      setHours(newHours);
    }
  }, [savedHours]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company ID');

      for (const hour of hours) {
        const is24Hours = hour.open_time === '24hours';
        const payload = {
          company_id: companyId,
          day_of_week: hour.day_of_week,
          open_time: hour.is_closed ? null : (is24Hours ? '00:00:00' : hour.open_time),
          close_time: hour.is_closed ? null : (is24Hours ? '23:59:59' : hour.close_time),
          is_closed: hour.is_closed,
          hour_type: 'office',
        };

        const { error } = await supabase
          .from('business_hours')
          .upsert(payload, { onConflict: 'company_id,day_of_week,hour_type' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-hours-office'] });
      toast.success('Business hours saved!');
    },
    onError: () => {
      toast.error('Failed to save hours');
    },
  });

  const saveTimezoneMutation = useMutation({
    mutationFn: async (timezone: string) => {
      if (!companyId) throw new Error('No company ID');
      const { error } = await supabase
        .from('companies')
        .update({ weekly_digest_timezone: timezone })
        .eq('id', companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-timezone'] });
      toast.success('Timezone saved!');
    },
    onError: () => {
      toast.error('Failed to save timezone');
    },
  });

  const handleTimezoneChange = (timezone: string) => {
    setSelectedTimezone(timezone);
    saveTimezoneMutation.mutate(timezone);
  };

  const toggleDay = (dayIndex: number) => {
    setHours((prev) =>
      prev.map((h) =>
        h.day_of_week === dayIndex
          ? {
              ...h,
              is_closed: !h.is_closed,
              open_time: h.is_closed ? '09:00:00' : null,
              close_time: h.is_closed ? '17:00:00' : null,
            }
          : h
      )
    );
  };

  const updateHour = (dayIndex: number, field: 'open_time' | 'close_time', value: string) => {
    setHours((prev) =>
      prev.map((h) => (h.day_of_week === dayIndex ? { ...h, [field]: value } : h))
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timezone Selector */}
      <div className="flex items-center gap-4 pb-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-card-foreground/70" />
          <Label className="text-card-foreground">Timezone</Label>
        </div>
        <Select value={selectedTimezone} onValueChange={handleTimezoneChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONE_OPTIONS.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Hours Grid */}
      <div className="space-y-2">
        {hours.map((hour) => (
          <div
            key={hour.day_of_week}
            className={cn(
              'flex items-center gap-4 p-2 rounded-lg transition-colors',
              hour.is_closed ? 'opacity-60' : ''
            )}
          >
            <div className="w-28 flex items-center gap-2">
              <Switch
                checked={!hour.is_closed}
                onCheckedChange={() => toggleDay(hour.day_of_week)}
              />
              <Label className="font-medium text-card-foreground">{DAYS[hour.day_of_week]}</Label>
            </div>

            {hour.is_closed ? (
              <span className="text-card-foreground/60 text-sm">Closed</span>
            ) : (
              <div className="flex items-center gap-2">
                <Select
                  value={hour.open_time || '09:00:00'}
                  onValueChange={(value) => updateHour(hour.day_of_week, 'open_time', value)}
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
                {hour.open_time === '24hours' ? (
                  <span className="text-primary text-sm font-medium">(All Day)</span>
                ) : (
                  <>
                    <span className="text-card-foreground/70">to</span>
                    <Select
                      value={hour.close_time || '17:00:00'}
                      onValueChange={(value) => updateHour(hour.day_of_week, 'close_time', value)}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.filter((t) => t.value !== '24hours').map((time) => (
                          <SelectItem key={time.value} value={time.value}>
                            {time.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? 'Saving...' : 'Save Hours'}
        </Button>

        <Link
          to="/dashboard/knowledge?tab=hours"
          className="text-sm text-accent hover:underline flex items-center gap-1"
        >
          Full Hours Manager
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
