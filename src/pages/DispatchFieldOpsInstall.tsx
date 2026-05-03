import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { DispatchFieldOpsAppCard } from '@/components/company/DispatchFieldOpsAppCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Monitor, ExternalLink, Globe, MapPin } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { useNavigate } from 'react-router-dom';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { getNavLabels } from '@/lib/industryNavLabels';

export default function DispatchFieldOpsInstall() {
  const navigate = useNavigate();
  const { pack } = useIndustryPack();
  const nav = getNavLabels(pack);
  const dispatchLabel = nav.dispatchView; // e.g. Patient Schedule, Shop Queue, Chair Schedule

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            icon={MapPin}
            title={`${dispatchLabel} Mobile App Install`}
            description={`Deploy the ${dispatchLabel} mobile app to your front-desk and manager devices`}
            featureColor="fieldops"
          />
        
        <DispatchFieldOpsAppCard />

        {/* Web Backup Access Card */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Monitor className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">Web Backup Access</CardTitle>
                  <Badge variant="outline" className="text-xs text-white border-white/30">
                    <Globe className="h-3 w-3 mr-1" />
                    Desktop / Browser
                  </Badge>
                </div>
                <CardDescription>
                  Access {dispatchLabel} directly through the platform for desktop use or as a backup method
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-4 rounded-lg border border-border/50 bg-card">
                <h4 className="font-medium mb-1 text-card-foreground">{dispatchLabel} (Dashboard)</h4>
                <p className="text-sm text-card-foreground/70 mb-3">
                  Full {dispatchLabel.toLowerCase()} experience within the main dashboard
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/dashboard/dispatch-field-ops')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open {dispatchLabel}
                </Button>
              </div>
              <div className="p-4 rounded-lg border border-border/50 bg-card">
                <h4 className="font-medium mb-1 text-card-foreground">Standalone {dispatchLabel} App</h4>
                <p className="text-sm text-card-foreground/70 mb-3">
                  Lightweight {dispatchLabel.toLowerCase()} console without dashboard navigation
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open('/dispatch-field-ops-app', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Standalone App
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Web access provides the same functionality as the mobile app, ideal for desktop use or when PWA installation isn't available
            </p>
          </CardContent>
        </Card>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
