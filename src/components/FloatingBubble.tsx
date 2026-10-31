import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, HelpCircle, ShieldAlert, X } from 'lucide-react';

interface FloatingBubbleProps {
  onNeedHelp: () => void;
  onCheckMessage: () => void;
  currentAppName: string;
}

export const FloatingBubble: React.FC<FloatingBubbleProps> = ({
  onNeedHelp,
  onCheckMessage,
  currentAppName,
}) => {
  const [pos, setPos] = useState({ x: 16, y: 180 });
  const [isDragging, setIsDragging] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; mouseX: number; mouseY: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(false);
    dragStartRef.current = {
      startX: pos.x,
      startY: pos.y,
      mouseX: e.clientX,
      mouseY: e.clientY,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    const deltaX = e.clientX - dragStartRef.current.mouseX;
    const deltaY = e.clientY - dragStartRef.current.mouseY;

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      setIsDragging(true);
    }

    setPos({
      x: Math.max(8, Math.min(320, dragStartRef.current.startX + deltaX)),
      y: Math.max(60, Math.min(600, dragStartRef.current.startY + deltaY)),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!isDragging && dragStartRef.current) {
      setShowMenu(!showMenu);
    }
    dragStartRef.current = null;
    setIsDragging(false);
  };

  return (
    <div
      style={{
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        touchAction: 'none',
      }}
      className="absolute top-0 left-0 z-50 select-none cursor-grab active:cursor-grabbing transition-transform duration-75"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Mini Action Popup when bubble is tapped */}
      {showMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-16 left-0 w-64 p-3 bg-neutral-900/95 backdrop-blur-md border border-teal-500/50 rounded-2xl shadow-2xl text-white space-y-2 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between pb-2 border-b border-neutral-700 text-xs">
            <span className="font-bold text-teal-400">مددگار (Clario) Helper</span>
            <button
              onClick={() => setShowMenu(false)}
              className="p-1 text-neutral-400 hover:text-white rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => {
              setShowMenu(false);
              onNeedHelp();
            }}
            className="w-full p-2.5 bg-teal-600 hover:bg-teal-500 rounded-xl text-left flex items-center gap-2.5 transition active:scale-95"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-800 flex items-center justify-center text-white shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold">Madad Chahiye (مدد چاہیے)</div>
              <div className="text-[10px] text-teal-100">Guide me on {currentAppName} screen</div>
            </div>
          </button>

          <button
            onClick={() => {
              setShowMenu(false);
              onCheckMessage();
            }}
            className="w-full p-2.5 bg-rose-600 hover:bg-rose-500 rounded-xl text-left flex items-center gap-2.5 transition active:scale-95"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-800 flex items-center justify-center text-white shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold">Yeh Message Check Karo</div>
              <div className="text-[10px] text-rose-100">Check active text or SMS for scam</div>
            </div>
          </button>
        </div>
      )}

      {/* The Draggable Bubble Element */}
      <div className="relative group">
        {/* Pulsing ring for high visibility */}
        <div className="absolute inset-0 rounded-full bg-teal-400/40 pulse-ring"></div>

        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-teal-700 via-teal-600 to-emerald-500 text-white flex flex-col items-center justify-center shadow-2xl border-2 border-white/80 active:scale-95 transition">
          <span className="text-xl font-black font-urdu leading-none">م</span>
          <span className="text-[8px] font-extrabold uppercase tracking-widest text-teal-100">Madad</span>
        </div>
      </div>
    </div>
  );
};
