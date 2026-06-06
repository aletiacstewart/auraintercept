import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { detectLocalIntent } from '@/lib/auraIntentDetection';
import { isDataQuery } from '@/lib/voiceNavigation';
import { dispatchAuraRun, hasAuraRunListener } from '@/lib/auraRunBus';

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

    // Prefer running inline on the current page if an InlineAuraBar is mounted.
    // This keeps the user on their console (Field Ops, Business Mgt, etc.) and
    // streams the response in place instead of jumping to Business Management.
    if (hasAuraRunListener() && dispatchAuraRun(trimmedQuery)) {
      close();
      return;
    }

    // No inline surface — fall back to navigation. Route data questions to the
    // Analytics & Reports tab; everything else also lands there (the page now
    // forwards `?q=` into its own Aura bar, so the prompt is no longer dropped).
    const localIntent = detectLocalIntent(trimmedQuery);
    const isDataQuestion =
      isDataQuery(trimmedQuery) ||
      (localIntent.intent === 'data_query' && localIntent.confidence >= 0.5);

    const target = isDataQuestion
      ? `/dashboard/analytics-reports?tab=analytics&q=${encodeURIComponent(trimmedQuery)}`
      : `/dashboard/analytics-reports?q=${encodeURIComponent(trimmedQuery)}`;
    navigate(target);

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
