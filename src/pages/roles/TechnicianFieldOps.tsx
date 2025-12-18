import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeJobRole } from '@/hooks/useEmployeeJobRole';
import { RoleDashboardLayout } from '@/components/dashboard/RoleDashboardLayout';
import { FieldOpsAgentConsole } from '@/components/employee/FieldOpsAgentConsole';
import { TechnicianMap } from '@/components/employee/TechnicianMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Map } from 'lucide-react';

export default function TechnicianFieldOps() {
  const { user, loading: authLoading, companyId } = useAuth();
  const { loading: roleLoading } = useEmployeeJobRole();
  const navigate = useNavigate();
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleNavigateRequest = (address: string) => {
    setSelectedAddress(address);
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-32 w-64" />
      </div>
    );
  }

  return (
    <RoleDashboardLayout jobRole="technician">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="w-8 h-8 text-primary" />
            Field Ops Console
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered field operations management
          </p>
        </div>

        {/* Main Content - Tabs */}
        <Tabs defaultValue="console" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="console" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              AI Console
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Map className="w-4 h-4" />
              Navigation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="console" className="space-y-4">
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" />
                  Field Operations AI Assistant
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage your jobs with AI assistance - accept jobs, update status, get directions
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <FieldOpsAgentConsole 
                  companyId={companyId || undefined}
                  onNavigateRequest={handleNavigateRequest}
                  className="h-[600px]"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="map" className="space-y-4">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="w-5 h-5 text-primary" />
                  Navigation Map
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Get directions to customer locations
                </p>
              </CardHeader>
              <CardContent>
                <TechnicianMap 
                  initialAddress={selectedAddress}
                  onAddressSearched={() => setSelectedAddress(null)}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RoleDashboardLayout>
  );
}