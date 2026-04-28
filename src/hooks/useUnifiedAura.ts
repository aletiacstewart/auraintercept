import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useVoice } from '@/contexts/VoiceContext';
import { useMultiAgentChat } from '@/hooks/useMultiAgentChat';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  detectLocalIntent,
  splitHybridCommand,
  type IntentType,
} from '@/lib/auraIntentDetection';
import {
  getVisibleButtonLabels,
  getVisibleCardLabels,
  getVisibleFieldLabels,
} from '@/lib/voiceNavigation';

interface UnifiedAuraOptions {
  companyId?: string;
  userId?: string;
  onActionExecuted?: (action: string) => void;
}

interface UnifiedAuraState {
  isProcessing: boolean;
  lastIntent: IntentType | null;
  inputValue: string;
}

export function useUnifiedAura(options: UnifiedAuraOptions = {}) {
  const { companyId, userId, onActionExecuted } = options;
  const navigate = useNavigate();
  const location = useLocation();
  const { injectText, isVoiceModeEnabled, transcript, isListening, clearTranscript } = useVoice();
  const { i18n } = useTranslation();
  const language = (i18n.language?.startsWith('es') ? 'es' : 'en');
  
  const [state, setState] = useState<UnifiedAuraState>({
    isProcessing: false,
    lastIntent: null,
    inputValue: '',
  });
  
  /**
   * Generate page context description based on current route
   */
  const getPageContext = useCallback((): string => {
    const path = location.pathname;
    
    // Map routes to context descriptions
    const pageContextMap: Record<string, string> = {
      '/dashboard/ai-consoles/business-mgt-ops': 'Business Management Console showing: financial metrics dashboard, sales (leads, quotes, invoices), appointments, inventory, people management, and real-time Aura Live activity stream.',
      '/dashboard/leads': 'Leads management page showing all leads with status, priority, source, and contact info.',
      '/dashboard/appointments': 'Appointments management page showing scheduled, confirmed, and completed appointments.',
      '/dashboard/calendar': 'Calendar view showing appointments by day/week/month.',
      '/dashboard/quotes': 'Quotes management page showing draft, sent, accepted, and rejected quotes with totals.',
      '/dashboard/invoices': 'Invoices management page showing draft, sent, paid, and overdue invoices with totals.',
      '/dashboard/inventory': 'Inventory management page showing items, stock levels, and low stock alerts.',
      '/dashboard/customers': 'Customer profiles page showing customer list with contact info and history.',
      '/dashboard/campaigns': 'Marketing campaigns page showing active, scheduled, and completed campaigns.',
      '/dashboard/analytics': 'Analytics dashboard showing performance metrics, revenue trends, and forecasts.',
      '/dashboard/ask-aura': 'Ask Aura analytics page for deep-dive data queries and business intelligence.',
      '/dashboard/knowledge': 'Knowledge Base page with services catalog, FAQs, business hours, and documents.',
      '/dashboard/field-ops': 'Field Ops console for technician management, job assignments, and dispatch.',
      '/dashboard/marketing': 'Outreach & Sales Ops console for campaigns, promotions, and lead management.',
    };
    
    // Find matching context or generate generic one
    for (const [route, context] of Object.entries(pageContextMap)) {
      if (path.startsWith(route)) {
        return context;
      }
    }
    
    // Generic context for unknown pages
    return `Dashboard page at ${path}. User can ask about any business data including leads, appointments, quotes, invoices, inventory, campaigns, customers, and feedback.`;
  }, [location.pathname]);
  
  // Use the multi-agent chat for analytics queries with page context
  const multiAgent = useMultiAgentChat({
    companyId,
    userId,
    initialAgent: 'triage',
    pageContext: getPageContext(),
    language,
  });
  
  // Track if we're waiting for voice input to auto-submit
  const voiceSubmitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Track the last processed transcript to avoid reprocessing
  const lastProcessedTranscriptRef = useRef<string>('');
  
  /**
   * Classify intent using local detection first, then AI if needed
   */
  const classifyIntent = useCallback(async (input: string): Promise<{
    intent: IntentType;
    dataPart: string | null;
    actionPart: string | null;
  }> => {
    const normalizedInput = input.trim().toLowerCase();
    
    // PRIORITY FAST-PATH: Questions starting with "how many" are ALWAYS data queries
    if (/^how many\b/i.test(normalizedInput)) {
      return {
        intent: 'data_query',
        dataPart: input,
        actionPart: null,
      };
    }
    
    // PRIORITY FAST-PATH: Questions with "do I have" about business entities are data queries
    const businessEntities = /customers?|leads?|appointments?|quotes?|invoices?|campaigns?|inventory|items?/i;
    if (/\bdo i have\b/i.test(normalizedInput) && businessEntities.test(normalizedInput)) {
      return {
        intent: 'data_query',
        dataPart: input,
        actionPart: null,
      };
    }
    
    // PRIORITY FAST-PATH: "What is/are my X" questions are data queries
    if (/^what('?s| is| are)?\s+(my |our |the )?/i.test(normalizedInput) && businessEntities.test(normalizedInput)) {
      return {
        intent: 'data_query',
        dataPart: input,
        actionPart: null,
      };
    }
    
    // Try local detection (fast)
    const localResult = detectLocalIntent(input);
    
    if (localResult.confidence >= 0.75) {
      // High confidence local match
      if (localResult.intent === 'hybrid') {
        const parts = splitHybridCommand(input);
        return {
          intent: 'hybrid',
          dataPart: parts?.dataPart || input,
          actionPart: parts?.actionPart || null,
        };
      }
      return {
        intent: localResult.intent,
        dataPart: localResult.intent === 'data_query' ? input : null,
        actionPart: localResult.intent === 'action_command' ? input : null,
      };
    }
    
    // Low confidence - use AI classification
    try {
      const response = await supabase.functions.invoke('aura-unified', {
        body: {
          input,
          currentPage: location.pathname,
          visibleButtons: getVisibleButtonLabels(),
          visibleCards: getVisibleCardLabels(),
          visibleFields: getVisibleFieldLabels(),
        },
      });
      
      if (response.error) {
        console.error('AI classification error:', response.error);
        // Fall back to local detection
        return {
          intent: localResult.intent !== 'unknown' ? localResult.intent : 'data_query',
          dataPart: input,
          actionPart: null,
        };
      }
      
      const { classification } = response.data;
      return {
        intent: classification.intent,
        dataPart: classification.data_part,
        actionPart: classification.action_part,
      };
    } catch (error) {
      console.error('Classification failed:', error);
      return {
        intent: localResult.intent !== 'unknown' ? localResult.intent : 'data_query',
        dataPart: input,
        actionPart: null,
      };
    }
  }, [location.pathname]);
  
  /**
   * Execute an action command via the voice navigator
   */
  const executeAction = useCallback(async (command: string): Promise<boolean> => {
    try {
      const response = await supabase.functions.invoke('voice-navigator', {
        body: {
          command,
          currentPage: location.pathname,
          visibleButtons: getVisibleButtonLabels(),
          visibleCards: getVisibleCardLabels(),
          visibleFields: getVisibleFieldLabels(),
        },
      });
      
      if (response.error) {
        console.error('Action execution error:', response.error);
        return false;
      }
      
      const action = response.data;
      
      // Execute the action based on type
      if (action.action === 'navigate' && action.route) {
        navigate(action.route);
        toast.success(action.message || `Navigating to ${action.target || action.route}`);
        onActionExecuted?.('navigate');
        return true;
      }
      
      // For other actions, inject via voice context
      injectText(command);
      onActionExecuted?.(action.action);
      return true;
    } catch (error) {
      console.error('Failed to execute action:', error);
      return false;
    }
  }, [location.pathname, navigate, injectText, onActionExecuted]);
  
  /**
   * Main handler for unified input (voice or text)
   */
  const handleInput = useCallback(async (input: string, _isVoice = false) => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;
    
    setState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      // Classify the intent
      const { intent, dataPart, actionPart } = await classifyIntent(trimmedInput);
      setState(prev => ({ ...prev, lastIntent: intent }));
      
      if (intent === 'data_query' && dataPart) {
        // Send to multi-agent analytics chat
        await multiAgent.sendMessage(dataPart);
      } else if (intent === 'action_command' && actionPart) {
        // Execute as voice/UI action
        await executeAction(actionPart);
      } else if (intent === 'hybrid') {
        // Handle data first, then action
        if (dataPart) {
          await multiAgent.sendMessage(dataPart);
        }
        // Small delay before action to let user see the data response
        if (actionPart) {
          setTimeout(async () => {
            await executeAction(actionPart);
          }, 1500);
        }
      } else {
        // Unknown intent - try as analytics query by default
        await multiAgent.sendMessage(trimmedInput);
      }
    } catch (error) {
      console.error('Unified Aura error:', error);
      toast.error('Failed to process your request');
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [classifyIntent, multiAgent, executeAction]);
  
  /**
   * Set input value (for controlled input)
   */
  const setInputValue = useCallback((value: string) => {
    setState(prev => ({ ...prev, inputValue: value }));
  }, []);
  
  /**
   * Clear the input and reset state
   */
  const clearInput = useCallback(() => {
    setState(prev => ({ ...prev, inputValue: '', lastIntent: null }));
    clearTranscript(); // Also clear the voice transcript
    lastProcessedTranscriptRef.current = ''; // Reset the processed ref
  }, [clearTranscript]);
  
  // Ref to store the latest handleInput to avoid dependency issues
  const handleInputRef = useRef(handleInput);
  useEffect(() => {
    handleInputRef.current = handleInput;
  }, [handleInput]);
  
  // Auto-populate input from voice transcript when voice mode is active
  useEffect(() => {
    if (isVoiceModeEnabled && isListening && transcript) {
      // Skip if we already processed this transcript
      if (transcript === lastProcessedTranscriptRef.current) {
        return;
      }
      
      setState(prev => ({ ...prev, inputValue: transcript }));
      
      // Clear any existing timer
      if (voiceSubmitTimerRef.current) {
        clearTimeout(voiceSubmitTimerRef.current);
      }
      
      // Auto-submit after 2 second pause in speech
      voiceSubmitTimerRef.current = setTimeout(() => {
        if (transcript.trim()) {
          // Mark this transcript as processed
          lastProcessedTranscriptRef.current = transcript;
          
          handleInputRef.current(transcript.trim(), true);
          
          // Clear the input and the voice transcript
          setState(prev => ({ ...prev, inputValue: '' }));
          clearTranscript();
        }
      }, 2000);
    }
    
    return () => {
      if (voiceSubmitTimerRef.current) {
        clearTimeout(voiceSubmitTimerRef.current);
      }
    };
  }, [transcript, isVoiceModeEnabled, isListening, clearTranscript]);
  
  return {
    // State
    inputValue: state.inputValue,
    isProcessing: state.isProcessing,
    lastIntent: state.lastIntent,
    messages: multiAgent.messages,
    isLoading: multiAgent.isLoading || state.isProcessing,
    currentAgent: multiAgent.currentAgent,
    
    // Actions
    handleInput,
    setInputValue,
    clearInput,
    clearMessages: multiAgent.clearMessages,
    
    // Voice state passthrough
    isVoiceModeEnabled,
    isListening,
    transcript,
  };
}
