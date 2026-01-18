import { createContext, useContext } from 'react';

// Custom event name for setup progress refresh
export const SETUP_PROGRESS_REFRESH_EVENT = 'setup-progress-refresh';

/**
 * Dispatch an event to trigger a refresh of the SetupProgressBar
 * Call this after successfully saving any settings that affect setup completion
 */
export function triggerSetupProgressRefresh() {
  window.dispatchEvent(new CustomEvent(SETUP_PROGRESS_REFRESH_EVENT));
}
