import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PWAUpdatePrompt } from "@/components/pwa/PWAUpdatePrompt";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CustomerAuth from "./pages/CustomerAuth";
import CustomerPortalHome from "./pages/CustomerPortalHome";
import CustomerCompanyPortal from "./pages/CustomerCompanyPortal";

import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import Customers from "./pages/Customers";
import Employees from "./pages/Employees";
import Settings from "./pages/Settings";
import Onboarding from "./pages/Onboarding";
import EmployeeAvailability from "./pages/EmployeeAvailability";
import EmployeeAppointments from "./pages/EmployeeAppointments";

import Messages from "./pages/Messages";
import EmailLogs from "./pages/EmailLogs";
import SMSLogs from "./pages/SMSLogs";
import Integrations from "./pages/Integrations";
import { VoiceIntegration, SMSIntegration, EmailIntegration, CRMIntegration, CalendarIntegration } from "./pages/integrations";
import KnowledgeBase from "./pages/KnowledgeBase";
import AIAgent from "./pages/AIAgent";
import AIAgentsHub from "./pages/AIAgentsHub";
import AgentDetailPage from "./pages/AgentDetailPage";
import Widget from "./pages/Widget";
import CallHistory from "./pages/CallHistory";
import Analytics from "./pages/Analytics";
import CustomerPortal from "./pages/CustomerPortal";
import CustomerDashboard from "./pages/CustomerDashboard";
import Subscription from "./pages/Subscription";
import PublicChat from "./pages/PublicChat";
import Inventory from "./pages/Inventory";
import Quotes from "./pages/Quotes";
import Invoices from "./pages/Invoices";
import Warranties from "./pages/Warranties";
import Referrals from "./pages/Referrals";
import Campaigns from "./pages/Campaigns";
import Help from "./pages/Help";
import Architecture from "./pages/Architecture";
import Calculators from "./pages/Calculators";
import ExportDocumentation from "./pages/ExportDocumentation";
import FieldOperations from "./pages/FieldOperations";
import BusinessOperations from "./pages/BusinessOperations";
import NotFound from "./pages/NotFound";
import OAuthGoogleCalendar from "./pages/OAuthGoogleCalendar";

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
        <Toaster />
        <Sonner />
        <PWAUpdatePrompt />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/oauth/google-calendar" element={<OAuthGoogleCalendar />} />
            <Route path="/customer-auth" element={<CustomerAuth />} />
            
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/companies" element={<Companies />} />
            <Route path="/dashboard/customers" element={<Customers />} />
            <Route path="/dashboard/employees" element={<Employees />} />
            <Route path="/dashboard/settings" element={<Settings />} />
            <Route path="/dashboard/onboarding" element={<Onboarding />} />
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
            <Route path="/dashboard/ai-agents" element={<AIAgentsHub />} />
            <Route path="/dashboard/ai-agents/:agentId" element={<AgentDetailPage />} />
            <Route path="/dashboard/widget" element={<Widget />} />
            <Route path="/dashboard/calls" element={<CallHistory />} />
            <Route path="/dashboard/email-logs" element={<EmailLogs />} />
            <Route path="/dashboard/sms-logs" element={<SMSLogs />} />
            <Route path="/dashboard/analytics" element={<Analytics />} />
            <Route path="/dashboard/subscription" element={<Subscription />} />
            <Route path="/dashboard/inventory" element={<Inventory />} />
            <Route path="/dashboard/quotes" element={<Quotes />} />
            <Route path="/dashboard/invoices" element={<Invoices />} />
            <Route path="/dashboard/warranties" element={<Warranties />} />
            <Route path="/dashboard/referrals" element={<Referrals />} />
            <Route path="/dashboard/campaigns" element={<Campaigns />} />
            <Route path="/dashboard/help" element={<Help />} />
            <Route path="/dashboard/architecture" element={<Architecture />} />
            <Route path="/dashboard/calculators" element={<Calculators />} />
            <Route path="/dashboard/documentation" element={<ExportDocumentation />} />
            <Route path="/dashboard/field-operations" element={<FieldOperations />} />
            <Route path="/dashboard/business-operations" element={<BusinessOperations />} />
            <Route path="/dashboard/integrations/embed" element={<IntegrationDocs />} />
            <Route path="/dashboard/guides" element={<PlatformGuides />} />
            
            {/* Customer Portal Routes */}
            <Route path="/customer" element={<CustomerPortalHome />} />
            <Route path="/customer-portal" element={<CustomerPortalHome />} />
            <Route path="/customer-portal/:companySlug" element={<CustomerCompanyPortal />} />
            
            {/* Legacy Customer Routes */}
            <Route path="/appointment" element={<CustomerPortal />} />
            <Route path="/customer-dashboard" element={<CustomerDashboard />} />
            <Route path="/chat/:companySlug" element={<PublicChat />} />
            
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
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
