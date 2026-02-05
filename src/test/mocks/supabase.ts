import { vi } from "vitest";

// Mock Supabase client
export const mockSupabaseClient = {
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  })),
  functions: {
    invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(),
  })),
  removeChannel: vi.fn(),
};

// Mock for fetch streaming responses
export const createMockStreamResponse = (chunks: string[]) => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      chunks.forEach((chunk) => {
        controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
      });
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" },
  });
};

// Mock AI response
export const mockAIResponse = {
  choices: [
    {
      delta: {
        content: "Hello! I'm your AI assistant.",
      },
    },
  ],
};

// Helper to create mock agent data
export const createMockAgent = (overrides = {}) => ({
  type: "triage",
  name: "AI Receptionist",
  category: "customer_engagement",
  phase: 1,
  is_enabled: false,
  settings: {},
  ...overrides,
});

// Helper to create mock company
export const createMockCompany = (overrides = {}) => ({
  id: "test-company-id",
  name: "Test Company",
  slug: "test-company",
  ...overrides,
});
