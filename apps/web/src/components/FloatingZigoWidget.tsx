import React from 'react';
import { Shield, Sword } from 'lucide-react';

export interface FloatingZigoWidgetProps {
  isThinking: boolean;
  isOpen: boolean;
  onClick: () => void;
  onQuickRez: () => void;
}

export const FloatingZigoWidget: React.FC<FloatingZigoWidgetProps> = ({
  isThinking,
  isOpen,
  onClick,
  onQuickRez,
}) => {
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
          className="group flex items-center gap-2 px-3 py-2 bg-[#1e2025]/95 hover:bg-[#252830] text-[#e0cfab] border border-[#b89758]/50 hover:border-[#d4af37] shadow-xl text-xs font-mono font-bold tracking-wide transition-all transform hover:-translate-y-0.5 active:translate-y-0 backdrop-blur-md"
        >
          <Sword className="w-3.5 h-3.5 text-[#b89758] group-hover:rotate-45 transition-transform" />
          <span className="hidden sm:inline">Žigo, presijeci</span>
        </button>
      )}

      {/* 2. Glavni Amblem: Digitalni Orlando s klesanim kamenom i rotirajućim Q-prstenom */}
      <div className="relative group">
        {/* Pozadinski sjaj pri razmišljanju */}
        {isThinking && (
          <div className="absolute -inset-1.5 bg-gradient-to-r from-[#b89758] via-[#ffd700] to-[#b89758] rounded-full blur opacity-70 animate-pulse" />
        )}

        <button
          onClick={onClick}
          className={`relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[#252830] via-[#1a1b20] to-[#141518] border-2 shadow-2xl transition-all duration-300 transform group-hover:scale-105 active:scale-95 ${
            isOpen
              ? 'border-[#ffd700] ring-2 ring-[#ffd700]/30 shadow-[#ffd700]/20'
              : isThinking
              ? 'border-[#ffd700] animate-pulse'
              : 'border-[#b89758]/70 hover:border-[#d4af37]'
          }`}
          title="Žigo (Digitalni Orlando) - Autonomni klijentski agent"
          aria-label="Otvori Žigo agenta"
        >
          {/* Rotirajući Q-prsten (Zavrti se brzinom centrifuge pri obradi) */}
          <div
            className={`absolute inset-0.5 rounded-full border border-dashed border-[#d4af37]/60 pointer-events-none transition-all ${
              isThinking ? 'animate-spin border-t-[#ffd700] border-r-transparent duration-700' : 'opacity-40 group-hover:opacity-100 group-hover:rotate-45'
            }`}
          />

          {/* Unutarnja kamena jezgra s Orlandovim štitom */}
          <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-[#1e2025] border border-[#b89758]/40 shadow-inner">
            <Shield className="w-5 h-5 text-[#d4af37]" />
            {/* Oznaka slova Q na sredini štita */}
            <span className="absolute text-[9px] font-black font-mono text-[#ffd700] tracking-tighter">
              Q
            </span>
          </div>

          {/* Indikator statusa (Zeleni stoički puls ili zlatna iskra) */}
          <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
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
