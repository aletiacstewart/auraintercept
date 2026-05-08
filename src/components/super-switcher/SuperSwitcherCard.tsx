import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Layers, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SUPER_ADMIN_EMAIL, SUPER_LAST_INDUSTRY } from '@/hooks/useSuperSwitcher';

export function SuperSwitcherCard() {
  const navigate = useNavigate();
  const [isSuper, setIsSuper] = useState(false);
  const [lastIndustry, setLastIndustry] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setIsSuper(data.user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL);
    });
    try { setLastIndustry(localStorage.getItem(SUPER_LAST_INDUSTRY)); } catch {}
    return () => { mounted = false; };
  }, []);

  if (!isSuper) return null;

  return (
    <Card className="border-primary/40 bg-gradient-to-br from-primary/10 via-background to-background shadow-[0_0_30px_-10px_hsl(var(--primary)/0.4)]">
      <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-lg border border-primary/40 bg-primary/10 p-3">
            <Layers className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold tracking-wide text-foreground">Demo Switcher Hub</h3>
              <Badge variant="outline" className="border-primary/40 text-primary">
                <Sparkles className="mr-1 h-3 w-3" /> Super Admin
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Jump into any industry as Company, Employee, or Customer — no logout required.
            </p>
            {lastIndustry && (
              <p className="text-xs text-muted-foreground">
                Last used: <span className="font-mono text-foreground">{lastIndustry}</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate('/super-switcher')} className="gap-2">
            Open Switcher Hub <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}