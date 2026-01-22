import { RefreshCw, HardDrive, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForceRefresh } from '@/hooks/useForceRefresh';

export function SystemSettings() {
  const { forceRefresh, isRefreshing } = useForceRefresh();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Cache Management
          </CardTitle>
          <CardDescription>
            Manage your application cache and ensure you're running the latest version
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-primary/10 rounded-lg border border-primary/20">
            <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-foreground mb-1">When to use Force Refresh</p>
              <ul className="list-disc list-inside space-y-1 text-foreground/80">
                <li>The app seems outdated or shows old data</li>
                <li>You're seeing unexpected behavior after an update</li>
                <li>Features aren't working as expected</li>
                <li>Switching between devices and seeing inconsistencies</li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={forceRefresh} 
              disabled={isRefreshing}
              className="flex-1"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Clearing Cache...' : 'Force Refresh & Clear Cache'}
            </Button>
          </div>
          
          <p className="text-xs text-foreground/70">
            This will clear all cached data, unregister service workers, and reload the application 
            to ensure you're running the latest version.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>App Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-foreground/70">Build Date</p>
              <p className="font-medium text-foreground">{new Date().toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-foreground/70">PWA Status</p>
              <p className="font-medium text-foreground">
                {'serviceWorker' in navigator ? 'Enabled' : 'Not Available'}
              </p>
            </div>
            <div>
              <p className="text-foreground/70">Cache Storage</p>
              <p className="font-medium text-foreground">
                {'caches' in window ? 'Available' : 'Not Available'}
              </p>
            </div>
            <div>
              <p className="text-foreground/70">Online Status</p>
              <p className="font-medium text-foreground">
                {navigator.onLine ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
