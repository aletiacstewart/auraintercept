import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Share2, 
  Instagram, 
  MapPin, 
  Facebook, 
  MessageSquare, 
  Linkedin, 
  Video,
  TrendingUp,
  FileText,
  CheckCircle,
  Clock,
  X,
} from 'lucide-react';
import { format, subDays } from 'date-fns';

interface SocialAnalyticsFormProps {
  companyId: string;
  onCancel: () => void;
  onAnalyze: (data: Record<string, unknown>) => void;
}

const PLATFORM_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  instagram: { icon: Instagram, color: 'text-pink-600 bg-white border-border', label: 'Instagram' },
  google_business: { icon: MapPin, color: 'text-blue-600 bg-white border-border', label: 'Google Business' },
  facebook: { icon: Facebook, color: 'text-indigo-600 bg-white border-border', label: 'Facebook' },
  sms: { icon: MessageSquare, color: 'text-green-600 bg-white border-border', label: 'SMS' },
  tiktok: { icon: Video, color: 'text-rose-600 bg-white border-border', label: 'TikTok' },
  linkedin: { icon: Linkedin, color: 'text-sky-600 bg-white border-border', label: 'LinkedIn' },
};

export function SocialAnalyticsForm({ companyId, onCancel, onAnalyze }: SocialAnalyticsFormProps) {
  const [dateRange] = useState(30);

  // Fetch all drafts
  const { data: drafts, isLoading: loadingDrafts } = useQuery({
    queryKey: ['social-analytics-drafts', companyId, dateRange],
    queryFn: async () => {
      const startDate = subDays(new Date(), dateRange);
      const { data, error } = await supabase
        .from('social_content_drafts')
        .select('*')
        .eq('company_id', companyId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Fetch scheduled posts
  const { data: scheduledPosts, isLoading: loadingScheduled } = useQuery({
    queryKey: ['social-analytics-scheduled', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_posts')
        .select('*')
        .eq('company_id', companyId)
        .order('scheduled_for', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const isLoading = loadingDrafts || loadingScheduled;

  // Calculate metrics
  const totalDrafts = drafts?.length || 0;
  const publishedCount = drafts?.filter(d => d.status === 'published').length || 0;
  const pendingCount = drafts?.filter(d => d.status === 'pending').length || 0;
  const scheduledCount = scheduledPosts?.filter(p => p.status === 'scheduled').length || 0;
  const publishRate = totalDrafts > 0 ? Math.round((publishedCount / totalDrafts) * 100) : 0;

  // Platform breakdown
  const platformCounts = drafts?.reduce((acc, draft) => {
    acc[draft.platform] = (acc[draft.platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const handleAnalyze = () => {
    onAnalyze({
      dateRange,
      totalDrafts,
      publishedCount,
      pendingCount,
      scheduledCount,
      publishRate,
      platformBreakdown: platformCounts,
      topPlatform: Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none',
    });
  };

  return (
    <Card className="border-border bg-background shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-border">
              <Share2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg text-foreground">Social Media Analytics</CardTitle>
              <p className="text-sm text-muted-foreground">
                Publishing activity over the last {dateRange} days
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 rounded-xl bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-white border border-border shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Total Drafts</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{totalDrafts}</p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-border shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-muted-foreground">Published</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{publishedCount}</p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-border shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-xs text-muted-foreground">Pending</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-border shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-xs text-muted-foreground">Scheduled</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{scheduledCount}</p>
              </div>
            </div>

            {/* Publish Rate */}
            <div className="p-4 rounded-xl bg-white border border-border shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Publish Rate</span>
                <span className="text-lg font-bold text-foreground">{publishRate}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted">
                <div 
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${publishRate}%` }}
                />
              </div>
            </div>

            {/* Platform Breakdown */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Platform Distribution</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(PLATFORM_CONFIG).map(([platform, config]) => {
                  const count = platformCounts[platform] || 0;
                  const Icon = config.icon;
                  const iconColorClass = config.color.split(' ')[0]; // Extract just the text color
                  return (
                    <div 
                      key={platform}
                      className="p-3 rounded-lg border border-border bg-white shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${iconColorClass}`} />
                        <span className="text-sm font-medium text-foreground">{config.label}</span>
                      </div>
                      <p className="text-xl font-bold mt-1 text-foreground">{count}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button 
                onClick={handleAnalyze} 
                className="flex-1"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Get AI Insights
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Close
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
