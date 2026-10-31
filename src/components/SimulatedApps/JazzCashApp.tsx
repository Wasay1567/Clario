import React, { useState } from 'react';
import { Send, Receipt, Smartphone, AlertTriangle, ShieldCheck, CreditCard, ChevronRight, Check } from 'lucide-react';

interface JazzCashAppProps {
  onTriggerHelp: (query?: string) => void;
}

export const JazzCashApp: React.FC<JazzCashAppProps> = ({ onTriggerHelp }) => {
  const [showBiometricLock, setShowBiometricLock] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);

  return (
    <div className="flex flex-col h-full bg-[#121212] text-white overflow-y-auto select-none">
      {/* Top JazzCash Bar */}
      <div className="bg-[#E60000] p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-black text-[#E60000] text-lg">
            J
          </div>
          <span className="font-bold text-xl tracking-wide">JazzCash</span>
        </div>
        <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-300" />
          <span>Verified Account</span>
        </div>
      </div>

      {/* Account Balance Card */}
      <div className="p-4 bg-gradient-to-b from-[#E60000]/20 to-transparent">
        <div className="bg-[#1e1e1e] border border-neutral-800 rounded-2xl p-4 shadow-lg">
          <div className="text-xs text-neutral-400 font-medium">Available Balance (PKR)</div>
          <div className="text-3xl font-extrabold mt-1 text-white tracking-tight">
            ₨ 14,250<span className="text-sm font-normal text-neutral-400">.00</span>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-850 text-xs text-neutral-400">
            <span>Account: 0300-XXXX421</span>
            <span className="text-emerald-400 font-semibold">Level 1 Biometric</span>
          </div>
        </div>
      </div>

      {/* Biometric Lock Modal (Common struggle for elderly parents) */}
      {showBiometricLock && !isUnlocked && (
        <div className="mx-4 mb-4 p-4 rounded-2xl bg-amber-950/40 border border-amber-600/50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-200 text-base">Account Locked / Biometric Required</div>
              <p className="text-xs text-amber-300/80 mt-1 leading-relaxed">
                State Bank policy ke tehat aapka account biometric tasdeeq ke baghair transactions ke liye band hai.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => setIsUnlocked(true)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl transition"
                >
                  Verify Biometric (Scan Finger)
                </button>
                <button
                  onClick={() => onTriggerHelp('Mera JazzCash lock hogya hai, biometric mang raha hai')}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-xl"
                >
                  Ask Clario
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unlocked feedback banner */}
      {isUnlocked && (
        <div className="mx-4 mb-3 p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Biometric verified successfully! Transactions unlocked.</span>
          </div>
          <button onClick={() => setIsUnlocked(false)} className="text-[10px] text-neutral-400 underline">reset</button>
        </div>
      )}

      {/* Core Action Grid */}
      <div className="px-4 py-2">
        <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Quick Actions</div>
        <div className="grid grid-cols-4 gap-3 text-center">
          <button
            onClick={() => onTriggerHelp('Mujhe JazzCash se paise bhejne hain, tareeqa bata dein')}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-[#1e1e1e] hover:bg-[#282828] active:scale-95 transition"
          >
            <div className="w-12 h-12 rounded-full bg-[#E60000] flex items-center justify-center text-white shadow-md">
              <Send className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold">Send Money</span>
          </button>

          <button
            onClick={() => onTriggerHelp('Bijli ka bill kahan se ada hoga?')}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-[#1e1e1e] hover:bg-[#282828] active:scale-95 transition"
          >
            <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-white shadow-md">
              <Receipt className="w-6 h-6 text-amber-400" />
            </div>
            <span className="text-xs font-semibold">Pay Bills</span>
          </button>

          <button
            onClick={() => onTriggerHelp('Mobile load kaise karein?')}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-[#1e1e1e] hover:bg-[#282828] active:scale-95 transition"
          >
            <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-white shadow-md">
              <Smartphone className="w-6 h-6 text-sky-400" />
            </div>
            <span className="text-xs font-semibold">Mobile Load</span>
          </button>

          <button
            onClick={() => onTriggerHelp('Debit card order karna hai')}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-[#1e1e1e] hover:bg-[#282828] active:scale-95 transition"
          >
            <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-white shadow-md">
              <CreditCard className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-xs font-semibold">Debit Card</span>
          </button>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="p-4 mt-2">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Recent Transactions</span>
          <span className="text-xs text-[#E60000] font-semibold">View All</span>
        </div>
        <div className="space-y-2.5">
          <div className="p-3 bg-[#1e1e1e] rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-sm">
                +
              </div>
              <div>
                <div className="text-sm font-semibold">Tariq Ahmed (Son)</div>
                <div className="text-[11px] text-neutral-400">Money Received • 29 Oct</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-emerald-400">+₨ 5,000</div>
              <div className="text-[10px] text-neutral-500">Success</div>
            </div>
          </div>

          <div className="p-3 bg-[#1e1e1e] rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-300 font-bold text-sm">
                -
              </div>
              <div>
                <div className="text-sm font-semibold">K-Electric Bill Payment</div>
                <div className="text-[11px] text-neutral-400">Utility Bill • 24 Oct</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-neutral-200">-₨ 6,430</div>
              <div className="text-[10px] text-emerald-400">Paid</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
