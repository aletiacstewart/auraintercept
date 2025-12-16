import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import Employees from "./pages/Employees";
import Settings from "./pages/Settings";
import Onboarding from "./pages/Onboarding";
import EmployeeAvailability from "./pages/EmployeeAvailability";
import EmployeeAppointments from "./pages/EmployeeAppointments";
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
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/companies" element={<Companies />} />
            <Route path="/dashboard/employees" element={<Employees />} />
            <Route path="/dashboard/settings" element={<Settings />} />
            <Route path="/dashboard/onboarding" element={<Onboarding />} />
            <Route path="/dashboard/availability" element={<EmployeeAvailability />} />
            <Route path="/dashboard/appointments" element={<EmployeeAppointments />} />
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
            <Route path="/appointment" element={<CustomerPortal />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
