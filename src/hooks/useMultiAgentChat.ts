import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  agent?: string;
  timestamp?: Date;
  actions?: Array<{ label: string; action: string }>;
  isLocked?: boolean;
}

export interface UseMultiAgentChatOptions {
  companyId?: string;
  userId?: string;
  onAgentChange?: (agent: string) => void;
  initialAgent?: string;
  pageContext?: string; // Description of the current page and visible data
}

export const useMultiAgentChat = (options: UseMultiAgentChatOptions = {}) => {
  const { companyId, userId, onAgentChange, initialAgent = 'triage', pageContext } = options;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<string>(initialAgent);
  const [sessionId] = useState(() => crypto.randomUUID());
  const { toast } = useToast();

  // Build enriched page context with current date/time so all AI agents have temporal awareness
  const buildEnrichedContext = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateTimeContext = `Current date/time: ${dateStr} at ${timeStr} (user's local time).`;
    return pageContext ? `${dateTimeContext}\n\n${pageContext}` : dateTimeContext;
  };

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
          userId,
          sessionId,
          pageContext: buildEnrichedContext(), // Pass enriched context with date/time to backend
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

      // Handle agent locked error
      if (data?.error === 'agent_locked') {
        const tierLabels: Record<string, string> = {
          single_point: 'Single-Point',
          multi_track: 'Multi-Track',
          command: 'Command'
        };
        const requiredTierLabel = tierLabels[data.required_tier] || data.required_tier;
        
        const lockedMsg: ChatMessage = {
          role: 'assistant',
          content: `This feature requires the ${requiredTierLabel} subscription tier. Would you like to learn more about upgrading your plan?`,
          agent: currentAgent,
          timestamp: new Date(),
          isLocked: true,
        };
        setMessages((prev) => [...prev, lockedMsg]);
        
        toast({
          title: 'Upgrade Required',
          description: `The ${currentAgent} agent requires the ${requiredTierLabel} tier.`,
        });
        return;
      }
      
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

      // If there was a handoff, make a follow-up call to the new agent (minimal delay)
      if (data.handoff_to) {
        console.log(`[MultiAgentChat] Handoff detected: ${currentAgent} -> ${data.handoff_to}`);
        
        // Minimal delay for handoff transition
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Call the new agent with handoff context
        const followUpResponse = await supabase.functions.invoke('ai-agent-chat', {
          body: {
            agentType: data.handoff_to,
            message: userMessage,
            companyId,
            userId,
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
  }, [companyId, sessionId, messages, currentAgent, isLoading, onAgentChange, toast]);

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
