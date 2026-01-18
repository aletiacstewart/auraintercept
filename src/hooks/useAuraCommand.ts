import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface UseAuraCommandOptions {
  onOpen?: () => void;
  onClose?: () => void;
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
    
    // Navigate to Ask Aura with the query
    navigate(`/dashboard/ask-aura?q=${encodeURIComponent(searchQuery.trim())}`);
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
