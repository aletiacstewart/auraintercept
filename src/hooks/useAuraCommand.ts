import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { detectLocalIntent } from '@/lib/auraIntentDetection';
import { isDataQuery } from '@/lib/voiceNavigation';

interface UseAuraCommandOptions {
  onOpen?: () => void;
  onClose?: () => void;
  onInlineResponse?: (response: string) => void;
}

export function useAuraCommand(options: UseAuraCommandOptions = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const open = useCallback(() => {
    setIsOpen(true);
    options.onOpen?.();
  }, [options]);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    options.onClose?.();
  }, [options]);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  const submitQuery = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    const trimmedQuery = searchQuery.trim();
    
    // Detect if this is a data query that should get an inline answer
    const localIntent = detectLocalIntent(trimmedQuery);
    const isDataQuestion = isDataQuery(trimmedQuery) || 
      (localIntent.intent === 'data_query' && localIntent.confidence >= 0.5);
    
    if (isDataQuestion) {
      // For data queries, navigate to analytics with the query for full processing
      // The analytics page will show the answer inline
      navigate(`/dashboard/analytics-reports?q=${encodeURIComponent(trimmedQuery)}`);
    } else {
      // For other queries (navigation, actions), still go to analytics
      navigate(`/dashboard/analytics-reports?q=${encodeURIComponent(trimmedQuery)}`);
    }
    
    close();
  }, [navigate, close]);

  // Global keyboard listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        toggle();
      }
      
      // Close on Escape
      if (event.key === 'Escape' && isOpen) {
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggle, close]);

  return {
    isOpen,
    query,
    setQuery,
    open,
    close,
    toggle,
    submitQuery,
  };
}
