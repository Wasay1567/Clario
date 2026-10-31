import React from 'react';
import { HelpSession, Language } from '../types';
import { History, Calendar, CheckCircle2, ChevronRight, X, Trash2, Database } from 'lucide-react';
import { tts } from '../services/ttsService';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  sessions: HelpSession[];
  onClearHistory: () => void;
  isOffline: boolean;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  language,
  sessions,
  onClearHistory,
  isOffline,
}) => {
  if (!isOpen) return null;

  const isUrdu = language === 'ur';

  return (
    <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-50 flex flex-col justify-end p-3 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-5 shadow-2xl max-h-[92%] flex flex-col text-slate-900 border border-slate-200 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-lg text-slate-900">
                {isUrdu ? 'گزشتہ مدد کا ریکارڈ' : 'Offline Help History'}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-teal-600" />
                <span>{isOffline ? 'Android Room SQLite (Offline)' : 'Room Sync & Cached'}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sessions List */}
        <div className="py-4 space-y-3">
          {sessions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              {isUrdu ? 'ابھی تک کوئی ریکارڈ موجود نہیں ہے۔' : 'No past help sessions found.'}
            </div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className="p-4 bg-slate-50 hover:bg-teal-50/50 border border-slate-200 rounded-2xl transition"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-teal-700 text-white text-[11px] font-bold">
                      {s.appContext}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(s.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="text-[10px] text-teal-700 font-bold bg-teal-100 px-2 py-0.5 rounded-full">
                    {s.steps.length} Steps
                  </span>
                </div>

                <div className="text-sm font-bold text-slate-900 mt-1.5 font-urdu">
                  {s.summary}
                </div>

                <div className="text-xs text-slate-600 mt-1 line-clamp-1 italic">
                  "{s.userQuery}"
                </div>

                {/* Steps Mini Preview */}
                <div className="mt-3 pt-2.5 border-t border-slate-200/70 space-y-1">
                  {s.steps.slice(0, 2).map((step, idx) => (
                    <div key={idx} className="text-xs text-slate-700 flex items-center gap-1.5 font-urdu">
                      <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {step.n}
                      </span>
                      <span className="truncate">{step.text}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => {
                      const text = `${s.summary}. ${s.steps.map((st) => `مرحلہ ${st.n}: ${st.text}`).join('. ')}`;
                      tts.speak(text, s.language);
                    }}
                    className="text-xs text-teal-700 hover:text-teal-900 font-bold underline"
                  >
                    {isUrdu ? 'دوبارہ سنیں (Read Aloud)' : 'Listen Aloud'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {sessions.length > 0 && (
          <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
            <span className="text-xs text-slate-400">
              {sessions.length} {isUrdu ? 'سیشنز محفوظ ہیں' : 'sessions saved'}
            </span>
            <button
              onClick={onClearHistory}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'ہسٹری صاف کریں' : 'Clear History'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
