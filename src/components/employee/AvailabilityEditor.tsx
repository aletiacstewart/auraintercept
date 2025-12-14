import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Save, Plus, Trash2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeSlot {
  start: string;
  end: string;
}

interface AvailabilityData {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  const time = `${hour.toString().padStart(2, '0')}:${minute}`;
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return { value: time, label: `${displayHour}:${minute} ${ampm}` };
});

const DEFAULT_AVAILABILITY: AvailabilityData = {
  monday: [{ start: '09:00', end: '17:00' }],
  tuesday: [{ start: '09:00', end: '17:00' }],
  wednesday: [{ start: '09:00', end: '17:00' }],
  thursday: [{ start: '09:00', end: '17:00' }],
  friday: [{ start: '09:00', end: '17:00' }],
  saturday: [],
  sunday: [],
};

interface AvailabilityEditorProps {
  initialAvailability?: AvailabilityData | null;
}

export function AvailabilityEditor({ initialAvailability }: AvailabilityEditorProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [availability, setAvailability] = useState<AvailabilityData>(
    initialAvailability || DEFAULT_AVAILABILITY
  );
  const [enabledDays, setEnabledDays] = useState<Record<string, boolean>>({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  });

  useEffect(() => {
    if (initialAvailability) {
      setAvailability(initialAvailability);
      const enabled: Record<string, boolean> = {};
      DAYS.forEach(day => {
        enabled[day] = initialAvailability[day]?.length > 0;
      });
      setEnabledDays(enabled);
    }
  }, [initialAvailability]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      // Clean up disabled days - convert to JSON-compatible format
      const cleanedAvailability = Object.fromEntries(
        DAYS.map(day => [
          day,
          enabledDays[day] 
            ? availability[day].map(slot => ({ start: slot.start, end: slot.end }))
            : []
        ])
      );

      const { error } = await supabase
        .from('profiles')
        // @ts-ignore - availability_json is a valid JSONB column
        .update({ availability_json: cleanedAvailability })
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Availability saved!');
    },
    onError: (error) => {
      console.error('Error saving availability:', error);
      toast.error('Failed to save availability');
    },
  });

  const toggleDay = (day: string) => {
    setEnabledDays(prev => {
      const newState = { ...prev, [day]: !prev[day] };
      if (!prev[day]) {
        // Enable day with default slot
        setAvailability(a => ({
          ...a,
          [day]: [{ start: '09:00', end: '17:00' }],
        }));
      }
      return newState;
    });
  };

  const addTimeSlot = (day: typeof DAYS[number]) => {
    setAvailability(prev => ({
      ...prev,
      [day]: [...prev[day], { start: '09:00', end: '17:00' }],
    }));
  };

  const removeTimeSlot = (day: typeof DAYS[number], index: number) => {
    setAvailability(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index),
    }));
  };

  const updateTimeSlot = (day: typeof DAYS[number], index: number, field: 'start' | 'end', value: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: prev[day].map((slot, i) =>
        i === index ? { ...slot, [field]: value } : slot
      ),
    }));
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Weekly Availability
        </CardTitle>
        <CardDescription>
          Set your working hours for each day of the week
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {DAYS.map((day, dayIndex) => (
          <div
            key={day}
            className={cn(
              'p-4 rounded-lg border transition-colors',
              enabledDays[day] ? 'bg-card border-border' : 'bg-muted/30 border-transparent'
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Switch
                  checked={enabledDays[day]}
                  onCheckedChange={() => toggleDay(day)}
                />
                <Label className={cn('font-medium', !enabledDays[day] && 'text-muted-foreground')}>
                  {DAY_LABELS[dayIndex]}
                </Label>
              </div>
              {enabledDays[day] && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => addTimeSlot(day)}
                  className="text-primary"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Slot
                </Button>
              )}
            </div>

            {enabledDays[day] && (
              <div className="space-y-2 pl-10">
                {availability[day].length === 0 ? (
                  <p className="text-sm text-muted-foreground">No time slots. Add one to set availability.</p>
                ) : (
                  availability[day].map((slot, slotIndex) => (
                    <div key={slotIndex} className="flex items-center gap-2">
                      <Select
                        value={slot.start}
                        onValueChange={(value) => updateTimeSlot(day, slotIndex, 'start', value)}
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
                        value={slot.end}
                        onValueChange={(value) => updateTimeSlot(day, slotIndex, 'end', value)}
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
                      {availability[day].length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTimeSlot(day, slotIndex)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}

        <div className="flex justify-end pt-4">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? 'Saving...' : 'Save Availability'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
