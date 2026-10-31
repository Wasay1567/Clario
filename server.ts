import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));

// Server-side Gemini initialization with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Privacy filter to redact CNIC, OTPs, phone numbers, and card numbers
function redactSensitiveData(text: string): { cleanedText: string; redactedCount: number } {
  let count = 0;
  // CNIC pattern (e.g. 42201-1234567-1 or 4220112345671)
  const cnicRegex = /\b\d{5}[-\s]?\d{7}[-\s]?\d\b/g;
  // Pakistani Phone numbers (+92300..., 0300...)
  const phoneRegex = /\b(\+92|0092|0)?3[0-9]{2}[-\s]?[0-9]{7}\b/g;
  // 4-6 digit OTP or PIN sequences preceded or followed by otp/pin/code/password
  const otpRegex = /\b(?:otp|pin|code|password|passcode|secret)[\s:=#\-]*([0-9]{4,6})\b/gi;
  // Credit/Debit card numbers (16 digits)
  const cardRegex = /\b(?:\d{4}[-\s]?){3}\d{4}\b/g;

  let cleaned = text;

  cleaned = cleaned.replace(cnicRegex, () => {
    count++;
    return '[CNIC_REDACTED]';
  });

  cleaned = cleaned.replace(cardRegex, () => {
    count++;
    return '[CARD_REDACTED]';
  });

  cleaned = cleaned.replace(otpRegex, (_match, p1) => {
    count++;
    return `[CODE_REDACTED_****]`;
  });

  cleaned = cleaned.replace(phoneRegex, () => {
    count++;
    return '[PHONE_REDACTED]';
  });

  return { cleanedText: cleaned, redactedCount: count };
}

// In-memory persistent stores (simulating cloud backend for Android Room sync)
interface HelpSessionRecord {
  id: string;
  appContext: string;
  userQuery: string;
  language: string;
  summary: string;
  steps: Array<{ n: number; text: string; hint: string }>;
  warning: string | null;
  timestamp: number;
}

interface MessageCheckRecord {
  id: string;
  sender: string;
  textHash: string;
  redactedPreview: string;
  label: 'FRAUD' | 'SAFE' | 'NOT_SURE';
  confidence: number;
  reasons: string[];
  userDecision?: 'KEEP' | 'DELETE';
  timestamp: number;
}

const helpSessionsDb: HelpSessionRecord[] = [
  {
    id: 'hs-1',
    appContext: 'JazzCash',
    userQuery: 'Mera JazzCash account lock hogya hai',
    language: 'ur',
    summary: 'JazzCash account unblock karne ki madad',
    steps: [
      { n: 1, text: 'Screen par "Help & Support" par tap karein.', hint: 'Yeh aam tor par ooper daayein kone mein hota hai.' },
      { n: 2, text: 'Biometric verification par click karke apna angootha scan karein.', hint: 'Kamray mein roshni achi honi chahiye.' }
    ],
    warning: 'Apna 4-digit PIN kisi ko na batayein.',
    timestamp: Date.now() - 86400000 * 2,
  }
];

const messageChecksDb: MessageCheckRecord[] = [
  {
    id: 'msg-1',
    sender: '8171-Fake',
    textHash: 'hash-8171',
    redactedPreview: 'Mubarak! BISP Ehsaas 25,000 rupay jaari hogaye. Fauran call karein...',
    label: 'FRAUD',
    confidence: 0.96,
    reasons: ['Fake BISP aid prize claim', 'Urgent call-to-action to unofficial number', 'Asks for banking info'],
    userDecision: 'DELETE',
    timestamp: Date.now() - 3600000 * 5,
  },
  {
    id: 'msg-2',
    sender: 'Bank-Alfalah',
    textHash: 'hash-alfa',
    redactedPreview: 'Dear Customer, PKR 1,500 debited from your account via ATM withdrawal on [DATE].',
    label: 'SAFE',
    confidence: 0.95,
    reasons: ['Official bank format', 'Informational transaction receipt', 'No suspicious links or PIN requests'],
    userDecision: 'KEEP',
    timestamp: Date.now() - 86400000,
  }
];

// POST /api/help - Multimodal Screen + Voice analysis
app.post('/api/help', async (req, res) => {
  try {
    const { screenDataUrl, userQuery, language = 'ur', appContext = 'General App', previousSteps = [] } = req.body;

    const { cleanedText: sanitizedQuery, redactedCount } = redactSensitiveData(userQuery || '');

    // System prompt tailored for elderly Pakistani users in Urdu/English
    const prompt = `
You are "Clario" (مددگار), a patient, warm, and loving digital assistant helping an elderly Pakistani parent/grandparent (age 55+) navigate an Android phone.
User's Language: ${language} (ur = Urdu script, ur-roman = Roman Urdu, en = English).
Current App: ${appContext}.
User's Spoken Query/Problem: "${sanitizedQuery}".
Previous Steps Given (if any follow-up): ${JSON.stringify(previousSteps)}.

Your instructions:
1. Explain in simple, respectful everyday words (like a polite grandchild).
2. Look at what is on the screen or describe the most direct path. Mention button colors, positions ("screen ke neeche hare rang ka button", "ooper daayein kone mein"), and clear text labels.
3. Provide at most 4 short numbered steps. Each step must contain ONE clear action.
4. If language is 'ur', write in clean Urdu. If 'ur-roman', write in friendly Roman Urdu. If 'en', write in very simple plain English.
5. NEVER ask for or repeat passwords, PINs, OTPs, or card numbers. If there is a risk, add a safety warning ("Apna PIN kisi ko na batayein").
6. If the screen looks like a scam or fake app, warn the user immediately.

Return JSON in this exact structure:
{
  "summary": "Short encouraging summary (e.g. 'Aap JazzCash se paise bhejna chahte hain')",
  "steps": [
    { "n": 1, "text": "Step instruction", "hint": "Helpful visual cue (e.g. color or location)" }
  ],
  "warning": "Optional safety note or null",
  "needsMoreInfo": false
}
`;

    let generatedGuidance: {
      summary: string;
      steps: Array<{ n: number; text: string; hint: string }>;
      warning: string | null;
      needsMoreInfo: boolean;
    };

    if (process.env.GEMINI_API_KEY) {
      try {
        const parts: any[] = [];
        if (screenDataUrl && typeof screenDataUrl === 'string' && screenDataUrl.includes('data:image')) {
          const match = screenDataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
          if (match) {
            parts.push({
              inlineData: {
                mimeType: `image/${match[1]}`,
                data: match[2],
              },
            });
          }
        }
        parts.push({ text: prompt });

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: parts.length > 1 ? { parts } : parts[0].text,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                steps: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      n: { type: Type.INTEGER },
                      text: { type: Type.STRING },
                      hint: { type: Type.STRING },
                    },
                  },
                },
                warning: { type: Type.STRING },
                needsMoreInfo: { type: Type.BOOLEAN },
              },
            },
          },
        });

        const textOutput = response.text || '{}';
        generatedGuidance = JSON.parse(textOutput);
      } catch (geminiErr) {
        console.warn('Gemini API call fallback to heuristic generation:', geminiErr);
        generatedGuidance = getHeuristicGuidance(appContext, sanitizedQuery, language);
      }
    } else {
      generatedGuidance = getHeuristicGuidance(appContext, sanitizedQuery, language);
    }

    const sessionRecord: HelpSessionRecord = {
      id: `hs-${Date.now()}`,
      appContext,
      userQuery: sanitizedQuery,
      language,
      summary: generatedGuidance.summary,
      steps: generatedGuidance.steps,
      warning: generatedGuidance.warning,
      timestamp: Date.now(),
    };
    helpSessionsDb.unshift(sessionRecord);

    res.json({
      success: true,
      data: generatedGuidance,
      sessionId: sessionRecord.id,
      redactedItems: redactedCount,
    });
  } catch (error: any) {
    console.error('Help API error:', error);
    res.status(500).json({ success: false, error: error.message || 'Error processing help request' });
  }
});

// Heuristic fallback guidance for offline / unkeyed operation
function getHeuristicGuidance(appContext: string, query: string, lang: string) {
  const isUrdu = lang === 'ur';
  const isRoman = lang === 'ur-roman';

  if (appContext.toLowerCase().includes('jazzcash')) {
    if (isUrdu) {
      return {
        summary: 'JazzCash میں مدد: ہم آپ کی رہنمائی کر رہے ہیں',
        steps: [
          { n: 1, text: 'اسکرین پر نیچے لال رنگ کے "Send Money" بٹن پر انگلی رکھیں۔', hint: 'یہ درمیان میں گول آئیکون ہے' },
          { n: 2, text: 'جس کو پیسے بھیجنے ہیں اس کا موبائل نمبر درج کریں۔', hint: 'پہلے سے محفوظ رابطہ منتخب کر سکتے ہیں' },
          { n: 3, text: 'رقم لکھیں اور آگے بڑھنے کے لیے "Next" دبائیں۔', hint: 'رقم دوبارہ چیک کر لیں' },
          { n: 4, text: 'اپنا 4 ہندسوں والا خفیہ PIN درج کریں، کسی کو مت بتائیں۔', hint: 'یہ صرف آپ کے علم میں ہونا چاہیے' }
        ],
        warning: 'یاد رکھیں: JazzCash کا عملہ کبھی آپ سے فون پر OTP یا PIN نہیں مانگتا۔',
        needsMoreInfo: false
      };
    } else if (isRoman) {
      return {
        summary: 'JazzCash mein madad: Aasan tareeqa',
        steps: [
          { n: 1, text: 'Screen par lal rang ke "Send Money" button par tap karein.', hint: 'Yeh darmiyan mein gol icon hai' },
          { n: 2, text: 'Recevier ka mobile number ya CNIC likhein.', hint: 'Number bilkul theek hona chahiye' },
          { n: 3, text: 'Raqam likhein aur "Next" dabayein.', hint: 'Raqam dobara tasdeeq karein' },
          { n: 4, text: 'Apna 4-digit PIN enter karein, kisi ko mat batayein.', hint: 'Khatam hone par receipt screen par ayegi' }
        ],
        warning: 'Hoshiyaar: Apna 4-digit PIN kisi bhi call ya message par share na karein.',
        needsMoreInfo: false
      };
    } else {
      return {
        summary: 'JazzCash Assistance: Step-by-step transfer guide',
        steps: [
          { n: 1, text: 'Tap the prominent red "Send Money" icon in the center.', hint: 'Main screen quick actions' },
          { n: 2, text: 'Enter the receiver mobile phone number carefully.', hint: 'Check the recipient name' },
          { n: 3, text: 'Type the amount in PKR and tap Continue.', hint: 'Verify before final step' },
          { n: 4, text: 'Enter your 4-digit secret MPIN on the secure keypad.', hint: 'Never share this with callers' }
        ],
        warning: 'JazzCash representatives will never ask for your secret MPIN or OTP.',
        needsMoreInfo: false
      };
    }
  } else if (appContext.toLowerCase().includes('easypaisa')) {
    if (isUrdu) {
      return {
        summary: 'Easypaisa میں آسانی سے رقم بھیجنے کا طریقہ',
        steps: [
          { n: 1, text: 'اوپر ہرے رنگ کے "Easyload & Money Transfer" پر دبائیں۔', hint: 'سب سے اوپر والی قطار میں ہے' },
          { n: 2, text: '"Easypaisa Transfer" یا "Bank Transfer" منتخب کریں۔', hint: 'دوسرے نمبر والا آپشن' },
          { n: 3, text: 'وصول کنندہ کا نمبر لکھیں اور رقم درج کریں۔', hint: 'نام چیک کر لیں تاکہ غلطی نہ ہو' },
          { n: 4, text: 'سبز بٹن "Send Now" دبا کر تصدیق کریں۔', hint: 'تصدیقی میسج سکرین پر نظر آئے گا' }
        ],
        warning: 'اپنا پاسورڈ یا او ٹی پی کسی کے ساتھ شیئر مت کریں۔',
        needsMoreInfo: false
      };
    } else {
      return {
        summary: 'Easypaisa Money Transfer steps',
        steps: [
          { n: 1, text: 'Tap the green "Money Transfer" option at the top.', hint: 'First icon from left' },
          { n: 2, text: 'Select "Easypaisa Account" or "Bank Transfer".', hint: 'Choose where to send' },
          { n: 3, text: 'Enter the phone number and required amount.', hint: 'Confirm the displayed owner name' },
          { n: 4, text: 'Tap the green "Send Now" button to complete.', hint: 'You will receive an SMS receipt' }
        ],
        warning: 'Never share your 5-digit Easypaisa secret PIN with anyone.',
        needsMoreInfo: false
      };
    }
  } else if (appContext.toLowerCase().includes('whatsapp')) {
    if (isUrdu) {
      return {
        summary: 'واٹس ایپ ویڈیو کال میں دوبارہ شامل ہونے کا طریقہ',
        steps: [
          { n: 1, text: 'اسکرین پر اوپر کال ریکوری یا "Rejoin" بٹن پر دبائیں۔', hint: 'سبز رنگ کا ویڈیو کیمرہ آئیکون ہے' },
          { n: 2, text: 'اگر انٹرنیٹ بند ہے تو اوپر سے انگلی نیچے کھینچ کر Wi-Fi چیک کریں۔', hint: 'نوٹیفکیشن پینل کھولیں' },
          { n: 3, text: 'کال میں مائیکروفون کا نشان دیکھیں، اس پر سرخ لکیر نہ ہو۔', hint: 'اگر لکیر ہے تو ایک بار دبائیں تاکہ آواز جائے' }
        ],
        warning: null,
        needsMoreInfo: false
      };
    } else {
      return {
        summary: 'WhatsApp Call Reconnection',
        steps: [
          { n: 1, text: 'Tap the green "Rejoin" button on screen or contact profile.', hint: 'Video camera icon' },
          { n: 2, text: 'Swipe down from top of screen to confirm Wi-Fi or Mobile Data is ON.', hint: 'Check connectivity signal' },
          { n: 3, text: 'Ensure the microphone icon has no red slash across it.', hint: 'Tap mic once to unmute if muted' }
        ],
        warning: null,
        needsMoreInfo: false
      };
    }
  } else {
    // General smartphone navigation
    if (isUrdu) {
      return {
        summary: 'مددگار گائیڈ: کوئی بات نہیں، ہم ساتھ حل کرتے ہیں',
        steps: [
          { n: 1, text: 'اسکرین پر سب سے بڑا نیلا یا سبز بٹن تلاش کریں اور دبائیں۔', hint: 'عموماً نیچے دائیں جانب ہوتا ہے' },
          { n: 2, text: 'اگر کوئی پاپ اپ آئے تو "Allow" یا "جاری رکھیں" پر ٹیپ کریں۔', hint: 'صرف قابل اعتماد ایپس کے لیے' },
          { n: 3, text: 'اگر پھنس جائیں تو نیچے گول بٹن دبا کر ہوم اسکرین پر آ جائیں۔', hint: 'درمیان والا بٹن' }
        ],
        warning: 'کسی بھی نامعلوم شخص کو اپنے فون کا کنٹرول یا کوڈ نہ دیں۔',
        needsMoreInfo: false
      };
    } else {
      return {
        summary: 'Screen Assistance Guide',
        steps: [
          { n: 1, text: 'Tap the main primary button visible on the lower section of your screen.', hint: 'Usually blue or green' },
          { n: 2, text: 'If a confirmation dialog appears, tap Allow or Continue.', hint: 'Check that you trust the app' },
          { n: 3, text: 'If stuck, tap the Clario bubble again for immediate next guidance.', hint: 'We are here to assist' }
        ],
        warning: 'Keep your personal codes and passwords strictly private.',
        needsMoreInfo: false
      };
    }
  }
}

// POST /api/fraud/check - Fraud SMS Classifier (Rules + Pakistani Context ML heuristic)
app.post('/api/fraud/check', (req, res) => {
  try {
    const { text, sender = 'Unknown' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const { cleanedText, redactedCount } = redactSensitiveData(text);
    const lower = text.toLowerCase();
    const lowerCleaned = cleanedText.toLowerCase();

    // Pakistan-specific Fraud heuristics
    const fraudSignals: string[] = [];
    let fraudScore = 0;

    // Check 1: Fake BISP / Ehsaas / 8171 / Prize
    if (
      lower.includes('bisp') ||
      lower.includes('ehsaas') ||
      lower.includes('8171') ||
      lower.includes('benazir') ||
      lower.includes('25000') ||
      lower.includes('35000') ||
      lower.includes('inami') ||
      lower.includes('lottery') ||
      lower.includes('jeeto pakistan') ||
      lower.includes('mubarak') && (lower.includes('razaq') || lower.includes('inami') || lower.includes('claim'))
    ) {
      if (!sender.toLowerCase().includes('8171') || lower.includes('call') || lower.includes('whatsapp') || lower.includes('03')) {
        fraudSignals.push('جعلی بینظیر / احساس پروگرام یا انعامی رقم کا جھوٹا دعویٰ (Fake BISP / Prize scam)');
        fraudScore += 0.55;
      }
    }

    // Check 2: Fake account block / freeze & requests for PIN/OTP
    if (
      (lower.includes('block') || lower.includes('freeze') || lower.includes('suspend') || lower.includes('band ho jaega') || lower.includes('lock')) &&
      (lower.includes('jazzcash') || lower.includes('easypaisa') || lower.includes('hbl') || lower.includes('bank') || lower.includes('account'))
    ) {
      fraudSignals.push('اکاؤنٹ بند ہونے کا خوف دلا کر خفیہ معلومات چرانے کی کوشش (Account block phishing scare)');
      fraudScore += 0.45;
    }

    // Check 3: Asking for PIN, password, OTP, biometric, CNIC
    if (
      lower.includes('pin') ||
      lower.includes('otp') ||
      lower.includes('password') ||
      lower.includes('4-digit') ||
      lower.includes('passcode') ||
      lower.includes('code share') ||
      lower.includes('bhejein') && lower.includes('code')
    ) {
      fraudSignals.push('خفیہ PIN یا OTP کوڈ طلب کیا گیا ہے جو صرف ہیکرز مانگتے ہیں (Suspicious request for secret PIN/OTP)');
      fraudScore += 0.5;
    }

    // Check 4: Suspicious unofficial links (bit.ly, .xyz, tinyurl, raw IP, non-bank domains)
    if (
      lower.includes('http://') ||
      lower.includes('https://') ||
      lower.includes('.xyz') ||
      lower.includes('bit.ly') ||
      lower.includes('tinyurl') ||
      lower.includes('is.gd') ||
      lower.includes('apk') ||
      lower.includes('download')
    ) {
      fraudSignals.push('غیر محفوظ اور مشکوک لنک موجود ہے (Unverified external web link)');
      fraudScore += 0.35;
    }

    // Check 5: Asking to call an unofficial local cellphone number (0300..., 0345...)
    if (/\b03[0-9]{2}[-\s]?[0-9]{7}\b/.test(text) && (lower.includes('call') || lower.includes('rabta') || lower.includes('whatsapp'))) {
      fraudSignals.push('سرکاری محکمے کے بجائے عام موبائل نمبر پر کال کرنے کا کہا گیا ہے (Requests calling personal 03xx phone number)');
      fraudScore += 0.35;
    }

    // Check 6: Courier / Customs parcel scam
    if ((lower.includes('pakistan post') || lower.includes('parcel') || lower.includes('delivery')) && (lower.includes('fee') || lower.includes('link') || lower.includes('update address'))) {
      fraudSignals.push('جعلی پارسل ڈیلیوری یا کسٹمز فیس کا دھوکہ (Fake courier/parcel delivery link)');
      fraudScore += 0.4;
    }

    // Genuine bank / telecom signals
    let safeScore = 0;
    const safeSenders = ['jazzcash', 'easypaisa', 'bankalfalah', 'hbl', 'ubl', 'meezan', 'telenor', 'jazz', 'zong', 'ufone', 'ptcl'];
    const isVerifiedSender = safeSenders.some(s => sender.toLowerCase().includes(s));
    
    if (isVerifiedSender && !lower.includes('pin') && !lower.includes('call 03') && !lower.includes('lottery')) {
      safeScore += 0.6;
    }
    if ((lower.includes('debited') || lower.includes('credited') || lower.includes('balance') || lower.includes('recharge')) && !lower.includes('click')) {
      safeScore += 0.35;
    }

    // Final verdict calculation
    let label: 'FRAUD' | 'SAFE' | 'NOT_SURE' = 'SAFE';
    let confidence = 0.85;

    if (fraudScore >= 0.5) {
      label = 'FRAUD';
      confidence = Math.min(0.99, 0.70 + fraudScore * 0.25);
    } else if (fraudScore >= 0.25 || (fraudScore > 0 && safeScore > 0)) {
      label = 'NOT_SURE';
      confidence = 0.65;
      if (fraudSignals.length === 0) {
        fraudSignals.push('اس میسج میں کچھ غیر معمولی علامات ہیں، احتیاط برتیں (Unusual formatting, proceed with caution)');
      }
    } else {
      label = 'SAFE';
      confidence = Math.min(0.98, 0.75 + safeScore * 0.2);
    }

    const checkRecord: MessageCheckRecord = {
      id: `msg-${Date.now()}`,
      sender,
      textHash: `h-${text.length}-${Math.abs(text.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0))}`,
      redactedPreview: cleanedText.length > 90 ? cleanedText.slice(0, 90) + '...' : cleanedText,
      label,
      confidence: Number(confidence.toFixed(2)),
      reasons: fraudSignals.length > 0 ? fraudSignals : ['عام معلوماتی پیغام، کوئی مشکوک ربط یا PIN کی طلب نہیں ہے'],
      timestamp: Date.now(),
    };

    messageChecksDb.unshift(checkRecord);

    res.json({
      success: true,
      verdict: {
        label,
        confidence: checkRecord.confidence,
        reasons: checkRecord.reasons,
        cleanPreview: checkRecord.redactedPreview,
        checkId: checkRecord.id,
        redactedCount,
      },
    });
  } catch (err: any) {
    console.error('Fraud check error:', err);
    res.status(500).json({ success: false, error: err.message || 'Error checking message' });
  }
});

// POST /api/fraud/decision - User feedback loop (Delete/Keep)
app.post('/api/fraud/decision', (req, res) => {
  const { checkId, decision } = req.body;
  const record = messageChecksDb.find(m => m.id === checkId);
  if (record) {
    record.userDecision = decision;
  }
  res.json({ success: true, savedDecision: decision });
});

// GET /api/help/history
app.get('/api/help/history', (_req, res) => {
  res.json({ success: true, data: helpSessionsDb });
});

// GET /api/fraud/history
app.get('/api/fraud/history', (_req, res) => {
  res.json({ success: true, data: messageChecksDb });
});

// Family Guardian summary (counts & assisted tasks, no private text)
app.get('/api/family/summary', (_req, res) => {
  const fraudBlockedCount = messageChecksDb.filter(m => m.label === 'FRAUD').length;
  const totalAssistedTasks = helpSessionsDb.length;
  const recentCategories = Array.from(new Set(helpSessionsDb.map(h => h.appContext)));
  res.json({
    success: true,
    data: {
      parentName: 'والد محترم (Elder Parent)',
      linkedFamilyMember: 'بیٹا / بیٹی (Family Guardian)',
      fraudBlockedCount,
      totalAssistedTasks,
      recentCategories,
      lastActive: helpSessionsDb[0]?.timestamp || Date.now(),
      status: 'Active & Protected',
    },
  });
});

// Mount Vite or serve static
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Clario server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
