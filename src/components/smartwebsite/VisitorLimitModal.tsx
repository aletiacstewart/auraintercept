import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, Zap, Crown, ArrowRight } from 'lucide-react';

interface VisitorLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentVisitors: number;
  visitorLimit: number;
  currentTier?: string;
}

const tierLimits = {
  starter: { limit: 500, name: 'Core', next: 'connect' },
  connect: { limit: 2000, name: 'Boost', next: 'performance' },
  performance: { limit: 10000, name: 'Pro', next: 'command' },
  command: { limit: 25000, name: 'Elite', next: null },
};

const tierUpgrades = {
  connect: {
    name: 'Boost',
    price: '$497/mo',
    limit: '2,000',
    icon: TrendingUp,
    features: ['4x more visitors', '5 Control Centers', 'Field Operations'],
  },
  performance: {
    name: 'Pro',
    price: '$997/mo',
    limit: '10,000',
    icon: TrendingUp,
    features: ['20x more visitors', '5 Control Centers', 'Industry Specialist Agents'],
  },
  command: {
    name: 'Elite',
    price: '$1,997/mo',
    limit: '25,000',
    icon: Crown,
    features: ['50x more visitors', 'All 7 Centers + AI Hub', 'Unlimited employees'],
  },
};

export function VisitorLimitModal({
  open,
  onOpenChange,
  currentVisitors,
  visitorLimit,
  currentTier = 'single_point',
}: VisitorLimitModalProps) {
  const navigate = useNavigate();
  const usagePercent = Math.min((currentVisitors / visitorLimit) * 100, 100);
  const isAtLimit = currentVisitors >= visitorLimit;
  const isNearLimit = usagePercent >= 80;
  
  const currentTierInfo = tierLimits[currentTier as keyof typeof tierLimits] || tierLimits.starter;
  const nextTier = currentTierInfo.next;
  const upgradeInfo = nextTier ? tierUpgrades[nextTier as keyof typeof tierUpgrades] : null;

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/dashboard/subscription');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {isAtLimit ? (
              <div className="p-2 rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
            ) : (
              <div className="p-2 rounded-full bg-amber-500/10">
                <Zap className="h-5 w-5 text-amber-500" />
              </div>
            )}
            <DialogTitle>
              {isAtLimit ? 'Visitor Limit Reached' : 'Approaching Visitor Limit'}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isAtLimit
              ? 'Your Web Presence has reached its monthly visitor limit. New visitors will see a "Coming Soon" page until next month.'
              : `You've used ${usagePercent.toFixed(0)}% of your monthly visitor quota. Consider upgrading to avoid interruptions.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Usage */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Usage</span>
              <span className="font-medium">
                {currentVisitors.toLocaleString()} / {visitorLimit.toLocaleString()}
              </span>
            </div>
            <Progress 
              value={usagePercent} 
              className={`h-2 ${isAtLimit ? '[&>div]:bg-destructive' : isNearLimit ? '[&>div]:bg-amber-500' : ''}`}
            />
            <div className="flex justify-between items-center">
              <Badge variant="outline" className="text-xs">
                {currentTierInfo.name}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Resets monthly
              </span>
            </div>
          </div>

          {/* Upgrade Option */}
          {upgradeInfo && (
            <div className="border rounded-lg p-4 bg-primary/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <upgradeInfo.icon className="h-5 w-5 text-primary" />
                  <span className="font-semibold">{upgradeInfo.name}</span>
                </div>
                <Badge className="bg-primary">{upgradeInfo.price}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Up to <span className="font-semibold text-foreground">{upgradeInfo.limit}</span> monthly visitors
              </div>
              <ul className="space-y-1">
                {upgradeInfo.features.map((feature, i) => (
                  <li key={i} className="text-sm flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!upgradeInfo && (
            <div className="border rounded-lg p-4 bg-muted/50 text-center">
              <Crown className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-medium">You're on our highest tier!</p>
              <p className="text-sm text-muted-foreground">
                Contact support if you need higher limits.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Dismiss
          </Button>
          {upgradeInfo && (
            <Button onClick={handleUpgrade} className="w-full sm:w-auto">
              Upgrade Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
