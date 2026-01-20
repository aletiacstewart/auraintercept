// AuraVoiceOverlay is now integrated into AuraVoicePanel in the sidebar
// This component is kept for backwards compatibility but renders nothing
// The voice UI is now displayed in the sidebar under "Ask Aura" section

import { useVoice } from '@/contexts/VoiceContext';

export function AuraVoiceOverlay() {
  // All voice UI is now in AuraVoicePanel (sidebar)
  // This component is intentionally empty
  return null;
}
