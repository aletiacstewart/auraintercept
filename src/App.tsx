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
import { AutoTranslatePageObserver } from "@/components/common/AutoTranslatePageObserver";
import { PWAUpdatePrompt } from "@/components/pwa/PWAUpdatePrompt";
import { AuraVoiceOverlay } from "@/components/voice/AuraVoiceOverlay";
import ErrorBoundary from "@/components/error/ErrorBoundary";
import { useEffect, lazy, Suspense } from "react";
import { useVisibilityRefresh } from "@/hooks/useVisibilityRefresh";
import { useDeploymentAutoReload } from "@/hooks/useDeploymentAutoReload";
// Eager: public marketing / auth (LCP + SEO landing pages).
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import OpportunityAudit from "./pages/OpportunityAudit";
import ForBusiness from "./pages/ForBusiness";
import Contact from "./pages/Contact";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

// Lazy: everything else. Each named-export module wraps a `.then(m => ({ default: m.X }))`.
const CustomerAuth = lazy(() => import("./pages/CustomerAuth"));
const CustomerPortalHome = lazy(() => import("./pages/CustomerPortalHome"));
const CustomerPortalInstall = lazy(() => import("./pages/CustomerPortalInstall"));
const CustomerCompanyPortal = lazy(() => import("./pages/CustomerCompanyPortal"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Companies = lazy(() => import("./pages/Companies"));
const Customers = lazy(() => import("./pages/Customers"));
const Employees = lazy(() => import("./pages/Employees"));
const EmployeeDetail = lazy(() => import("./pages/EmployeeDetail"));
const Settings = lazy(() => import("./pages/Settings"));
const EmployeeAvailability = lazy(() => import("./pages/EmployeeAvailability"));
const EmployeeAppointments = lazy(() => import("./pages/EmployeeAppointments"));
const Messages = lazy(() => import("./pages/Messages"));
const EmailLogs = lazy(() => import("./pages/EmailLogs"));
const SMSLogs = lazy(() => import("./pages/SMSLogs"));
const Integrations = lazy(() => import("./pages/Integrations"));
const VoiceIntegration = lazy(() => import("./pages/integrations").then(m => ({ default: m.VoiceIntegration })));
const SMSIntegration = lazy(() => import("./pages/integrations").then(m => ({ default: m.SMSIntegration })));
const EmailIntegration = lazy(() => import("./pages/integrations").then(m => ({ default: m.EmailIntegration })));
const CalendarIntegration = lazy(() => import("./pages/integrations").then(m => ({ default: m.CalendarIntegration })));
const SocialMediaIntegration = lazy(() => import("./pages/integrations").then(m => ({ default: m.SocialMediaIntegration })));
const TavilyIntegration = lazy(() => import("./pages/integrations").then(m => ({ default: m.TavilyIntegration })));
const KnowledgeBase = lazy(() => import("./pages/KnowledgeBase"));
const AIAgent = lazy(() => import("./pages/AIAgent"));
const CustomerPortalConsole = lazy(() => import("./pages/ai-consoles").then(m => ({ default: m.CustomerPortalConsole })));
const FieldOpsConsole = lazy(() => import("./pages/ai-consoles").then(m => ({ default: m.FieldOpsConsole })));
const BusinessManagementConsole = lazy(() => import("./pages/ai-consoles").then(m => ({ default: m.BusinessManagementConsole })));
const PipelineConsole = lazy(() => import("./pages/ai-consoles").then(m => ({ default: m.PipelineConsole })));
const MarketingSalesConsole = lazy(() => import("./pages/ai-consoles").then(m => ({ default: m.MarketingSalesConsole })));
const SocialMediaConsole = lazy(() => import("./pages/ai-consoles").then(m => ({ default: m.SocialMediaConsole })));
const AnalyticsConsole = lazy(() => import("./pages/ai-consoles").then(m => ({ default: m.AnalyticsConsole })));
const NewLeadPage = lazy(() => import("./pages/ai-consoles").then(m => ({ default: m.NewLeadPage })));
const SpecialistOperativesConsole = lazy(() => import("./pages/ai-consoles").then(m => ({ default: m.SpecialistOperativesConsole })));
const PerformanceReportPage = lazy(() => import("./pages/ai-consoles").then(m => ({ default: m.PerformanceReportPage })));
const BusinessInsightsPage = lazy(() => import("./pages/ai-consoles").then(m => ({ default: m.BusinessInsightsPage })));
const RevenueAnalysisPage = lazy(() => import("./pages/ai-consoles").then(m => ({ default: m.RevenueAnalysisPage })));
const DemandForecastPage = lazy(() => import("./pages/ai-consoles").then(m => ({ default: m.DemandForecastPage })));
const CustomerInsightsPage = lazy(() => import("./pages/ai-consoles").then(m => ({ default: m.CustomerInsightsPage })));
const KpiDashboardPage = lazy(() => import("./pages/ai-consoles").then(m => ({ default: m.KpiDashboardPage })));
const AskAura = lazy(() => import("./pages/AskAura"));
const OperationsRouter = lazy(() => import("./pages/operations/OperationsRouter"));
const VideoConsole = lazy(() => import("./pages/VideoConsole"));
const AIAgentsHub = lazy(() => import("./pages/AIAgentsHub"));
const Automation = lazy(() => import("./pages/Automation"));
const AIAgentGuide = lazy(() => import("./pages/AIAgentGuide"));
const AuditReport = lazy(() => import("./pages/AuditReport"));
const AgentDetailPage = lazy(() => import("./pages/AgentDetailPage"));
const ContentEngineConsole = lazy(() => import("./pages/ContentEngineConsole"));
const Widget = lazy(() => import("./pages/Widget"));
const CallHistory = lazy(() => import("./pages/CallHistory"));
const Analytics = lazy(() => import("./pages/Analytics"));
const AppointmentLookup = lazy(() => import("./pages/AppointmentLookup"));
const CustomerDashboard = lazy(() => import("./pages/CustomerDashboard"));
const Subscription = lazy(() => import("./pages/Subscription"));
const SubscriptionAnalytics = lazy(() => import("./pages/SubscriptionAnalytics"));
const PublicChat = lazy(() => import("./pages/PublicChat"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Quotes = lazy(() => import("./pages/Quotes"));
const Invoices = lazy(() => import("./pages/Invoices"));
const Referrals = lazy(() => import("./pages/Referrals"));
const Campaigns = lazy(() => import("./pages/Campaigns"));
const CampaignDetail = lazy(() => import("./pages/CampaignDetail"));
const Leads = lazy(() => import("./pages/Leads"));
const LeadsImport = lazy(() => import("./pages/LeadsImport"));
const CRMIntegration = lazy(() => import("./pages/integrations/CRMIntegration"));
const Help = lazy(() => import("./pages/Help"));
const Architecture = lazy(() => import("./pages/Architecture"));
const PlatformBrief = lazy(() => import("./pages/dashboard/PlatformBrief"));
const Calculators = lazy(() => import("./pages/Calculators"));
const CyberSentryMockup = lazy(() => import("./pages/CyberSentryMockup"));
const IndustryPacksAdmin = lazy(() => import("./pages/admin/IndustryPacksAdmin"));
const PackCoverage = lazy(() => import("./pages/admin/PackCoverage"));
const SuperSwitcher = lazy(() => import("./pages/SuperSwitcher"));
const CyberSentryPortalMockup = lazy(() => import("./pages/CyberSentryPortalMockup"));
const BusinessOperations = lazy(() => import("./pages/BusinessOperations"));
const FieldOpsInstall = lazy(() => import("./pages/FieldOpsInstall"));
const DispatchFieldOpsInstall = lazy(() => import("./pages/DispatchFieldOpsInstall"));
const BusinessMgtOpsInstall = lazy(() => import("./pages/BusinessMgtOpsInstall"));
const FieldOpsApp = lazy(() => import("./pages/FieldOpsApp"));
const DispatchFieldOpsApp = lazy(() => import("./pages/DispatchFieldOpsApp"));
const BusinessMgtOpsApp = lazy(() => import("./pages/BusinessMgtOpsApp"));
const OnboardingForm = lazy(() => import("./pages/OnboardingForm"));
const PublicOnboardingIntake = lazy(() => import("./pages/PublicOnboardingIntake"));
const CustomerPortalAppInstall = lazy(() => import("./pages/CustomerPortalAppInstall"));
const PlatformIssues = lazy(() => import("./pages/PlatformIssues"));
const PlatformHealth = lazy(() => import("./pages/PlatformHealth"));
const StatusPage = lazy(() => import("./pages/StatusPage"));
const OAuthGoogleCalendar = lazy(() => import("./pages/OAuthGoogleCalendar"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent"));
const SmartWebsite = lazy(() => import("./pages/SmartWebsite"));
const SmartWebsiteManager = lazy(() => import("./pages/SmartWebsiteManager"));
const CompanyBlog = lazy(() => import("./pages/CompanyBlog"));
const CompanyBlogPost = lazy(() => import("./pages/CompanyBlogPost"));
const BlogManagement = lazy(() => import("./pages/BlogManagement"));
const TechnicianDashboard = lazy(() => import("./pages/technician").then(m => ({ default: m.TechnicianDashboard })));
const TechnicianAIConsole = lazy(() => import("./pages/technician").then(m => ({ default: m.TechnicianAIConsole })));
const TechnicianJobs = lazy(() => import("./pages/technician").then(m => ({ default: m.TechnicianJobs })));
const TechnicianCalendar = lazy(() => import("./pages/technician").then(m => ({ default: m.TechnicianCalendar })));
const TechnicianSettings = lazy(() => import("./pages/technician").then(m => ({ default: m.TechnicianSettings })));
const TechnicianAvailability = lazy(() => import("./pages/technician").then(m => ({ default: m.TechnicianAvailability })));
const TechnicianHistory = lazy(() => import("./pages/technician").then(m => ({ default: m.TechnicianHistory })));
const TechnicianProfile = lazy(() => import("./pages/technician").then(m => ({ default: m.TechnicianProfile })));
const TechnicianInstall = lazy(() => import("./pages/technician").then(m => ({ default: m.TechnicianInstall })));
const IntegrationDocs = lazy(() => import("./pages/IntegrationDocs"));
const PlatformGuides = lazy(() => import("./pages/PlatformGuides"));
const NotificationSettingsPage = lazy(() => import("./pages/NotificationSettingsPage"));
const EmailLimits = lazy(() => import("./pages/settings/EmailLimits"));
const TavilyLimits = lazy(() => import("./pages/settings/TavilyLimits"));
const DesignPreview = lazy(() => import("./pages/DesignPreview"));
const PublicBooking = lazy(() => import("./pages/PublicBooking"));

// Suspense fallback for lazy routes — minimal, on-brand.
const RouteFallback = () => (
  <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    <span className="sr-only">Loading…</span>
  </div>
);

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
  
  // Auto-reload when a new deployment is detected. Poll once every 10 minutes
  // (not 20s) so we don't disrupt long dashboard / console sessions. The hook
  // is also gated on user activity, open modals, and route changes.
  useDeploymentAutoReload(10 * 60 * 1000);

  return (
    <TooltipProvider>
      <AuthProvider>
        <LanguageProvider>
          <ErrorBoundary>
            <Sonner />
          <Toaster />
          <AutoTranslatePageObserver />
          {!isEmbedMode && <PWAUpdatePrompt />}
          <BrowserRouter>
            <ScrollToTop />
            <VoiceProvider>
              {!isEmbedMode && <AuraVoiceOverlay />}
              <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/audit" element={<OpportunityAudit />} />
                <Route path="/for-business" element={<ForBusiness />} />
                <Route path="/pricing" element={<Navigate to="/#pricing" replace />} />
                <Route path="/onboarding" element={<OnboardingForm />} />
                <Route path="/intake/:token" element={<PublicOnboardingIntake />} />
                <Route path="/dashboard/onboarding-invites" element={<Navigate to="/dashboard/subscription-analytics?tab=invites" replace />} />
                <Route path="/field-ops-app" element={<FieldOpsApp />} />
                <Route path="/dispatch-field-ops-app" element={<DispatchFieldOpsApp />} />
                <Route path="/business-mgt-ops-app" element={<BusinessMgtOpsApp />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/status" element={<StatusPage />} />
                <Route path="/oauth/google-calendar" element={<OAuthGoogleCalendar />} />
                <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
                <Route path="/customer-auth" element={<CustomerAuth />} />
                <Route path="/talk-to-aura" element={<Navigate to="/contact" replace />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/design-preview" element={<ProtectedRoute requiredRole="platform_admin"><DesignPreview /></ProtectedRoute>} />
                <Route path="/about" element={<Navigate to="/" replace />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                {/* All Dashboard Routes - Protected */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/dashboard/companies" element={<ProtectedRoute><Companies /></ProtectedRoute>} />
                <Route path="/dashboard/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
                <Route path="/dashboard/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
                <Route path="/dashboard/employees/:id" element={<ProtectedRoute><EmployeeDetail /></ProtectedRoute>} />
                <Route path="/dashboard/quick-setup" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/dashboard/automation" element={<ProtectedRoute><Automation /></ProtectedRoute>} />
                
                <Route path="/dashboard/availability" element={<ProtectedRoute><EmployeeAvailability /></ProtectedRoute>} />
                <Route path="/dashboard/appointments" element={<ProtectedRoute><EmployeeAppointments /></ProtectedRoute>} />
                <Route path="/appointments" element={<Navigate to="/dashboard/appointments" replace />} />
                
                <Route path="/dashboard/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                <Route path="/dashboard/3rd-party-overview" element={<ProtectedRoute><Integrations /></ProtectedRoute>} />
                <Route path="/dashboard/integrations/voice" element={<ProtectedRoute><VoiceIntegration /></ProtectedRoute>} />
                <Route path="/dashboard/integrations/sms" element={<ProtectedRoute><SMSIntegration /></ProtectedRoute>} />
                <Route path="/dashboard/integrations/email" element={<ProtectedRoute><EmailIntegration /></ProtectedRoute>} />
                <Route path="/dashboard/integrations/calendar" element={<ProtectedRoute><CalendarIntegration /></ProtectedRoute>} />
                <Route path="/dashboard/integrations/social" element={<ProtectedRoute><SocialMediaIntegration /></ProtectedRoute>} />
                <Route path="/dashboard/integrations/tavily" element={<ProtectedRoute><TavilyIntegration /></ProtectedRoute>} />
                <Route path="/dashboard/integrations/crm" element={<ProtectedRoute><CRMIntegration /></ProtectedRoute>} />
                <Route path="/dashboard/knowledge" element={<ProtectedRoute><KnowledgeBase /></ProtectedRoute>} />
                <Route path="/dashboard/ai-agent" element={<ProtectedRoute><AIAgent /></ProtectedRoute>} />
                <Route path="/dashboard/ai-consoles/customer-portal" element={<ProtectedRoute><CustomerPortalConsole /></ProtectedRoute>} />
                <Route path="/dashboard/ai-consoles/field-ops" element={<ProtectedRoute><FieldOpsConsole /></ProtectedRoute>} />
                <Route path="/dashboard/ai-consoles/business-mgt-ops" element={<ProtectedRoute><BusinessManagementConsole /></ProtectedRoute>} />
                <Route path="/dashboard/pipeline" element={<ProtectedRoute><PipelineConsole /></ProtectedRoute>} />
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
                <Route path="/dashboard/campaigns/:id" element={<ProtectedRoute><CampaignDetail /></ProtectedRoute>} />
                <Route path="/dashboard/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
                <Route path="/dashboard/leads/import" element={<ProtectedRoute><LeadsImport /></ProtectedRoute>} />
                <Route path="/dashboard/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
                <Route path="/dashboard/notification-settings" element={<ProtectedRoute><NotificationSettingsPage /></ProtectedRoute>} />
                <Route path="/dashboard/email-limits" element={<ProtectedRoute><EmailLimits /></ProtectedRoute>} />
                <Route path="/dashboard/tavily-limits" element={<ProtectedRoute><TavilyLimits /></ProtectedRoute>} />
                <Route path="/dashboard/architecture" element={<ProtectedRoute requiredRole="platform_admin"><Architecture /></ProtectedRoute>} />
                <Route path="/dashboard/platform-brief" element={<ProtectedRoute requiredRole="platform_admin"><PlatformBrief /></ProtectedRoute>} />
                <Route path="/dashboard/calculators" element={<ProtectedRoute requiredRole="platform_admin"><Calculators /></ProtectedRoute>} />
                <Route path="/dashboard/export-docs" element={<Navigate to="/dashboard/platform-guides?tab=export" replace />} />
                <Route path="/dashboard/video-prompts" element={<Navigate to="/dashboard/platform-guides?tab=video" replace />} />
                <Route path="/dashboard/cyber-sentry-mockup" element={<ProtectedRoute requiredRole="platform_admin"><CyberSentryMockup /></ProtectedRoute>} />
                <Route path="/dashboard/cyber-sentry-portal-mockup" element={<ProtectedRoute requiredRole="platform_admin"><CyberSentryPortalMockup /></ProtectedRoute>} />
                <Route path="/dashboard/admin/industry-packs" element={<ProtectedRoute requiredRole="platform_admin"><IndustryPacksAdmin /></ProtectedRoute>} />
                <Route path="/dashboard/admin/industry-packs/:id" element={<ProtectedRoute requiredRole="platform_admin"><IndustryPacksAdmin /></ProtectedRoute>} />
                <Route path="/dashboard/pack-coverage" element={<ProtectedRoute requiredRole="platform_admin"><PackCoverage /></ProtectedRoute>} />
                <Route path="/dashboard/super-switcher" element={<ProtectedRoute requiredRole="platform_admin"><SuperSwitcher /></ProtectedRoute>} />
                <Route path="/super-switcher" element={<ProtectedRoute requiredRole="platform_admin"><SuperSwitcher /></ProtectedRoute>} />
                <Route path="/dashboard/audit-report" element={<ProtectedRoute requiredRole="platform_admin"><AuditReport /></ProtectedRoute>} />
                <Route path="/dashboard/operations" element={<ProtectedRoute><OperationsRouter /></ProtectedRoute>} />
                <Route path="/dashboard/dispatch-field-ops" element={<ProtectedRoute><OperationsRouter /></ProtectedRoute>} />
                <Route path="/dashboard/video-console" element={<ProtectedRoute><VideoConsole /></ProtectedRoute>} />
                <Route path="/dashboard/business-operations" element={<Navigate to="/dashboard/ai-consoles/business-mgt-ops" replace />} />
                <Route path="/dashboard/field-ops-install" element={<ProtectedRoute><FieldOpsInstall /></ProtectedRoute>} />
                <Route path="/dashboard/dispatch-field-ops-install" element={<ProtectedRoute><DispatchFieldOpsInstall /></ProtectedRoute>} />
                <Route path="/dashboard/business-mgt-ops-install" element={<ProtectedRoute><BusinessMgtOpsInstall /></ProtectedRoute>} />
                <Route path="/dashboard/customer-portal-app-install" element={<ProtectedRoute><CustomerPortalAppInstall /></ProtectedRoute>} />
                <Route path="/dashboard/integrations/embed" element={<ProtectedRoute><IntegrationDocs /></ProtectedRoute>} />
                <Route path="/dashboard/platform-guides" element={<ProtectedRoute><PlatformGuides /></ProtectedRoute>} />
                <Route path="/dashboard/platform-issues" element={<ProtectedRoute><PlatformIssues /></ProtectedRoute>} />
                <Route path="/dashboard/platform-health" element={<ProtectedRoute><PlatformHealth /></ProtectedRoute>} />
                <Route path="/dashboard/ai-agent-demo" element={<Navigate to="/dashboard/architecture?tab=demo" replace />} />
                <Route path="/dashboard/smart-website" element={<ProtectedRoute><SmartWebsiteManager /></ProtectedRoute>} />
                <Route path="/dashboard/blog-management" element={<ProtectedRoute><BlogManagement /></ProtectedRoute>} />
                
                {/* Customer Portal Routes */}
                <Route path="/customer" element={<CustomerPortalHome />} />
                <Route path="/customer-portal" element={<CustomerPortalHome />} />
                <Route path="/customer-portal-install" element={<CustomerPortalInstall />} />
                <Route path="/customer-portal/:companySlug" element={<CustomerCompanyPortal />} />
                
                {/* Legacy Customer Routes */}
                <Route path="/appointment" element={<AppointmentLookup />} />
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
              </Suspense>
            </VoiceProvider>
          </BrowserRouter>
          </ErrorBoundary>
        </LanguageProvider>
      </AuthProvider>
    </TooltipProvider>
  );
};

const App = () => {
  // Self-healing: only unregister stray service workers whose scope is NOT the
  // technician PWA. Previously this nuked every SW + cache on every full app
  // mount, which combined with VitePWA autoUpdate to cause flapping (install →
  // unregister → reinstall → reload) and randomly logged users out.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        const scope = registration.scope || '';
        // Keep the technician PWA SW (scope ends with "/technician" or "/technician/").
        if (/\/technician\/?$/.test(scope)) return;
        registration.unregister().catch(() => {});
      });
    }).catch(() => {});
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
