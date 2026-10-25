import React from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Sparkles,
} from 'lucide-react';
import { useAudioTransport } from '../context/AudioTransportContext';
import { ObrtEmblem } from './icons';

export interface ZigoGlobalAudioTransportProps {
  className?: string;
}

export const ZigoGlobalAudioTransport: React.FC<ZigoGlobalAudioTransportProps> = ({
  className = '',
}) => {
  const {
    queue,
    currentIndex,
    status,
    activeItem,
    isMuted,
    autoRead,
    pause,
    resume,
    stop,
    toggleMute,
    toggleAutoRead,
    skipNext,
    skipPrev,
  } = useAudioTransport();

  const isPlaying = status === 'playing';
  const isPaused = status === 'paused';
  const hasQueue = queue.length > 0;

  // Ako nema aktivnog govora i nije uključen autoRead i red je prazan, prikazujemo minimalni status
  if (!hasQueue && !isPlaying && !isPaused) {
    return (
      <div className={`flex items-center justify-between px-2.5 py-1 bg-[#16181d] border-b border-[#b89758]/20 text-[10px] font-mono text-gray-400 select-none ${className}`}>
        <div className="flex items-center gap-1.5">
          <Volume2 size={12} className={autoRead ? 'text-[#ffd700]' : 'text-gray-500'} />
          <span>Narator: {autoRead ? 'Auto-čitaj aktivan' : 'Ručno pokretanje'}</span>
        </div>

        <button
          type="button"
          onClick={toggleAutoRead}
          className={`flex items-center gap-1 px-1.5 py-0.5 border text-[9px] font-bold uppercase transition-colors cursor-pointer ${
            autoRead
              ? 'bg-[#ffd700]/15 border-[#ffd700]/50 text-[#ffd700]'
              : 'bg-[#22242a] border-gray-700 text-gray-400 hover:text-gray-200'
          }`}
          title="Automatski naglas pročitaj svaki novi odgovor Žiga"
        >
          <Sparkles size={10} />
          <span>Auto-čitaj: {autoRead ? 'ON' : 'OFF'}</span>
        </button>
      </div>
    );
  }

  const currentStep = currentIndex >= 0 ? currentIndex + 1 : 0;
  const totalSteps = queue.length;

  return (
    <div
      className={`bg-[#141518]/95 backdrop-blur-md border-b border-[#b89758]/40 px-3 py-2 text-white shadow-xl flex flex-col gap-1.5 font-sans select-none animate-fadeIn ${className}`}
    >
      {/* 1. Gornji red: status trenutnog elementa i brojač */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <ObrtEmblem
            emblem="zigo-emblem"
            size={20}
            rotatingRing={isPlaying}
            ringSpeed="fast"
            glowing={isPlaying}
          />
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-mono text-[11px] font-bold text-[#ffd700] uppercase shrink-0">
              {activeItem?.label || 'Žigo govori'}
            </span>
            <span className="text-gray-500">•</span>
            <span className="font-mono text-[10px] text-gray-300 truncate max-w-[260px] italic">
              {activeItem?.rawText ? activeItem.rawText.slice(0, 70) + '...' : 'Priprema izgovora...'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {totalSteps > 0 && (
            <span className="font-mono text-[9px] px-1.5 py-0.2 bg-[#252830] border border-[#b89758]/30 text-[#e0cfab]">
              Dio {currentStep} od {totalSteps}
            </span>
          )}

          {/* Mute gumb */}
          <button
            type="button"
            onClick={toggleMute}
            className={`p-1 border transition-colors cursor-pointer ${
              isMuted
                ? 'bg-red-950/80 border-red-500 text-red-400'
                : 'bg-[#252830] hover:bg-[#2e313b] border-gray-700 text-gray-300 hover:text-white'
            }`}
            title={isMuted ? 'Uključi zvuk (Unmute)' : 'Utišaj govor (Mute)'}
          >
            {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
          </button>
        </div>
      </div>

      {/* 2. Donji red: Master Transport Kontrole (STOP, Pauza, Skip) */}
      <div className="flex items-center justify-between pt-1 border-t border-white/10">
        <button
          type="button"
          onClick={toggleAutoRead}
          className={`flex items-center gap-1 text-[9px] font-mono cursor-pointer transition-colors ${
            autoRead ? 'text-[#ffd700]' : 'text-gray-400 hover:text-gray-200'
          }`}
          title="Automatsko čitanje novih pristiglih poruka"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${autoRead ? 'bg-[#ffd700]' : 'bg-gray-600'}`} />
          <span>Auto-čitaj: {autoRead ? 'UKLJUČEN' : 'ISKLJUČEN'}</span>
        </button>

        <div className="flex items-center gap-1.5">
          {/* Prethodno */}
          <button
            type="button"
            onClick={skipPrev}
            disabled={currentIndex <= 0}
            className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="Prethodni dio"
          >
            <SkipBack size={13} />
          </button>

          {/* Pauza / Nastavak */}
          {isPlaying ? (
            <button
              type="button"
              onClick={pause}
              className="flex items-center gap-1 px-2 py-0.5 bg-[#b89758]/30 hover:bg-[#b89758]/50 text-[#ffd700] border border-[#ffd700]/50 text-[10px] font-mono font-bold cursor-pointer transition-colors"
              title="Pauziraj čitanje"
            >
              <Pause size={11} className="fill-current" />
              <span>Pauza</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={resume}
              className="flex items-center gap-1 px-2 py-0.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/50 text-[10px] font-mono font-bold cursor-pointer transition-colors"
              title="Nastavi čitanje"
            >
              <Play size={11} className="fill-current" />
              <span>Nastavi</span>
            </button>
          )}

          {/* Iduće */}
          <button
            type="button"
            onClick={skipNext}
            disabled={currentIndex >= totalSteps - 1}
            className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="Sljedeći dio"
          >
            <SkipForward size={13} />
          </button>

          {/* STOP — crvena tipka */}
          <button
            type="button"
            onClick={stop}
            className="flex items-center gap-1 px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white border border-red-400/50 font-mono font-bold text-[10px] uppercase cursor-pointer transition-all active:scale-95 shadow-md ml-1"
            title="Prekini sve izgovore i očisti listu (STOP)"
          >
            <Square size={10} className="fill-current" />
            <span>STOP</span>
          </button>
        </div>
      </div>
    </div>
  );
};
