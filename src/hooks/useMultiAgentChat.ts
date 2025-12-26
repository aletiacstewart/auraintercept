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
  initialAgent?: string;
}

export const useMultiAgentChat = (options: UseMultiAgentChatOptions = {}) => {
  const { companyId, onAgentChange, initialAgent = 'triage' } = options;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<string>(initialAgent);
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
          agentType: currentAgent,
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
      
      // Handle agent change from response or handoff
      const newAgent = data.handoff_to || data.agent;
      if (newAgent && newAgent !== currentAgent) {
        setCurrentAgent(newAgent);
        onAgentChange?.(newAgent);
      }

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.response || data.message || 'I apologize, I encountered an issue. Please try again.',
        agent: newAgent || data.agent || currentAgent,
        timestamp: new Date(),
        actions: data.actions,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If there was a handoff, make a follow-up call to the new agent
      if (data.handoff_to) {
        console.log(`[MultiAgentChat] Handoff detected: ${currentAgent} -> ${data.handoff_to}`);
        
        // Brief delay before follow-up call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Call the new agent with handoff context
        const followUpResponse = await supabase.functions.invoke('ai-agent-chat', {
          body: {
            agentType: data.handoff_to,
            message: userMessage,
            companyId,
            sessionId,
            isHandoff: true,
            handoffFrom: currentAgent,
            handoffReason: data.handoff_reason,
            conversationHistory: [...messages, { role: 'user', content: userMessage }, assistantMsg].map(m => ({
              role: m.role,
              content: m.content,
            })),
          },
        });

        if (!followUpResponse.error && followUpResponse.data) {
          const followUpData = followUpResponse.data;
          const followUpMsg: ChatMessage = {
            role: 'assistant',
            content: followUpData.response || 'How can I assist you today?',
            agent: data.handoff_to,
            timestamp: new Date(),
            actions: followUpData.actions,
          };
          setMessages((prev) => [...prev, followUpMsg]);
        }
      }
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
    setCurrentAgent(initialAgent);
  }, [initialAgent]);

  return {
    messages,
    isLoading,
    currentAgent,
    sessionId,
    sendMessage,
    clearMessages,
  };
};
