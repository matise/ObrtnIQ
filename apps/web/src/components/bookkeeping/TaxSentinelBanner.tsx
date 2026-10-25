// apps/web/src/components/bookkeeping/TaxSentinelBanner.tsx
// Faza 20: Proaktivni Sentinel za nadolazeće zakonske porezne rokove

import { useState, useMemo } from 'react';
import { QrCode, ArrowRight, ShieldAlert } from 'lucide-react';
import {
  generirajPorezniKalendar,
  dohvatiSljedeciPorezniRok,
  formatHrvatskiIznos,
  generateHub3Payload,
  generateEpcQrForGovPayment,
  type TaxDeadlineEntry,
} from '@obrtniq/core';
import { Hub3PaymentModal } from './Hub3PaymentModal';

export interface TaxSentinelBannerProps {
  obrtOib: string;
  obrtNaziv: string;
  obrtAdresa: string;
  godina?: number;
  onOpenKalendar?: () => void;
}

export function TaxSentinelBanner({
  obrtOib,
  obrtNaziv,
  obrtAdresa,
  godina = new Date().getFullYear(),
  onOpenKalendar,
}: TaxSentinelBannerProps) {
  const [activeModalRok, setActiveModalRok] = useState<TaxDeadlineEntry | null>(null);

  // Dohvat svih rokova i provjera je li nadolazeći unutar 7 dana
  const nextRokInfo = useMemo(() => {
    const calendar = generirajPorezniKalendar(godina, obrtOib || '00000000000');
    const sljedeci = dohvatiSljedeciPorezniRok(calendar);
    if (!sljedeci) return null;
    // Prikazuj sentinel samo ako je rok hitan (preostalo <= 7 dana ili je prekoračen)
    if (sljedeci.jeHitno || sljedeci.preostaloDana < 0) {
      return sljedeci;
    }
    return null;
  }, [godina, obrtOib]);

  // Generiranje payloada za HUB-3 uplatnicu
  const modalPayloads = useMemo(() => {
    if (!activeModalRok) return null;
    const iznos = activeModalRok.okvirniIznosEur || 100;

    const hub3Payload = generateHub3Payload({
      iznosEur: iznos,
      platiteljImeAdresa: `${obrtNaziv || 'Obrt'}, ${obrtAdresa || 'Hrvatska'}`,
      primateljImeAdresa: activeModalRok.primateljNaziv,
      primateljIban: activeModalRok.primateljIban,
      model: activeModalRok.model,
      pozivNaBroj: activeModalRok.pozivNaBroj,
      sifraNamjene: 'GOVT',
      opisPlacanja: activeModalRok.naslov,
    });

    const epcQrPayload = generateEpcQrForGovPayment({
      nazivPrimatelja: activeModalRok.primateljNaziv,
      iban: activeModalRok.primateljIban,
      iznosEur: iznos,
      model: activeModalRok.model,
      pozivNaBroj: activeModalRok.pozivNaBroj,
      opis: activeModalRok.naslov,
    });

    return { hub3Payload, epcQrPayload, iznos };
  }, [activeModalRok, obrtNaziv, obrtAdresa]);

  if (!nextRokInfo) return null;

  const { rok, preostaloDana } = nextRokInfo;

  return (
    <>
      <div className="w-full bg-gradient-to-r from-indigo-950/40 via-amber-950/30 to-slate-900 border-y sm:border sm:rounded-xl border-amber-500/40 px-4 py-2.5 mb-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-slate-200">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 animate-pulse">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-amber-300">
              {preostaloDana === 0
                ? 'Porezni rok dospijeva DANAS!'
                : preostaloDana < 0
                ? `Porezni rok je prekoračen za ${Math.abs(preostaloDana)} dana!`
                : `Porezni rok dospijeva za ${preostaloDana} dana (${rok.datumDospijeca})!`}
            </span>{' '}
            <span className="text-slate-300">• {rok.naslov}</span>
            {rok.okvirniIznosEur && (
              <span className="text-white font-semibold ml-1">
                ({formatHrvatskiIznos(rok.okvirniIznosEur)})
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            onClick={() => setActiveModalRok(rok)}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-semibold rounded-lg shadow transition flex items-center gap-1.5"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Plati (HUB-3)</span>
          </button>

          {onOpenKalendar && (
            <button
              onClick={onOpenKalendar}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition flex items-center gap-1"
            >
              <span>Kalendar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {activeModalRok && modalPayloads && (
        <Hub3PaymentModal
          isOpen={true}
          onClose={() => setActiveModalRok(null)}
          naslov={activeModalRok.naslov}
          opis={activeModalRok.opis}
          iznosEur={modalPayloads.iznos}
          platiteljImeAdresa={`${obrtNaziv || 'Obrt'}, ${obrtAdresa || 'Hrvatska'}`}
          primateljNaziv={activeModalRok.primateljNaziv}
          primateljIban={activeModalRok.primateljIban}
          model={activeModalRok.model}
          pozivNaBroj={activeModalRok.pozivNaBroj}
          hub3Payload={modalPayloads.hub3Payload}
          epcQrPayload={modalPayloads.epcQrPayload}
        />
      )}
    </>
  );
}
