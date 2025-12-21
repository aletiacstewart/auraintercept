import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, Truck, Megaphone, BarChart3, HeadphonesIcon, Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import aiBotBannerLogo from '@/assets/ai-bot-company-banner.png';

// Import actual dashboard console components
import { AIAgentConsole } from '@/components/ai/AIAgentConsole';
import { FieldOpsAgentConsole } from '@/components/employee/FieldOpsAgentConsole';
import { BusinessOpsAgentConsole } from '@/components/billing/BusinessOpsAgentConsole';
import { MarketingSalesAgentConsole } from '@/components/marketing/MarketingSalesAgentConsole';
import { AnalyticsAgentConsole } from '@/components/analytics/AnalyticsAgentConsole';

// Demo company ID - AI Bot Company
const DEMO_COMPANY_ID = '00000000-0000-0000-0000-000000000001';

// Console types for the demo - matching Platform Admin sidebar navigation exactly
const CONSOLE_TYPES = [
  { id: 'customer', label: 'Customer Engagement', icon: HeadphonesIcon, color: 'from-cyan-500 to-blue-500', description: 'Schedule appointments, get quotes, track service status, and leave feedback' },
  { id: 'fieldops', label: 'Field Operations', icon: Truck, color: 'from-green-500 to-emerald-500', description: 'Accept jobs, get directions, update ETA, and complete service calls' },
  { id: 'businessops', label: 'Business Operations', icon: Briefcase, color: 'from-purple-500 to-violet-500', description: 'Create quotes, generate invoices, check inventory, and manage warranties' },
  { id: 'marketing', label: 'Marketing & Sales', icon: Megaphone, color: 'from-orange-500 to-red-500', description: 'Create campaigns, generate promos, manage referrals, and track leads' },
  { id: 'analytics', label: 'Analytics & Insights', icon: BarChart3, color: 'from-indigo-500 to-blue-600', description: 'View performance reports, revenue analysis, forecasts, and KPIs' },
];

export default function Demo() {
  const navigate = useNavigate();
  const [activeConsole, setActiveConsole] = useState('customer');

  const currentConsole = CONSOLE_TYPES.find(c => c.id === activeConsole);

  const renderActiveConsole = () => {
    switch (activeConsole) {
      case 'customer':
        return <AIAgentConsole companyId={DEMO_COMPANY_ID} />;
      case 'fieldops':
        return <FieldOpsAgentConsole companyId={DEMO_COMPANY_ID} />;
      case 'businessops':
        return <BusinessOpsAgentConsole companyId={DEMO_COMPANY_ID} />;
      case 'marketing':
        return <MarketingSalesAgentConsole companyId={DEMO_COMPANY_ID} />;
      case 'analytics':
        return <AnalyticsAgentConsole companyId={DEMO_COMPANY_ID} demoMode={true} />;
      default:
        return <AIAgentConsole companyId={DEMO_COMPANY_ID} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <PublicHeader />
      
      {/* Demo Banner */}
      <div className="glass-primary text-primary-foreground py-2 px-4 sm:py-3 sm:px-6">
        <div className="container max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            <span className="font-medium text-sm sm:text-base truncate">Live Demo - AI Agent Consoles</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button 
              variant="secondary" 
              size="sm"
              className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
              onClick={() => navigate('/auth?mode=company')}
            >
              Sign Up
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex-1">
        <div className="container max-w-6xl mx-auto py-4 sm:py-6 px-3 sm:px-6">
          {/* Header */}
          <div className="text-center mb-6">
            <img 
              src={aiBotBannerLogo} 
              alt="AI Bot Company" 
              className="h-12 sm:h-14 object-contain mx-auto mb-3"
            />
            <h1 className="text-xl sm:text-2xl font-bold mb-2">Experience All 5 AI Agent Consoles</h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
              Switch between console types to see how AI agents handle different business operations
            </p>
          </div>

          {/* Console Type Selector */}
          <Tabs value={activeConsole} onValueChange={setActiveConsole} className="mb-6">
            <TabsList className="grid grid-cols-5 w-full h-auto p-1 bg-muted/50">
              {CONSOLE_TYPES.map((console) => (
                <TabsTrigger
                  key={console.id}
                  value={console.id}
                  className={cn(
                    "flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm",
                    "data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  )}
                >
                  <console.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">{console.label}</span>
                  <span className="sm:hidden text-[10px] text-center leading-tight">{console.label.split(' ')[0]}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Console Description Badge */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge 
              variant="outline" 
              className={cn(
                "px-4 py-1.5 text-sm font-medium",
                `bg-gradient-to-r ${currentConsole?.color} text-white border-0`
              )}
            >
              {currentConsole && <currentConsole.icon className="h-4 w-4 mr-2" />}
              {currentConsole?.label}
            </Badge>
          </div>
          <p className="text-center text-muted-foreground text-sm mb-6">{currentConsole?.description}</p>

          {/* Render the actual console component */}
          <div className="h-[calc(100vh-340px)] sm:h-[550px]">
            {renderActiveConsole()}
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
