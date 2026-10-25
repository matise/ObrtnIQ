import React from 'react';
import { Mic, MicOff, Square, AlertCircle } from 'lucide-react';
import type { UseZigoVoiceReturn } from '../hooks/useZigoVoice';
import { ObrtEmblem } from './icons';

export interface ZigoVoiceBarProps {
  voice: UseZigoVoiceReturn;
  onClose?: () => void;
  className?: string;
}

export const ZigoVoiceBar: React.FC<ZigoVoiceBarProps> = ({
  voice,
  onClose,
  className = '',
}) => {
  const {
    isSupported,
    isRecording,
    isDumando,
    interimText,
    finalText,
    errorMessage,
    dumanjeLabel,
    startListening,
    stopListening,
    stopAll,
  } = voice;

  if (!isSupported) {
    return (
      <div className={`p-3 bg-[#1e1c18] border border-amber-600/40 rounded-none text-xs text-amber-200/90 flex items-center gap-2 ${className}`}>
        <AlertCircle size={16} className="text-amber-400 shrink-0" />
        <span>Tvoj preglednik ne podržava glasovni unos (Web Speech API). Koristi Google Chrome ili Edge.</span>
      </div>
    );
  }

  return (
    <div
      className={`bg-[#141518]/95 backdrop-blur-md border border-[#b89758]/40 shadow-2xl p-3 text-slate-100 flex flex-col gap-2.5 transition-all duration-300 font-sans ${className}`}
    >
      {/* 1. Zaglavlje s Orlandom i STOP tipkom */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ObrtEmblem
            emblem="zigo-emblem"
            size={24}
            rotatingRing={isRecording || isDumando}
            ringSpeed={isDumando ? 'fast' : 'slow'}
            glowing={isRecording || isDumando}
          />
          <span className="font-mono text-xs font-bold tracking-wide text-[#f0e6d2]">
            Žigo Glasovni Bedem
          </span>
          {isRecording && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-red-950/60 border border-red-500/40 text-red-400 text-[10px] font-mono font-bold animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              SLUŠAN
            </span>
          )}
        </div>

        {/* Tipka STOP — trenutno prekida sve mrežne pozive i dumanja */}
        {(isRecording || isDumando) && (
          <button
            onClick={stopAll}
            className="flex items-center gap-1 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-mono font-bold text-[11px] uppercase tracking-wider transition-all shadow-lg active:scale-95 cursor-pointer border border-red-400/40"
            title="Trenutačno prekini govor i zaustavi sva dumanja"
          >
            <Square size={12} className="fill-current" />
            <span>STOP</span>
          </button>
        )}
      </div>

      {/* 2. Prikaz transkripcije i stanja dumanja */}
      <div className="min-h-[44px] bg-[#0d0e11] p-2 border border-[#b89758]/20 text-xs font-mono select-text flex flex-col justify-center">
        {errorMessage && (
          <div className="text-red-400 flex items-center gap-1.5">
            <AlertCircle size={13} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isRecording && !interimText && !errorMessage && (
          <span className="text-[#a09a8c] italic animate-pulse">
            Slušan te pažljivo, govori slobodno...
          </span>
        )}

        {interimText && (
          <span className="text-[#ffd700] font-medium leading-relaxed">
            {interimText}
          </span>
        )}

        {isDumando && !interimText && (
          <div className="flex items-center gap-2 text-[#b89758] font-medium animate-pulse">
            <span className="inline-block w-2 h-2 rounded-full bg-[#ffd700]" />
            <span>{dumanjeLabel}</span>
          </div>
        )}

        {!isRecording && !isDumando && !finalText && !errorMessage && (
          <span className="text-[#706c64] text-[11px]">
            Pritisni mikrofon i reci što te muči. Nema preše.
          </span>
        )}

        {!isRecording && !isDumando && finalText && !errorMessage && (
          <span className="text-emerald-400 text-[11px]">
            ✓ Poslano Žigu: <span className="text-slate-200">{finalText}</span>
          </span>
        )}
      </div>

      {/* 3. Kontrolne tipke (Mikrofon i zatvaranje) */}
      <div className="flex items-center justify-between pt-1 border-t border-[#b89758]/15">
        <span className="text-[10px] text-[#8c8270] font-mono">
          {voice.activeEngine === 'gcp_stt_v2' ? 'Google STT V2 (Chirp 2)' : 'Web Speech API (Lokalno)'}
        </span>

        <div className="flex items-center gap-2">
          {!isRecording ? (
            <button
              onClick={() => startListening()}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#b89758] hover:bg-[#d4af37] text-[#141518] font-bold text-xs transition-colors cursor-pointer"
            >
              <Mic size={13} />
              <span>Pokreni glas</span>
            </button>
          ) : (
            <button
              onClick={() => stopListening()}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#22242a] hover:bg-[#2c2f38] text-[#e0cfab] border border-[#b89758]/40 text-xs transition-colors cursor-pointer"
            >
              <MicOff size={13} />
              <span>Završi govor</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="px-2 py-1 text-[#8c8270] hover:text-[#f0e6d2] text-xs font-mono transition-colors cursor-pointer"
              title="Zatvori glasovni bedem"
            >
              Zatvori
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
