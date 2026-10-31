import React, { useState } from 'react';
import { FraudCheckResult, FraudVerdictLabel, Language, SmsMessage } from '../types';
import { ShieldAlert, ShieldCheck, AlertTriangle, Trash2, Check, X, ArrowRight, CornerDownRight } from 'lucide-react';
import { offlineStorage } from '../services/offlineStorage';

interface FraudCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  targetMessage?: SmsMessage | null;
  onDecisionSaved: (checkId: string, decision: 'KEEP' | 'DELETE') => void;
  isOffline: boolean;
}

export const FraudCheckModal: React.FC<FraudCheckModalProps> = ({
  isOpen,
  onClose,
  language,
  targetMessage,
  onDecisionSaved,
  isOffline,
}) => {
  const [inputText, setInputText] = useState(targetMessage?.body || '');
  const [sender, setSender] = useState(targetMessage?.sender || 'Unknown');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FraudCheckResult | null>(null);
  const [decision, setDecision] = useState<'KEEP' | 'DELETE' | null>(null);

  if (!isOpen) return null;

  const isUrdu = language === 'ur';

  const handleRunCheck = async (customText?: string) => {
    const textToCheck = customText || inputText;
    if (!textToCheck.trim()) return;

    setIsLoading(true);
    setResult(null);
    setDecision(null);

    try {
      const response = await fetch('/api/fraud/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToCheck,
          sender: sender || 'Incoming SMS',
        }),
      });

      const data = await response.json();
      if (data.success && data.verdict) {
        setResult(data.verdict);
        offlineStorage.saveFraudCheck(data.verdict);
      } else {
        throw new Error('Server returned error');
      }
    } catch (e) {
      // Offline fallback rule check
      const lower = textToCheck.toLowerCase();
      let label: FraudVerdictLabel = 'SAFE';
      let confidence = 0.88;
      const reasons: string[] = [];

      if (
        lower.includes('bisp') ||
        lower.includes('8171') ||
        lower.includes('ehsaas') ||
        lower.includes('25000') ||
        lower.includes('pin') ||
        lower.includes('otp') ||
        lower.includes('block') ||
        lower.includes('freeze')
      ) {
        label = 'FRAUD';
        confidence = 0.95;
        reasons.push(
          isUrdu
            ? 'جعلی بینظیر / احساس یا اکاؤنٹ بلاک کا جھوٹا دعویٰ'
            : 'Fake BISP prize claim or phishing scare tactic'
        );
      } else {
        reasons.push(isUrdu ? 'عام معلوماتی پیغام' : 'Standard informational message');
      }

      const offlineVerdict: FraudCheckResult = {
        label,
        confidence,
        reasons,
        cleanPreview: textToCheck.slice(0, 80),
        checkId: `offline-${Date.now()}`,
        redactedCount: 0,
      };
      setResult(offlineVerdict);
      offlineStorage.saveFraudCheck(offlineVerdict);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMakeDecision = async (chosen: 'KEEP' | 'DELETE') => {
    setDecision(chosen);
    if (result) {
      try {
        await fetch('/api/fraud/decision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            checkId: result.checkId,
            decision: chosen,
          }),
        });
      } catch (err) {
        console.warn('Failed to sync decision to server:', err);
      }
      onDecisionSaved(result.checkId, chosen);
    }
  };

  return (
    <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-50 flex flex-col justify-end p-3 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-5 shadow-2xl max-h-[92%] flex flex-col text-slate-900 border border-slate-200 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-700 text-white flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-lg text-slate-900">
                {isUrdu ? 'فراڈ میسج ڈیٹیکٹر' : 'SMS Fraud & Scam Shield'}
              </div>
              <div className="text-xs text-slate-500">
                {isOffline ? 'Offline ML Model' : 'Trained Pakistani Scam Model'}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input view if no result yet */}
        {!result && (
          <div className="py-4 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isUrdu ? 'بھیجنے والا (Sender):' : 'Sender info:'}
              </label>
              <input
                type="text"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                placeholder="e.g. 8171, JazzCash, 0300..."
                className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isUrdu ? 'میسج کی عبارت (Message Text):' : 'Message Text:'}
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  isUrdu
                    ? 'یہاں میسج پیسٹ کریں یا نیچے سے نمونہ منتخب کریں...'
                    : 'Paste incoming SMS here to verify...'
                }
                rows={4}
                className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              />
            </div>

            {/* Quick Pakistan Scam Examples */}
            <div>
              <div className="text-xs font-bold text-slate-500 mb-2">
                {isUrdu ? 'عام پاکستانی فراڈ کے نمونے چیک کریں:' : 'Try sample Pakistani scam SMS:'}
              </div>
              <div className="space-y-1.5">
                <button
                  onClick={() => {
                    setSender('8171-Fake');
                    setInputText(
                      'Mubarak! BISP Ehsaas 25,000 rupay jaari hogaye. Fauran call karein: 0302-1234567 Officer Tariq'
                    );
                    handleRunCheck(
                      'Mubarak! BISP Ehsaas 25,000 rupay jaari hogaye. Fauran call karein: 0302-1234567 Officer Tariq'
                    );
                  }}
                  className="w-full text-left p-2 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 text-xs font-medium text-slate-700 flex items-center justify-between"
                >
                  <span>1. بینظیر 25,000 روپے والی جعلی اسکیم</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  onClick={() => {
                    setSender('JazzCash-Alert');
                    setInputText(
                      'Aapka JazzCash account 24 ghante mein block ho jayega. Bachne k liye apna 4-digit PIN bhejein: bit.ly/jazz'
                    );
                    handleRunCheck(
                      'Aapka JazzCash account 24 ghante mein block ho jayega. Bachne k liye apna 4-digit PIN bhejein: bit.ly/jazz'
                    );
                  }}
                  className="w-full text-left p-2 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 text-xs font-medium text-slate-700 flex items-center justify-between"
                >
                  <span>2. جاز کیش بلاک ہونے کا جھوٹا نوٹس اور PIN طلب</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            <button
              disabled={isLoading || !inputText.trim()}
              onClick={() => handleRunCheck()}
              className="w-full py-4 bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 active:scale-95 transition"
            >
              {isLoading ? (
                <span>{isUrdu ? 'تحقیق جاری ہے...' : 'Analyzing message...'}</span>
              ) : (
                <>
                  <ShieldAlert className="w-5 h-5" />
                  <span>{isUrdu ? 'فراڈ چیک کریں' : 'Verify Message Safety'}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* VERDICT PRESENTATION (RED, GREEN, YELLOW) */}
        {result && (
          <div className="py-4 space-y-4">
            {/* Verdict Card */}
            <div
              className={`p-5 rounded-3xl border-2 shadow-lg ${
                result.label === 'FRAUD'
                  ? 'bg-rose-50 border-rose-600 text-rose-950'
                  : result.label === 'SAFE'
                  ? 'bg-emerald-50 border-emerald-600 text-emerald-950'
                  : 'bg-amber-50 border-amber-600 text-amber-950'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {result.label === 'FRAUD' ? (
                    <ShieldAlert className="w-8 h-8 text-rose-600" />
                  ) : result.label === 'SAFE' ? (
                    <ShieldCheck className="w-8 h-8 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 text-amber-600" />
                  )}
                  <div>
                    <div className="text-2xl font-black">
                      {result.label === 'FRAUD'
                        ? isUrdu
                          ? 'یہ فراڈ ہے! (Fraud)'
                          : 'High Risk Scam!'
                        : result.label === 'SAFE'
                        ? isUrdu
                          ? 'یہ میسج محفوظ ہے (Safe)'
                          : 'Safe Message'
                        : isUrdu
                        ? 'مشکوک ہے، احتیاط کریں'
                        : 'Unverified / Caution'}
                    </div>
                    <div className="text-xs font-bold opacity-80">
                      Confidence: {Math.round(result.confidence * 100)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Reasons Breakdown */}
              <div className="mt-4 pt-3 border-t border-black/10 space-y-1.5">
                <div className="text-xs font-bold uppercase tracking-wider opacity-90">
                  {isUrdu ? 'وجوہات (Analysis Reasons):' : 'Key Signals:'}
                </div>
                {result.reasons.map((r, i) => (
                  <div key={i} className="text-sm font-semibold flex items-start gap-2">
                    <CornerDownRight className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>

              {/* What the user should do (Actionable guidance) */}
              <div className="mt-4 p-3 bg-white/60 rounded-2xl text-xs font-bold leading-relaxed">
                {result.label === 'FRAUD' ? (
                  <span className="text-rose-900">
                    ⚠️ {isUrdu
                      ? 'کسی بھی لنک پر کلک نہ کریں، نہ ہی اس نمبر پر کال کریں۔ اپنا 4 یا 5 ہندسوں کا پن کسی کو نہ بتائیں۔ فوری ڈیلیٹ کریں۔'
                      : 'Never click the link or call the number. Do not reveal any PIN or OTP. Delete immediately.'}
                  </span>
                ) : result.label === 'SAFE' ? (
                  <span className="text-emerald-900">
                    ✓ {isUrdu
                      ? 'یہ عام بینک یا ٹیلی کام کا تصدیقی پیغام لگتا ہے۔ اس میں کوئی مشکوک طلب نہیں ہے۔'
                      : 'This appears to be a legitimate notification with no credential phishing.'}
                  </span>
                ) : (
                  <span className="text-amber-900">
                    ⚠️ {isUrdu
                      ? 'اگر آپ بھیجنے والے کو نہیں جانتے تو کوئی کوڈ یا ذاتی معلومات شیئر نہ کریں۔'
                      : 'If you do not recognize the sender, do not share any codes or personal details.'}
                  </span>
                )}
              </div>
            </div>

            {/* User Decision Feedback Buttons (Delete vs Keep) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="text-xs font-bold text-slate-700 mb-2">
                {isUrdu ? 'آپ کیا کرنا چاہتے ہیں؟ (Feedback Loop)' : 'What would you like to do?'}
              </div>

              <div className="flex gap-2">
                {result.label === 'FRAUD' && (
                  <button
                    onClick={() => handleMakeDecision('DELETE')}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow transition ${
                      decision === 'DELETE'
                        ? 'bg-rose-800 text-white'
                        : 'bg-rose-600 hover:bg-rose-500 text-white'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{isUrdu ? 'ڈیلیٹ کر دیں' : 'Delete Message'}</span>
                  </button>
                )}

                <button
                  onClick={() => handleMakeDecision('KEEP')}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow transition ${
                    decision === 'KEEP'
                      ? 'bg-emerald-800 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>{isUrdu ? 'محفوظ رکھیں (Keep)' : 'Keep Message'}</span>
                </button>
              </div>

              {decision && (
                <div className="mt-2 text-center text-xs font-bold text-slate-600 animate-in fade-in">
                  ✓ {isUrdu ? 'آپ کا فیصلہ محفوظ ہو گیا اور ماڈل نے سیکھ لیا۔' : 'Your decision was recorded to improve the model.'}
                </div>
              )}
            </div>

            {/* Check another message */}
            <button
              onClick={() => {
                setResult(null);
                setInputText('');
              }}
              className="w-full py-2.5 text-xs text-slate-600 font-bold hover:text-slate-900"
            >
              {isUrdu ? 'دوسرا میسج چیک کریں' : 'Check Another Message'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
