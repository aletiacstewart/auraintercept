import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  CalendarDays,
  Instagram,
  MapPin,
  Facebook,
  MessageSquare,
  Linkedin,
  Video,
  Clock,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

interface SocialContentCalendarProps {
  companyId: string;
  onClose?: () => void;
}

interface ScheduledPost {
  id: string;
  scheduled_for: string;
  platforms: string[];
  status: string;
  content_json: {
    content?: string;
  };
}

interface ContentDraft {
  id: string;
  created_at: string;
  platform: string;
  status: string;
  generated_content: string;
  published_at?: string;
}

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  instagram: Instagram,
  google_business: MapPin,
  facebook: Facebook,
  sms: MessageSquare,
  tiktok: Video,
  linkedin: Linkedin,
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'bg-pink-100 text-pink-700 border-pink-200',
  google_business: 'bg-blue-100 text-blue-700 border-blue-200',
  facebook: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  sms: 'bg-green-100 text-green-700 border-green-200',
  tiktok: 'bg-rose-100 text-rose-700 border-rose-200',
  linkedin: 'bg-sky-100 text-sky-700 border-sky-200',
};

export function SocialContentCalendar({ companyId, onClose }: SocialContentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Fetch scheduled posts
  const { data: scheduledPosts } = useQuery({
    queryKey: ['scheduled-posts-calendar', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_posts')
        .select('*')
        .eq('company_id', companyId)
        .order('scheduled_for', { ascending: true });
      if (error) throw error;
      return data as ScheduledPost[];
    },
    enabled: !!companyId,
  });

  // Fetch published content
  const { data: publishedContent } = useQuery({
    queryKey: ['published-content-calendar', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_content_drafts')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'published')
        .order('published_at', { ascending: false });
      if (error) throw error;
      return data as ContentDraft[];
    },
    enabled: !!companyId,
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Group content by date
  const contentByDate = useMemo(() => {
    const map = new Map<string, { scheduled: ScheduledPost[], published: ContentDraft[] }>();
    
    scheduledPosts?.forEach(post => {
      const dateKey = format(new Date(post.scheduled_for), 'yyyy-MM-dd');
      if (!map.has(dateKey)) {
        map.set(dateKey, { scheduled: [], published: [] });
      }
      map.get(dateKey)!.scheduled.push(post);
    });

    publishedContent?.forEach(content => {
      if (content.published_at) {
        const dateKey = format(new Date(content.published_at), 'yyyy-MM-dd');
        if (!map.has(dateKey)) {
          map.set(dateKey, { scheduled: [], published: [] });
        }
        map.get(dateKey)!.published.push(content);
      }
    });

    return map;
  }, [scheduledPosts, publishedContent]);

  const getContentForDate = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return contentByDate.get(dateKey) || { scheduled: [], published: [] };
  };

  const selectedDateContent = selectedDate ? getContentForDate(selectedDate) : null;

  return (
    <Card className="border-card-foreground/20 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-pink-100 border border-pink-200">
              <CalendarDays className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-card-foreground">Content Calendar</CardTitle>
              <p className="text-sm text-card-foreground/60">
                View scheduled and published content
              </p>
            </div>
          </div>
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="text-card-foreground hover:text-card-foreground hover:bg-card-foreground/10"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Prev
          </Button>
          <h3 className="text-lg font-semibold text-card-foreground">
            {format(currentDate, 'MMMM yyyy')}
          </h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="text-card-foreground hover:text-card-foreground hover:bg-card-foreground/10"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-card-foreground/50 py-2">
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {/* Add padding for days before month start */}
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {days.map(day => {
            const content = getContentForDate(day);
            const hasScheduled = content.scheduled.length > 0;
            const hasPublished = content.published.length > 0;
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentDate);

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "aspect-square p-1 rounded-lg text-sm transition-all relative",
                  "hover:bg-card-foreground/10",
                  isCurrentMonth ? "text-card-foreground" : "text-card-foreground/30",
                  isToday(day) && "ring-2 ring-pink-500/50",
                  isSelected && "bg-pink-500/20 ring-2 ring-pink-500"
                )}
              >
                <span className={cn(
                  "block text-center",
                  isToday(day) && "font-bold text-pink-600"
                )}>
                  {format(day, 'd')}
                </span>
                {(hasScheduled || hasPublished) && (
                  <div className="flex gap-0.5 justify-center mt-0.5">
                    {hasScheduled && (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" title="Scheduled" />
                    )}
                    {hasPublished && (
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" title="Published" />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-card-foreground/60 border-t border-card-foreground/10 pt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Scheduled</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span>Published</span>
          </div>
        </div>

        {/* Selected Date Details */}
        {selectedDate && selectedDateContent && (
          <div className="border-t border-card-foreground/10 pt-4 space-y-3">
            <h4 className="font-medium text-card-foreground">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h4>

            {selectedDateContent.scheduled.length === 0 && selectedDateContent.published.length === 0 ? (
              <p className="text-sm text-card-foreground/50">No content for this date</p>
            ) : (
              <div className="space-y-2">
                {/* Scheduled Posts */}
                {selectedDateContent.scheduled.map(post => (
                  <div 
                    key={post.id} 
                    className="p-3 rounded-lg bg-blue-50 border border-blue-200"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-600">
                        Scheduled for {format(new Date(post.scheduled_for), 'h:mm a')}
                      </span>
                    </div>
                    <p className="text-sm text-card-foreground/80 line-clamp-2">
                      {post.content_json?.content || 'No content preview'}
                    </p>
                    <div className="flex gap-1 mt-2">
                      {post.platforms.map(platform => {
                        const Icon = PLATFORM_ICONS[platform];
                        return Icon ? (
                          <Badge 
                            key={platform} 
                            variant="outline" 
                            className={cn("text-xs", PLATFORM_COLORS[platform])}
                          >
                            <Icon className="h-3 w-3 mr-1" />
                            {platform.replace('_', ' ')}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                ))}

                {/* Published Content */}
                {selectedDateContent.published.map(content => {
                  const Icon = PLATFORM_ICONS[content.platform];
                  return (
                    <div 
                      key={content.id} 
                      className="p-3 rounded-lg bg-green-50 border border-green-200"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">
                          Published {content.published_at && format(new Date(content.published_at), 'h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm text-card-foreground/80 line-clamp-2">
                        {content.generated_content}
                      </p>
                      <div className="mt-2">
                        {Icon && (
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs", PLATFORM_COLORS[content.platform])}
                          >
                            <Icon className="h-3 w-3 mr-1" />
                            {content.platform.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
