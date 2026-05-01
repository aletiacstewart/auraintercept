import { AuraSummary } from './AuraSummary';
import { AuraStatCard } from './charts/AuraStatCard';
import { AuraLineChart } from './charts/AuraLineChart';
import {
  AuraIntent,
  getSuggestedVisualization,
  buildIntakeAnalyticsHref,
  type IntakeAnalyticsTarget,
} from '@/lib/auraQueryParser';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DollarSign, TrendingUp, Users, Target, BarChart3, ClipboardList } from 'lucide-react';

interface AuraResponseRendererProps {
  intent: AuraIntent;
  summary: string;
  isLoading?: boolean;
  data?: {
    stats?: Array<{
      title: string;
      value: string | number;
      change?: number;
      icon?: string;
    }>;
    chartData?: Array<{
      date: string;
      value: number;
    }>;
    chartTitle?: string;
  };
  /** When provided, renders a deep-link CTA into the Intake analytics tab. */
  intake?: IntakeAnalyticsTarget;
}

const iconMap: Record<string, React.ReactNode> = {
  dollar: <DollarSign className="h-6 w-6 text-primary" />,
  trending: <TrendingUp className="h-6 w-6 text-primary" />,
  users: <Users className="h-6 w-6 text-primary" />,
  target: <Target className="h-6 w-6 text-primary" />,
  chart: <BarChart3 className="h-6 w-6 text-primary" />,
};

export function AuraResponseRenderer({
  intent,
  summary,
  isLoading = false,
  data,
  intake,
}: AuraResponseRendererProps) {
  const visualizationType = getSuggestedVisualization(intent);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <AuraSummary content="" isLoading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Summary */}
      <AuraSummary content={summary} />

      {/* Intake analytics deep-link */}
      {intake && (
        <Card className="bg-card border-border p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-2">
              <ClipboardList className="h-4 w-4 text-primary" />
            </div>
            <div className="text-sm">
              <div className="font-medium text-foreground">
                Open in Intake analytics
              </div>
              <div className="text-xs text-muted-foreground">
                {intake.field
                  ? `${intake.field} · ${intake.view} · ${intake.source}`
                  : `${intake.view} · ${intake.source}`}
              </div>
            </div>
          </div>
          <Button asChild size="sm" variant="secondary">
            <Link to={buildIntakeAnalyticsHref(intake)}>View report</Link>
          </Button>
        </Card>
      )}

      {/* Stats Grid */}
      {data?.stats && data.stats.length > 0 && (
        <div className={`grid gap-4 ${data.stats.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
          {data.stats.map((stat, index) => (
            <AuraStatCard
              key={index}
              title={stat.title}
              value={stat.value}
              change={stat.change}
              icon={stat.icon ? iconMap[stat.icon] : iconMap.chart}
              size={data.stats?.length === 1 ? 'lg' : 'md'}
            />
          ))}
        </div>
      )}

      {/* Chart */}
      {data?.chartData && data.chartData.length > 0 && (
        <AuraLineChart
          title={data.chartTitle || 'Trend Analysis'}
          data={data.chartData}
          type={intent === 'forecast' ? 'area' : 'line'}
          valuePrefix={intent === 'revenue' || intent === 'forecast' ? '$' : ''}
        />
      )}
    </div>
  );
}
