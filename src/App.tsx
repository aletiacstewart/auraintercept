import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PWAUpdatePrompt } from "@/components/pwa/PWAUpdatePrompt";
import ErrorBoundary from "@/components/error/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CustomerAuth from "./pages/CustomerAuth";
import CustomerPortalHome from "./pages/CustomerPortalHome";
import CustomerPortalInstall from "./pages/CustomerPortalInstall";
import CustomerCompanyPortal from "./pages/CustomerCompanyPortal";

import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import Customers from "./pages/Customers";
import Employees from "./pages/Employees";
import EmployeeDetail from "./pages/EmployeeDetail";
import Settings from "./pages/Settings";

import EmployeeAvailability from "./pages/EmployeeAvailability";
import EmployeeAppointments from "./pages/EmployeeAppointments";

import Messages from "./pages/Messages";
import EmailLogs from "./pages/EmailLogs";
import SMSLogs from "./pages/SMSLogs";
import Integrations from "./pages/Integrations";
import { VoiceIntegration, SMSIntegration, EmailIntegration, CRMIntegration, CalendarIntegration } from "./pages/integrations";
import KnowledgeBase from "./pages/KnowledgeBase";
import AIAgent from "./pages/AIAgent";
import {
  CustomerPortalConsole,
  FieldOpsConsole,
  BusinessManagementConsole,
  MarketingSalesConsole,
  AnalyticsConsole,
  NewLeadPage,
  PerformanceReportPage,
  BusinessInsightsPage,
  RevenueAnalysisPage,
  DemandForecastPage,
  CustomerInsightsPage,
  KpiDashboardPage,
} from "./pages/ai-consoles";
import AIAgentsHub from "./pages/AIAgentsHub";
import AgentDetailPage from "./pages/AgentDetailPage";
import Widget from "./pages/Widget";
import CallHistory from "./pages/CallHistory";
import Analytics from "./pages/Analytics";
import CustomerPortal from "./pages/CustomerPortal";
import CustomerDashboard from "./pages/CustomerDashboard";
import Subscription from "./pages/Subscription";
import SubscriptionAnalytics from "./pages/SubscriptionAnalytics";
import PublicChat from "./pages/PublicChat";
import Inventory from "./pages/Inventory";
import Quotes from "./pages/Quotes";
import Invoices from "./pages/Invoices";
import Warranties from "./pages/Warranties";
import Referrals from "./pages/Referrals";
import Campaigns from "./pages/Campaigns";
import Leads from "./pages/Leads";
import Help from "./pages/Help";
import Architecture from "./pages/Architecture";
import Calculators from "./pages/Calculators";
import ExportDocumentation from "./pages/ExportDocumentation";
import FieldOperations from "./pages/FieldOperations";
import BusinessOperations from "./pages/BusinessOperations";
import FieldOpsInstall from "./pages/FieldOpsInstall";
import DispatchFieldOpsInstall from "./pages/DispatchFieldOpsInstall";
import BusinessMgtOpsInstall from "./pages/BusinessMgtOpsInstall";
import FieldOpsApp from "./pages/FieldOpsApp";
import DispatchFieldOpsApp from "./pages/DispatchFieldOpsApp";
import BusinessMgtOpsApp from "./pages/BusinessMgtOpsApp";
import OpportunityAudit from "./pages/OpportunityAudit";
import CustomerPortalAppInstall from "./pages/CustomerPortalAppInstall";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";
import PlatformIssues from "./pages/PlatformIssues";
import OAuthGoogleCalendar from "./pages/OAuthGoogleCalendar";
import SmartWebsite from "./pages/SmartWebsite";
import SmartWebsiteManager from "./pages/SmartWebsiteManager";
// Technician Dashboard Pages
import {
  TechnicianDashboard,
  TechnicianAIConsole,
  TechnicianJobs,
  TechnicianCalendar,
  TechnicianSettings,
  TechnicianAvailability,
  TechnicianHistory,
  TechnicianProfile,
  TechnicianInstall,
} from "./pages/technician";

import IntegrationDocs from "./pages/IntegrationDocs";
import PlatformGuides from "./pages/PlatformGuides";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ErrorBoundary>
          <Toaster />
          <Sonner />
          <PWAUpdatePrompt />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/audit" element={<OpportunityAudit />} />
              <Route path="/field-ops-app" element={<FieldOpsApp />} />
              <Route path="/dispatch-field-ops-app" element={<DispatchFieldOpsApp />} />
              <Route path="/business-mgt-ops-app" element={<BusinessMgtOpsApp />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/oauth/google-calendar" element={<OAuthGoogleCalendar />} />
              <Route path="/customer-auth" element={<CustomerAuth />} />
            
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/companies" element={<Companies />} />
              <Route path="/dashboard/customers" element={<Customers />} />
              <Route path="/dashboard/employees" element={<Employees />} />
              <Route path="/dashboard/employees/:id" element={<EmployeeDetail />} />
              <Route path="/dashboard/start-step-1-setup" element={<Settings />} />
              
              <Route path="/dashboard/availability" element={<EmployeeAvailability />} />
              <Route path="/dashboard/appointments" element={<EmployeeAppointments />} />
              
              <Route path="/dashboard/messages" element={<Messages />} />
              <Route path="/dashboard/integrations" element={<Integrations />} />
              <Route path="/dashboard/integrations/voice" element={<VoiceIntegration />} />
              <Route path="/dashboard/integrations/sms" element={<SMSIntegration />} />
              <Route path="/dashboard/integrations/email" element={<EmailIntegration />} />
              <Route path="/dashboard/integrations/crm" element={<CRMIntegration />} />
              <Route path="/dashboard/integrations/calendar" element={<CalendarIntegration />} />
              <Route path="/dashboard/knowledge" element={<KnowledgeBase />} />
              <Route path="/dashboard/ai-agent" element={<AIAgent />} />
              <Route path="/dashboard/ai-consoles/customer-portal" element={<CustomerPortalConsole />} />
              <Route path="/dashboard/ai-consoles/field-ops" element={<FieldOpsConsole />} />
              <Route path="/dashboard/ai-consoles/business-management" element={<BusinessManagementConsole />} />
              <Route path="/dashboard/ai-consoles/marketing-sales" element={<MarketingSalesConsole />} />
              <Route path="/dashboard/ai-consoles/analytics" element={<AnalyticsConsole />} />
              <Route path="/dashboard/ai-consoles/new-lead" element={<NewLeadPage />} />
              <Route path="/dashboard/ai-consoles/performance-report" element={<PerformanceReportPage />} />
              <Route path="/dashboard/ai-consoles/business-insights" element={<BusinessInsightsPage />} />
              <Route path="/dashboard/ai-consoles/revenue-analysis" element={<RevenueAnalysisPage />} />
              <Route path="/dashboard/ai-consoles/revenue-forecast" element={<DemandForecastPage />} />
              <Route path="/dashboard/ai-consoles/customer-insights" element={<CustomerInsightsPage />} />
              <Route path="/dashboard/ai-consoles/kpi-dashboard" element={<KpiDashboardPage />} />
              <Route path="/dashboard/ai-agents" element={<AIAgentsHub />} />
              <Route path="/dashboard/ai-agents/:agentId" element={<AgentDetailPage />} />
              <Route path="/dashboard/customer-website-app" element={<Widget />} />
              <Route path="/dashboard/calls" element={<CallHistory />} />
              <Route path="/dashboard/email-logs" element={<EmailLogs />} />
              <Route path="/dashboard/sms-logs" element={<SMSLogs />} />
              <Route path="/dashboard/analytics" element={<Analytics />} />
              <Route path="/dashboard/subscription" element={<Subscription />} />
              <Route path="/dashboard/subscription-analytics" element={<SubscriptionAnalytics />} />
              <Route path="/dashboard/inventory" element={<Inventory />} />
              <Route path="/dashboard/quotes" element={<Quotes />} />
              <Route path="/dashboard/invoices" element={<Invoices />} />
              <Route path="/dashboard/warranties" element={<Warranties />} />
              <Route path="/dashboard/referrals" element={<Referrals />} />
              <Route path="/dashboard/campaigns" element={<Campaigns />} />
              <Route path="/dashboard/leads" element={<Leads />} />
              <Route path="/dashboard/help" element={<Help />} />
              <Route path="/dashboard/architecture" element={<Architecture />} />
              <Route path="/dashboard/calculators" element={<Calculators />} />
              <Route path="/dashboard/export-docs" element={<ExportDocumentation />} />
              <Route path="/dashboard/dispatch-field-ops" element={<FieldOperations />} />
              <Route path="/dashboard/business-operations" element={<BusinessOperations />} />
              <Route path="/dashboard/field-ops-install" element={<FieldOpsInstall />} />
              <Route path="/dashboard/dispatch-field-ops-install" element={<DispatchFieldOpsInstall />} />
              <Route path="/dashboard/business-mgt-ops-install" element={<BusinessMgtOpsInstall />} />
              <Route path="/dashboard/customer-portal-app-install" element={<CustomerPortalAppInstall />} />
              <Route path="/dashboard/integrations/embed" element={<IntegrationDocs />} />
              <Route path="/dashboard/platform-guides" element={<PlatformGuides />} />
              <Route path="/dashboard/platform-issues" element={<PlatformIssues />} />
              <Route path="/dashboard/platform-issues" element={<PlatformIssues />} />
              
              {/* Customer Portal Routes */}
              <Route path="/customer" element={<CustomerPortalHome />} />
              <Route path="/customer-portal" element={<CustomerPortalHome />} />
              <Route path="/customer-portal-install" element={<CustomerPortalInstall />} />
              <Route path="/customer-portal/:companySlug" element={<CustomerCompanyPortal />} />
              
              {/* Legacy Customer Routes */}
              <Route path="/appointment" element={<CustomerPortal />} />
              <Route path="/customer-dashboard" element={<CustomerDashboard />} />
              <Route path="/chat/:companySlug" element={<PublicChat />} />
              
              {/* Smart Website Routes */}
              <Route path="/site/:subdomain" element={<SmartWebsite />} />
              <Route path="/dashboard/smart-website" element={<SmartWebsiteManager />} />
              
              {/* Technician Dashboard Routes - Protected */}
              <Route path="/technician" element={<ProtectedRoute><TechnicianDashboard /></ProtectedRoute>} />
              <Route path="/technician/ai-console" element={<ProtectedRoute><TechnicianAIConsole /></ProtectedRoute>} />
              <Route path="/technician/jobs" element={<ProtectedRoute><TechnicianJobs /></ProtectedRoute>} />
              <Route path="/technician/calendar" element={<ProtectedRoute><TechnicianCalendar /></ProtectedRoute>} />
              <Route path="/technician/settings" element={<ProtectedRoute><TechnicianSettings /></ProtectedRoute>} />
              <Route path="/technician/availability" element={<ProtectedRoute><TechnicianAvailability /></ProtectedRoute>} />
              <Route path="/technician/history" element={<ProtectedRoute><TechnicianHistory /></ProtectedRoute>} />
              <Route path="/technician/profile" element={<ProtectedRoute><TechnicianProfile /></ProtectedRoute>} />
              <Route path="/technician/install" element={<ProtectedRoute><TechnicianInstall /></ProtectedRoute>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ErrorBoundary>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
