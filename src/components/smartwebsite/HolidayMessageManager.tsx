import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { CalendarIcon, Gift, Plus, Trash2, Edit2, X, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';

interface Holiday {
  id: string;
  holiday_name: string;
  holiday_date: string;
  custom_headline: string;
  custom_subheadline: string | null;
  custom_cta_text: string | null;
  custom_cta_url: string | null;
  is_active: boolean;
}

interface HolidayMessageManagerProps {
  websiteId: string;
  companyId: string;
}

const PRESET_HOLIDAYS = [
  { name: "New Year's Day", date: "01-01" },
  { name: "Valentine's Day", date: "02-14" },
  { name: "St. Patrick's Day", date: "03-17" },
  { name: "Easter", date: null }, // Variable date
  { name: "Mother's Day", date: null }, // Variable date
  { name: "Father's Day", date: null }, // Variable date
  { name: "Independence Day", date: "07-04" },
  { name: "Halloween", date: "10-31" },
  { name: "Thanksgiving", date: null }, // Variable date
  { name: "Christmas Eve", date: "12-24" },
  { name: "Christmas Day", date: "12-25" },
  { name: "New Year's Eve", date: "12-31" },
];

export function HolidayMessageManager({ websiteId, companyId }: HolidayMessageManagerProps) {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [formData, setFormData] = useState({
    holiday_name: '',
    custom_headline: '',
    custom_subheadline: '',
    custom_cta_text: '',
    custom_cta_url: '',
  });

  // Fetch holidays
  const { data: holidays = [], isLoading } = useQuery({
    queryKey: ['smart-website-holidays', websiteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('smart_website_holidays')
        .select('*')
        .eq('website_id', websiteId)
        .order('holiday_date', { ascending: true });
      
      if (error) throw error;
      return data as Holiday[];
    },
    enabled: !!websiteId,
  });

  // Create holiday mutation
  const createHoliday = useMutation({
    mutationFn: async () => {
      if (!selectedDate) throw new Error('Please select a date');
      
      const { error } = await supabase
        .from('smart_website_holidays')
        .insert({
          website_id: websiteId,
          company_id: companyId,
          holiday_name: formData.holiday_name,
          holiday_date: format(selectedDate, 'yyyy-MM-dd'),
          custom_headline: formData.custom_headline,
          custom_subheadline: formData.custom_subheadline || null,
          custom_cta_text: formData.custom_cta_text || null,
          custom_cta_url: formData.custom_cta_url || null,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-website-holidays'] });
      toast.success('Holiday message created!');
      resetForm();
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create holiday message');
    },
  });

  // Update holiday mutation
  const updateHoliday = useMutation({
    mutationFn: async (holidayId: string) => {
      const { error } = await supabase
        .from('smart_website_holidays')
        .update({
          holiday_name: formData.holiday_name,
          holiday_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined,
          custom_headline: formData.custom_headline,
          custom_subheadline: formData.custom_subheadline || null,
          custom_cta_text: formData.custom_cta_text || null,
          custom_cta_url: formData.custom_cta_url || null,
        })
        .eq('id', holidayId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-website-holidays'] });
      toast.success('Holiday message updated!');
      resetForm();
      setEditingHoliday(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update holiday message');
    },
  });

  // Toggle active mutation
  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('smart_website_holidays')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-website-holidays'] });
    },
  });

  // Delete holiday mutation
  const deleteHoliday = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('smart_website_holidays')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-website-holidays'] });
      toast.success('Holiday message deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete holiday message');
    },
  });

  const resetForm = () => {
    setFormData({
      holiday_name: '',
      custom_headline: '',
      custom_subheadline: '',
      custom_cta_text: '',
      custom_cta_url: '',
    });
    setSelectedDate(undefined);
  };

  const handleEdit = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      holiday_name: holiday.holiday_name,
      custom_headline: holiday.custom_headline,
      custom_subheadline: holiday.custom_subheadline || '',
      custom_cta_text: holiday.custom_cta_text || '',
      custom_cta_url: holiday.custom_cta_url || '',
    });
    setSelectedDate(new Date(holiday.holiday_date));
  };

  const handlePresetSelect = (preset: { name: string; date: string | null }) => {
    setFormData(prev => ({ ...prev, holiday_name: preset.name }));
    if (preset.date) {
      const currentYear = new Date().getFullYear();
      const [month, day] = preset.date.split('-');
      setSelectedDate(new Date(currentYear, parseInt(month) - 1, parseInt(day)));
    }
  };

  const HolidayForm = () => (
    <div className="space-y-4">
      {/* Preset Holidays Quick Select */}
      {!editingHoliday && (
        <div className="space-y-2">
          <Label>Quick Select Holiday</Label>
          <div className="flex flex-wrap gap-2">
            {PRESET_HOLIDAYS.slice(0, 6).map(preset => (
              <Button
                key={preset.name}
                variant="outline"
                size="sm"
                onClick={() => handlePresetSelect(preset)}
                className="text-xs"
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Holiday Name *</Label>
          <Input
            value={formData.holiday_name}
            onChange={(e) => setFormData(prev => ({ ...prev, holiday_name: e.target.value }))}
            placeholder="Christmas Day"
          />
        </div>
        <div className="space-y-2">
          <Label>Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Custom Headline *</Label>
        <Input
          value={formData.custom_headline}
          onChange={(e) => setFormData(prev => ({ ...prev, custom_headline: e.target.value }))}
          placeholder="🎄 Merry Christmas from our team!"
        />
      </div>

      <div className="space-y-2">
        <Label>Custom Subheadline</Label>
        <Textarea
          value={formData.custom_subheadline}
          onChange={(e) => setFormData(prev => ({ ...prev, custom_subheadline: e.target.value }))}
          placeholder="Wishing you joy and peace this holiday season..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Special CTA Text</Label>
          <Input
            value={formData.custom_cta_text}
            onChange={(e) => setFormData(prev => ({ ...prev, custom_cta_text: e.target.value }))}
            placeholder="Holiday Special"
          />
        </div>
        <div className="space-y-2">
          <Label>Special CTA URL</Label>
          <Input
            value={formData.custom_cta_url}
            onChange={(e) => setFormData(prev => ({ ...prev, custom_cta_url: e.target.value }))}
            placeholder="/holiday-offer"
          />
        </div>
      </div>
    </div>
  );

  return (
    <Collapsible>
      <Card>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              <div className="text-left">
                <CardTitle className="text-lg">Holiday Messages</CardTitle>
                <CardDescription>Schedule special greetings for holidays and important dates</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={(e) => { e.stopPropagation(); resetForm(); }}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Holiday
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add Holiday Message</DialogTitle>
                    <DialogDescription>
                      Create a special message that will display on your website on the selected date.
                    </DialogDescription>
                  </DialogHeader>
                  <HolidayForm />
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => createHoliday.mutate()}
                      disabled={!formData.holiday_name || !formData.custom_headline || !selectedDate || createHoliday.isPending}
                    >
                      {createHoliday.isPending ? 'Creating...' : 'Create Holiday'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <ChevronDown className="h-5 w-5 text-card-foreground/70" />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            {holidays.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No holiday messages scheduled yet.</p>
                <p className="text-sm">Add special greetings for Christmas, New Year, and more!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {holidays.map(holiday => (
                  <div
                    key={holiday.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg border transition-all",
                      holiday.is_active ? "bg-background" : "bg-muted/50 opacity-60"
                    )}
                  >
                    {editingHoliday?.id === holiday.id ? (
                      <div className="w-full space-y-4">
                        <HolidayForm />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingHoliday(null);
                              resetForm();
                            }}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateHoliday.mutate(holiday.id)}
                            disabled={updateHoliday.isPending}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{holiday.holiday_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {format(new Date(holiday.holiday_date), 'MMM d, yyyy')}
                            </Badge>
                            {new Date(holiday.holiday_date).toDateString() === new Date().toDateString() && (
                              <Badge className="text-xs bg-green-500">Today!</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate max-w-md">
                            {holiday.custom_headline}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={holiday.is_active}
                            onCheckedChange={(checked) => toggleActive.mutate({ id: holiday.id, is_active: checked })}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="btn-ghost-card"
                            onClick={(e) => { e.stopPropagation(); handleEdit(holiday); }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); deleteHoliday.mutate(holiday.id); }}
                            className="btn-ghost-card text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}