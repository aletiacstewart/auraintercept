import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { 
  Calendar as CalendarIcon,
  Share2, 
  Mail, 
  FileText, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { format, isSameDay, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';


interface ScheduledItem {
  id: string;
  type: 'social' | 'blog' | 'campaign';
  title: string;
  scheduledFor: Date;
  status: string;
  platform?: string;
}

const TYPE_CONFIG = {
  social: { icon: Share2, color: 'bg-pink-500/20 text-pink-400', label: 'Social Post' },
  blog: { icon: FileText, color: 'bg-green-500/20 text-green-400', label: 'Blog Post' },
  campaign: { icon: Mail, color: 'bg-amber-500/20 text-amber-400', label: 'Campaign' },
};

export function ContentEngineCalendar() {
  const { companyId } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Fetch scheduled social posts
  const { data: socialPosts } = useQuery({
    queryKey: ['scheduled-social-posts-calendar', companyId, currentMonth],
    queryFn: async () => {
      if (!companyId) return [];
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      
      const { data, error } = await supabase
        .from('scheduled_social_posts')
        .select('id, topic, platforms, scheduled_for, status, content_json')
        .eq('company_id', companyId)
        .gte('scheduled_for', start.toISOString())
        .lte('scheduled_for', end.toISOString())
        .order('scheduled_for', { ascending: true });
      
      if (error) throw error;
      return (data || []).map(post => {
        // Extract first platform's post for preview
        const contentJson = post.content_json as Record<string, { post?: string }> | null;
        const firstPlatform = post.platforms?.[0];
        const postContent = contentJson && firstPlatform ? contentJson[firstPlatform]?.post : '';
        const title = postContent?.slice(0, 50) + (postContent && postContent.length > 50 ? '...' : '') || post.topic || 'Social Post';
        
        return {
          id: post.id,
          type: 'social' as const,
          title,
          scheduledFor: new Date(post.scheduled_for),
          status: post.status,
          platform: post.platforms?.[0],
        };
      });
    },
    enabled: !!companyId,
  });

  // Fetch scheduled blog posts
  const { data: blogPosts } = useQuery({
    queryKey: ['scheduled-blog-posts-calendar', companyId, currentMonth],
    queryFn: async () => {
      if (!companyId) return [];
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      
      const { data, error } = await supabase
        .from('scheduled_blog_posts')
        .select('id, title, scheduled_for, status')
        .eq('company_id', companyId)
        .gte('scheduled_for', start.toISOString())
        .lte('scheduled_for', end.toISOString())
        .order('scheduled_for', { ascending: true });
      
      if (error) throw error;
      return (data || []).map(post => ({
        id: post.id,
        type: 'blog' as const,
        title: post.title || 'Blog Post',
        scheduledFor: new Date(post.scheduled_for),
        status: post.status,
      }));
    },
    enabled: !!companyId,
  });

  // Fetch scheduled campaigns
  const { data: campaigns } = useQuery({
    queryKey: ['marketing-campaigns-calendar', companyId, currentMonth],
    queryFn: async () => {
      if (!companyId) return [];
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('id, name, scheduled_send_date, status')
        .eq('company_id', companyId)
        .not('scheduled_send_date', 'is', null)
        .gte('scheduled_send_date', start.toISOString())
        .lte('scheduled_send_date', end.toISOString())
        .order('scheduled_send_date', { ascending: true });
      
      if (error) throw error;
      return (data || []).map(camp => ({
        id: camp.id,
        type: 'campaign' as const,
        title: camp.name || 'Campaign',
        scheduledFor: new Date(camp.scheduled_send_date!),
        status: camp.status,
      }));
    },
    enabled: !!companyId,
  });

  // Combine all scheduled items
  const allItems: ScheduledItem[] = [
    ...(socialPosts || []),
    ...(blogPosts || []),
    ...(campaigns || []),
  ].sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());

  // Get items for selected date
  const selectedDateItems = allItems.filter(item => 
    isSameDay(item.scheduledFor, selectedDate)
  );

  // Get dates with content for calendar highlighting
  const datesWithContent = allItems.map(item => item.scheduledFor);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Content Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>Unified view of all scheduled content</CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className="w-full"
            modifiers={{
              hasContent: datesWithContent,
            }}
            modifiersStyles={{
              hasContent: {
                fontWeight: 'bold',
                backgroundColor: 'hsl(var(--primary) / 0.1)',
                borderRadius: '50%',
              },
            }}
          />
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t">
            {Object.entries(TYPE_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <div key={key} className="flex items-center gap-1.5">
                  <div className={`p-1 rounded ${config.color}`}>
                    <Icon className="h-3 w-3" />
                  </div>
                  <span className="text-xs text-muted-foreground">{config.label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Day Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {format(selectedDate, 'EEEE, MMM d')}
          </CardTitle>
          <CardDescription>
            {selectedDateItems.length} item{selectedDateItems.length !== 1 ? 's' : ''} scheduled
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedDateItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No content scheduled for this day</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {selectedDateItems.map((item) => {
                  const config = TYPE_CONFIG[item.type];
                  const Icon = config.icon;
                  return (
                    <div
                      key={`${item.type}-${item.id}`}
                      className="p-3 rounded-lg border bg-background/50"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded ${config.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {format(item.scheduledFor, 'h:mm a')}
                            </span>
                            {item.platform && (
                              <Badge variant="outline" className="text-xs capitalize">
                                {item.platform}
                              </Badge>
                            )}
                            <Badge
                              variant={item.status === 'published' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {item.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
