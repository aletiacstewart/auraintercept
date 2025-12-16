import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  agent?: string;
  timestamp?: Date;
  actions?: Array<{ label: string; action: string }>;
}

interface UseMultiAgentChatOptions {
  companyId?: string;
  onAgentChange?: (agent: string) => void;
}

export const useMultiAgentChat = (options: UseMultiAgentChatOptions = {}) => {
  const { companyId, onAgentChange } = options;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<string>('triage');
  const [sessionId] = useState(() => crypto.randomUUID());

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke('ai-agent-chat', {
        body: {
          message: userMessage,
          companyId,
          sessionId,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;
      
      // Handle agent change
      if (data.agent && data.agent !== currentAgent) {
        setCurrentAgent(data.agent);
        onAgentChange?.(data.agent);
      }

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.response || data.message || 'I apologize, I encountered an issue. Please try again.',
        agent: data.agent || currentAgent,
        timestamp: new Date(),
        actions: data.actions,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: 'I apologize, I encountered an issue processing your request. Please try again.',
        agent: currentAgent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, sessionId, messages, currentAgent, isLoading, onAgentChange]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentAgent('triage');
  }, []);

  return {
    messages,
    isLoading,
    currentAgent,
    sessionId,
    sendMessage,
    clearMessages,
  };
};
