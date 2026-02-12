/**
 * Browser-native Text-to-Speech utility using the Web Speech API.
 * Zero cost alternative to ElevenLabs for UI announcements and fallback voice chat.
 */

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
  voiceName?: string;
}

/** Whether the browser supports speechSynthesis */
export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Whether the browser supports SpeechRecognition (for STT) */
export function isRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
}

/** Get the SpeechRecognition constructor (cross-browser) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSpeechRecognition(): any | null {
  if (typeof window === 'undefined') return null;
  return (
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    null
  );
}

/** List available browser voices */
export function getVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSupported()) return [];
  return window.speechSynthesis.getVoices();
}

/**
 * Pick a natural-sounding female English voice to match "Aura" branding.
 * Falls back to the first English voice, then the default voice.
 */
function pickDefaultVoice(): SpeechSynthesisVoice | undefined {
  const voices = getVoices();
  if (voices.length === 0) return undefined;

  const enVoices = voices.filter((v) => v.lang.startsWith('en'));
  if (enVoices.length === 0) return voices[0];

  // 1. Explicit "female" in name (Chrome: "Google US English Female")
  const explicitFemale = enVoices.find((v) => /female/i.test(v.name));
  if (explicitFemale) return explicitFemale;

  // 2. Known female voice names across OS/browser
  const knownFemale = enVoices.find((v) =>
    /samantha|victoria|karen|zira|hazel|susan|fiona|moira|tessa|allison/i.test(v.name)
  );
  if (knownFemale) return knownFemale;

  // 3. Any English voice that does NOT contain "male" in name
  const nonMale = enVoices.find((v) => !/\bmale\b/i.test(v.name));
  if (nonMale) return nonMale;

  // 4. Fallback to first English voice
  return enVoices[0];
}

/**
 * Speak text aloud using the browser's built-in speech synthesis.
 * Returns a Promise that resolves when speech finishes (or rejects on error).
 */
export function speak(text: string, options?: SpeakOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isSpeechSupported()) {
      reject(new Error('Speech synthesis not supported in this browser'));
      return;
    }

    window.speechSynthesis.cancel(); // stop any in-progress speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options?.lang ?? 'en-US';
    utterance.rate = options?.rate ?? 1.0;
    utterance.pitch = options?.pitch ?? 1.0;
    utterance.volume = options?.volume ?? 1.0;

    if (options?.voiceName) {
      const match = getVoices().find((v) => v.name === options.voiceName);
      if (match) utterance.voice = match;
    } else {
      const defaultVoice = pickDefaultVoice();
      if (defaultVoice) utterance.voice = defaultVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(e);

    window.speechSynthesis.speak(utterance);
  });
}

/** Cancel any in-progress speech */
export function stopSpeaking(): void {
  if (isSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Simple fire-and-forget browser TTS.
 * Returns true if speech started, false if unsupported.
 * Used as a drop-in replacement for the old inline `speakWithBrowser` helpers.
 */
export function speakSimple(text: string, lang = 'en-US', rate = 1): boolean {
  if (!isSpeechSupported()) return false;
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}
