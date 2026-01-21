import { useState, useCallback, useRef } from 'react';

export interface StreamMessage {
  role: 'user' | 'assistant';
  content: string;
  agent?: string;
  timestamp?: Date;
  isStreaming?: boolean;
}

interface UsePublicChatStreamOptions {
  companySlug: string;
  onAgentChange?: (agent: string) => void;
}

export const usePublicChatStream = (options: UsePublicChatStreamOptions) => {
  const { companySlug, onAgentChange } = options;
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<string>('triage');
  const abortControllerRef = useRef<AbortController | null>(null);

  const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;

    // Cancel any ongoing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const userMsg: StreamMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    // Add user message and placeholder for assistant
    setMessages(prev => [...prev, userMsg, {
      role: 'assistant',
      content: '',
      agent: currentAgent,
      timestamp: new Date(),
      isStreaming: true,
    }]);
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));
      conversationHistory.push({ role: 'user', content: userMessage });

      const response = await fetch(
        `${API_BASE}/widget-api?action=chat&company=${encodeURIComponent(companySlug)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            messages: conversationHistory,
            stream: true 
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      // Handle rate limiting
      if (response.status === 429) {
        setMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (updated[lastIdx]?.role === 'assistant') {
            updated[lastIdx] = {
              ...updated[lastIdx],
              content: 'Service is busy, please try again in a moment.',
              isStreaming: false,
            };
          }
          return updated;
        });
        setIsLoading(false);
        return;
      }

      if (response.status === 402) {
        setMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (updated[lastIdx]?.role === 'assistant') {
            updated[lastIdx] = {
              ...updated[lastIdx],
              content: 'Service temporarily unavailable. Please try again later.',
              isStreaming: false,
            };
          }
          return updated;
        });
        setIsLoading(false);
        return;
      }

      if (!response.ok || !response.body) {
        throw new Error('Failed to start stream');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';
      let detectedAgent = currentAgent;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process SSE lines
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            
            // Extract agent info from first chunk if available
            if (parsed.agent && parsed.agent !== detectedAgent) {
              detectedAgent = parsed.agent;
              setCurrentAgent(detectedAgent);
              onAgentChange?.(detectedAgent);
            }

            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullContent += content;
              
              // Update the last message with new content
              setMessages(prev => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (updated[lastIdx]?.role === 'assistant') {
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    content: fullContent,
                    agent: detectedAgent,
                  };
                }
                return updated;
              });
            }
          } catch {
            // Incomplete JSON, put back in buffer
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Final flush
      if (buffer.trim()) {
        for (let raw of buffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullContent += content;
            }
          } catch { /* ignore */ }
        }
      }

      // Mark streaming complete
      setMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.role === 'assistant') {
          updated[lastIdx] = {
            ...updated[lastIdx],
            content: fullContent || "I'm here to help! How can I assist you?",
            isStreaming: false,
          };
        }
        return updated;
      });

    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return;
      }
      
      console.error('Stream error:', error);
      setMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.role === 'assistant') {
          updated[lastIdx] = {
            ...updated[lastIdx],
            content: 'I apologize, I encountered an issue. Please try again.',
            isStreaming: false,
          };
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  }, [companySlug, messages, currentAgent, isLoading, onAgentChange, API_BASE]);

  const clearMessages = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages([]);
    setCurrentAgent('triage');
  }, []);

  return {
    messages,
    isLoading,
    currentAgent,
    sendMessage,
    clearMessages,
  };
};
