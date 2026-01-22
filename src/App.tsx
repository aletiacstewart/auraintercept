import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { VoiceProvider } from "@/contexts/VoiceContext";
import { PWAUpdatePrompt } from "@/components/pwa/PWAUpdatePrompt";
import { AuraVoiceOverlay } from "@/components/voice/AuraVoiceOverlay";
import ErrorBoundary from "@/components/error/ErrorBoundary";
import { useEffect } from "react";
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
import { VoiceIntegration, SMSIntegration, EmailIntegration, CRMIntegration, CalendarIntegration, SocialMediaIntegration } from "./pages/integrations";
import KnowledgeBase from "./pages/KnowledgeBase";
import AIAgent from "./pages/AIAgent";
import {
  CustomerPortalConsole,
  FieldOpsConsole,
  BusinessManagementConsole,
  MarketingSalesConsole,
  AnalyticsConsole,
  NewLeadPage,
} from "./pages/ai-consoles";
import AskAura from "./pages/AskAura";
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
import BusinessOpsHub from "./pages/BusinessOpsHub";
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

const App = () => {
  // Self-healing: unregister service workers on non-technician routes to prevent stale cached versions
  useEffect(() => {
    const path = window.location.pathname;
    const isTechnicianRoute = path.startsWith('/technician');
    
    if (!isTechnicianRoute && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
        });
      });
      // Also clear workbox caches
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => {
            if (name.includes('workbox') || name.includes('assets') || name.includes('html')) {
              caches.delete(name);
            }
          });
        });
      }
    }
  }, []);

  // Embed mode must be true in an iframe (preview widgets) OR when explicitly requested via ?embed=true
  // NOTE: computed inside the component to avoid stale module-scope evaluation.
  const isEmbedMode = (() => {
    if (typeof window === 'undefined') return false;
    const isIframe = window.self !== window.top;
    const hasEmbedParam = new URLSearchParams(window.location.search).get('embed') === 'true';
    return isIframe || hasEmbedParam;
  })();

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ErrorBoundary>
          <Sonner />
          {!isEmbedMode && <PWAUpdatePrompt />}
          <BrowserRouter>
            <VoiceProvider>
              {!isEmbedMode && <AuraVoiceOverlay />}
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
              {/* All Dashboard Routes - Protected */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard/companies" element={<ProtectedRoute><Companies /></ProtectedRoute>} />
              <Route path="/dashboard/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
              <Route path="/dashboard/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
              <Route path="/dashboard/employees/:id" element={<ProtectedRoute><EmployeeDetail /></ProtectedRoute>} />
              <Route path="/dashboard/quick-setup" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              
              <Route path="/dashboard/availability" element={<ProtectedRoute><EmployeeAvailability /></ProtectedRoute>} />
              <Route path="/dashboard/appointments" element={<ProtectedRoute><EmployeeAppointments /></ProtectedRoute>} />
              
              <Route path="/dashboard/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="/dashboard/3rd-party-overview" element={<ProtectedRoute><Integrations /></ProtectedRoute>} />
              <Route path="/dashboard/integrations/voice" element={<ProtectedRoute><VoiceIntegration /></ProtectedRoute>} />
              <Route path="/dashboard/integrations/sms" element={<ProtectedRoute><SMSIntegration /></ProtectedRoute>} />
              <Route path="/dashboard/integrations/email" element={<ProtectedRoute><EmailIntegration /></ProtectedRoute>} />
              <Route path="/dashboard/integrations/crm" element={<ProtectedRoute><CRMIntegration /></ProtectedRoute>} />
              <Route path="/dashboard/integrations/calendar" element={<ProtectedRoute><CalendarIntegration /></ProtectedRoute>} />
              <Route path="/dashboard/integrations/social" element={<ProtectedRoute><SocialMediaIntegration /></ProtectedRoute>} />
              <Route path="/dashboard/knowledge" element={<ProtectedRoute><KnowledgeBase /></ProtectedRoute>} />
              <Route path="/dashboard/ai-agent" element={<ProtectedRoute><AIAgent /></ProtectedRoute>} />
              <Route path="/dashboard/ai-consoles/customer-portal" element={<ProtectedRoute><CustomerPortalConsole /></ProtectedRoute>} />
              <Route path="/dashboard/ai-consoles/field-ops" element={<ProtectedRoute><FieldOpsConsole /></ProtectedRoute>} />
              <Route path="/dashboard/ai-consoles/business-mgt-ops" element={<ProtectedRoute><BusinessManagementConsole /></ProtectedRoute>} />
              <Route path="/dashboard/ai-consoles/marketing-sales" element={<ProtectedRoute><MarketingSalesConsole /></ProtectedRoute>} />
              <Route path="/dashboard/ai-consoles/analytics" element={<ProtectedRoute><AnalyticsConsole /></ProtectedRoute>} />
              <Route path="/dashboard/ai-consoles/new-lead" element={<ProtectedRoute><NewLeadPage /></ProtectedRoute>} />
              <Route path="/dashboard/analytics-reports" element={<ProtectedRoute><AskAura /></ProtectedRoute>} />
              {/* Legacy routes redirect to Analytics & Reports */}
              <Route path="/dashboard/ask-aura" element={<ProtectedRoute><AskAura /></ProtectedRoute>} />
              <Route path="/dashboard/ai-consoles/performance-report" element={<ProtectedRoute><AskAura /></ProtectedRoute>} />
              <Route path="/dashboard/ai-consoles/business-insights" element={<ProtectedRoute><AskAura /></ProtectedRoute>} />
              <Route path="/dashboard/ai-consoles/revenue-analysis" element={<ProtectedRoute><AskAura /></ProtectedRoute>} />
              <Route path="/dashboard/ai-consoles/revenue-forecast" element={<ProtectedRoute><AskAura /></ProtectedRoute>} />
              <Route path="/dashboard/ai-consoles/customer-insights" element={<ProtectedRoute><AskAura /></ProtectedRoute>} />
              <Route path="/dashboard/ai-consoles/kpi-dashboard" element={<ProtectedRoute><AskAura /></ProtectedRoute>} />
              <Route path="/dashboard/ai-agents" element={<ProtectedRoute><AIAgentsHub /></ProtectedRoute>} />
              <Route path="/dashboard/ai-agents/:agentId" element={<ProtectedRoute><AgentDetailPage /></ProtectedRoute>} />
              <Route path="/dashboard/customer-website-app" element={<ProtectedRoute><Widget /></ProtectedRoute>} />
              <Route path="/dashboard/calls" element={<ProtectedRoute><CallHistory /></ProtectedRoute>} />
              <Route path="/dashboard/email-logs" element={<ProtectedRoute><EmailLogs /></ProtectedRoute>} />
              <Route path="/dashboard/sms-logs" element={<ProtectedRoute><SMSLogs /></ProtectedRoute>} />
              <Route path="/dashboard/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/dashboard/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
              <Route path="/dashboard/subscription-analytics" element={<ProtectedRoute><SubscriptionAnalytics /></ProtectedRoute>} />
              <Route path="/dashboard/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
              <Route path="/dashboard/quotes" element={<ProtectedRoute><Quotes /></ProtectedRoute>} />
              <Route path="/dashboard/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
              <Route path="/dashboard/warranties" element={<ProtectedRoute><Warranties /></ProtectedRoute>} />
              <Route path="/dashboard/referrals" element={<ProtectedRoute><Referrals /></ProtectedRoute>} />
              <Route path="/dashboard/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
              <Route path="/dashboard/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
              <Route path="/dashboard/business-ops-hub" element={<ProtectedRoute><BusinessOpsHub /></ProtectedRoute>} />
              <Route path="/dashboard/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
              <Route path="/dashboard/architecture" element={<ProtectedRoute><Architecture /></ProtectedRoute>} />
              <Route path="/dashboard/calculators" element={<ProtectedRoute><Calculators /></ProtectedRoute>} />
              <Route path="/dashboard/export-docs" element={<ProtectedRoute><ExportDocumentation /></ProtectedRoute>} />
              <Route path="/dashboard/dispatch-field-ops" element={<ProtectedRoute><FieldOperations /></ProtectedRoute>} />
              <Route path="/dashboard/business-operations" element={<ProtectedRoute><BusinessOperations /></ProtectedRoute>} />
              <Route path="/dashboard/field-ops-install" element={<ProtectedRoute><FieldOpsInstall /></ProtectedRoute>} />
              <Route path="/dashboard/dispatch-field-ops-install" element={<ProtectedRoute><DispatchFieldOpsInstall /></ProtectedRoute>} />
              <Route path="/dashboard/business-mgt-ops-install" element={<ProtectedRoute><BusinessMgtOpsInstall /></ProtectedRoute>} />
              <Route path="/dashboard/customer-portal-app-install" element={<ProtectedRoute><CustomerPortalAppInstall /></ProtectedRoute>} />
              <Route path="/dashboard/integrations/embed" element={<ProtectedRoute><IntegrationDocs /></ProtectedRoute>} />
              <Route path="/dashboard/platform-guides" element={<ProtectedRoute><PlatformGuides /></ProtectedRoute>} />
              <Route path="/dashboard/platform-issues" element={<ProtectedRoute><PlatformIssues /></ProtectedRoute>} />
              <Route path="/dashboard/smart-website" element={<ProtectedRoute><SmartWebsiteManager /></ProtectedRoute>} />
              
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
              <Route path="/dashboard/smart-website" element={<ProtectedRoute><SmartWebsiteManager /></ProtectedRoute>} />
              
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
            </VoiceProvider>
          </BrowserRouter>
        </ErrorBoundary>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
