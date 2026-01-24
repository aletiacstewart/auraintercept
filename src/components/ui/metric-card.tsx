import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  badge?: React.ReactNode;
  onClick?: () => void;
  valueColor?: 'accent' | 'warning' | 'destructive' | 'success' | 'default';
  iconColor?: string;
  className?: string;
}

export function MetricCard({ 
  icon: Icon, 
  value, 
  label, 
  badge, 
  onClick, 
  valueColor = 'accent',
  iconColor = 'text-white',
  className
}: MetricCardProps) {
  const valueColors = {
    accent: 'text-accent',
    warning: 'text-warning',
    destructive: 'text-destructive',
    success: 'text-green-400',
    default: 'text-foreground'
  };

  return (
    <Card 
      className={cn(
        "surface-metric transition-colors",
        onClick && "hover:border-accent/40 cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <Icon className={cn("h-4 w-4", iconColor)} />
          {badge}
        </div>
        <p className={cn("text-xl font-bold mt-1.5", valueColors[valueColor])}>{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
