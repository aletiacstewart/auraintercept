// Chat Feedback Utilities - Sound, Haptic, and Visual Feedback

// ============ SOUND FEEDBACK ============

// Play a subtle chime when AI starts responding (Web Audio API)
export const playChime = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Pleasant A5 note (880Hz)
    oscillator.frequency.value = 880;
    oscillator.type = 'sine';
    
    // Quick fade out for subtle effect
    gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
  } catch (e) {
    // Silently fail if audio not supported
    console.debug('Audio feedback not available:', e);
  }
};

// Play a completion sound (two-note chime)
export const playCompleteChime = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // First note
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.connect(gain1);
    gain1.connect(audioContext.destination);
    osc1.frequency.value = 659.25; // E5
    osc1.type = 'sine';
    gain1.gain.setValueAtTime(0.06, audioContext.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    osc1.start(audioContext.currentTime);
    osc1.stop(audioContext.currentTime + 0.1);
    
    // Second note (higher)
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.connect(gain2);
    gain2.connect(audioContext.destination);
    osc2.frequency.value = 783.99; // G5
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0.06, audioContext.currentTime + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    osc2.start(audioContext.currentTime + 0.1);
    osc2.stop(audioContext.currentTime + 0.2);
  } catch (e) {
    console.debug('Audio feedback not available:', e);
  }
};

// ============ HAPTIC FEEDBACK ============

// Trigger haptic vibration on mobile devices
export const triggerHaptic = (pattern: 'light' | 'medium' | 'success') => {
  if (!navigator.vibrate) return; // Device doesn't support vibration
  
  try {
    switch (pattern) {
      case 'light':
        navigator.vibrate(30);
        break;
      case 'medium':
        navigator.vibrate(50);
        break;
      case 'success':
        navigator.vibrate([40, 30, 40]); // Double tap pattern
        break;
    }
  } catch (e) {
    // Silently fail if vibration not supported
    console.debug('Haptic feedback not available:', e);
  }
};

// ============ SOUND PREFERENCES ============

const SOUND_STORAGE_KEY = 'aura-chat-sound-enabled';

export const isSoundEnabled = (): boolean => {
  try {
    return localStorage.getItem(SOUND_STORAGE_KEY) !== 'off';
  } catch {
    return true; // Default to enabled if localStorage not available
  }
};

export const toggleSound = (): boolean => {
  try {
    const current = isSoundEnabled();
    localStorage.setItem(SOUND_STORAGE_KEY, current ? 'off' : 'on');
    return !current;
  } catch {
    return true;
  }
};

// ============ COMBINED FEEDBACK TRIGGERS ============

// Trigger feedback when AI starts responding
export const onAIStreamStart = () => {
  if (isSoundEnabled()) {
    playChime();
  }
  triggerHaptic('light');
};

// Trigger feedback when AI completes response
export const onAIStreamComplete = () => {
  triggerHaptic('success');
  // Optionally play completion sound (disabled by default for subtlety)
  // if (isSoundEnabled()) playCompleteChime();
};
