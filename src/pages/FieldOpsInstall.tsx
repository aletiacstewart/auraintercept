import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { FieldOpsAppCard } from '@/components/company/FieldOpsAppCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Monitor, ExternalLink, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FieldOpsInstall() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Field Ops App Installation</h1>
          <p className="text-muted-foreground">
            Deploy the Field Ops mobile app to your technicians' devices
          </p>
        </div>
        
        <FieldOpsAppCard />

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
                  Access Field Ops Console directly through the platform for desktop use or as a backup method
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-4 rounded-lg border border-border/50 bg-muted/30">
                <h4 className="font-medium mb-1">Technician Console</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Full Field Ops experience for technicians accessing via web browser
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/technician/ai-console')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Technician Console
                </Button>
              </div>
              <div className="p-4 rounded-lg border border-border/50 bg-muted/30">
                <h4 className="font-medium mb-1">Dispatch Console</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Admin view for dispatching and managing field operations
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/dashboard/field-operations')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Dispatch Console
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Web access provides the same functionality as the mobile app, ideal for desktop use or when PWA installation isn't available
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
