export type Language = 'ur' | 'ur-roman' | 'en';

export interface StepItem {
  n: number;
  text: string;
  hint: string;
}

export interface HelpGuidance {
  summary: string;
  steps: StepItem[];
  warning: string | null;
  needsMoreInfo: boolean;
}

export interface HelpSession {
  id: string;
  appContext: string;
  userQuery: string;
  language: Language;
  summary: string;
  steps: StepItem[];
  warning: string | null;
  timestamp: number;
  isOffline?: boolean;
}

export type FraudVerdictLabel = 'FRAUD' | 'SAFE' | 'NOT_SURE';

export interface FraudCheckResult {
  label: FraudVerdictLabel;
  confidence: number;
  reasons: string[];
  cleanPreview: string;
  checkId: string;
  redactedCount: number;
}

export interface SmsMessage {
  id: string;
  sender: string;
  time: string;
  body: string;
  isScam: boolean;
  verdict?: FraudVerdictLabel;
  userDecision?: 'KEEP' | 'DELETE';
}

export type ScreenAppType = 'Clario' | 'jazzcash' | 'easypaisa' | 'whatsapp' | 'messages';
