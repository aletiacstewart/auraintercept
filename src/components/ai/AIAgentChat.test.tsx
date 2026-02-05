import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { AIAgentChat } from "./AIAgentChat";

// Mock the useAIAgent hook
const mockSendMessage = vi.fn();
const mockClearMessages = vi.fn();

vi.mock("@/hooks/useAIAgent", () => ({
  useAIAgent: () => ({
    messages: [],
    isLoading: false,
    sendMessage: mockSendMessage,
    clearMessages: mockClearMessages,
  }),
}));

describe("AIAgentChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state with suggestions", () => {
    const { container, getByText, getByPlaceholderText } = render(<AIAgentChat />);
    
    expect(getByText("AI Agent Test Console")).toBeInTheDocument();
    expect(getByText("Start a conversation to test the AI Agent")).toBeInTheDocument();
    expect(getByPlaceholderText("Type a message...")).toBeInTheDocument();
  });

  it("renders input field and submit button", () => {
    const { getByPlaceholderText, getAllByRole } = render(<AIAgentChat />);
    
    const input = getByPlaceholderText("Type a message...");
    const buttons = getAllByRole("button");
    
    expect(input).toBeInTheDocument();
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("has disabled submit when input is empty", () => {
    const { getByPlaceholderText, container } = render(<AIAgentChat />);
    
    const input = getByPlaceholderText("Type a message...");
    const form = input.closest("form");
    const submitBtn = form?.querySelector('button[type="submit"]');
    
    expect(submitBtn).toBeDisabled();
  });

  it("calls clearMessages when clear button is clicked", async () => {
    const { getAllByRole } = render(<AIAgentChat />);
    
    const buttons = getAllByRole("button");
    const clearButton = buttons[0]; // First button is the clear/trash button
    
    clearButton.click();
    
    expect(mockClearMessages).toHaveBeenCalled();
  });
});

describe("AIAgentChat structure", () => {
  it("renders card with proper structure", () => {
    const { container } = render(<AIAgentChat />);
    
    // Check card structure exists
    expect(container.querySelector('[class*="card"]')).toBeTruthy();
  });

  it("renders suggestion text for new users", () => {
    const { getByText } = render(<AIAgentChat />);
    
    expect(getByText(/What services do you offer/)).toBeInTheDocument();
  });
});
