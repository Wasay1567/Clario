import React from 'react';
import { Language, HelpSession, FraudCheckResult } from '../../types';
import { Mic, ShieldAlert, History, Users, Sparkles, Volume2, CheckCircle2, ChevronRight, Lock, Database } from 'lucide-react';

interface ClarioHomeAppProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onStartHelp: () => void;
  onStartFraudCheck: () => void;
  onOpenHistory: () => void;
  onOpenFamily: () => void;
  isBubbleActive: boolean;
  onToggleBubble: () => void;
  isOffline: boolean;
  helpSessionsCount: number;
  fraudBlockedCount: number;
}

export const ClarioHomeApp: React.FC<ClarioHomeAppProps> = ({
  language,
  onLanguageChange,
  onStartHelp,
  onStartFraudCheck,
  onOpenHistory,
  onOpenFamily,
  isBubbleActive,
  onToggleBubble,
  isOffline,
  helpSessionsCount,
  fraudBlockedCount,
}) => {
  const isUrdu = language === 'ur';

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] text-slate-900 overflow-y-auto select-none">
      {/* Top App Bar (Material 3 TopAppBar) */}
      <div className="p-5 bg-teal-800 text-white shadow-md rounded-b-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-500/30 border border-teal-300/40 flex items-center justify-center font-black text-2xl text-teal-100 shadow-inner">
              م
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight leading-none">
                {isUrdu ? 'مددگار (Clario)' : 'Clario Screen Companion'}
              </h1>
              <p className="text-xs text-teal-200 mt-1">
                {isUrdu ? 'بزرگوں کا ڈیجیٹل محافظ اور رہبر' : 'Material 3 Digital Screen Assistant'}
              </p>
            </div>
          </div>

          {/* Bilingual Switcher */}
          <button
            onClick={() => onLanguageChange(isUrdu ? 'en' : 'ur')}
            className="px-3.5 py-1.5 bg-teal-900/80 hover:bg-teal-900 border border-teal-400/40 rounded-full text-xs font-bold text-teal-100 shadow transition"
          >
            {isUrdu ? 'English' : 'اردو'}
          </button>
        </div>

        {/* Status Indicators Pill */}
        <div className="mt-4 pt-3 border-t border-teal-700/60 flex items-center justify-between text-xs text-teal-100">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isBubbleActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span>{isBubbleActive ? (isUrdu ? 'ببل اسکرین پر موجود ہے' : 'Floating Bubble: On') : (isUrdu ? 'ببل بند ہے' : 'Bubble: Standby')}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-teal-900/60 px-2.5 py-1 rounded-lg">
            <Database className="w-3.5 h-3.5 text-teal-300" />
            <span>{isOffline ? 'Offline (Room DB)' : 'Room Sync: Ready'}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 space-y-4">
        {/* Giant Primary Help Action Button (56dp+ Accessibility Target) */}
        <button
          onClick={onStartHelp}
          className="w-full p-5 rounded-3xl bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-600 hover:to-emerald-600 text-white shadow-xl flex items-center justify-between active:scale-[0.98] transition group"
        >
          <div className="flex items-center gap-4 text-left">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition">
              <Mic className="w-8 h-8 text-teal-100" />
            </div>
            <div>
              <div className="text-2xl font-black leading-tight">
                {isUrdu ? 'مجھے مدد چاہیے' : 'Need Screen Help'}
              </div>
              <div className="text-sm text-teal-100 mt-1">
                {isUrdu ? 'آواز سے بولیں، قدم بہ قدم رہنمائی پائیں' : 'Speak your problem in Urdu or English'}
              </div>
            </div>
          </div>
          <ChevronRight className="w-7 h-7 text-teal-200 shrink-0" />
        </button>

        {/* Fraud Check Primary Button */}
        <button
          onClick={onStartFraudCheck}
          className="w-full p-5 rounded-3xl bg-gradient-to-r from-rose-700 to-red-600 hover:from-rose-600 hover:to-red-500 text-white shadow-xl flex items-center justify-between active:scale-[0.98] transition group"
        >
          <div className="flex items-center gap-4 text-left">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition">
              <ShieldAlert className="w-8 h-8 text-rose-100" />
            </div>
            <div>
              <div className="text-2xl font-black leading-tight">
                {isUrdu ? 'یہ میسج چیک کرو' : 'Check SMS for Fraud'}
              </div>
              <div className="text-sm text-rose-100 mt-1">
                {isUrdu ? 'بینظیر، جاز کیش یا انعامی دھوکے کی جانچ' : 'Pakistani SMS scam & phishing detector'}
              </div>
            </div>
          </div>
          <ChevronRight className="w-7 h-7 text-rose-200 shrink-0" />
        </button>

        {/* Floating Bubble Quick Toggle Card */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold">
              م
            </div>
            <div>
              <div className="font-bold text-base text-slate-800">
                {isUrdu ? 'تیرتا ہوا ببل (Overlay)' : 'Floating Bubble Overlay'}
              </div>
              <div className="text-xs text-slate-500">
                {isUrdu ? 'دوسری ایپس (JazzCash وغیرہ) کے اوپر رہے گا' : 'Android draw-over-apps service'}
              </div>
            </div>
          </div>

          <button
            onClick={onToggleBubble}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow ${
              isBubbleActive
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
            }`}
          >
            {isBubbleActive ? (isUrdu ? 'فعال ہے' : 'Active') : (isUrdu ? 'شروع کریں' : 'Enable')}
          </button>
        </div>

        {/* Secondary Row: History & Family Dashboard */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onOpenHistory}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-teal-400 shadow-sm text-left flex flex-col justify-between h-32 active:scale-95 transition"
          >
            <div className="flex items-center justify-between">
              <History className="w-6 h-6 text-teal-700" />
              <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[10px] font-bold">
                {helpSessionsCount} Saved
              </span>
            </div>
            <div>
              <div className="font-bold text-base text-slate-800">
                {isUrdu ? 'مدد کی ہسٹری' : 'Help History'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {isUrdu ? 'آف لائن Room کیش' : 'Local Room storage'}
              </div>
            </div>
          </button>

          <button
            onClick={onOpenFamily}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 shadow-sm text-left flex flex-col justify-between h-32 active:scale-95 transition"
          >
            <div className="flex items-center justify-between">
              <Users className="w-6 h-6 text-indigo-700" />
              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold">
                {fraudBlockedCount} Blocked
              </span>
            </div>
            <div>
              <div className="font-bold text-base text-slate-800">
                {isUrdu ? 'فیملی پروٹیکشن' : 'Family Link'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {isUrdu ? 'بغیر پرائیویٹ میسجز دیکھے' : 'Guardian dashboard'}
              </div>
            </div>
          </button>
        </div>

        {/* Security Reassurance Guarantee */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <span className="font-bold block text-sm mb-0.5 text-amber-950">
              {isUrdu ? 'آپ کا تحفظ ہماری ذمہ داری ہے' : 'Privacy & Security Guarantee'}
            </span>
            {isUrdu
              ? 'ہم آپ کا کوئی بھی بینک پاسورڈ، خفیہ PIN یا OTP کبھی محفوظ نہیں کرتے۔ اسکرین شاٹ پروسیسنگ کے بعد فوری ڈیلیٹ ہو جاتا ہے۔'
              : 'Zero passwords, PINs, or CNIC numbers are ever retained. Screenshots are discarded immediately.'}
          </div>
        </div>
      </div>
    </div>
  );
};
