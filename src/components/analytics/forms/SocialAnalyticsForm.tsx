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
  instagram: { icon: Instagram, color: 'text-pink-400 bg-pink-500/15 border-pink-500/30', label: 'Instagram' },
  google_business: { icon: MapPin, color: 'text-blue-400 bg-blue-500/15 border-blue-500/30', label: 'Google Business' },
  facebook: { icon: Facebook, color: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30', label: 'Facebook' },
  sms: { icon: MessageSquare, color: 'text-green-400 bg-green-500/15 border-green-500/30', label: 'SMS' },
  tiktok: { icon: Video, color: 'text-rose-400 bg-rose-500/15 border-rose-500/30', label: 'TikTok' },
  linkedin: { icon: Linkedin, color: 'text-sky-400 bg-sky-500/15 border-sky-500/30', label: 'LinkedIn' },
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
    <Card className="border-card-foreground/20 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-pink-500/15 border border-pink-500/30">
              <Share2 className="h-5 w-5 text-pink-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-card-foreground">Social Media Analytics</CardTitle>
              <p className="text-sm text-card-foreground/60">
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
              <div className="p-4 rounded-xl bg-muted/20 border border-card-foreground/10">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-card-foreground/60" />
                  <span className="text-xs text-card-foreground/60">Total Drafts</span>
                </div>
                <p className="text-2xl font-bold text-card-foreground">{totalDrafts}</p>
              </div>

              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-xs text-green-400/80">Published</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{publishedCount}</p>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-amber-400" />
                  <span className="text-xs text-amber-400/80">Pending</span>
                </div>
                <p className="text-2xl font-bold text-amber-400">{pendingCount}</p>
              </div>

              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-400" />
                  <span className="text-xs text-blue-400/80">Scheduled</span>
                </div>
                <p className="text-2xl font-bold text-blue-400">{scheduledCount}</p>
              </div>
            </div>

            {/* Publish Rate */}
            <div className="p-4 rounded-xl bg-muted/20 border border-card-foreground/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-card-foreground/70">Publish Rate</span>
                <span className="text-lg font-bold text-card-foreground">{publishRate}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-card-foreground/10">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all"
                  style={{ width: `${publishRate}%` }}
                />
              </div>
            </div>

            {/* Platform Breakdown */}
            <div>
              <h4 className="text-sm font-medium text-card-foreground mb-3">Platform Distribution</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(PLATFORM_CONFIG).map(([platform, config]) => {
                  const count = platformCounts[platform] || 0;
                  const Icon = config.icon;
                  return (
                    <div 
                      key={platform}
                      className={`p-3 rounded-lg border ${config.color}`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{config.label}</span>
                      </div>
                      <p className="text-xl font-bold mt-1">{count}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button 
                onClick={handleAnalyze} 
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white"
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
