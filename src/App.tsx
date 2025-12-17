import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Demo from "./pages/Demo";
import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import Employees from "./pages/Employees";
import Settings from "./pages/Settings";
import Onboarding from "./pages/Onboarding";
import EmployeeAvailability from "./pages/EmployeeAvailability";
import EmployeeAppointments from "./pages/EmployeeAppointments";
import EmployeeFieldOps from "./pages/EmployeeFieldOps";
import Messages from "./pages/Messages";
import Integrations from "./pages/Integrations";
import KnowledgeBase from "./pages/KnowledgeBase";
import AIAgent from "./pages/AIAgent";
import AIAgentsHub from "./pages/AIAgentsHub";
import AgentDetailPage from "./pages/AgentDetailPage";
import Widget from "./pages/Widget";
import CallHistory from "./pages/CallHistory";
import Analytics from "./pages/Analytics";
import CustomerPortal from "./pages/CustomerPortal";
import Subscription from "./pages/Subscription";
import PublicChat from "./pages/PublicChat";
import Inventory from "./pages/Inventory";
import Quotes from "./pages/Quotes";
import Invoices from "./pages/Invoices";
import Warranties from "./pages/Warranties";
import Referrals from "./pages/Referrals";
import Campaigns from "./pages/Campaigns";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/companies" element={<Companies />} />
            <Route path="/dashboard/employees" element={<Employees />} />
            <Route path="/dashboard/settings" element={<Settings />} />
            <Route path="/dashboard/onboarding" element={<Onboarding />} />
            <Route path="/dashboard/availability" element={<EmployeeAvailability />} />
            <Route path="/dashboard/appointments" element={<EmployeeAppointments />} />
            <Route path="/dashboard/field-ops" element={<EmployeeFieldOps />} />
            <Route path="/dashboard/messages" element={<Messages />} />
            <Route path="/dashboard/integrations" element={<Integrations />} />
            <Route path="/dashboard/knowledge" element={<KnowledgeBase />} />
            <Route path="/dashboard/ai-agent" element={<AIAgent />} />
            <Route path="/dashboard/ai-agents" element={<AIAgentsHub />} />
            <Route path="/dashboard/ai-agents/:agentId" element={<AgentDetailPage />} />
            <Route path="/dashboard/widget" element={<Widget />} />
            <Route path="/dashboard/calls" element={<CallHistory />} />
            <Route path="/dashboard/analytics" element={<Analytics />} />
            <Route path="/dashboard/subscription" element={<Subscription />} />
            <Route path="/dashboard/inventory" element={<Inventory />} />
            <Route path="/dashboard/quotes" element={<Quotes />} />
            <Route path="/dashboard/invoices" element={<Invoices />} />
            <Route path="/dashboard/warranties" element={<Warranties />} />
            <Route path="/dashboard/referrals" element={<Referrals />} />
            <Route path="/dashboard/campaigns" element={<Campaigns />} />
            <Route path="/appointment" element={<CustomerPortal />} />
            <Route path="/chat/:companySlug" element={<PublicChat />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
