import { Toaster as Sonner } from "@/components/ui/sonner";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { VoiceProvider } from "@/contexts/VoiceContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { PWAUpdatePrompt } from "@/components/pwa/PWAUpdatePrompt";
import { AuraVoiceOverlay } from "@/components/voice/AuraVoiceOverlay";
import ErrorBoundary from "@/components/error/ErrorBoundary";
import { useEffect } from "react";
import { useVisibilityRefresh } from "@/hooks/useVisibilityRefresh";
import { useDeploymentAutoReload } from "@/hooks/useDeploymentAutoReload";
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
import { VoiceIntegration, SMSIntegration, EmailIntegration, CalendarIntegration, SocialMediaIntegration, TavilyIntegration } from "./pages/integrations";
import KnowledgeBase from "./pages/KnowledgeBase";
import AIAgent from "./pages/AIAgent";
import {
  CustomerPortalConsole,
  FieldOpsConsole,
  BusinessManagementConsole,
  MarketingSalesConsole,
  SocialMediaConsole,
  AnalyticsConsole,
  NewLeadPage,
  SpecialistOperativesConsole,
  PerformanceReportPage,
  BusinessInsightsPage,
  RevenueAnalysisPage,
  DemandForecastPage,
  CustomerInsightsPage,
  KpiDashboardPage,
} from "./pages/ai-consoles";
import AskAura from "./pages/AskAura";
import OperationsRouter from "./pages/operations/OperationsRouter";
import AIAgentsHub from "./pages/AIAgentsHub";
import AIAgentGuide from "./pages/AIAgentGuide";
import AgentDetailPage from "./pages/AgentDetailPage";
import ContentEngineConsole from "./pages/ContentEngineConsole";
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
import Referrals from "./pages/Referrals";
import Campaigns from "./pages/Campaigns";
import Leads from "./pages/Leads";
// BusinessOpsHub merged into BusinessOperations
import Help from "./pages/Help";
import Architecture from "./pages/Architecture";
import Calculators from "./pages/Calculators";
import ExportDocumentation from "./pages/ExportDocumentation";
import VideoPromptsPage from "./pages/VideoPromptsPage";
import CyberSentryMockup from "./pages/CyberSentryMockup";
import IndustryPacksAdmin from "./pages/admin/IndustryPacksAdmin";
import PackCoverage from "./pages/admin/PackCoverage";
import CyberSentryPortalMockup from "./pages/CyberSentryPortalMockup";
import FieldOperations from "./pages/FieldOperations";
import BusinessOperations from "./pages/BusinessOperations";
import FieldOpsInstall from "./pages/FieldOpsInstall";
import DispatchFieldOpsInstall from "./pages/DispatchFieldOpsInstall";
import BusinessMgtOpsInstall from "./pages/BusinessMgtOpsInstall";
import FieldOpsApp from "./pages/FieldOpsApp";
import DispatchFieldOpsApp from "./pages/DispatchFieldOpsApp";
import BusinessMgtOpsApp from "./pages/BusinessMgtOpsApp";
import OpportunityAudit from "./pages/OpportunityAudit";
import OnboardingForm from "./pages/OnboardingForm";
import CustomerPortalAppInstall from "./pages/CustomerPortalAppInstall";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";
import PlatformIssues from "./pages/PlatformIssues";
import PlatformHealth from "./pages/PlatformHealth";
import DemoAccountSeeder from "./pages/DemoAccountSeeder";
import OAuthGoogleCalendar from "./pages/OAuthGoogleCalendar";
import SmartWebsite from "./pages/SmartWebsite";
import SmartWebsiteManager from "./pages/SmartWebsiteManager";
import CompanyBlog from "./pages/CompanyBlog";
import CompanyBlogPost from "./pages/CompanyBlogPost";
import TalkToAura from "./pages/TalkToAura";
import Contact from "./pages/Contact";
import ForBusiness from "./pages/ForBusiness";
import DemoAccess from "./pages/DemoAccess";
import About from "./pages/About";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import BlogManagement from "./pages/BlogManagement";
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
import NotificationSettingsPage from "./pages/NotificationSettingsPage";
import AIAgentFlowDemo from "./pages/AIAgentFlowDemo";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import DesignPreview from "./pages/DesignPreview";
import PublicBooking from "./pages/PublicBooking";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // Data is fresh for 30 seconds
      gcTime: 5 * 60 * 1000, // Garbage collect after 5 minutes
      refetchOnWindowFocus: true, // Refetch when window gets focus
      refetchOnReconnect: true, // Refetch on network reconnect
      retry: 1, // Retry failed requests once
    },
  },
});

// Inner component that uses hooks requiring QueryClientProvider
const AppContent = ({ isEmbedMode }: { isEmbedMode: boolean }) => {
  // Auto-refresh queries when tab becomes visible after being hidden
  useVisibilityRefresh(60000); // Refresh if hidden for more than 60 seconds
  
  // Auto-reload when new deployment is detected (polls every 20s)
  useDeploymentAutoReload(20000);

  return (
    <TooltipProvider>
      <AuthProvider>
        <LanguageProvider>
          <ErrorBoundary>
            <Sonner />
          <Toaster />
          {!isEmbedMode && <PWAUpdatePrompt />}
          <BrowserRouter>
            <ScrollToTop />
            <VoiceProvider>
              {!isEmbedMode && <AuraVoiceOverlay />}
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/audit" element={<OpportunityAudit />} />
                <Route path="/for-business" element={<ForBusiness />} />
                <Route path="/demo/:trialId" element={<DemoAccess />} />
                <Route path="/onboarding" element={<OnboardingForm />} />
                <Route path="/field-ops-app" element={<FieldOpsApp />} />
                <Route path="/dispatch-field-ops-app" element={<DispatchFieldOpsApp />} />
                <Route path="/business-mgt-ops-app" element={<BusinessMgtOpsApp />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/oauth/google-calendar" element={<OAuthGoogleCalendar />} />
                <Route path="/customer-auth" element={<CustomerAuth />} />
                <Route path="/talk-to-aura" element={<TalkToAura />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/design-preview" element={<ProtectedRoute requiredRole="platform_admin"><DesignPreview /></ProtectedRoute>} />
                <Route path="/about" element={<About />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
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
                <Route path="/dashboard/integrations/calendar" element={<ProtectedRoute><CalendarIntegration /></ProtectedRoute>} />
                <Route path="/dashboard/integrations/social" element={<ProtectedRoute><SocialMediaIntegration /></ProtectedRoute>} />
                <Route path="/dashboard/integrations/tavily" element={<ProtectedRoute><TavilyIntegration /></ProtectedRoute>} />
                <Route path="/dashboard/knowledge" element={<ProtectedRoute><KnowledgeBase /></ProtectedRoute>} />
                <Route path="/dashboard/ai-agent" element={<ProtectedRoute><AIAgent /></ProtectedRoute>} />
                <Route path="/dashboard/ai-consoles/customer-portal" element={<ProtectedRoute><CustomerPortalConsole /></ProtectedRoute>} />
                <Route path="/dashboard/ai-consoles/field-ops" element={<ProtectedRoute><FieldOpsConsole /></ProtectedRoute>} />
                <Route path="/dashboard/ai-consoles/business-mgt-ops" element={<ProtectedRoute><BusinessManagementConsole /></ProtectedRoute>} />
                <Route path="/dashboard/ai-consoles/marketing-sales" element={<ProtectedRoute><MarketingSalesConsole /></ProtectedRoute>} />
                <Route path="/dashboard/ai-consoles/social-media" element={<ProtectedRoute><SocialMediaConsole /></ProtectedRoute>} />
                <Route path="/dashboard/ai-consoles/analytics" element={<ProtectedRoute><AnalyticsConsole /></ProtectedRoute>} />
                <Route path="/dashboard/ai-consoles/new-lead" element={<ProtectedRoute><NewLeadPage /></ProtectedRoute>} />
                <Route path="/dashboard/ai-consoles/specialists" element={<ProtectedRoute><SpecialistOperativesConsole /></ProtectedRoute>} />
                {/* Analytics & Reports now consolidated into Business Operations */}
                <Route path="/dashboard/analytics-reports" element={<ProtectedRoute><BusinessOperations /></ProtectedRoute>} />
                {/* Legacy routes redirect to Analytics & Reports */}
                <Route path="/dashboard/ask-aura" element={<ProtectedRoute><AskAura /></ProtectedRoute>} />
                <Route path="/dashboard/ai-consoles/performance-report" element={<ProtectedRoute><PerformanceReportPage /></ProtectedRoute>} />
                <Route path="/dashboard/ai-consoles/business-insights" element={<ProtectedRoute><BusinessInsightsPage /></ProtectedRoute>} />
                <Route path="/dashboard/ai-consoles/revenue-analysis" element={<ProtectedRoute><RevenueAnalysisPage /></ProtectedRoute>} />
                <Route path="/dashboard/ai-consoles/revenue-forecast" element={<ProtectedRoute><DemandForecastPage /></ProtectedRoute>} />
                <Route path="/dashboard/ai-consoles/customer-insights" element={<ProtectedRoute><CustomerInsightsPage /></ProtectedRoute>} />
                <Route path="/dashboard/ai-consoles/kpi-dashboard" element={<ProtectedRoute><KpiDashboardPage /></ProtectedRoute>} />
                <Route path="/dashboard/ai-agents" element={<ProtectedRoute><AIAgentsHub /></ProtectedRoute>} />
                <Route path="/dashboard/ai-agent-guide" element={<ProtectedRoute><AIAgentGuide /></ProtectedRoute>} />
                <Route path="/dashboard/ai-agents/:agentId" element={<ProtectedRoute><AgentDetailPage /></ProtectedRoute>} />
                <Route path="/dashboard/content-engine" element={<ProtectedRoute><ContentEngineConsole /></ProtectedRoute>} />
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
                <Route path="/dashboard/referrals" element={<ProtectedRoute><Referrals /></ProtectedRoute>} />
                <Route path="/dashboard/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
                <Route path="/dashboard/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
                <Route path="/dashboard/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
                <Route path="/dashboard/notification-settings" element={<ProtectedRoute><NotificationSettingsPage /></ProtectedRoute>} />
                <Route path="/dashboard/architecture" element={<ProtectedRoute requiredRole="platform_admin"><Architecture /></ProtectedRoute>} />
                <Route path="/dashboard/calculators" element={<ProtectedRoute requiredRole="platform_admin"><Calculators /></ProtectedRoute>} />
                <Route path="/dashboard/export-docs" element={<ProtectedRoute requiredRole="platform_admin"><ExportDocumentation /></ProtectedRoute>} />
                <Route path="/dashboard/video-prompts" element={<ProtectedRoute><VideoPromptsPage /></ProtectedRoute>} />
                <Route path="/dashboard/cyber-sentry-mockup" element={<ProtectedRoute requiredRole="platform_admin"><CyberSentryMockup /></ProtectedRoute>} />
                <Route path="/dashboard/cyber-sentry-portal-mockup" element={<ProtectedRoute requiredRole="platform_admin"><CyberSentryPortalMockup /></ProtectedRoute>} />
                <Route path="/dashboard/admin/industry-packs" element={<ProtectedRoute requiredRole="platform_admin"><IndustryPacksAdmin /></ProtectedRoute>} />
                <Route path="/dashboard/admin/industry-packs/:id" element={<ProtectedRoute requiredRole="platform_admin"><IndustryPacksAdmin /></ProtectedRoute>} />
                <Route path="/dashboard/pack-coverage" element={<ProtectedRoute requiredRole="platform_admin"><PackCoverage /></ProtectedRoute>} />
                <Route path="/dashboard/operations" element={<ProtectedRoute><OperationsRouter /></ProtectedRoute>} />
                <Route path="/dashboard/dispatch-field-ops" element={<ProtectedRoute><OperationsRouter /></ProtectedRoute>} />
                <Route path="/dashboard/business-operations" element={<Navigate to="/dashboard/ai-consoles/business-mgt-ops" replace />} />
                <Route path="/dashboard/field-ops-install" element={<ProtectedRoute><FieldOpsInstall /></ProtectedRoute>} />
                <Route path="/dashboard/dispatch-field-ops-install" element={<ProtectedRoute><DispatchFieldOpsInstall /></ProtectedRoute>} />
                <Route path="/dashboard/business-mgt-ops-install" element={<ProtectedRoute><BusinessMgtOpsInstall /></ProtectedRoute>} />
                <Route path="/dashboard/customer-portal-app-install" element={<ProtectedRoute><CustomerPortalAppInstall /></ProtectedRoute>} />
                <Route path="/dashboard/integrations/embed" element={<ProtectedRoute><IntegrationDocs /></ProtectedRoute>} />
                <Route path="/dashboard/platform-guides" element={<ProtectedRoute><PlatformGuides /></ProtectedRoute>} />
                <Route path="/dashboard/platform-issues" element={<ProtectedRoute><PlatformIssues /></ProtectedRoute>} />
                <Route path="/dashboard/platform-health" element={<ProtectedRoute><PlatformHealth /></ProtectedRoute>} />
                <Route path="/dashboard/demo-seeder" element={<ProtectedRoute><DemoAccountSeeder /></ProtectedRoute>} />
                <Route path="/dashboard/ai-agent-demo" element={<ProtectedRoute><AIAgentFlowDemo /></ProtectedRoute>} />
                <Route path="/dashboard/smart-website" element={<ProtectedRoute><SmartWebsiteManager /></ProtectedRoute>} />
                <Route path="/dashboard/blog-management" element={<ProtectedRoute><BlogManagement /></ProtectedRoute>} />
                
                {/* Customer Portal Routes */}
                <Route path="/customer" element={<CustomerPortalHome />} />
                <Route path="/customer-portal" element={<CustomerPortalHome />} />
                <Route path="/customer-portal-install" element={<CustomerPortalInstall />} />
                <Route path="/customer-portal/:companySlug" element={<CustomerCompanyPortal />} />
                
                {/* Legacy Customer Routes */}
                <Route path="/appointment" element={<CustomerPortal />} />
                <Route path="/customer-dashboard" element={<CustomerDashboard />} />
                <Route path="/chat/:companySlug" element={<PublicChat />} />
                <Route path="/book/:companySlug" element={<PublicBooking />} />
                
                {/* Smart Website Routes */}
                <Route path="/site/:subdomain" element={<SmartWebsite />} />
                <Route path="/site/:subdomain/blog" element={<CompanyBlog />} />
                <Route path="/site/:subdomain/blog/:slug" element={<CompanyBlogPost />} />
                
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
        </LanguageProvider>
      </AuthProvider>
    </TooltipProvider>
  );
};

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
  const isEmbedMode = (() => {
    if (typeof window === 'undefined') return false;
    const isIframe = window.self !== window.top;
    const hasEmbedParam = new URLSearchParams(window.location.search).get('embed') === 'true';
    return isIframe || hasEmbedParam;
  })();

  return (
    <QueryClientProvider client={queryClient}>
      <AppContent isEmbedMode={isEmbedMode} />
    </QueryClientProvider>
  );
};

export default App;
