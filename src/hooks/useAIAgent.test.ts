import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock AuthContext
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    companyId: "test-company-id",
    user: { id: "test-user-id" },
  }),
}));

// Import after mocks
import { useAIAgent } from "./useAIAgent";

describe("useAIAgent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes with empty messages", () => {
    const { result } = renderHook(() => useAIAgent());
    
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it("adds user message when sendMessage is called", async () => {
    // Mock successful streaming response
    const mockStream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n'));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: mockStream,
    });

    const { result } = renderHook(() => useAIAgent());

    await act(async () => {
      await result.current.sendMessage("Test message");
    });

    // Should have user message
    expect(result.current.messages.length).toBeGreaterThan(0);
    expect(result.current.messages[0].role).toBe("user");
    expect(result.current.messages[0].content).toBe("Test message");
  });

  it("sets isLoading to true during request", async () => {
    let resolvePromise: (value: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockFetch.mockReturnValueOnce(pendingPromise);

    const { result } = renderHook(() => useAIAgent());

    act(() => {
      result.current.sendMessage("Test");
    });

    expect(result.current.isLoading).toBe(true);

    // Cleanup
    resolvePromise!({
      ok: true,
      body: new ReadableStream({
        start(controller) {
          controller.close();
        },
      }),
    });
  });

  it("handles fetch errors gracefully", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useAIAgent());

    await act(async () => {
      await result.current.sendMessage("Test message");
    });

    // Should have error message
    const lastMessage = result.current.messages[result.current.messages.length - 1];
    expect(lastMessage.role).toBe("assistant");
    expect(lastMessage.content).toContain("error");
  });

  it("handles non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
    });

    const { result } = renderHook(() => useAIAgent());

    await act(async () => {
      await result.current.sendMessage("Test");
    });

    const lastMessage = result.current.messages[result.current.messages.length - 1];
    expect(lastMessage.content).toContain("error");
  });

  it("clears messages when clearMessages is called", async () => {
    const mockStream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n'));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: mockStream,
    });

    const { result } = renderHook(() => useAIAgent());

    await act(async () => {
      await result.current.sendMessage("Hello");
    });

    expect(result.current.messages.length).toBeGreaterThan(0);

    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.messages).toEqual([]);
  });

  it("parses streaming SSE response correctly", async () => {
    const mockStream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n'));
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":" World"}}]}\n\n'));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: mockStream,
    });

    const { result } = renderHook(() => useAIAgent());

    await act(async () => {
      await result.current.sendMessage("Test");
    });

    // Should have assistant message after streaming
    const assistantMessages = result.current.messages.filter(m => m.role === "assistant");
    expect(assistantMessages.length).toBeGreaterThan(0);
  });
});
