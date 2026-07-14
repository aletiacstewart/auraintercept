import { Activity } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { AutonomyStatusPanel } from '@/components/admin/AutonomyStatusPanel';
import { StatusEditor } from '@/components/admin/StatusEditor';
import { PlatformBlogPanel } from '@/components/admin/PlatformBlogPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PlatformHealth() {
  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader
          icon={Activity}
          title="Platform Health"
          description="Real-time view of autonomous background operations across the platform."
        />
        <Tabs defaultValue="autonomy" className="space-y-4">
          <TabsList>
            <TabsTrigger value="autonomy">Autonomy</TabsTrigger>
            <TabsTrigger value="status">Public status page</TabsTrigger>
            <TabsTrigger value="blog">Platform blog</TabsTrigger>
          </TabsList>
          <TabsContent value="autonomy" className="mt-4">
            <AutonomyStatusPanel />
          </TabsContent>
          <TabsContent value="status" className="mt-4">
            <StatusEditor />
          </TabsContent>
          <TabsContent value="blog" className="mt-4">
            <PlatformBlogPanel />
          </TabsContent>
        </Tabs>
      </PageContainer>
    </DashboardLayout>
  );
}
