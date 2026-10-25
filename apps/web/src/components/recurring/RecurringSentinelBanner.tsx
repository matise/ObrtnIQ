// apps/web/src/components/recurring/RecurringSentinelBanner.tsx
// Faza 20: Proaktivna obavijest na radnoj plohi o dospjelim paušalnim računima

import { Repeat, ArrowRight } from 'lucide-react';
import { formatHrvatskiIznos } from '@obrtniq/core';

export interface RecurringSentinelBannerProps {
  dospjeloBroj: number;
  ukupnoEur: number;
  onOpenModal: () => void;
  onDismiss?: () => void;
}

export function RecurringSentinelBanner({
  dospjeloBroj,
  ukupnoEur,
  onOpenModal,
}: RecurringSentinelBannerProps) {
  if (dospjeloBroj <= 0) return null;

  return (
    <div className="w-full bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-emerald-500/10 border-y sm:border sm:rounded-xl border-amber-500/30 px-4 py-2.5 mb-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2.5 text-slate-200">
        <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
          <Repeat className="w-4 h-4 animate-spin-slow" />
        </div>
        <div>
          <span className="font-semibold text-amber-300">
            Dospjelo je {dospjeloBroj} {dospjeloBroj === 1 ? 'ponavljajući račun' : 'ponavljajuća računa'}
          </span>{' '}
          za ovaj mjesec u ukupnom iznosu od{' '}
          <span className="font-bold text-white">{formatHrvatskiIznos(ukupnoEur)}</span>.
        </div>
      </div>

      <button
        onClick={onOpenModal}
        className="self-end sm:self-center px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 hover:text-white font-medium rounded-lg transition flex items-center gap-1.5 shrink-0"
      >
        <span>Pregledaj i Pripremi Nacrte</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
