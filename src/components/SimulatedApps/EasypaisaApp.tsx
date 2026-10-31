import React from 'react';
import { ArrowUpRight, Smartphone, Banknote, Shield, HelpCircle, History } from 'lucide-react';

interface EasypaisaAppProps {
  onTriggerHelp: (query?: string) => void;
}

export const EasypaisaApp: React.FC<EasypaisaAppProps> = ({ onTriggerHelp }) => {
  return (
    <div className="flex flex-col h-full bg-[#0d1b17] text-white overflow-y-auto select-none">
      {/* Easypaisa Header */}
      <div className="bg-[#00A859] p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-black text-[#00A859] text-lg">
            e
          </div>
          <span className="font-bold text-xl tracking-wide">easypaisa</span>
        </div>
        <button
          onClick={() => onTriggerHelp('Easypaisa mein madad chahiye')}
          className="flex items-center gap-1.5 px-3 py-1 bg-black/20 rounded-full text-xs font-semibold hover:bg-black/30"
        >
          <HelpCircle className="w-4 h-4 text-emerald-200" />
          <span>Help</span>
        </button>
      </div>

      {/* Balance Card */}
      <div className="p-4">
        <div className="bg-[#122b24] border border-[#00A859]/30 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-emerald-200">
            <span>Available Balance</span>
            <span className="bg-[#00A859]/20 text-[#00A859] px-2 py-0.5 rounded font-bold">Active</span>
          </div>
          <div className="text-3xl font-extrabold mt-1 text-white">
            Rs. 8,940<span className="text-sm font-normal text-emerald-300/70">.25</span>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => onTriggerHelp('Easypaisa se paise kaise transfer karein?')}
              className="flex-1 py-2.5 bg-[#00A859] hover:bg-[#008f4c] text-neutral-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow"
            >
              <ArrowUpRight className="w-4 h-4 text-neutral-950" />
              <span>Send Money</span>
            </button>
            <button
              onClick={() => onTriggerHelp('Easypaisa mein bill kaise bharein?')}
              className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
            >
              <Banknote className="w-4 h-4 text-emerald-300" />
              <span>Bill Payment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Money Transfer Options (Where elders often get confused) */}
      <div className="p-4 pt-0">
        <div className="text-xs font-bold text-emerald-200/70 uppercase tracking-wider mb-2.5">
          Send Money To
        </div>
        <div className="space-y-2">
          <div
            onClick={() => onTriggerHelp('Easypaisa account mein paise kaise bhejein?')}
            className="p-3 bg-[#122b24]/80 hover:bg-[#122b24] border border-emerald-900/40 rounded-xl flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#00A859]/20 flex items-center justify-center text-[#00A859]">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">Easypaisa Mobile Account</div>
                <div className="text-xs text-neutral-400">Transfer instantly to any Easypaisa number</div>
              </div>
            </div>
            <span className="text-xs text-[#00A859] font-bold">Select</span>
          </div>

          <div
            onClick={() => onTriggerHelp('Easypaisa se bank account mein paise kaise bhejein?')}
            className="p-3 bg-[#122b24]/80 hover:bg-[#122b24] border border-emerald-900/40 rounded-xl flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">Bank Transfer (HBL, Meezan, Alfa)</div>
                <div className="text-xs text-neutral-400">Direct transfer to any Pakistani bank</div>
              </div>
            </div>
            <span className="text-xs text-[#00A859] font-bold">Select</span>
          </div>

          <div
            onClick={() => onTriggerHelp('CNIC transfer kya hota hai aur kaise karein?')}
            className="p-3 bg-[#122b24]/80 hover:bg-[#122b24] border border-emerald-900/40 rounded-xl flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">CNIC Transfer</div>
                <div className="text-xs text-neutral-400">Send cash to NADRA CNIC for retail collection</div>
              </div>
            </div>
            <span className="text-xs text-amber-400 font-bold">Select</span>
          </div>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="mx-4 mt-auto mb-4 p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-300">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Easypaisa representative will never call asking for your secret 5-digit PIN or OTP.</span>
        </div>
      </div>
    </div>
  );
};
