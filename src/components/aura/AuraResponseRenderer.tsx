import { AuraSummary } from './AuraSummary';
import { AuraStatCard } from './charts/AuraStatCard';
import { AuraLineChart } from './charts/AuraLineChart';
import { AuraIntent, getSuggestedVisualization } from '@/lib/auraQueryParser';
import { DollarSign, TrendingUp, Users, Target, BarChart3 } from 'lucide-react';

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
