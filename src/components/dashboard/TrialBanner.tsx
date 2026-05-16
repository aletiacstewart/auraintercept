import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, Crown, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TrialBanner() {
  const { inTrial, trialEndsAt, subscribed } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
  } | null>(null);

  useEffect(() => {
    if (!trialEndsAt) return;

    const updateCountdown = () => {
      const now = new Date();
      const end = new Date(trialEndsAt);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeRemaining({ days, hours, minutes });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [trialEndsAt]);

  // Don't show if not in trial, already subscribed (not trial), or dismissed
  if (!inTrial || !trialEndsAt || dismissed) return null;

  // If subscribed but not in trial, it means they have a real subscription
  if (subscribed && !inTrial) return null;

  const totalDays = 90;
  const daysUsed = totalDays - (timeRemaining?.days ?? 0);
  const progressPercent = Math.min((daysUsed / totalDays) * 100, 100);

  const isUrgent = timeRemaining && timeRemaining.days <= 3;
  const isCritical = timeRemaining && timeRemaining.days <= 1;

  return (
    <div 
      className={cn(
        "relative rounded-xl border p-4 mb-6 animate-fade-in",
        isCritical 
          ? "bg-red-500/10 border-red-500/30" 
          : isUrgent 
            ? "bg-amber-500/10 border-amber-500/30"
            : "bg-primary/5 border-primary/20"
      )}
    >
      <button 
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-background/50 text-foreground"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
          isCritical 
            ? "bg-red-500/20" 
            : isUrgent 
              ? "bg-amber-500/20"
              : "bg-primary/20"
        )}>
          <Sparkles className={cn(
            "w-6 h-6",
            isCritical 
              ? "text-red-500" 
              : isUrgent 
                ? "text-amber-500"
                : "text-primary"
          )} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/20 text-primary">
              Free Trial
            </span>
            {isCritical && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/20 text-red-500">
                Ending Soon!
              </span>
            )}
          </div>

          <h3 className="font-semibold text-lg">
            {timeRemaining?.days === 0 
              ? "Your trial ends today!" 
              : `${timeRemaining?.days} day${timeRemaining?.days !== 1 ? 's' : ''} left in your free trial`
            }
          </h3>

          <p className="text-sm text-foreground mt-1">
            {isCritical 
              ? "Subscribe now to keep your AI Operatives and all premium features."
              : "You have full access to every Aura Elite feature during your 90-day trial."
            }
          </p>

          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>
                  {timeRemaining?.days}d {timeRemaining?.hours}h {timeRemaining?.minutes}m remaining
                </span>
              </div>
              <span>{Math.round(progressPercent)}% of trial used</span>
            </div>
            <Progress 
              value={progressPercent} 
              className={cn(
                "h-2",
                isCritical 
                  ? "[&>div]:bg-red-500" 
                  : isUrgent 
                    ? "[&>div]:bg-amber-500"
                    : ""
              )}
            />
          </div>
        </div>

        <Button 
          onClick={() => navigate('/dashboard/subscription')}
          className={cn(
            "shrink-0",
            isCritical 
              ? "bg-red-500 hover:bg-red-600" 
              : isUrgent 
                ? "bg-amber-500 hover:bg-amber-600"
                : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
          )}
        >
          <Crown className="w-4 h-4 mr-2" />
          Subscribe Now
        </Button>
      </div>
    </div>
  );
}