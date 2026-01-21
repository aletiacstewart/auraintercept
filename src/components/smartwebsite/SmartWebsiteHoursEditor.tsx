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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Save, ExternalLink, Clock, Globe, AlertTriangle, Truck, Calendar, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BusinessHour {
  id?: string;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
}

interface SmartWebsiteHoliday {
  id: string;
  holiday_name: string;
  holiday_date: string;
  is_active: boolean;
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
  const [officeHours, setOfficeHours] = useState<BusinessHour[]>(getDefaultHours());
  const [emergencyHours, setEmergencyHours] = useState<BusinessHour[]>(getDefaultHours());
  const [fieldHours, setFieldHours] = useState<BusinessHour[]>(getDefaultHours());
  const [selectedTimezone, setSelectedTimezone] = useState('America/New_York');

  // Fetch website visibility settings
  const { data: websiteSettings } = useQuery({
    queryKey: ['smart-website-hours-settings', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('smart_websites')
        .select('show_hours, show_emergency_hours, show_field_hours, show_holidays')
        .eq('company_id', companyId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

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

  // Fetch all saved hours
  const { data: allSavedHours, isLoading } = useQuery({
    queryKey: ['business-hours-all', companyId],
    queryFn: async () => {
      if (!companyId) return { office: [], emergency: [], field: [] };
      const { data, error } = await supabase
        .from('business_hours')
        .select('*')
        .eq('company_id', companyId)
        .order('day_of_week');
      if (error) throw error;
      return {
        office: data.filter(h => h.hour_type === 'office'),
        emergency: data.filter(h => h.hour_type === 'emergency'),
        field: data.filter(h => h.hour_type === 'field'),
      };
    },
    enabled: !!companyId,
  });

  // Fetch website ID first
  const { data: websiteData } = useQuery({
    queryKey: ['smart-website-id', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('smart_websites')
        .select('id')
        .eq('company_id', companyId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Fetch holidays
  const { data: holidays } = useQuery({
    queryKey: ['smart-website-holidays-list', websiteData?.id],
    queryFn: async () => {
      if (!websiteData?.id) return [];
      const { data, error } = await supabase
        .from('smart_website_holidays')
        .select('id, holiday_name, holiday_date, is_active')
        .eq('website_id', websiteData.id)
        .order('holiday_date');
      if (error) throw error;
      return data as SmartWebsiteHoliday[];
    },
    enabled: !!websiteData?.id,
  });

  useEffect(() => {
    if (companyData?.weekly_digest_timezone) {
      setSelectedTimezone(companyData.weekly_digest_timezone);
    }
  }, [companyData]);

  useEffect(() => {
    if (allSavedHours) {
      // Load office hours
      if (allSavedHours.office.length > 0) {
        const newHours = getDefaultHours().map((defaultHour) => {
          const saved = allSavedHours.office.find((h) => h.day_of_week === defaultHour.day_of_week);
          if (saved) {
            const is24Hours = saved.open_time?.startsWith('00:00') && saved.close_time?.startsWith('23:59');
            return { ...saved, open_time: is24Hours ? '24hours' : saved.open_time };
          }
          return defaultHour;
        });
        setOfficeHours(newHours);
      }
      // Load emergency hours
      if (allSavedHours.emergency.length > 0) {
        const newHours = getDefaultHours().map((defaultHour) => {
          const saved = allSavedHours.emergency.find((h) => h.day_of_week === defaultHour.day_of_week);
          if (saved) {
            const is24Hours = saved.open_time?.startsWith('00:00') && saved.close_time?.startsWith('23:59');
            return { ...saved, open_time: is24Hours ? '24hours' : saved.open_time };
          }
          return defaultHour;
        });
        setEmergencyHours(newHours);
      }
      // Load field hours
      if (allSavedHours.field.length > 0) {
        const newHours = getDefaultHours().map((defaultHour) => {
          const saved = allSavedHours.field.find((h) => h.day_of_week === defaultHour.day_of_week);
          if (saved) {
            const is24Hours = saved.open_time?.startsWith('00:00') && saved.close_time?.startsWith('23:59');
            return { ...saved, open_time: is24Hours ? '24hours' : saved.open_time };
          }
          return defaultHour;
        });
        setFieldHours(newHours);
      }
    }
  }, [allSavedHours]);

  const saveHoursMutation = useMutation({
    mutationFn: async ({ hours, hourType }: { hours: BusinessHour[], hourType: string }) => {
      if (!companyId) throw new Error('No company ID');

      for (const hour of hours) {
        const is24Hours = hour.open_time === '24hours';
        const payload = {
          company_id: companyId,
          day_of_week: hour.day_of_week,
          open_time: hour.is_closed ? null : (is24Hours ? '00:00:00' : hour.open_time),
          close_time: hour.is_closed ? null : (is24Hours ? '23:59:59' : hour.close_time),
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
      queryClient.invalidateQueries({ queryKey: ['business-hours-all'] });
      toast.success('Hours saved!');
    },
    onError: () => {
      toast.error('Failed to save hours');
    },
  });

  const updateVisibilityMutation = useMutation({
    mutationFn: async (updates: { show_hours?: boolean; show_emergency_hours?: boolean; show_field_hours?: boolean; show_holidays?: boolean }) => {
      if (!companyId) throw new Error('No company ID');
      const { error } = await supabase
        .from('smart_websites')
        .update(updates)
        .eq('company_id', companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-website-hours-settings'] });
      toast.success('Visibility updated!');
    },
    onError: () => {
      toast.error('Failed to update visibility');
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

  const toggleDay = (hours: BusinessHour[], setHours: (h: BusinessHour[]) => void, dayIndex: number) => {
    setHours(
      hours.map((h) =>
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

  const updateHour = (hours: BusinessHour[], setHours: (h: BusinessHour[]) => void, dayIndex: number, field: 'open_time' | 'close_time', value: string) => {
    setHours(
      hours.map((h) => (h.day_of_week === dayIndex ? { ...h, [field]: value } : h))
    );
  };

  const renderHoursGrid = (hours: BusinessHour[], setHours: (h: BusinessHour[]) => void) => (
    <div className="space-y-2">
      {hours.map((hour) => (
        <div
          key={hour.day_of_week}
          className={cn(
            'flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-2 rounded-lg transition-colors',
            hour.is_closed ? 'opacity-60' : ''
          )}
        >
          <div className="w-full sm:w-28 flex items-center gap-2">
            <Switch
              checked={!hour.is_closed}
              onCheckedChange={() => toggleDay(hours, setHours, hour.day_of_week)}
            />
            <Label className="font-medium text-card-foreground text-sm sm:text-base">
              <span className="sm:hidden">{DAYS[hour.day_of_week].slice(0, 3)}</span>
              <span className="hidden sm:inline">{DAYS[hour.day_of_week]}</span>
            </Label>
          </div>

          {hour.is_closed ? (
            <span className="text-card-foreground/60 text-sm pl-8 sm:pl-0">Closed</span>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto pl-8 sm:pl-0">
              <Select
                value={hour.open_time || '09:00:00'}
                onValueChange={(value) => updateHour(hours, setHours, hour.day_of_week, 'open_time', value)}
              >
                <SelectTrigger className="w-[100px] sm:w-28">
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
                    onValueChange={(value) => updateHour(hours, setHours, hour.day_of_week, 'close_time', value)}
                  >
                    <SelectTrigger className="w-[100px] sm:w-28">
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
  );

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
    <div className="space-y-6">
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

      {/* Office Hours */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <Label className="font-semibold text-card-foreground">Office Hours</Label>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-card-foreground/70">Show on website</Label>
            <Switch
              checked={websiteSettings?.show_hours ?? true}
              onCheckedChange={(checked) => updateVisibilityMutation.mutate({ show_hours: checked })}
            />
          </div>
        </div>
        {renderHoursGrid(officeHours, setOfficeHours)}
        <Button 
          size="sm" 
          onClick={() => saveHoursMutation.mutate({ hours: officeHours, hourType: 'office' })}
          disabled={saveHoursMutation.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Office Hours
        </Button>
      </div>

      <Separator />

      {/* Emergency Hours */}
      <Collapsible>
        <div className="space-y-4">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <Label className="font-semibold text-card-foreground">Emergency Hours</Label>
                <ChevronDown className="h-4 w-4 text-card-foreground/50" />
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Label className="text-xs text-card-foreground/70">Show on website</Label>
                <Switch
                  checked={websiteSettings?.show_emergency_hours ?? false}
                  onCheckedChange={(checked) => updateVisibilityMutation.mutate({ show_emergency_hours: checked })}
                />
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pt-2 space-y-4">
              {renderHoursGrid(emergencyHours, setEmergencyHours)}
              <Button 
                size="sm" 
                onClick={() => saveHoursMutation.mutate({ hours: emergencyHours, hourType: 'emergency' })}
                disabled={saveHoursMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Emergency Hours
              </Button>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      <Separator />

      {/* Field Hours */}
      <Collapsible>
        <div className="space-y-4">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-blue-500" />
                <Label className="font-semibold text-card-foreground">Field Service Hours</Label>
                <ChevronDown className="h-4 w-4 text-card-foreground/50" />
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Label className="text-xs text-card-foreground/70">Show on website</Label>
                <Switch
                  checked={websiteSettings?.show_field_hours ?? false}
                  onCheckedChange={(checked) => updateVisibilityMutation.mutate({ show_field_hours: checked })}
                />
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pt-2 space-y-4">
              {renderHoursGrid(fieldHours, setFieldHours)}
              <Button 
                size="sm" 
                onClick={() => saveHoursMutation.mutate({ hours: fieldHours, hourType: 'field' })}
                disabled={saveHoursMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Field Hours
              </Button>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      <Separator />

      {/* Holidays */}
      <Collapsible>
        <div className="space-y-4">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-500" />
                <Label className="font-semibold text-card-foreground">Holidays</Label>
                <ChevronDown className="h-4 w-4 text-card-foreground/50" />
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Label className="text-xs text-card-foreground/70">Show on website</Label>
                <Switch
                  checked={websiteSettings?.show_holidays ?? false}
                  onCheckedChange={(checked) => updateVisibilityMutation.mutate({ show_holidays: checked })}
                />
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pt-2">
              {holidays && holidays.length > 0 ? (
                <div className="space-y-2">
                  {holidays.filter(h => h.is_active).slice(0, 5).map((holiday) => (
                    <div key={holiday.id} className="flex items-center justify-between p-2 bg-card-foreground/5 rounded-lg">
                      <div>
                        <p className="font-medium text-card-foreground text-sm">{holiday.holiday_name}</p>
                        <p className="text-xs text-card-foreground/70">
                          {new Date(holiday.holiday_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {holidays.filter(h => h.is_active).length > 5 && (
                    <p className="text-xs text-card-foreground/70 text-center">
                      +{holidays.filter(h => h.is_active).length - 5} more holidays
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-card-foreground/70 text-center py-4">
                  No holidays configured. Add holidays using the Holiday Messages section above.
                </p>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Full Manager Link */}
      <div className="flex justify-end pt-4">
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
