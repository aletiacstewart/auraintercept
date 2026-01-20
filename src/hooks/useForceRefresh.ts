import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export const useForceRefresh = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const forceRefresh = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      // 1. Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
        console.log('Service workers unregistered:', registrations.length);
      }
      
      // 2. Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('Caches cleared:', cacheNames);
      }
      
      // 3. Clear local storage cache markers
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('workbox-') || key.startsWith('sw-'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      toast.success('Cache cleared successfully. Reloading...');
      
      // 4. Hard reload after a brief delay
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
    } catch (error) {
      console.error('Force refresh failed:', error);
      toast.error('Failed to clear cache. Please try again.');
      setIsRefreshing(false);
    }
  }, []);

  return { forceRefresh, isRefreshing };
};
