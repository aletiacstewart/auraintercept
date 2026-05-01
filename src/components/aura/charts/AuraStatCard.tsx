import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AuraStatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  description?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AuraStatCard({
  title,
  value,
  change,
  changeLabel = 'vs last period',
  icon,
  description,
  className,
  size = 'md',
}: AuraStatCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change === 0;

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const valueSizes = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-5xl',
  };

  return (
    <Card className={cn('bg-card border-border', className)}>
      <CardContent className={sizeClasses[size]}>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-primary">{title}</p>
            <p className={cn('font-bold text-card-foreground', valueSizes[size])}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            
            {change !== undefined && (
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium',
                    isPositive && 'bg-secondary/20 text-secondary',
                    isNegative && 'bg-destructive/20 text-destructive',
                    isNeutral && 'bg-muted text-white'
                  )}
                >
                  {isPositive && <TrendingUp className="h-3 w-3" />}
                  {isNegative && <TrendingDown className="h-3 w-3" />}
                  {isNeutral && <Minus className="h-3 w-3" />}
                  <span>
                    {isPositive && '+'}
                    {change.toFixed(1)}%
                  </span>
                </div>
                <span className="text-xs text-white">{changeLabel}</span>
              </div>
            )}
            
            {description && (
              <p className="text-sm text-white mt-2">{description}</p>
            )}
          </div>
          
          {icon && (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
