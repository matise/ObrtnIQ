// apps/web/src/components/bookkeeping/DoprinosiTab.tsx

import { useState } from 'react';
import { 
  Calendar, 
  AlertCircle, 
  QrCode, 
  Clock, 
  Check, 
  Building2,
  HelpCircle
} from 'lucide-react';
import { 
  formatHrvatskiIznos, 
  formatHrvatskiDatum,
  generateHub3ForDoprinos,
  generateHub3ForPorez,
  generateEpcQrForGovPayment,
  type MjesecniObracunDoprinosa,
  type KvartalniPorezNalog,
  type PojedinacniNalogDoprinosa
} from '@obrtniq/core';
import { Hub3PaymentModal } from './Hub3PaymentModal';

export interface DoprinosiTabProps {
  obrtOib: string;
  obrtNaziv: string;
  obrtAdresa: string;
  godina: number;
  mjesecniDoprinosi: MjesecniObracunDoprinosa[];
  kvartalniPorezi: KvartalniPorezNalog[];
  statistika: {
    ukupnoDoprinosaGodina: number;
    ukupnoUplacenoDoprinosa: number;
    preostaloDoprinosa: number;
    brojNeplacenihDospjelih: number;
    ukupnoPorezaGodina: number;
    ukupnoUplacenoPoreza: number;
  };
  onOznaciDoprinosUplacenim: (mjesec: number, datum?: string) => Promise<void>;
  onPonistiUplatuDoprinosa: (mjesec: number) => Promise<void>;
  onOznaciPorezUplacenim: (kvartal: 1 | 2 | 3 | 4, datum?: string) => Promise<void>;
}

const MJESECI_NAZIVI = [
  'Siječanj', 'Veljača', 'Ožujak', 'Travanj', 'Svibanj', 'Lipanj',
  'Srpanj', 'Kolovoz', 'Rujan', 'Listopad', 'Studeni', 'Prosinac'
];

export function DoprinosiTab({
  obrtOib,
  obrtNaziv,
  obrtAdresa,
  godina,
  mjesecniDoprinosi,
  kvartalniPorezi,
  statistika,
  onOznaciDoprinosUplacenim,
  onPonistiUplatuDoprinosa,
  onOznaciPorezUplacenim,
}: DoprinosiTabProps) {
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    naslov: string;
    opis: string;
    iznosEur: number;
    primateljNaziv: string;
    primateljIban: string;
    model: string;
    pozivNaBroj: string;
    hub3Payload: string;
    epcQrPayload?: string;
    onMarkAsPaid?: () => void;
    isPaid?: boolean;
  } | null>(null);

  const platiteljInfo = {
    naziv: obrtNaziv || 'OBRT',
    adresa: obrtAdresa || 'Adresa obrta',
    grad: 'RH',
    oib: obrtOib,
  };

  // Otvaranje uplatnice za pojedinačni doprinos (MIO 1, MIO 2 ili HZZO)
  const openSingleDoprinosModal = (
    obracun: MjesecniObracunDoprinosa,
    vrsta: 'MIO1' | 'MIO2' | 'HZZO'
  ) => {
    let nalog: PojedinacniNalogDoprinosa;
    if (vrsta === 'MIO1') {
      nalog = {
        naziv: 'MIO I. stup (generacijska solidarnost)',
        opis: `Doprinos za MIO I ${obracun.mjesec}/${godina}`,
        iznosEur: obracun.iznosMio1Eur,
        ibanPrimatelja: obracun.ibanMio1,
        model: 'HR68',
        pozivNaBroj: obracun.pozivNaBrojMio1,
        sifraNamjene: 'GOVT',
      };
    } else if (vrsta === 'MIO2') {
      nalog = {
        naziv: 'MIO II. stup (kapitalizirana štednja)',
        opis: `Doprinos za MIO II ${obracun.mjesec}/${godina}`,
        iznosEur: obracun.iznosMio2Eur,
        ibanPrimatelja: obracun.ibanMio2,
        model: 'HR68',
        pozivNaBroj: obracun.pozivNaBrojMio2,
        sifraNamjene: 'GOVT',
      };
    } else {
      nalog = {
        naziv: 'HZZO (obvezno zdravstveno osiguranje)',
        opis: `Doprinos za HZZO ${obracun.mjesec}/${godina}`,
        iznosEur: obracun.iznosHzzoEur,
        ibanPrimatelja: obracun.ibanHzzo,
        model: 'HR68',
        pozivNaBroj: obracun.pozivNaBrojHzzo,
        sifraNamjene: 'GOVT',
      };
    }

    const hub3Payload = generateHub3ForDoprinos(platiteljInfo, nalog);
    const epcQrPayload = generateEpcQrForGovPayment({
      nazivPrimatelja: nalog.ibanPrimatelja.includes('000213') ? 'REGOS - MIO II' : 'Državni proračun RH',
      iban: nalog.ibanPrimatelja,
      iznosEur: nalog.iznosEur,
      model: nalog.model,
      pozivNaBroj: nalog.pozivNaBroj,
      opis: nalog.opis,
    });

    setModalConfig({
      isOpen: true,
      naslov: `${nalog.naziv} (${MJESECI_NAZIVI[obracun.mjesec - 1]} ${godina})`,
      opis: nalog.opis,
      iznosEur: nalog.iznosEur,
      primateljNaziv: nalog.ibanPrimatelja.includes('000213') ? 'REGOS - MIO II. stup' : 'Državni proračun RH',
      primateljIban: nalog.ibanPrimatelja,
      model: nalog.model,
      pozivNaBroj: nalog.pozivNaBroj,
      hub3Payload,
      epcQrPayload,
      isPaid: obracun.status === 'UPLACENO',
    });
  };

  // Otvaranje uplatnice za kvartalni porez
  const openPorezModal = (nalog: KvartalniPorezNalog) => {
    const hub3Payload = generateHub3ForPorez(platiteljInfo, nalog);
    const epcQrPayload = generateEpcQrForGovPayment({
      nazivPrimatelja: 'Gradski proračun',
      iban: nalog.ibanPrimatelja,
      iznosEur: nalog.iznosPorezaEur,
      model: nalog.model,
      pozivNaBroj: nalog.pozivNaBroj,
      opis: `Paušalni porez Q${nalog.kvartal}/${godina}`,
    });

    setModalConfig({
      isOpen: true,
      naslov: `Paušalni porez na dohodak (Q${nalog.kvartal}/${godina})`,
      opis: `Paušalni porez Q${nalog.kvartal}/${godina} (Razred ${nalog.razred})`,
      iznosEur: nalog.iznosPorezaEur,
      primateljNaziv: 'Gradski proračun (Paušalni porez)',
      primateljIban: nalog.ibanPrimatelja,
      model: nalog.model,
      pozivNaBroj: nalog.pozivNaBroj,
      hub3Payload,
      epcQrPayload,
      isPaid: nalog.status === 'UPLACENO',
      onMarkAsPaid: () => onOznaciPorezUplacenim(nalog.kvartal),
    });
  };

  return (
    <div className="space-y-6">
      {/* 4 sažetne metrike */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 font-medium">Godišnji doprinosi ({godina})</span>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {formatHrvatskiIznos(statistika.ukupnoDoprinosaGodina)}
          </div>
          <span className="text-[11px] text-slate-500">12 mj x 262,51 €</span>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <span className="text-xs text-emerald-400 font-medium">Plaćeno doprinosa</span>
          <div className="text-xl font-bold font-mono text-emerald-300 mt-1">
            {formatHrvatskiIznos(statistika.ukupnoUplacenoDoprinosa)}
          </div>
          <span className="text-[11px] text-slate-500">Uknjiženo u sustav</span>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <span className="text-xs text-amber-400 font-medium">Preostalo za platiti</span>
          <div className="text-xl font-bold font-mono text-amber-300 mt-1">
            {formatHrvatskiIznos(statistika.preostaloDoprinosa)}
          </div>
          {statistika.brojNeplacenihDospjelih > 0 ? (
            <span className="text-[11px] text-rose-400 font-medium">⚠️ {statistika.brojNeplacenihDospjelih} dospjelih neplaćeno</span>
          ) : (
            <span className="text-[11px] text-slate-500">Nema kašnjenja</span>
          )}
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <span className="text-xs text-indigo-400 font-medium">Godišnji paušalni porez</span>
          <div className="text-xl font-bold font-mono text-indigo-300 mt-1">
            {formatHrvatskiIznos(statistika.ukupnoPorezaGodina)}
          </div>
          <span className="text-[11px] text-slate-500">Uplaćeno: {formatHrvatskiIznos(statistika.ukupnoUplacenoPoreza)}</span>
        </div>
      </div>

      {/* Info traka o zakonodavstvu */}
      <div className="flex items-start gap-3 p-3.5 bg-indigo-950/30 border border-indigo-900/50 rounded-xl text-xs text-indigo-200">
        <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <p>
          <strong>Zakonska obveza:</strong> Doprinosi za samostalnu djelatnost (obrt kao glavno zanimanje) dospijevaju na naplatu 
          <strong> do 15. u tekućem mjesecu za prethodni mjesec</strong>. Plaćaju se putem 3 zasebna naloga (MIO I, MIO II, HZZO) s modelom <code>HR68</code>.
          Kliknite na bilo koji nalog za generiranje HUB-3 barkoda za m-banking.
        </p>
      </div>

      {/* Kartice 12 mjeseci doprinosa */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-400" />
          Mjesečni obračun i status obveznih doprinosa ({godina})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {mjesecniDoprinosi.map((obracun) => {
            const isPaid = obracun.status === 'UPLACENO';
            const isOverdue = obracun.status === 'PREKORACEN_ROK';

            return (
              <div 
                key={obracun.id}
                className={`p-4 rounded-xl border transition-all ${
                  isPaid 
                    ? 'bg-slate-900/40 border-slate-800/80 text-slate-400' 
                    : isOverdue 
                    ? 'bg-rose-950/20 border-rose-800/60' 
                    : 'bg-slate-900/80 border-slate-700/80'
                }`}
              >
                {/* Zaglavlje kartice */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      {MJESECI_NAZIVI[obracun.mjesec - 1]} {godina}.
                    </span>
                    <span className="text-xs text-slate-400">
                      (dospijeva {formatHrvatskiDatum(obracun.rokPlacanja)})
                    </span>
                  </div>

                  {isPaid ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <Check className="w-3 h-3" /> Plaćeno {obracun.datumUplate ? `(${formatHrvatskiDatum(obracun.datumUplate)})` : ''}
                    </span>
                  ) : isOverdue ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                      <AlertCircle className="w-3 h-3" /> Prekoračen rok!
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      <Clock className="w-3 h-3" /> Čeka uplatu
                    </span>
                  )}
                </div>

                {/* 3 stavke doprinosa */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between p-1.5 rounded hover:bg-slate-800/50 transition-colors">
                    <span className="text-slate-300">1. MIO I. stup (15%):</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-200">{formatHrvatskiIznos(obracun.iznosMio1Eur)}</span>
                      <button
                        type="button"
                        onClick={() => openSingleDoprinosModal(obracun, 'MIO1')}
                        className="px-2 py-0.5 text-[10px] bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded border border-slate-700 transition-colors flex items-center gap-1"
                      >
                        <QrCode className="w-2.5 h-2.5" /> Uplatnica
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-1.5 rounded hover:bg-slate-800/50 transition-colors">
                    <span className="text-slate-300">2. MIO II. stup (5%):</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-200">{formatHrvatskiIznos(obracun.iznosMio2Eur)}</span>
                      <button
                        type="button"
                        onClick={() => openSingleDoprinosModal(obracun, 'MIO2')}
                        className="px-2 py-0.5 text-[10px] bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded border border-slate-700 transition-colors flex items-center gap-1"
                      >
                        <QrCode className="w-2.5 h-2.5" /> Uplatnica
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-1.5 rounded hover:bg-slate-800/50 transition-colors">
                    <span className="text-slate-300">3. HZZO zdravstvo (16.5%):</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-200">{formatHrvatskiIznos(obracun.iznosHzzoEur)}</span>
                      <button
                        type="button"
                        onClick={() => openSingleDoprinosModal(obracun, 'HZZO')}
                        className="px-2 py-0.5 text-[10px] bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded border border-slate-700 transition-colors flex items-center gap-1"
                      >
                        <QrCode className="w-2.5 h-2.5" /> Uplatnica
                      </button>
                    </div>
                  </div>
                </div>

                {/* Podnožje kartice s ukupno i akcijom */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80">
                  <div className="text-xs">
                    <span className="text-slate-400">Ukupno: </span>
                    <span className="font-bold font-mono text-white text-sm">{formatHrvatskiIznos(obracun.ukupnoDoprinosiEur)}</span>
                  </div>

                  {isPaid ? (
                    <button
                      type="button"
                      onClick={() => onPonistiUplatuDoprinosa(obracun.mjesec)}
                      className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      Poništi status
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOznaciDoprinosUplacenim(obracun.mjesec)}
                      className="flex items-center gap-1 px-3 py-1 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded text-xs font-medium transition-colors"
                    >
                      <Check className="w-3 h-3" /> Označi plaćenim
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Kvartalni paušalni porez sekcija */}
      <div className="space-y-3 pt-4 border-t border-slate-800">
        <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
          <Building2 className="w-4 h-4 text-indigo-400" />
          Kvartalni paušalni porez na dohodak ({godina})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {kvartalniPorezi.map((porez) => {
            const isPaid = porez.status === 'UPLACENO';
            return (
              <div 
                key={porez.kvartal}
                className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                  isPaid ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-900/80 border-slate-700/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white">Q{porez.kvartal} ({godina}.)</span>
                    {isPaid ? (
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Plaćeno
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 font-medium">Do {formatHrvatskiDatum(porez.rokPlacanja)}</span>
                    )}
                  </div>
                  <div className="text-lg font-bold font-mono text-white mb-2">
                    {formatHrvatskiIznos(porez.iznosPorezaEur)}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Razred {porez.razred} • Model HR68
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => openPorezModal(porez)}
                    className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                  >
                    <QrCode className="w-3 h-3" /> Uplatnica
                  </button>

                  {!isPaid && (
                    <button
                      type="button"
                      onClick={() => onOznaciPorezUplacenim(porez.kvartal)}
                      className="px-2 py-0.5 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded text-[10px] font-medium transition-colors"
                    >
                      Plaćeno
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal za prikaz HUB-3 uplatnice */}
      {modalConfig && (
        <Hub3PaymentModal
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig(null)}
          naslov={modalConfig.naslov}
          opis={modalConfig.opis}
          iznosEur={modalConfig.iznosEur}
          platiteljImeAdresa={`${platiteljInfo.naziv}, ${platiteljInfo.adresa}`}
          primateljNaziv={modalConfig.primateljNaziv}
          primateljIban={modalConfig.primateljIban}
          model={modalConfig.model}
          pozivNaBroj={modalConfig.pozivNaBroj}
          hub3Payload={modalConfig.hub3Payload}
          epcQrPayload={modalConfig.epcQrPayload}
          isPaid={modalConfig.isPaid}
          onMarkAsPaid={modalConfig.onMarkAsPaid}
        />
      )}
    </div>
  );
}
