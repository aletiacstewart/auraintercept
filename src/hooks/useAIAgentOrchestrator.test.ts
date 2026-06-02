import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAIAgentOrchestrator } from "./useAIAgentOrchestrator";

// Mock Supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { company_id: "test-company" }, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
}));

// Mock AuthContext
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "test-user-id" },
  }),
}));

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("useAIAgentOrchestrator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes with default agents", () => {
    const { result } = renderHook(() => useAIAgentOrchestrator());
    
    // Should have 24 default agents
    expect(result.current.agents.length).toBe(24);
    expect(result.current.loading).toBe(true);
  });

  it("has all required agent categories", () => {
    const { result } = renderHook(() => useAIAgentOrchestrator());
    
    const categories = new Set(result.current.agents.map(a => a.category));
    
    expect(categories.has("customer_engagement")).toBe(true);
    expect(categories.has("field_operations")).toBe(true);
    expect(categories.has("business_operations")).toBe(true);
    expect(categories.has("marketing_sales")).toBe(true);
    expect(categories.has("social_media")).toBe(true);
    expect(categories.has("analytics_reports")).toBe(true);
    expect(categories.has("creative_web_presence")).toBe(true);
  });

  it("groups agents by category correctly", () => {
    const { result } = renderHook(() => useAIAgentOrchestrator());

    const { groupedAgents } = result.current;

    // 10-operative consolidated model: 2 customer_engagement, 2 field_operations
    expect(groupedAgents.customer_engagement?.length).toBe(2);
    expect(groupedAgents.field_operations?.length).toBe(2);
  });

  it("has correct agent types", () => {
    const { result } = renderHook(() => useAIAgentOrchestrator());

    const agentTypes = result.current.agents.map(a => a.type);

    // Consolidated operatives (legacy IDs booking/followup/review/route/eta/
    // checkin/quoting/invoice/inventory fold into these via LEGACY_AGENT_MAP).
    expect(agentTypes).toContain("triage");
    expect(agentTypes).toContain("customer_journey");
    expect(agentTypes).toContain("dispatch");
    expect(agentTypes).toContain("field_navigation");
    expect(agentTypes).toContain("admin");
    expect(agentTypes).toContain("business_finance");
    expect(agentTypes).toContain("outreach");
    expect(agentTypes).toContain("creative_content");
    expect(agentTypes).toContain("web_presence");
    expect(agentTypes).toContain("analytics_intelligence");
  });

  it("exposes toggleAgent function", () => {
    const { result } = renderHook(() => useAIAgentOrchestrator());
    
    expect(typeof result.current.toggleAgent).toBe("function");
  });

  it("exposes updateAgentSettings function", () => {
    const { result } = renderHook(() => useAIAgentOrchestrator());
    
    expect(typeof result.current.updateAgentSettings).toBe("function");
  });

  it("exposes emitEvent function", () => {
    const { result } = renderHook(() => useAIAgentOrchestrator());
    
    expect(typeof result.current.emitEvent).toBe("function");
  });

  it("exposes createContext function", () => {
    const { result } = renderHook(() => useAIAgentOrchestrator());
    
    expect(typeof result.current.createContext).toBe("function");
  });

  it("exposes handoff function", () => {
    const { result } = renderHook(() => useAIAgentOrchestrator());
    
    expect(typeof result.current.handoff).toBe("function");
  });

  it("exposes subscribeToEvents function", () => {
    const { result } = renderHook(() => useAIAgentOrchestrator());
    
    expect(typeof result.current.subscribeToEvents).toBe("function");
  });

  it("agents have correct phase assignments", () => {
    const { result } = renderHook(() => useAIAgentOrchestrator());

    const triageAgent = result.current.agents.find(a => a.type === "triage");
    expect(triageAgent?.phase).toBe(1);

    const customerJourneyAgent = result.current.agents.find(a => a.type === "customer_journey");
    expect(customerJourneyAgent?.phase).toBe(2);

    const dispatchAgent = result.current.agents.find(a => a.type === "dispatch");
    expect(dispatchAgent?.phase).toBe(1);
  });
});

describe("useAIAgentOrchestrator agent definitions", () => {
  it("each agent has required fields", () => {
    const { result } = renderHook(() => useAIAgentOrchestrator());
    
    result.current.agents.forEach(agent => {
      expect(agent.type).toBeDefined();
      expect(agent.name).toBeDefined();
      expect(agent.category).toBeDefined();
      expect(typeof agent.phase).toBe("number");
      expect(typeof agent.is_enabled).toBe("boolean");
      expect(agent.settings).toBeDefined();
    });
  });

  it("agent types are unique", () => {
    const { result } = renderHook(() => useAIAgentOrchestrator());
    
    const types = result.current.agents.map(a => a.type);
    const uniqueTypes = new Set(types);
    
    expect(types.length).toBe(uniqueTypes.size);
  });
});
