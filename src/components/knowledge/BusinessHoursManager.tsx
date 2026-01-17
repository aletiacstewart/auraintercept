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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { Save, Clock, Building2, Truck, AlertTriangle, CalendarHeart, X, Plus, Copy, Check, Globe } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format, addMonths, startOfMonth, isSameDay } from 'date-fns';

interface BusinessHour {
  id?: string;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
  hour_type: string;
}

interface HolidayClosure {
  id?: string;
  closure_date: string;
  name: string | null;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const HOUR_TYPES = [
  { value: 'office', label: 'Office Hours', icon: Building2, description: 'Regular office/business hours' },
  { value: 'field', label: 'Field Hours', icon: Truck, description: 'Service/field technician hours' },
  { value: 'emergency', label: 'Emergency Hours', icon: AlertTriangle, description: '24/7 emergency availability' },
  { value: 'holiday', label: 'Holiday Hours', icon: CalendarHeart, description: 'Select specific dates your business will be closed' },
];

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

const COMMON_HOLIDAYS = [
  { name: "New Year's Day", month: 0, day: 1 },
  { name: "Martin Luther King Jr. Day", month: 0, day: 20 },
  { name: "Presidents' Day", month: 1, day: 17 },
  { name: "Memorial Day", month: 4, day: 26 },
  { name: "Independence Day", month: 6, day: 4 },
  { name: "Labor Day", month: 8, day: 1 },
  { name: "Columbus Day", month: 9, day: 14 },
  { name: "Veterans Day", month: 10, day: 11 },
  { name: "Thanksgiving Day", month: 10, day: 28 },
  { name: "Christmas Eve", month: 11, day: 24 },
  { name: "Christmas Day", month: 11, day: 25 },
  { name: "New Year's Eve", month: 11, day: 31 },
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

const getDefaultHours = (hourType: string): BusinessHour[] => {
  if (hourType === 'emergency') {
    return DAYS.map((_, index) => ({
      day_of_week: index,
      open_time: '00:00:00',
      close_time: '23:30:00',
      is_closed: false,
      hour_type: hourType,
    }));
  }

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
  });
  const [holidayClosures, setHolidayClosures] = useState<HolidayClosure[]>([]);
  const [newHolidayName, setNewHolidayName] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedTimezone, setSelectedTimezone] = useState('America/New_York');

  // Fetch company settings for timezone
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

  useEffect(() => {
    if (companyData?.weekly_digest_timezone) {
      setSelectedTimezone(companyData.weekly_digest_timezone);
    }
  }, [companyData]);

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

  const { data: savedClosures, isLoading: isLoadingClosures } = useQuery({
    queryKey: ['holiday-closures', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('holiday_closures')
        .select('*')
        .eq('company_id', companyId)
        .order('closure_date');
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
      };

      ['office', 'field', 'emergency'].forEach((hourType) => {
        const savedForType = savedHours.filter((h) => (h.hour_type || 'office') === hourType);
        if (savedForType.length > 0) {
          newHoursByType[hourType] = getDefaultHours(hourType).map((defaultHour) => {
            const saved = savedForType.find((h) => h.day_of_week === defaultHour.day_of_week);
            if (saved) {
              // Detect 24-hour mode: open_time = '00:00:xx' and close_time = '23:59:xx'
              const is24Hours =
                saved.open_time?.startsWith('00:00') &&
                saved.close_time?.startsWith('23:59');

              return {
                ...saved,
                hour_type: hourType,
                open_time: is24Hours ? '24hours' : saved.open_time,
              };
            }
            return defaultHour;
          });
        }
      });

      setHoursByType(newHoursByType);
    }
  }, [savedHours]);

  useEffect(() => {
    if (savedClosures) {
      setHolidayClosures(savedClosures.map(c => ({
        id: c.id,
        closure_date: c.closure_date,
        name: c.name,
      })));
    }
  }, [savedClosures]);

  const saveMutation = useMutation({
    mutationFn: async (hourType: string) => {
      if (!companyId) throw new Error('No company ID');

      const hours = hoursByType[hourType];
      
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
      queryClient.invalidateQueries({ queryKey: ['business-hours'] });
      toast.success('Hours saved successfully!');
    },
    onError: (error) => {
      console.error('Error saving hours:', error);
      toast.error('Failed to save hours');
    },
  });

  const addClosureMutation = useMutation({
    mutationFn: async ({ date, name }: { date: Date; name: string }) => {
      if (!companyId) throw new Error('No company ID');

      const { error } = await supabase
        .from('holiday_closures')
        .insert({
          company_id: companyId,
          closure_date: format(date, 'yyyy-MM-dd'),
          name: name || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holiday-closures'] });
      setNewHolidayName('');
      toast.success('Holiday closure added!');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.error('This date is already marked as closed');
      } else {
        toast.error('Failed to add closure');
      }
    },
  });

  const removeClosureMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('holiday_closures')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holiday-closures'] });
      toast.success('Holiday closure removed!');
    },
    onError: () => {
      toast.error('Failed to remove closure');
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

  const closedDates = holidayClosures.map(c => new Date(c.closure_date + 'T00:00:00'));

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const existingClosure = holidayClosures.find(c => 
      isSameDay(new Date(c.closure_date + 'T00:00:00'), date)
    );

    if (existingClosure) {
      if (existingClosure.id) {
        removeClosureMutation.mutate(existingClosure.id);
      }
    } else {
      addClosureMutation.mutate({ date, name: newHolidayName });
    }
  };

  const addCommonHoliday = (holiday: typeof COMMON_HOLIDAYS[0]) => {
    const year = new Date().getFullYear();
    const date = new Date(year, holiday.month, holiday.day);
    addClosureMutation.mutate({ date, name: holiday.name });
  };

  const copyHoursToOtherDays = (hourType: string, sourceDayIndex: number) => {
    const sourceHour = hoursByType[hourType].find(h => h.day_of_week === sourceDayIndex);
    if (!sourceHour) return;

    setHoursByType((prev) => ({
      ...prev,
      [hourType]: prev[hourType].map((h) => ({
        ...h,
        is_closed: sourceHour.is_closed,
        open_time: sourceHour.open_time,
        close_time: sourceHour.close_time,
      })),
    }));
    toast.success(`Copied ${DAYS[sourceDayIndex]}'s hours to all days`);
  };

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
              <Label className={cn('font-medium text-white', hour.is_closed && 'text-white/60')}>
                {DAYS[hour.day_of_week]}
              </Label>
            </div>

            {hour.is_closed ? (
              <span className="text-white/60 text-sm">Closed</span>
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
                {hour.open_time === '24hours' ? (
                  <span className="text-primary text-sm font-medium">(All Day)</span>
                ) : (
                  <>
                    <span className="text-white/70">to</span>
                    <Select
                      value={hour.close_time || '17:00:00'}
                      onValueChange={(value) => updateHour(hourType, hour.day_of_week, 'close_time', value)}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.filter(t => t.value !== '24hours').map((time) => (
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
            
            {/* Copy Hours Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
                  <Copy className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => copyHoursToOtherDays(hourType, hour.day_of_week)}>
                  <Check className="h-4 w-4 mr-2" />
                  Copy to all days
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

  const renderHolidayCalendar = () => {
    const months = Array.from({ length: 12 }, (_, i) => addMonths(startOfMonth(new Date()), i));

    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <Label>Holiday Name (optional)</Label>
          <div className="flex gap-2">
            <Input 
              placeholder="e.g., Christmas Day"
              value={newHolidayName}
              onChange={(e) => setNewHolidayName(e.target.value)}
              className="max-w-xs"
            />
          </div>
          <p className="text-sm text-white/60">
            Click on dates in the calendar to mark them as closed. Click again to remove.
          </p>
        </div>

        {/* Quick Add Common Holidays */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Quick Add Common Holidays</Label>
          <div className="flex flex-wrap gap-2">
            {COMMON_HOLIDAYS.map((holiday) => (
              <Button
                key={holiday.name}
                variant="outline"
                size="sm"
                onClick={() => addCommonHoliday(holiday)}
                disabled={addClosureMutation.isPending}
                className="gap-1"
              >
                <Plus className="w-3 h-3" />
                {holiday.name}
              </Button>
            ))}
          </div>
        </div>

        {/* 12 Month Calendar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {months.map((month) => (
            <div key={month.toISOString()} className="border rounded-lg p-2">
              <Calendar
                mode="single"
                month={month}
                onMonthChange={() => {}}
                selected={undefined}
                onSelect={handleDateSelect}
                modifiers={{
                  closed: closedDates,
                }}
                modifiersStyles={{
                  closed: { 
                    backgroundColor: 'hsl(var(--destructive))', 
                    color: 'hsl(var(--destructive-foreground))',
                    borderRadius: '50%',
                  },
                }}
                className={cn("p-1 pointer-events-auto text-xs")}
                classNames={{
                  months: "flex flex-col",
                  month: "space-y-1",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium",
                  nav: "hidden",
                  table: "w-full border-collapse",
                  head_row: "flex",
                  head_cell: "text-muted-foreground rounded-md w-7 font-normal text-[0.65rem]",
                  row: "flex w-full mt-1",
                  cell: "h-7 w-7 text-center text-xs p-0 relative",
                  day: "h-7 w-7 p-0 font-normal text-xs hover:bg-accent rounded-full",
                  day_selected: "bg-primary text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground",
                  day_outside: "text-muted-foreground opacity-50",
                }}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </div>
          ))}
        </div>

        {/* List of Closed Dates */}
        {holidayClosures.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Scheduled Closures ({holidayClosures.length})</Label>
            <div className="flex flex-wrap gap-2">
              {holidayClosures.map((closure) => (
                <Badge 
                  key={closure.id || closure.closure_date} 
                  variant="secondary"
                  className="gap-1 py-1 px-2"
                >
                  {format(new Date(closure.closure_date + 'T00:00:00'), 'MMM d, yyyy')}
                  {closure.name && <span className="text-white/60">- {closure.name}</span>}
                  <button
                    onClick={() => closure.id && removeClosureMutation.mutate(closure.id)}
                    className="ml-1 hover:text-destructive"
                    disabled={removeClosureMutation.isPending}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Business Hours
            </CardTitle>
            <CardDescription className="text-white/70">Set your operating hours for different scenarios</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <Select value={selectedTimezone} onValueChange={handleTimezoneChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select timezone" />
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
        </div>
      </CardHeader>
      <CardContent>
        {isLoading || isLoadingClosures ? (
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

            {HOUR_TYPES.filter(t => t.value !== 'holiday').map(({ value, description }) => (
              <TabsContent key={value} value={value}>
                <p className="text-sm text-muted-foreground mb-4">{description}</p>
                {renderHoursGrid(value)}
              </TabsContent>
            ))}

            <TabsContent value="holiday">
              <p className="text-sm text-muted-foreground mb-4">
                {HOUR_TYPES.find(t => t.value === 'holiday')?.description}
              </p>
              {renderHolidayCalendar()}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
