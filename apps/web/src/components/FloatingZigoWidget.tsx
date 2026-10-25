import React from 'react';
import { ObrtEmblem, ObrtIcon } from './icons';

export interface FloatingZigoWidgetProps {
  isThinking: boolean;
  isOpen: boolean;
  isDocked?: boolean;
  onClick: () => void;
  onQuickRez: () => void;
}

export const FloatingZigoWidget: React.FC<FloatingZigoWidgetProps> = ({
  isThinking,
  isOpen,
  isDocked = false,
  onClick,
  onQuickRez,
}) => {
  if (isDocked) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 select-none print:hidden">
      {/* 1. Brza tipka: "Žigo, presijeci" (Instant Trijaža) */}
      {!isOpen && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickRez();
          }}
          title="Žigo, presijeci - Instant trijaža stanja u 3 točke: 1. Što gori, 2. Što čeka, 3. Akcija sad"
          className="group flex items-center gap-2 px-3 py-2 bg-[#1e2025]/95 hover:bg-[#252830] text-[#e0cfab] border border-[#b89758]/50 hover:border-[#d4af37] shadow-xl text-xs font-mono font-bold tracking-wide transition-all transform hover:-translate-y-0.5 active:translate-y-0 backdrop-blur-md cursor-pointer"
        >
          <ObrtIcon name="fiscal-quill" size={14} className="group-hover:rotate-45 transition-transform text-[#b89758]" />
          <span className="hidden sm:inline">Žigo, presijeci</span>
        </button>
      )}

      {/* 2. Glavni Amblem: Digitalni Orlando s klesanim kamenom i rotirajućim Q-prstenom */}
      <div className="relative group">
        {/* Pozadinski sjaj pri razmišljanju */}
        {isThinking && (
          <div className="absolute -inset-1.5 bg-gradient-to-r from-[#b89758] via-[#ffd700] to-[#b89758] rounded-full blur opacity-70 animate-pulse pointer-events-none" />
        )}

        <button
          onClick={onClick}
          className={`relative p-0.5 rounded-full shadow-2xl transition-all duration-300 transform group-hover:scale-105 active:scale-95 cursor-pointer bg-transparent border-0 outline-none ${
            isOpen ? 'ring-2 ring-[#ffd700]/60 ring-offset-2 ring-offset-[#141518]' : ''
          }`}
          title="Žigo (Digitalni Orlando) - Autonomni klijentski agent"
          aria-label="Otvori Žigo agenta"
        >
          <ObrtEmblem
            emblem="zigo-emblem"
            size={56}
            rotatingRing
            ringSpeed={isThinking ? 'fast' : 'slow'}
            glowing={isThinking}
          />

          {/* Indikator statusa (Zeleni stoički puls ili zlatna iskra) */}
          <span className="absolute top-0 right-0 flex h-3.5 w-3.5 z-10 pointer-events-none">
            {isThinking ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ffd700] opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#ffd700] border border-[#1a1b20]" />
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#10B981] border-2 border-[#1a1b20]" />
            )}
          </span>
        </button>

        {/* Hover Tooltip */}
        <div className="absolute right-0 bottom-16 hidden group-hover:flex flex-col items-end pointer-events-none z-50">
          <div className="bg-[#181a1f] text-[#f0e6d2] text-[11px] font-mono px-3 py-1.5 border border-[#b89758]/60 shadow-2xl rounded-none whitespace-nowrap">
            <span className="font-bold text-[#ffd700]">Žigo (Digitalni Orlando)</span>
            <span className="text-[10px] text-[var(--text-muted)] block">
              {isThinking ? 'Analizira pod laktom...' : 'Klikni za razgovor'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
