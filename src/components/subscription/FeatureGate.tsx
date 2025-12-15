import React from 'react';
import { useSubscription, SubscriptionTier, Feature } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FeatureGateProps {
  requiredTier?: SubscriptionTier;
  requiredFeature?: Feature;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  requiredTier,
  requiredFeature,
  children,
  fallback,
  showUpgradePrompt = true,
}) => {
  const { isAtLeastTier, hasFeature, subscriptionTier } = useSubscription();
  const navigate = useNavigate();

  const hasAccess = requiredTier 
    ? isAtLeastTier(requiredTier) 
    : requiredFeature 
      ? hasFeature(requiredFeature) 
      : true;

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  const tierLabel = requiredTier 
    ? requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)
    : 'a higher';

  return (
    <Card className="border-dashed border-2 border-muted-foreground/30 bg-muted/20">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-lg">Upgrade Required</CardTitle>
        <CardDescription>
          This feature requires the {tierLabel} plan or higher.
          You're currently on the {subscriptionTier} plan.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Button onClick={() => navigate('/dashboard/subscription')} className="gap-2">
          <Sparkles className="h-4 w-4" />
          Upgrade Now
        </Button>
      </CardContent>
    </Card>
  );
};

export const FeatureGateInline: React.FC<{
  requiredTier?: SubscriptionTier;
  requiredFeature?: Feature;
  children: React.ReactNode;
}> = ({ requiredTier, requiredFeature, children }) => {
  const { isAtLeastTier, hasFeature } = useSubscription();
  const navigate = useNavigate();

  const hasAccess = requiredTier 
    ? isAtLeastTier(requiredTier) 
    : requiredFeature 
      ? hasFeature(requiredFeature) 
      : true;

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div 
      className="relative cursor-pointer group"
      onClick={() => navigate('/dashboard/subscription')}
    >
      <div className="opacity-50 pointer-events-none blur-[1px]">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Lock className="h-4 w-4" />
          Upgrade to unlock
        </div>
      </div>
    </div>
  );
};
