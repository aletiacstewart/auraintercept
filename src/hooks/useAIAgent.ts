import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}

export const useAIAgent = () => {
  const { companyId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!companyId) {
      console.error('No company ID available');
      return;
    }

    const userMsg: Message = { role: 'user', content: userMessage };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    let assistantContent = '';

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMsg],
            company_id: companyId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let pendingToolCalls: ToolCall[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta;

            if (delta?.content) {
              assistantContent += delta.content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => 
                    i === prev.length - 1 ? { ...m, content: assistantContent } : m
                  );
                }
                return [...prev, { role: 'assistant', content: assistantContent }];
              });
            }

            // Handle tool calls
            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                if (tc.function?.name) {
                  pendingToolCalls.push({
                    name: tc.function.name,
                    arguments: {}
                  });
                }
                if (tc.function?.arguments && pendingToolCalls.length > 0) {
                  const lastTool = pendingToolCalls[pendingToolCalls.length - 1];
                  try {
                    lastTool.arguments = JSON.parse(tc.function.arguments);
                  } catch {
                    // Arguments may be streamed in chunks
                  }
                }
              }
            }
          } catch {
            // Continue on parse errors
          }
        }
      }

      // Execute any tool calls
      for (const toolCall of pendingToolCalls) {
        await executeToolCall(toolCall, companyId);
      }

    } catch (error) {
      console.error('AI Agent error:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, companyId]);

  const executeToolCall = async (toolCall: ToolCall, companyId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('booking-actions', {
        body: {
          action: toolCall.name,
          company_id: companyId,
          ...toolCall.arguments
        }
      });

      if (error) {
        console.error('Tool call error:', error);
      } else {
        console.log('Tool call result:', data);
      }

      return data;
    } catch (error) {
      console.error('Failed to execute tool call:', error);
    }
  };

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages
  };
};
