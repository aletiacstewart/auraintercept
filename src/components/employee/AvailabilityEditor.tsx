import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { Save, Clock, Truck, AlertTriangle, CalendarHeart, X, Plus, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format, addMonths, startOfMonth, isSameDay } from 'date-fns';

interface AvailabilityHour {
  id?: string;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
  hour_type: string;
}

interface TimeOff {
  id?: string;
  time_off_date: string;
  name: string | null;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const HOUR_TYPES = [
  { value: 'field', label: 'Field Hours', icon: Truck, description: 'Regular working/field service hours' },
  { value: 'emergency', label: 'Emergency Hours', icon: AlertTriangle, description: 'On-call emergency availability' },
  { value: 'timeoff', label: 'Time Off', icon: CalendarHeart, description: 'Personal days off and holidays' },
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

const getDefaultHours = (hourType: string): AvailabilityHour[] => {
  if (hourType === 'emergency') {
    return DAYS.map((_, index) => ({
      day_of_week: index,
      open_time: null,
      close_time: null,
      is_closed: true,
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

interface AvailabilityEditorProps {
  initialAvailability?: any;
}

export function AvailabilityEditor({ initialAvailability }: AvailabilityEditorProps) {
  const { user, companyId } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('field');
  const [hoursByType, setHoursByType] = useState<Record<string, AvailabilityHour[]>>({
    field: getDefaultHours('field'),
    emergency: getDefaultHours('emergency'),
  });
  const [timeOffs, setTimeOffs] = useState<TimeOff[]>([]);
  const [newTimeOffName, setNewTimeOffName] = useState('');

  // Fetch saved availability
  const { data: savedHours, isLoading } = useQuery({
    queryKey: ['employee-availability', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('employee_availability')
        .select('*')
        .eq('employee_id', user.id)
        .order('day_of_week');
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch saved time offs
  const { data: savedTimeOffs, isLoading: isLoadingTimeOffs } = useQuery({
    queryKey: ['employee-time-off', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('employee_time_off')
        .select('*')
        .eq('employee_id', user.id)
        .order('time_off_date');
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (savedHours && savedHours.length > 0) {
      const newHoursByType: Record<string, AvailabilityHour[]> = {
        field: getDefaultHours('field'),
        emergency: getDefaultHours('emergency'),
      };

      ['field', 'emergency'].forEach((hourType) => {
        const savedForType = savedHours.filter((h: any) => (h.hour_type || 'field') === hourType);
        if (savedForType.length > 0) {
          newHoursByType[hourType] = getDefaultHours(hourType).map((defaultHour) => {
            const saved = savedForType.find((h: any) => h.day_of_week === defaultHour.day_of_week);
            return saved ? { ...saved, hour_type: hourType } : defaultHour;
          });
        }
      });

      setHoursByType(newHoursByType);
    }
  }, [savedHours]);

  useEffect(() => {
    if (savedTimeOffs) {
      setTimeOffs(savedTimeOffs.map((t: any) => ({
        id: t.id,
        time_off_date: t.time_off_date,
        name: t.name,
      })));
    }
  }, [savedTimeOffs]);

  const saveMutation = useMutation({
    mutationFn: async (hourType: string) => {
      if (!user?.id || !companyId) throw new Error('Not authenticated');

      const hours = hoursByType[hourType];
      
      for (const hour of hours) {
        const is24Hours = hour.open_time === '24hours';
        const payload = {
          employee_id: user.id,
          company_id: companyId,
          day_of_week: hour.day_of_week,
          open_time: hour.is_closed ? null : (is24Hours ? '00:00:00' : hour.open_time),
          close_time: hour.is_closed ? null : (is24Hours ? '23:59:59' : hour.close_time),
          is_closed: hour.is_closed,
          hour_type: hourType,
        };

        const { error } = await supabase
          .from('employee_availability')
          .upsert(payload, { onConflict: 'employee_id,day_of_week,hour_type' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-availability'] });
      toast.success('Hours saved successfully!');
    },
    onError: (error) => {
      console.error('Error saving hours:', error);
      toast.error('Failed to save hours');
    },
  });

  const addTimeOffMutation = useMutation({
    mutationFn: async ({ date, name }: { date: Date; name: string }) => {
      if (!user?.id || !companyId) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('employee_time_off')
        .insert({
          employee_id: user.id,
          company_id: companyId,
          time_off_date: format(date, 'yyyy-MM-dd'),
          name: name || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-time-off'] });
      setNewTimeOffName('');
      toast.success('Time off added!');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.error('This date is already marked as time off');
      } else {
        toast.error('Failed to add time off');
      }
    },
  });

  const removeTimeOffMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('employee_time_off')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-time-off'] });
      toast.success('Time off removed!');
    },
    onError: () => {
      toast.error('Failed to remove time off');
    },
  });

  const updateHour = (hourType: string, dayIndex: number, field: keyof AvailabilityHour, value: unknown) => {
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

  const timeOffDates = timeOffs.map(t => new Date(t.time_off_date + 'T00:00:00'));

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const existingTimeOff = timeOffs.find(t => 
      isSameDay(new Date(t.time_off_date + 'T00:00:00'), date)
    );

    if (existingTimeOff) {
      if (existingTimeOff.id) {
        removeTimeOffMutation.mutate(existingTimeOff.id);
      }
    } else {
      addTimeOffMutation.mutate({ date, name: newTimeOffName });
    }
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
              <span className="text-muted-foreground text-sm">Not Available</span>
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
                    <span className="text-muted-foreground">to</span>
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

  const renderTimeOffCalendar = () => {
    const months = Array.from({ length: 12 }, (_, i) => addMonths(startOfMonth(new Date()), i));

    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <Label>Time Off Name (optional)</Label>
          <div className="flex gap-2">
            <Input 
              placeholder="e.g., Vacation, Personal Day"
              value={newTimeOffName}
              onChange={(e) => setNewTimeOffName(e.target.value)}
              className="max-w-xs"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Click on dates in the calendar to mark them as time off. Click again to remove.
          </p>
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
                  timeOff: timeOffDates,
                }}
                modifiersStyles={{
                  timeOff: { 
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

        {/* List of Time Off Dates */}
        {timeOffs.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Scheduled Time Off ({timeOffs.length})</Label>
            <div className="flex flex-wrap gap-2">
              {timeOffs.map((timeOff) => (
                <Badge 
                  key={timeOff.id || timeOff.time_off_date} 
                  variant="secondary"
                  className="gap-1 py-1 px-2"
                >
                  {format(new Date(timeOff.time_off_date + 'T00:00:00'), 'MMM d, yyyy')}
                  {timeOff.name && <span className="text-muted-foreground">- {timeOff.name}</span>}
                  <button
                    onClick={() => timeOff.id && removeTimeOffMutation.mutate(timeOff.id)}
                    className="ml-1 hover:text-destructive"
                    disabled={removeTimeOffMutation.isPending}
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

  if (isLoading || isLoadingTimeOffs) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-14 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          My Availability
        </CardTitle>
        <CardDescription>Set your working hours for different scenarios</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-6">
            {HOUR_TYPES.map((type) => (
              <TabsTrigger key={type.value} value={type.value} className="gap-2">
                <type.icon className="w-4 h-4" />
                {type.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="field">
            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <Truck className="w-4 h-4 inline mr-2" />
                Set your regular working hours for field service appointments.
              </p>
            </div>
            {renderHoursGrid('field')}
          </TabsContent>

          <TabsContent value="emergency">
            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                Set your on-call availability for emergency service requests.
              </p>
            </div>
            {renderHoursGrid('emergency')}
          </TabsContent>

          <TabsContent value="timeoff">
            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <CalendarHeart className="w-4 h-4 inline mr-2" />
                Mark specific dates when you will be unavailable (vacation, personal days, etc.).
              </p>
            </div>
            {renderTimeOffCalendar()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}