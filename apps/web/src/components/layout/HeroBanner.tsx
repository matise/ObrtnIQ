import React from 'react';
import { CheckCircle2, Lock, Unlock } from 'lucide-react';
import type { VrstaDokumenta, StatusDokumenta } from '@obrtniq/core';

export interface HeroBannerProps {
  docType: VrstaDokumenta;
  brojDokumenta: string;
  docStatus: StatusDokumenta;
  isLocked: boolean;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  docType,
  brojDokumenta,
  docStatus,
  isLocked,
}) => {
  return (
    <div className="border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 relative overflow-hidden transition-colors no-print">
      <div className="absolute top-0 left-0 w-1 h-full bg-[#10B981]" />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-mono tracking-widest text-[#10B981] font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Faza 5 &bull; Poslovni Tijek &amp; Immutability
            </span>
            <span className="text-xs px-2 py-0.5 bg-[#064E3B] text-[#10B981] border border-[#10B981]/30 font-mono">
              Radna Ploha 58/42 Split
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Ekran za Izdavanje Računa, Multi-Stavke &amp; Statusni Automat
          </h1>
          <p className="text-sm text-[var(--text-secondary)] max-w-3xl">
            Potpuni desktop i mobilni workflow: unos više stavaka uz prečac{' '}
            <code className="text-[var(--accent-primary)] font-mono">Alt+N</code>, brzo izdavanje s
            tipkom <code className="text-[var(--accent-primary)] font-mono">F2</code>, trajno
            zakonsko zaključavanje izdanih dokumenata (immutability), te storno niz bez rupa.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right font-mono text-xs text-[var(--text-muted)]">
            <span>Aktivni status dokumenta:</span>
            <div className="text-white font-semibold flex items-center gap-1.5 justify-end">
              {isLocked ? (
                <Lock className="w-3.5 h-3.5 text-[#10B981]" />
              ) : (
                <Unlock className="w-3.5 h-3.5 text-[#F59E0B]" />
              )}
              <span>
                {docType} {brojDokumenta} [{docStatus}]
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
