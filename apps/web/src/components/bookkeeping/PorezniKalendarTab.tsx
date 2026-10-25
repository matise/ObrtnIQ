// apps/web/src/components/bookkeeping/PorezniKalendarTab.tsx
// Faza 20: Službeni Porezni Kalendar Republike Hrvatske za paušalne obrte

import { useState, useMemo } from 'react';
import {
  Clock,
  QrCode,
  Filter,
} from 'lucide-react';
import {
  generirajPorezniKalendar,
  izracunajPreostaleDane,
  odrediStatusRoka,
  dohvatiSljedeciPorezniRok,
  formatHrvatskiIznos,
  generateHub3Payload,
  generateEpcQrForGovPayment,
  type TaxDeadlineEntry,
  type TaxDeadlineType,
  type TaxDeadlineStatus,
} from '@obrtniq/core';
import { Hub3PaymentModal } from './Hub3PaymentModal';

export interface PorezniKalendarTabProps {
  godina: number;
  obrtOib: string;
  obrtNaziv: string;
  obrtAdresa: string;
}

export function PorezniKalendarTab({
  godina,
  obrtOib,
  obrtNaziv,
  obrtAdresa,
}: PorezniKalendarTabProps) {
  const [filterVrsta, setFilterVrsta] = useState<TaxDeadlineType | 'SVE'>('SVE');
  const [placeniRokoviIds, setPlaceniRokoviIds] = useState<Set<string>>(() => new Set());

  // Modal za HUB-3 uplatnicu
  const [activeModalRok, setActiveModalRok] = useState<TaxDeadlineEntry | null>(null);

  // Svi zakonski rokovi za odabranu godinu
  const sviRokovi = useMemo(() => {
    return generirajPorezniKalendar(godina, obrtOib || '00000000000');
  }, [godina, obrtOib]);

  // Sljedeći najhitniji rok
  const sljedeciRokInfo = useMemo(() => {
    return dohvatiSljedeciPorezniRok(sviRokovi);
  }, [sviRokovi]);

  // Filtrirani rokovi
  const filtriraniRokovi = useMemo(() => {
    return sviRokovi.filter((r) => {
      if (filterVrsta !== 'SVE' && r.vrsta !== filterVrsta) return false;
      return true;
    });
  }, [sviRokovi, filterVrsta]);

  const togglePlaceno = (id: string) => {
    setPlaceniRokoviIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Otvaranje HUB-3 uplatnice za zadani rok
  const handleOpenHub3 = (rok: TaxDeadlineEntry) => {
    setActiveModalRok(rok);
  };

  // Generiranje payloada za aktivni modal
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

  return (
    <div className="space-y-6">
      {/* Zaglavlje taba */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white tracking-wide">
              Službeni Porezni Kalendar RH ({godina}.)
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Porezna uprava RH
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Pregled svih zakonskih obveza za paušalni obrt: 12 mjesečnih doprinosa, 4 kvartalne akontacije poreza na dohodak i predaja Obrasca PO-SD do 15. siječnja.
          </p>
        </div>

        {/* Filteri */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {(['SVE', 'DOPRINOSI', 'PAUSALNI_POREZ', 'POSD_OBRAZAC'] as const).map((vrsta) => {
            const label =
              vrsta === 'SVE'
                ? `Sve (${sviRokovi.length})`
                : vrsta === 'DOPRINOSI'
                ? 'Doprinosi (12)'
                : vrsta === 'PAUSALNI_POREZ'
                ? 'Porez Q1-Q4 (4)'
                : 'PO-SD (1)';

            const isSelected = filterVrsta === vrsta;
            return (
              <button
                key={vrsta}
                onClick={() => setFilterVrsta(vrsta)}
                className={`px-2.5 py-1 rounded-lg transition font-medium ${
                  isSelected
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Proaktivni radar / Najbliži nadolazeći rok */}
      {sljedeciRokInfo && (
        <div
          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
            sljedeciRokInfo.jeHitno
              ? 'bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-900/80 border-amber-500/40 shadow-lg shadow-amber-950/20'
              : 'bg-indigo-950/20 border-indigo-500/30'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                sljedeciRokInfo.jeHitno
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
                  : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
              }`}
            >
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-slate-800 text-slate-300">
                  Sljedeći Zakonski Rok
                </span>
                <span
                  className={`text-xs font-bold ${
                    sljedeciRokInfo.preostaloDana <= 0
                      ? 'text-red-400'
                      : sljedeciRokInfo.jeHitno
                      ? 'text-amber-300'
                      : 'text-indigo-300'
                  }`}
                >
                  {sljedeciRokInfo.preostaloDana === 0
                    ? 'Dospijeva DANAS!'
                    : sljedeciRokInfo.preostaloDana < 0
                    ? `Prekoračeno prije ${Math.abs(sljedeciRokInfo.preostaloDana)} dana`
                    : `Preostalo ${sljedeciRokInfo.preostaloDana} dana (${sljedeciRokInfo.rok.datumDospijeca})`}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-white mt-0.5">{sljedeciRokInfo.rok.naslov}</h4>
              <p className="text-xs text-slate-400">{sljedeciRokInfo.rok.opis}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
            {sljedeciRokInfo.rok.okvirniIznosEur && (
              <div className="text-right">
                <p className="text-[11px] text-slate-400">Okvirni iznos</p>
                <p className="text-sm font-bold text-white">
                  {formatHrvatskiIznos(sljedeciRokInfo.rok.okvirniIznosEur)}
                </p>
              </div>
            )}
            <button
              onClick={() => handleOpenHub3(sljedeciRokInfo.rok)}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-semibold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <QrCode className="w-4 h-4" />
              <span>Generiraj HUB-3 Nalog</span>
            </button>
          </div>
        </div>
      )}

      {/* Popis svih rokova */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtriraniRokovi.map((rok) => {
          const preostaloDana = izracunajPreostaleDane(rok.datumDospijeca);
          const jePlaceno = placeniRokoviIds.has(rok.id);
          const status: TaxDeadlineStatus = odrediStatusRoka(preostaloDana, jePlaceno);

          return (
            <div
              key={rok.id}
              className={`p-4 rounded-xl border transition-all text-xs flex flex-col justify-between gap-3 ${
                jePlaceno
                  ? 'bg-slate-950/30 border-slate-800/80 opacity-70'
                  : status === 'PREKORACENO'
                  ? 'bg-red-950/20 border-red-500/40 shadow-sm'
                  : preostaloDana <= 7
                  ? 'bg-amber-950/15 border-amber-500/30'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      rok.vrsta === 'DOPRINOSI'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : rok.vrsta === 'PAUSALNI_POREZ'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    }`}
                  >
                    {rok.vrsta === 'DOPRINOSI'
                      ? 'Doprinosi'
                      : rok.vrsta === 'PAUSALNI_POREZ'
                      ? `Porez Q${rok.kvartal}`
                      : 'PO-SD Prijava'}
                  </span>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      status === 'UPLACENO'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : status === 'PREKORACENO'
                        ? 'bg-red-500/20 text-red-300'
                        : preostaloDana <= 7
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {status === 'UPLACENO'
                      ? '✓ PLAĆENO'
                      : status === 'PREKORACENO'
                      ? `ISTEKLO (${Math.abs(preostaloDana)} d)`
                      : preostaloDana === 0
                      ? 'DANAS!'
                      : `za ${preostaloDana} dana`}
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-white">{rok.naslov}</h4>
                <p className="text-slate-400 leading-relaxed text-[11px]">{rok.opis}</p>

                <div className="pt-1 text-[11px] text-slate-400 space-y-0.5">
                  <p>
                    Rok: <strong className="text-slate-200">{rok.datumDospijeca}</strong>
                  </p>
                  <p className="truncate">
                    Primatelj: <span className="text-slate-300">{rok.primateljNaziv}</span>
                  </p>
                  <p className="font-mono text-[10px] text-slate-400">
                    {rok.model} {rok.pozivNaBroj}
                  </p>
                </div>
              </div>

              {/* Akcije i Iznos */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  {rok.okvirniIznosEur ? (
                    <span className="font-bold text-white text-sm">
                      {formatHrvatskiIznos(rok.okvirniIznosEur)}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500">ePorezna XML</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePlaceno(rok.id)}
                    className={`px-2.5 py-1 rounded text-[11px] transition font-medium ${
                      jePlaceno
                        ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {jePlaceno ? 'Poništi' : 'Označi uplaćeno'}
                  </button>

                  <button
                    onClick={() => handleOpenHub3(rok)}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded text-[11px] transition flex items-center gap-1"
                  >
                    <QrCode className="w-3 h-3" />
                    <span>HUB-3</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal za uplatnicu ako je otvoren */}
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
          isPaid={placeniRokoviIds.has(activeModalRok.id)}
          onMarkAsPaid={() => {
            togglePlaceno(activeModalRok.id);
            setActiveModalRok(null);
          }}
        />
      )}
    </div>
  );
}
