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
        "bg-slate-800 border-white/10 transition-colors",
        onClick && "hover:border-accent/40 cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <Icon className={cn("h-5 w-5", iconColor)} />
          {badge}
        </div>
        <p className={cn("text-2xl font-bold mt-2", valueColors[valueColor])}>{value}</p>
        <p className="text-xs text-white/70">{label}</p>
      </CardContent>
    </Card>
  );
}
