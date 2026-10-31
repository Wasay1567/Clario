// Offline Storage & Synchronization simulating Android Room Database (SQLite)
import { HelpSession, FraudCheckResult, Language } from '../types';

const SESSIONS_STORAGE_KEY = 'Clario_room_help_sessions';
const FRAUD_STORAGE_KEY = 'Clario_room_fraud_checks';
const SETTINGS_STORAGE_KEY = 'Clario_room_user_settings';

export interface UserSettings {
  language: Language;
  fontSize: 'standard' | 'large' | 'extra-large';
  voiceSpeed: number;
  highContrast: boolean;
  offlineMode: boolean;
}

const defaultSettings: UserSettings = {
  language: 'ur',
  fontSize: 'large',
  voiceSpeed: 0.85,
  highContrast: false,
  offlineMode: false,
};

// Initial offline seed data so users immediately have offline records
const initialHelpSessions: HelpSession[] = [
  {
    id: 'local-1',
    appContext: 'JazzCash',
    userQuery: 'پیسے بھیجنے کا طریقہ بتائیں',
    language: 'ur',
    summary: 'جاز کیش سے باآسانی رقم بھیجنے کا طریقہ',
    steps: [
      { n: 1, text: 'سکرین کے درمیان میں گول سرخ "Send Money" آئیکون پر دبائیں۔', hint: 'درمیان میں بڑا لال بٹن' },
      { n: 2, text: 'جس کو پیسے بھیجنے ہیں اس کا 11 ہندسوں والا موبائل نمبر لکھیں۔', hint: 'نمبر چیک کر لیں' },
      { n: 3, text: 'رقم لکھ کر آگے بڑھیں اور اپنا 4 ہندسوں کا خفیہ پن درج کریں۔', hint: 'اپنا پن کسی کو مت دیں' }
    ],
    warning: 'جاز کیش کبھی کال پر آپ سے خفیہ کوڈ یا پن نہیں مانگتا۔',
    timestamp: Date.now() - 3600000 * 24,
    isOffline: true,
  },
  {
    id: 'local-2',
    appContext: 'WhatsApp',
    userQuery: 'ویڈیو کال میں آواز نہیں آ رہی',
    language: 'ur',
    summary: 'واٹس ایپ ویڈیو کال میں مائیکروفون آن کرنا',
    steps: [
      { n: 1, text: 'سکرین پر ایک بار ٹیپ کریں تاکہ نیچے کے بٹن ظاہر ہوں۔', hint: 'سکرین کے خالی حصے پر دبائیں' },
      { n: 2, text: 'مائیکروفون کے نشان پر دبائیں جس پر لال لکیر بنی ہوئی ہے۔', hint: 'نیچے بائیں طرف' }
    ],
    warning: null,
    timestamp: Date.now() - 3600000 * 48,
    isOffline: true,
  }
];

export const offlineStorage = {
  getHelpSessions(): HelpSession[] {
    try {
      const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(initialHelpSessions));
        return initialHelpSessions;
      }
      return JSON.parse(raw);
    } catch {
      return initialHelpSessions;
    }
  },

  saveHelpSession(session: HelpSession) {
    const list = this.getHelpSessions();
    list.unshift(session);
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save help session to offline storage', e);
    }
  },

  getFraudChecks(): FraudCheckResult[] {
    try {
      const raw = localStorage.getItem(FRAUD_STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveFraudCheck(check: FraudCheckResult) {
    const list = this.getFraudChecks();
    // Prepend or update
    const existingIndex = list.findIndex(c => c.checkId === check.checkId);
    if (existingIndex >= 0) {
      list[existingIndex] = check;
    } else {
      list.unshift(check);
    }
    try {
      localStorage.setItem(FRAUD_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save fraud check to offline storage', e);
    }
  },

  getSettings(): UserSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) return defaultSettings;
      return { ...defaultSettings, ...JSON.parse(raw) };
    } catch {
      return defaultSettings;
    }
  },

  saveSettings(settings: Partial<UserSettings>): UserSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save settings', e);
    }
    return updated;
  },

  clearData() {
    localStorage.removeItem(SESSIONS_STORAGE_KEY);
    localStorage.removeItem(FRAUD_STORAGE_KEY);
  }
};
