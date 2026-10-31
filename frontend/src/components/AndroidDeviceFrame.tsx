import React from 'react';
import { Wifi, Signal, BatteryCharging, Shield } from 'lucide-react';

interface AndroidDeviceFrameProps {
  children: React.ReactNode;
  activeAppTitle: string;
}

export const AndroidDeviceFrame: React.FC<AndroidDeviceFrameProps> = ({
  children,
  activeAppTitle,
}) => {
  // Current simulated time
  const timeStr = '11:42';

  return (
    <div className="relative mx-auto w-full max-w-[390px] h-[780px] bg-neutral-900 rounded-[48px] p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] border-4 border-neutral-700/80 flex flex-col overflow-hidden">
      {/* Outer Phone Frame Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-4 bg-neutral-800 rounded-b-xl z-40"></div>

      {/* Screen Inner Viewport */}
      <div className="relative w-full h-full bg-slate-950 rounded-[40px] overflow-hidden flex flex-col border border-neutral-800">
        {/* Android Material 3 Status Bar */}
        <div className="h-9 px-6 bg-transparent text-white/90 flex items-center justify-between text-xs font-semibold select-none z-30 shrink-0">
          <span>{timeStr}</span>

          {/* Camera Notch */}
          <div className="w-3.5 h-3.5 rounded-full bg-black border border-neutral-800 shadow-inner"></div>

          <div className="flex items-center gap-1.5 text-xs text-white/80">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold">92%</span>
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>

        {/* Dynamic Screen Content Container */}
        <div className="relative flex-1 overflow-hidden flex flex-col">
          {children}
        </div>

        {/* Android Gesture Navigation Bar */}
        <div className="h-5 bg-transparent flex items-center justify-center shrink-0 z-30">
          <div className="w-28 h-1 bg-white/40 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
