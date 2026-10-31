import React, { useState, useEffect } from 'react';
import { AndroidDeviceFrame } from './components/AndroidDeviceFrame';
import { FloatingBubble } from './components/FloatingBubble';
import { HelpOverlayModal } from './components/HelpOverlayModal';
import { FraudCheckModal } from './components/FraudCheckModal';
import { HistoryModal } from './components/HistoryModal';
import { FamilyGuardianModal } from './components/FamilyGuardianModal';
import { KotlinCodeViewer } from './components/KotlinCodeViewer';
import { JazzCashApp } from './components/SimulatedApps/JazzCashApp';
import { EasypaisaApp } from './components/SimulatedApps/EasypaisaApp';
import { WhatsAppApp } from './components/SimulatedApps/WhatsAppApp';
import { MessagesApp } from './components/SimulatedApps/MessagesApp';
import { ClarioHomeApp } from './components/SimulatedApps/ClarioHomeApp';
import { Language, ScreenAppType, HelpSession, SmsMessage, HelpGuidance } from './types';
import { initialSmsMessages } from './data/mockScreens';
import { offlineStorage } from './services/offlineStorage';
import {
  Smartphone,
  ShieldAlert,
  History,
  Users,
  Code,
  Wifi,
  WifiOff,
  Bell,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Eye,
  CheckCircle2,
} from 'lucide-react';

export default function App() {
  // Navigation & Screen states
  const [currentApp, setCurrentApp] = useState<ScreenAppType>('Clario');
  const [viewMode, setViewMode] = useState<'simulator' | 'code'>('simulator');
  const [language, setLanguage] = useState<Language>('ur');
  const [isOffline, setIsOffline] = useState(false);
  const [isBubbleActive, setIsBubbleActive] = useState(true);

  // SMS and Data
  const [messages, setMessages] = useState<SmsMessage[]>(initialSmsMessages);
  const [helpSessions, setHelpSessions] = useState<HelpSession[]>([]);

  // Modals
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isFraudOpen, setIsFraudOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isFamilyOpen, setIsFamilyOpen] = useState(false);
  const [activeCheckMessage, setActiveCheckMessage] = useState<SmsMessage | null>(null);
  const [prefilledHelpQuery, setPrefilledHelpQuery] = useState('');

  // Toast banner for simulations
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load offline sessions on start
  useEffect(() => {
    const cached = offlineStorage.getHelpSessions();
    setHelpSessions(cached);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleTriggerHelpWithQuery = (query?: string) => {
    setPrefilledHelpQuery(query || '');
    setIsHelpOpen(true);
  };

  const handleSaveHelpSession = (query: string, guidance: HelpGuidance) => {
    const newSession: HelpSession = {
      id: `session-${Date.now()}`,
      appContext: currentApp.toUpperCase(),
      userQuery: query,
      language,
      summary: guidance.summary,
      steps: guidance.steps,
      warning: guidance.warning,
      timestamp: Date.now(),
      isOffline,
    };
    offlineStorage.saveHelpSession(newSession);
    setHelpSessions(offlineStorage.getHelpSessions());
  };

  const handleCheckSms = (msg: SmsMessage) => {
    setActiveCheckMessage(msg);
    setIsFraudOpen(true);
  };

  const handleDeleteSms = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    showToast('SMS removed from inbox successfully');
  };

  const handleDecisionSaved = (checkId: string, decision: 'KEEP' | 'DELETE') => {
    if (activeCheckMessage && decision === 'DELETE') {
      handleDeleteSms(activeCheckMessage.id);
    }
    showToast(
      decision === 'DELETE'
        ? 'Message marked as fraud and deleted'
        : 'Message marked as safe and kept'
    );
  };

  const handleSimulateIncomingScam = () => {
    setCurrentApp('messages');
    const scam: SmsMessage = {
      id: `scam-${Date.now()}`,
      sender: '8171-Ehsaas',
      time: 'Just now',
      body: 'URGENT: BISP 8171 Grant of Rs 25,000 ready for collection. Call immediately on 0308-5432190 to avoid cancellation.',
      isScam: true,
      verdict: 'FRAUD',
    };
    setMessages((prev) => [scam, ...prev]);
    showToast('⚠️ New SMS Arrived: High-Risk Scam intercepted by Clario!');
  };

  const isUrdu = language === 'ur';

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* Top Global Command Bar */}
      <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 py-3 shrink-0 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-teal-900/40">
              م
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  Clario (مددگار)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[10px] font-bold">
                  Android 10+ • Material 3
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Department of Software Engineering, NED University • Build4Better Hackathon
              </p>
            </div>
          </div>

          {/* Center Navigation Controls */}
          <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('simulator')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'simulator'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android Device Simulator</span>
            </button>

            <button
              onClick={() => setViewMode('code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'code'
                  ? 'bg-violet-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Kotlin Android Codebase</span>
            </button>
          </div>

          {/* Right quick toggles: Language, Offline, Incoming Scam test */}
          <div className="flex items-center gap-2">
            {/* Offline Mode Toggle */}
            <button
              onClick={() => {
                const nextState = !isOffline;
                setIsOffline(nextState);
                showToast(
                  nextState
                    ? 'Airplane Mode: Offline Room DB Cache Active'
                    : 'Online Mode: Gemini Cloud Connected'
                );
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                isOffline
                  ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Toggle offline data support"
            >
              {isOffline ? <WifiOff className="w-3.5 h-3.5 text-amber-400" /> : <Wifi className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isOffline ? 'Offline (Room)' : 'Online'}</span>
            </button>

            {/* Language Switch */}
            <button
              onClick={() => setLanguage(language === 'ur' ? 'en' : 'ur')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-xs font-bold text-slate-200"
            >
              {language === 'ur' ? 'English UI' : 'اردو انٹرفیس'}
            </button>

            {/* Simulate Incoming Scam SMS Button */}
            <button
              onClick={handleSimulateIncomingScam}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-bold rounded-xl transition shadow"
            >
              <Bell className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
              <span>Simulate Scam SMS</span>
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-neutral-900/95 border border-teal-500/50 rounded-full shadow-2xl text-xs font-bold text-white flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Display Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col items-center justify-center">
        {viewMode === 'code' ? (
          <div className="w-full h-[760px]">
            <KotlinCodeViewer />
          </div>
        ) : (
          <div className="w-full flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8">
            {/* Left: Interactive Context & Switcher Panel */}
            <div className="w-full lg:w-80 space-y-4">
              {/* App Switcher for Phone Simulation */}
              <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Switch Phone Screen
                  </span>
                  <span className="text-[10px] text-teal-400 font-bold">Live Interaction</span>
                </div>

                <div className="space-y-1.5">
                  <button
                    onClick={() => setCurrentApp('Clario')}
                    className={`w-full p-2.5 rounded-2xl text-xs font-bold flex items-center justify-between transition ${
                      currentApp === 'Clario'
                        ? 'bg-teal-600 text-white shadow-md'
                        : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-teal-800 text-white flex items-center justify-center font-bold text-xs">
                        م
                      </div>
                      <span>Clario Home App</span>
                    </div>
                    {currentApp === 'Clario' && <CheckCircle2 className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => setCurrentApp('jazzcash')}
                    className={`w-full p-2.5 rounded-2xl text-xs font-bold flex items-center justify-between transition ${
                      currentApp === 'jazzcash'
                        ? 'bg-[#E60000] text-white shadow-md'
                        : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-white text-[#E60000] flex items-center justify-center font-black text-xs">
                        J
                      </div>
                      <span>JazzCash (Locked screen)</span>
                    </div>
                    {currentApp === 'jazzcash' && <CheckCircle2 className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => setCurrentApp('easypaisa')}
                    className={`w-full p-2.5 rounded-2xl text-xs font-bold flex items-center justify-between transition ${
                      currentApp === 'easypaisa'
                        ? 'bg-[#00A859] text-white shadow-md'
                        : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-white text-[#00A859] flex items-center justify-center font-black text-xs">
                        e
                      </div>
                      <span>Easypaisa (Transfer)</span>
                    </div>
                    {currentApp === 'easypaisa' && <CheckCircle2 className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => setCurrentApp('whatsapp')}
                    className={`w-full p-2.5 rounded-2xl text-xs font-bold flex items-center justify-between transition ${
                      currentApp === 'whatsapp'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-[#25D366] text-white flex items-center justify-center font-bold text-xs">
                        W
                      </div>
                      <span>WhatsApp Call (Muted)</span>
                    </div>
                    {currentApp === 'whatsapp' && <CheckCircle2 className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => setCurrentApp('messages')}
                    className={`w-full p-2.5 rounded-2xl text-xs font-bold flex items-center justify-between transition ${
                      currentApp === 'messages'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-indigo-800 text-white flex items-center justify-center font-bold text-xs">
                        SMS
                      </div>
                      <span>SMS Messages Inbox</span>
                    </div>
                    {currentApp === 'messages' && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Instructions Callout for Hackathon Judges */}
              <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 text-xs space-y-2 text-slate-300">
                <div className="font-bold text-teal-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>How to test Clario:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-400">
                  <li>
                    Notice the <strong className="text-white">floating bubble (م)</strong> on the phone screen. You can drag it anywhere!
                  </li>
                  <li>
                    Tap the bubble to ask a voice question in <strong className="text-white">Urdu or English</strong>.
                  </li>
                  <li>
                    Switch to <strong className="text-white">Messages</strong> to inspect Pakistani scam SMS messages or click "Simulate Scam SMS".
                  </li>
                  <li>
                    Inspect the <strong className="text-white">Kotlin Codebase</strong> tab to view or download the complete native Android project.
                  </li>
                </ol>
              </div>
            </div>

            {/* Center: Real Android Phone Shell with Active Screen & Overlay Bubble */}
            <div className="relative">
              <AndroidDeviceFrame activeAppTitle={currentApp}>
                {/* Active Screen App */}
                {currentApp === 'Clario' && (
                  <ClarioHomeApp
                    language={language}
                    onLanguageChange={setLanguage}
                    onStartHelp={() => setIsHelpOpen(true)}
                    onStartFraudCheck={() => {
                      setActiveCheckMessage(null);
                      setIsFraudOpen(true);
                    }}
                    onOpenHistory={() => setIsHistoryOpen(true)}
                    onOpenFamily={() => setIsFamilyOpen(true)}
                    isBubbleActive={isBubbleActive}
                    onToggleBubble={() => setIsBubbleActive(!isBubbleActive)}
                    isOffline={isOffline}
                    helpSessionsCount={helpSessions.length}
                    fraudBlockedCount={messages.filter((m) => m.verdict === 'FRAUD').length}
                  />
                )}

                {currentApp === 'jazzcash' && (
                  <JazzCashApp onTriggerHelp={handleTriggerHelpWithQuery} />
                )}

                {currentApp === 'easypaisa' && (
                  <EasypaisaApp onTriggerHelp={handleTriggerHelpWithQuery} />
                )}

                {currentApp === 'whatsapp' && (
                  <WhatsAppApp onTriggerHelp={handleTriggerHelpWithQuery} />
                )}

                {currentApp === 'messages' && (
                  <MessagesApp
                    messages={messages}
                    onCheckMessage={handleCheckSms}
                    onDeleteMessage={handleDeleteSms}
                  />
                )}

                {/* Floating Bubble Overlay (Visible over ALL apps when active) */}
                {isBubbleActive && (
                  <FloatingBubble
                    currentAppName={currentApp.toUpperCase()}
                    onNeedHelp={() => setIsHelpOpen(true)}
                    onCheckMessage={() => {
                      setActiveCheckMessage(null);
                      setIsFraudOpen(true);
                    }}
                  />
                )}

                {/* Modal Overlays inside Android frame */}
                <HelpOverlayModal
                  isOpen={isHelpOpen}
                  onClose={() => setIsHelpOpen(false)}
                  currentAppName={currentApp.toUpperCase()}
                  language={language}
                  onSaveSession={handleSaveHelpSession}
                  isOffline={isOffline}
                  prefilledQuery={prefilledHelpQuery}
                />

                <FraudCheckModal
                  isOpen={isFraudOpen}
                  onClose={() => setIsFraudOpen(false)}
                  language={language}
                  targetMessage={activeCheckMessage}
                  onDecisionSaved={handleDecisionSaved}
                  isOffline={isOffline}
                />

                <HistoryModal
                  isOpen={isHistoryOpen}
                  onClose={() => setIsHistoryOpen(false)}
                  language={language}
                  sessions={helpSessions}
                  onClearHistory={() => {
                    offlineStorage.clearData();
                    setHelpSessions([]);
                    showToast('History cleared');
                  }}
                  isOffline={isOffline}
                />

                <FamilyGuardianModal
                  isOpen={isFamilyOpen}
                  onClose={() => setIsFamilyOpen(false)}
                  language={language}
                />
              </AndroidDeviceFrame>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
