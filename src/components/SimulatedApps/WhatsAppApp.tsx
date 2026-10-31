import React, { useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, RefreshCw, Volume2, Users } from 'lucide-react';

interface WhatsAppAppProps {
  onTriggerHelp: (query?: string) => void;
}

export const WhatsAppApp: React.FC<WhatsAppAppProps> = ({ onTriggerHelp }) => {
  const [isMuted, setIsMuted] = useState(true); // Default muted - common elderly problem
  const [isReconnecting, setIsReconnecting] = useState(true);

  return (
    <div className="flex flex-col h-full bg-[#111b21] text-white relative select-none">
      {/* Video Call Background Simulation */}
      <div className="flex-1 relative bg-gradient-to-b from-neutral-800 to-neutral-900 flex flex-col items-center justify-center p-6">
        {/* Caller Avatar */}
        <div className="relative">
          <div className="w-28 h-28 rounded-full bg-emerald-700/80 border-4 border-emerald-500/50 flex items-center justify-center text-4xl font-bold shadow-2xl">
            ع
          </div>
          {isMuted && (
            <div className="absolute -bottom-1 -right-1 bg-red-600 rounded-full p-1.5 border-2 border-[#111b21]">
              <MicOff className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        <div className="text-xl font-bold mt-4 tracking-wide">Ali (Son)</div>

        {/* Status */}
        {isReconnecting ? (
          <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-black/40 rounded-full border border-amber-500/40 text-amber-300 text-xs font-semibold animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Connection Weak • Reconnecting...</span>
          </div>
        ) : (
          <div className="text-xs text-emerald-400 mt-2 font-medium">04:12 • Connected</div>
        )}

        {/* Floating Elder Guide Banner */}
        <div className="absolute top-4 left-4 right-4 p-3 bg-neutral-900/90 backdrop-blur border border-neutral-700 rounded-2xl flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <span className="text-neutral-300">
              {isMuted ? 'Aapka mic band hai (You are muted)' : 'Mic is on'}
            </span>
          </div>
          <button
            onClick={() => onTriggerHelp('WhatsApp video call mein awaz nahi aa rahi aur mic band hai')}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
          >
            Ask Clario
          </button>
        </div>
      </div>

      {/* Video Call Bottom Control Bar */}
      <div className="bg-[#202c33] p-5 pb-8 rounded-t-3xl border-t border-neutral-700/60 shadow-2xl">
        <div className="flex items-center justify-around max-w-xs mx-auto">
          {/* Mute Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-14 h-14 rounded-full flex flex-col items-center justify-center transition shadow-lg ${
              isMuted ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-neutral-700 hover:bg-neutral-600 text-white'
            }`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {/* Video Toggle */}
          <button
            className="w-14 h-14 rounded-full bg-neutral-700 hover:bg-neutral-600 text-white flex items-center justify-center transition shadow-lg"
          >
            <Video className="w-6 h-6" />
          </button>

          {/* Speaker */}
          <button
            onClick={() => setIsReconnecting(!isReconnecting)}
            className="w-14 h-14 rounded-full bg-neutral-700 hover:bg-neutral-600 text-white flex items-center justify-center transition shadow-lg"
          >
            <Volume2 className="w-6 h-6" />
          </button>

          {/* End Call */}
          <button
            className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg active:scale-95"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
