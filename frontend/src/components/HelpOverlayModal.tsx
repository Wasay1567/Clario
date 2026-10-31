import React, { useState, useEffect } from 'react';
import { HelpGuidance, Language, StepItem } from '../types';
import { tts } from '../services/ttsService';
import { Mic, MicOff, Volume2, VolumeX, ArrowRight, ArrowLeft, RefreshCw, AlertTriangle, ShieldCheck, CheckCircle2, X } from 'lucide-react';
import { sampleVoiceQueries } from '../data/mockScreens';

interface HelpOverlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAppName: string;
  language: Language;
  onSaveSession: (query: string, guidance: HelpGuidance) => void;
  isOffline: boolean;
  prefilledQuery?: string;
}

export const HelpOverlayModal: React.FC<HelpOverlayModalProps> = ({
  isOpen,
  onClose,
  currentAppName,
  language,
  onSaveSession,
  isOffline,
  prefilledQuery = '',
}) => {
  const [stage, setStage] = useState<'input' | 'processing' | 'guidance'>('input');
  const [query, setQuery] = useState(prefilledQuery);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [guidance, setGuidance] = useState<HelpGuidance | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [redactedCount, setRedactedCount] = useState(0);
  const [isFollowUp, setIsFollowUp] = useState(false);

  useEffect(() => {
    if (prefilledQuery) {
      setQuery(prefilledQuery);
    }
  }, [prefilledQuery]);

  useEffect(() => {
    const unsub = tts.subscribe(setIsSpeaking);
    return () => unsub();
  }, []);

  // Voice recording timer simulation
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  if (!isOpen) return null;

  const isUrdu = language === 'ur';

  const handleStartRecording = () => {
    setIsRecording(true);
    setQuery('');
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // If empty, supply a natural spoken voice query for the current app
    if (!query) {
      if (currentAppName.toLowerCase().includes('jazzcash')) {
        setQuery('Mera JazzCash lock hogya hai, biometric mang raha hai');
      } else if (currentAppName.toLowerCase().includes('easypaisa')) {
        setQuery('Easypaisa se bank account mein paise kaise transfer karein?');
      } else if (currentAppName.toLowerCase().includes('whatsapp')) {
        setQuery('Video call mein awaz nahi aa rahi aur mic band hai');
      } else {
        setQuery('Is screen par aage kaise barhna hai?');
      }
    }
  };

  const handleSubmitForHelp = async (customQuery?: string) => {
    const activeQuery = customQuery || query || (isUrdu ? 'اس اسکرین پر رہنمائی چاہیے' : 'Need guidance on this screen');
    setQuery(activeQuery);
    setStage('processing');

    try {
      const response = await fetch('/api/help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appContext: currentAppName,
          userQuery: activeQuery,
          language,
          previousSteps: guidance ? guidance.steps.map((s) => s.text) : [],
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        setGuidance(resData.data);
        setRedactedCount(resData.redactedItems || 0);
        setCurrentStepIdx(0);
        setStage('guidance');
        onSaveSession(activeQuery, resData.data);

        // Auto read first step aloud
        const firstStep = resData.data.steps?.[0];
        if (firstStep) {
          const speakText = `${resData.data.summary}. پہلا مرحلہ: ${firstStep.text}`;
          tts.speak(speakText, language);
        }
      } else {
        throw new Error('API returned unsuccessful');
      }
    } catch (err) {
      console.warn('Backend call failed, generating offline guidance:', err);
      // Offline fallback guidance
      const fallback: HelpGuidance = {
        summary: isUrdu ? 'مددگار آف لائن گائیڈ' : 'Offline Guidance Guide',
        steps: [
          {
            n: 1,
            text: isUrdu
              ? 'سکرین پر سب سے واضح رنگین بٹن پر ٹیپ کریں۔'
              : 'Tap the most prominent primary action button on screen.',
            hint: isUrdu ? 'درمیان یا نیچے کی جانب' : 'Usually centered or near bottom',
          },
          {
            n: 2,
            text: isUrdu
              ? 'اگر تصدیق مانگے تو اپنا فنگر پرنٹ یا رجسٹرڈ نمبر چیک کریں۔'
              : 'Confirm with registered biometric fingerprint if prompted.',
            hint: isUrdu ? 'اپنا پن کسی کو مت بتائیں' : 'Never share your secret PIN',
          },
        ],
        warning: isUrdu ? 'اپنا OTP یا پاسورڈ کبھی کسی کو نہ بتائیں۔' : 'Never disclose your OTP or password.',
        needsMoreInfo: false,
      };
      setGuidance(fallback);
      setCurrentStepIdx(0);
      setStage('guidance');
      onSaveSession(activeQuery, fallback);
    }
  };

  const handleReadCurrentStep = () => {
    if (!guidance || !guidance.steps[currentStepIdx]) return;
    const current = guidance.steps[currentStepIdx];
    const text = isUrdu
      ? `مرحلہ نمبر ${current.n}: ${current.text}. اشارہ: ${current.hint}`
      : `Step ${current.n}: ${current.text}. Hint: ${current.hint}`;
    tts.speak(text, language);
  };

  const handleStuckHere = () => {
    setIsFollowUp(true);
    setStage('input');
    setQuery(isUrdu ? 'میں اس مرحلے پر پھنس گیا ہوں، مزید آسان کر کے بتائیں' : "I am stuck at this step, please clarify further");
  };

  const currentStep: StepItem | undefined = guidance?.steps?.[currentStepIdx];

  return (
    <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-50 flex flex-col justify-end p-3 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-5 shadow-2xl max-h-[92%] flex flex-col text-slate-900 border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold text-lg">
              م
            </div>
            <div>
              <div className="font-bold text-lg text-slate-900">
                {isUrdu ? 'مددگار اسکرین گائیڈ' : 'Madadgar Screen Guide'}
              </div>
              <div className="text-xs text-slate-500">
                {currentAppName} • {isOffline ? 'Offline Mode' : 'Gemini Multimodal AI'}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              tts.stop();
              onClose();
            }}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STAGE 1: VOICE INPUT & SCREEN CONFIRMATION */}
        {stage === 'input' && (
          <div className="py-4 space-y-4 overflow-y-auto">
            {/* Screen snapshot capture indicator with privacy shield */}
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-between text-xs text-teal-900">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0" />
                <div>
                  <span className="font-bold block">
                    {isUrdu ? 'اسکرین شاٹ محفوظ طریقے سے حاصل کیا گیا' : 'One-time screen captured safely'}
                  </span>
                  <span className="text-[11px] text-teal-800">
                    {isUrdu ? 'حساس ڈیٹا (CNIC، کوڈز) خود بخود چھپا دیا جاتا ہے' : 'Privacy filter masks CNIC & PIN codes'}
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-teal-700 text-white rounded font-bold text-[10px]">Active</span>
            </div>

            {/* Giant Microphone Recording Area */}
            <div className="flex flex-col items-center justify-center py-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="relative mb-3">
                {isRecording && <div className="absolute inset-0 rounded-full bg-red-400/40 animate-ping"></div>}
                <button
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all ${
                    isRecording
                      ? 'bg-red-600 text-white scale-105'
                      : 'bg-teal-700 hover:bg-teal-600 text-white active:scale-95'
                  }`}
                >
                  {isRecording ? <MicOff className="w-9 h-9" /> : <Mic className="w-9 h-9" />}
                </button>
              </div>

              <div className="text-center">
                <div className="text-lg font-bold text-slate-800">
                  {isRecording
                    ? (isUrdu ? `بولیں... (${recordingSeconds}s)` : `Listening... (${recordingSeconds}s)`)
                    : (isUrdu ? 'مائیک دبا کر اپنا مسئلہ بتائیں' : 'Tap mic and speak your problem')}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {isUrdu ? 'اردو یا انگریزی میں بولیں' : 'Urdu, Roman Urdu, or English'}
                </div>
              </div>
            </div>

            {/* Query Input & Edit Box */}
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">
                {isUrdu ? 'آپ کا سوال / مسئلہ:' : 'Your spoken problem:'}
              </label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isUrdu ? 'مثلاً: جاز کیش لاک ہو گیا ہے یا پیسے کیسے بھیجوں...' : 'e.g., How do I send money or unlock account...'}
                rows={2}
                className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
              />
            </div>

            {/* Quick suggested chips for common problems */}
            <div>
              <div className="text-xs font-bold text-slate-500 mb-2">
                {isUrdu ? 'یا فوری منتخب کریں:' : 'Or tap a common question:'}
              </div>
              <div className="flex flex-wrap gap-2">
                {(sampleVoiceQueries[currentAppName.toLowerCase() as keyof typeof sampleVoiceQueries] || sampleVoiceQueries.general).map(
                  (q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSubmitForHelp(q.text)}
                      className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-teal-100 text-slate-800 hover:text-teal-900 border border-slate-200 text-xs font-semibold transition"
                    >
                      {q.label}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Submit Action */}
            <button
              onClick={() => handleSubmitForHelp()}
              className="w-full py-4 bg-teal-700 hover:bg-teal-600 active:scale-[0.98] text-white rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition"
            >
              <span>{isUrdu ? 'رہنمائی حاصل کریں' : 'Get Step-by-Step Guidance'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* STAGE 2: PROCESSING (ANALYZING SCREEN + QUERY) */}
        {stage === 'processing' && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-teal-200 border-t-teal-700 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-teal-800 font-black text-xl">
                م
              </div>
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">
                {isUrdu ? 'اسکرین کا جائزہ لیا جا رہا ہے...' : 'Analyzing screen & voice...'}
              </div>
              <div className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                {isUrdu ? 'پرائیویسی فلٹر چالو ہے۔ سادہ الفاظ میں رہنمائی تیار ہو رہی ہے' : 'Applying privacy filter and preparing simple large-text steps'}
              </div>
            </div>
          </div>
        )}

        {/* STAGE 3: STEP-BY-STEP GUIDANCE (One step at a time, TTS read aloud) */}
        {stage === 'guidance' && guidance && (
          <div className="py-3 flex flex-col flex-1 justify-between overflow-y-auto">
            {/* Encouraging Summary Header */}
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl mb-3">
              <div className="text-xs font-bold text-teal-800 uppercase tracking-wide">
                {isUrdu ? 'مقصد (Summary)' : 'Task Summary'}
              </div>
              <div className="text-base font-bold text-teal-950 mt-0.5">
                {guidance.summary}
              </div>
            </div>

            {/* Current Step Card (Accessible 20sp+ font, high contrast) */}
            {currentStep && (
              <div className="bg-slate-50 border-2 border-teal-600 rounded-3xl p-5 shadow-md space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-teal-700 text-white font-extrabold flex items-center justify-center text-base">
                      {currentStep.n}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {isUrdu ? `مرحلہ ${currentStepIdx + 1} از ${guidance.steps.length}` : `Step ${currentStepIdx + 1} of ${guidance.steps.length}`}
                    </span>
                  </div>

                  {/* Audio Read-Aloud Button */}
                  <button
                    onClick={handleReadCurrentStep}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition shadow ${
                      isSpeaking ? 'bg-teal-700 text-white animate-pulse' : 'bg-white text-teal-700 border border-teal-300'
                    }`}
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>{isSpeaking ? (isUrdu ? 'آواز جاری ہے...' : 'Playing...') : (isUrdu ? 'سنیں (TTS)' : 'Listen')}</span>
                  </button>
                </div>

                {/* Step Main Text (20sp+ text for elders) */}
                <div className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug font-urdu">
                  {currentStep.text}
                </div>

                {/* Helpful Visual Cue */}
                {currentStep.hint && (
                  <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                    <span className="font-bold">اشارہ (Hint):</span>
                    <span>{currentStep.hint}</span>
                  </div>
                )}
              </div>
            )}

            {/* Warning if any */}
            {guidance.warning && (
              <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold">{guidance.warning}</span>
              </div>
            )}

            {/* Navigation & Follow-up Actions */}
            <div className="mt-4 pt-3 border-t border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                {currentStepIdx > 0 && (
                  <button
                    onClick={() => {
                      setCurrentStepIdx(currentStepIdx - 1);
                      tts.stop();
                    }}
                    className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold flex items-center justify-center transition"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}

                {currentStepIdx < guidance.steps.length - 1 ? (
                  <button
                    onClick={() => {
                      const nextIdx = currentStepIdx + 1;
                      setCurrentStepIdx(nextIdx);
                      const nextStep = guidance.steps[nextIdx];
                      if (nextStep) {
                        tts.speak(`مرحلہ نمبر ${nextStep.n}: ${nextStep.text}`, language);
                      }
                    }}
                    className="flex-1 py-4 bg-teal-700 hover:bg-teal-600 text-white rounded-2xl font-black text-lg shadow-lg flex items-center justify-center gap-2 active:scale-95 transition"
                  >
                    <span>{isUrdu ? 'اگلا مرحلہ (Next Step)' : 'Next Step'}</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      tts.stop();
                      onClose();
                    }}
                    className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-lg shadow-lg flex items-center justify-center gap-2 active:scale-95 transition"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{isUrdu ? 'مکمل ہو گیا! (Task Complete)' : 'Done!'}</span>
                  </button>
                )}
              </div>

              {/* Follow-up help button: "Main yahan phans gaya" */}
              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  onClick={handleStuckHere}
                  className="text-amber-800 hover:text-amber-900 font-bold underline flex items-center gap-1"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isUrdu ? 'میں یہاں پھنس گیا ہوں (Help for this step)' : "I'm stuck at this step"}</span>
                </button>

                <button
                  onClick={handleReadCurrentStep}
                  className="text-teal-700 hover:text-teal-800 font-bold flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{isUrdu ? 'دوبارہ سنیں' : 'Repeat'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
