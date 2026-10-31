import React from 'react';
import { SmsMessage } from '../../types';
import { ShieldAlert, ShieldCheck, HelpCircle, AlertCircle, Trash2 } from 'lucide-react';

interface MessagesAppProps {
  messages: SmsMessage[];
  onCheckMessage: (message: SmsMessage) => void;
  onDeleteMessage: (id: string) => void;
}

export const MessagesApp: React.FC<MessagesAppProps> = ({ messages, onCheckMessage, onDeleteMessage }) => {
  return (
    <div className="flex flex-col h-full bg-[#1e293b] text-white overflow-y-auto select-none">
      {/* Messages Header */}
      <div className="bg-[#0f172a] p-4 border-b border-slate-700/60 flex items-center justify-between sticky top-0 z-10 shadow">
        <div>
          <div className="font-extrabold text-xl tracking-tight text-white">Messages (SMS)</div>
          <div className="text-xs text-slate-400">Android Default Telephony Inbox</div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs text-emerald-400 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Clario Shield Active</span>
        </div>
      </div>

      {/* Messages List */}
      <div className="p-3 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-4 rounded-2xl border transition-all ${
              msg.verdict === 'FRAUD'
                ? 'bg-rose-950/40 border-rose-600/60 shadow-rose-950/20'
                : msg.verdict === 'SAFE'
                ? 'bg-emerald-950/30 border-emerald-600/40'
                : 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
            }`}
          >
            {/* Sender and status */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white">{msg.sender}</span>
                {msg.verdict === 'FRAUD' && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-extrabold text-[10px] tracking-wide uppercase">
                    Fraud Detected
                  </span>
                )}
                {msg.verdict === 'SAFE' && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[10px]">
                    Safe
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400">{msg.time}</span>
            </div>

            {/* Message Body */}
            <p className="text-sm text-slate-200 leading-relaxed font-normal">
              {msg.body}
            </p>

            {/* Action Bar */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-750">
              <div className="text-xs text-slate-400 flex items-center gap-1">
                {msg.isScam ? (
                  <span className="text-amber-400 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Possible scam signals
                  </span>
                ) : (
                  <span className="text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Standard message
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {msg.verdict === 'FRAUD' && (
                  <button
                    onClick={() => onDeleteMessage(msg.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}

                <button
                  onClick={() => onCheckMessage(msg)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{msg.verdict ? 'View Verdict' : 'Check with Clario'}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
