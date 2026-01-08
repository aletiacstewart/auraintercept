import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { FinancialPulseDashboard } from './FinancialPulseDashboard';
import { InventoryMatrix } from './InventoryMatrix';
import { PaymentConnectionsSettings } from './PaymentConnectionsSettings';
import { Briefcase } from 'lucide-react';

type ViewType = 'dashboard' | 'inventory' | 'payments';

interface BusinessOpsConsoleProps {
  companyId?: string;
}

export function BusinessOpsConsole({ companyId: propCompanyId }: BusinessOpsConsoleProps) {
  const { companyId: authCompanyId, userRole } = useAuth();
  const effectiveCompanyId = propCompanyId || authCompanyId;
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  
  const isPlatformAdmin = userRole === 'platform_admin';

  const handleNavigate = (section: ViewType) => {
    setCurrentView(section);
  };

  const handleBack = () => {
    setCurrentView('dashboard');
  };

  if (!effectiveCompanyId) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <p className="text-muted-foreground">No company selected</p>
      </Card>
    );
  }

  return (
    <Card className="min-h-[600px] flex flex-col overflow-hidden shadow-lg border-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-accent/20 bg-background/50">
        <div className="p-2 rounded-lg bg-gradient-to-br from-accent/20 to-accent/10">
          <Briefcase className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h1 className="font-semibold text-foreground">Business Operations</h1>
          <p className="text-xs text-muted-foreground">
            Financial Pulse • Inventory Matrix
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {currentView === 'dashboard' && (
          <FinancialPulseDashboard 
            companyId={effectiveCompanyId} 
            onNavigate={handleNavigate}
            showQuotes={false}
            userRole={userRole}
          />
        )}
        {currentView === 'inventory' && (
          <InventoryMatrix 
            companyId={effectiveCompanyId} 
            onBack={handleBack}
          />
        )}
        {currentView === 'payments' && (
          <PaymentConnectionsSettings 
            companyId={effectiveCompanyId} 
            onBack={handleBack}
          />
        )}
      </div>
    </Card>
  );
}
