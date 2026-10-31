// Accessible Speech Synthesis (Text-to-Speech) helper for elderly users

class TtsService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeakingState = false;
  private listeners: ((speaking: boolean) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public subscribe(callback: (speaking: boolean) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify(speaking: boolean) {
    this.isSpeakingState = speaking;
    this.listeners.forEach(cb => cb(speaking));
  }

  public speak(text: string, lang: 'ur' | 'ur-roman' | 'en' = 'ur', rate: number = 0.85) {
    if (!this.synth) return;

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    // Voice selection
    const voices = this.synth.getVoices();
    if (lang === 'ur') {
      const urduVoice = voices.find(v => v.lang.startsWith('ur') || v.lang.includes('PK'));
      if (urduVoice) {
        utterance.voice = urduVoice;
        utterance.lang = urduVoice.lang;
      } else {
        // Fallback to Hindi or Arabic phonetics for Urdu if native ur-PK is not installed
        const fallbackVoice = voices.find(v => v.lang.startsWith('hi') || v.lang.startsWith('ar'));
        if (fallbackVoice) {
          utterance.voice = fallbackVoice;
        }
        utterance.lang = 'ur-PK';
      }
    } else {
      utterance.lang = 'en-US';
      const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google')));
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
    }

    // Slightly slower rate for elderly comprehension
    utterance.rate = rate;
    utterance.pitch = 1.0;

    utterance.onstart = () => this.notify(true);
    utterance.onend = () => this.notify(false);
    utterance.onerror = () => this.notify(false);

    try {
      this.synth.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      this.notify(false);
    }
  }

  public stop() {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {
        // ignore
      }
    }
    this.notify(false);
  }

  public isSpeaking(): boolean {
    return this.isSpeakingState;
  }
}

export const tts = new TtsService();
