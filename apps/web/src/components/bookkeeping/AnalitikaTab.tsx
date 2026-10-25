import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Receipt, 
  ShieldCheck, 
  Package, 
  Users, 
  FileText, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar,
  Archive,
} from 'lucide-react';
import { 
  izracunajGodisnjuAnalitiku, 
  formatHrvatskiIznos, 
  formatHrvatskiDatum,
  type NaplataPromet, 
  type UlazniTrosak, 
  type MjesecniObracunDoprinosa, 
  type KvartalniPorezNalog,
  type TrosakKategorijaUdio,
  type TopPartnerStatistika,
  type MjesecniTrendStatistika
} from '@obrtniq/core';
import { AnnualReportPdfModal } from './AnnualReportPdfModal';
import { generateAuditZipPackage, downloadAuditZip } from '../../services/audit-export-service';


export interface AnalitikaTabProps {
  selectedYear: number;
  kprStavke: NaplataPromet[];
  troskovi: UlazniTrosak[];
  mjesecniDoprinosi: MjesecniObracunDoprinosa[];
  kvartalniPorezi: KvartalniPorezNalog[];
  obrtNaziv: string;
  obrtOib: string;
  obrtVlasnik: string;
  obrtAdresa: string;
}

export const AnalitikaTab: React.FC<AnalitikaTabProps> = ({
  selectedYear,
  kprStavke,
  troskovi,
  mjesecniDoprinosi,
  kvartalniPorezi,
  obrtNaziv,
  obrtOib,
  obrtVlasnik,
  obrtAdresa,
}) => {
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);

  const handleExportZip = async () => {
    setIsExportingZip(true);
    try {
      const res = await generateAuditZipPackage({
        godina: selectedYear,
        obrtProfil: {
          id: 'obrt-current',
          naziv: obrtNaziv,
          vlasnikImePrezime: obrtVlasnik,
          oib: obrtOib,
          ulicaIBroj: obrtAdresa,
          postanskiBroj: '10000',
          mjesto: 'Zagreb',
          drzavaIso: 'HR',
          email: '',
          iban: '',
          jePausalist: true,
          uSustavuPdv: false,
          poslovniProstorOznaka: 'POSL1',
          naplatniUredjajOznaka: '1',
          eracunPosrednik: 'BEZ_POSREDNIKA',
        },
      });
      downloadAuditZip(res.blob, res.filename);
    } catch (err: any) {
      alert(`Greška pri generiranju ZIP paketa: ${err?.message || 'Nepoznata greška'}`);
    } finally {
      setIsExportingZip(false);
    }
  };

  // Glavni izračun analitike preko core domenske funkcije
  const analitika = useMemo(() => {
    return izracunajGodisnjuAnalitiku({
      godina: selectedYear,
      kprStavke,
      troskovi,
      doprinosiUplate: mjesecniDoprinosi,
      kvartalniPorezi,
    });
  }, [selectedYear, kprStavke, troskovi, mjesecniDoprinosi, kvartalniPorezi]);

  const preostaloDoPragaEur = Math.max(0, analitika.pragLimitPausalEur - analitika.ukupniPrimiciEur);
  const isPrekoracen = analitika.ukupniPrimiciEur > analitika.pragLimitPausalEur;
  const isKriticno = analitika.postotakIskoristenostiPraga >= 90;

  return (
    <div className="space-y-6">
      {/* Gornja traka: Naslov i gumb za PDF izvještaj */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              Godišnja Financijska Analitika i Profitabilnost ({selectedYear}.)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Cjeloviti uvid u KPR primitke, operativne troškove, uplaćene doprinose i čistu neto zaradu obrta.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportZip}
            disabled={isExportingZip}
            className="flex items-center justify-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-all shadow-md cursor-pointer disabled:opacity-50"
            title="Preuzmi arhivski paket koji sadrži KPR CSV, PO-SD XML, troškove i analitiku za Poreznu upravu"
          >
            <Archive className="w-4 h-4" />
            {isExportingZip ? 'Pakiranje ZIP...' : 'Porezni Paket (ZIP)'}
          </button>

          <button
            type="button"
            onClick={() => setIsPdfModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold text-xs rounded-lg transition-all shadow-md cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            Službeni A4 Izvještaj (PDF)
          </button>
        </div>
      </div>


      {/* 4 Glavne KPI Kartice */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. KPR Primici */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">1. KPR Primici</span>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center">
              <ArrowUpRight className="w-3 h-3" /> Bruto prihod
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {formatHrvatskiIznos(analitika.ukupniPrimiciEur)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 font-mono">
            <span>Sve uplate u KPR</span>
            <span className="text-emerald-400 font-bold">100% prihod</span>
          </div>
        </div>

        {/* 2. Operativni Troškovi */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">2. Operativni Troškovi</span>
            <span className="text-[10px] text-rose-400 font-mono flex items-center">
              <ArrowDownRight className="w-3 h-3" /> Rashodi
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-300">
            {formatHrvatskiIznos(analitika.ukupniOperativniTroskoviEur)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 font-mono">
            <span>Gorivo, režije, oprema...</span>
            <span className="text-slate-300">
              {analitika.troskoviPoKategorijama.length} kat.
            </span>
          </div>
        </div>

        {/* 3. Obvezni Doprinosi & Porezi */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">3. Doprinosi & Porez</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-300">
            {formatHrvatskiIznos(analitika.ukupnoPlaceniDoprinosiEur + analitika.ukupnoPlaceniPorezEur)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 font-mono">
            <span>Doprinosi: {formatHrvatskiIznos(analitika.ukupnoPlaceniDoprinosiEur)}</span>
            <span>Porez: {formatHrvatskiIznos(analitika.ukupnoPlaceniPorezEur)}</span>
          </div>
        </div>

        {/* 4. Čista Neto Dobit */}
        <div className="p-4 bg-gradient-to-br from-emerald-950/40 to-slate-900/80 border-2 border-emerald-500/40 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-emerald-400">
            <span className="font-bold uppercase tracking-wider">4. Čista Neto Dobit</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold font-mono">
              MARŽA: {analitika.profitnaMarzaPostotak}%
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">
            {formatHrvatskiIznos(analitika.netoDobitEur)}
          </div>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            Zarada nakon podmirenja svih rashoda
          </div>
        </div>
      </div>

      {/* Traka statusa paušalnog praga */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">
              Status Zakonskog Paušalnog Praga ({formatHrvatskiIznos(analitika.pragLimitPausalEur)})
            </span>
            {isPrekoracen ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                PREKORAČEN PRAG
              </span>
            ) : isKriticno ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                OPASNA ZONA (&gt;90%)
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                SIGURNO ({analitika.postotakIskoristenostiPraga}%)
              </span>
            )}
          </div>
          <span className="font-mono text-slate-300">
            Preostalo do praga:{' '}
            <strong className="text-white">{formatHrvatskiIznos(preostaloDoPragaEur)}</strong>
          </span>
        </div>

        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isPrekoracen
                ? 'bg-rose-500'
                : isKriticno
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, analitika.postotakIskoristenostiPraga)}%` }}
          />
        </div>
      </div>

      {/* Dva stupca: Kategorije Troškova i Top 5 Klijenata */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lijevi stupac: Struktura operativnih troškova */}
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Receipt className="w-4 h-4 text-indigo-400" />
              <span>Struktura Troškova po Kategorijama</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Ukupno: <strong className="text-rose-300">{formatHrvatskiIznos(analitika.ukupniOperativniTroskoviEur)}</strong>
            </span>
          </div>

          <div className="space-y-3">
            {analitika.troskoviPoKategorijama.map((kat: TrosakKategorijaUdio) => (
              <div key={kat.kategorija} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300 font-sans">{kat.naziv}</span>
                  <div className="space-x-3 text-right">
                    <span className="font-bold text-white">{formatHrvatskiIznos(kat.iznosEur)}</span>
                    <span className="text-indigo-400 w-12 inline-block text-right">{kat.postotak}%</span>
                  </div>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${kat.postotak}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desni stupac: Top Partneri po prihodu */}
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Users className="w-4 h-4 text-amber-400" />
              <span>Glavni Partneri po Prometu</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Udio u prihodu
            </span>
          </div>

          {analitika.topPartneri.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 font-mono">
              Nema zabilježenih naplaćenih računa za {selectedYear}. godinu.
            </div>
          ) : (
            <div className="space-y-3">
              {analitika.topPartneri.map((partner: TopPartnerStatistika, idx: number) => (
                <div key={partner.partnerNaziv} className="p-3 bg-slate-800/40 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold font-mono flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="font-semibold text-white">{partner.partnerNaziv}</span>
                    </div>
                    <div className="font-mono text-right">
                      <span className="font-bold text-emerald-400">{formatHrvatskiIznos(partner.ukupnoUplacenoEur)}</span>
                      <span className="text-slate-400 text-[10px] ml-2">({partner.postotakUdjela}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${partner.postotakUdjela}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 12-Mjesečni Financijski Trend */}
      <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>12-Mjesečni Trend Poslovanja ({selectedYear}.)</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Mjesečni KPR vs Izdaci vs Neto Dobit
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] text-left">
                <th className="py-2">Mjesec</th>
                <th className="py-2 text-right">KPR Primici</th>
                <th className="py-2 text-right">Ukupni Izdaci</th>
                <th className="py-2 text-right">Neto Dobit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {analitika.mjesecniTrend.map((m: MjesecniTrendStatistika) => (
                <tr key={m.mjesec} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2 font-sans font-medium text-slate-300">
                    {m.nazivMjeseca}
                  </td>
                  <td className="py-2 text-right text-emerald-400 font-bold">
                    {formatHrvatskiIznos(m.primiciEur)}
                  </td>
                  <td className="py-2 text-right text-rose-300">
                    {formatHrvatskiIznos(m.izdaciEur)}
                  </td>
                  <td className={`py-2 text-right font-bold ${m.netoDobitEur >= 0 ? 'text-white' : 'text-rose-400'}`}>
                    {formatHrvatskiIznos(m.netoDobitEur)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Popis Dugotrajne Imovine (>663.61 €) */}
      <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Package className="w-4 h-4 text-indigo-400" />
            <span>Registar Dugotrajne Imovine (Vrijednost &gt; 663,61 €)</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Ukupno u imovini: <strong className="text-white">{formatHrvatskiIznos(analitika.dugotrajnaImovinaUkupnoEur)}</strong>
          </span>
        </div>

        {analitika.dugotrajnaImovinaPopis.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500 font-mono">
            Nema evidentirane opreme ili alata pojedinačne vrijednosti veće od 663,61 € u {selectedYear}. godini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] text-left">
                  <th className="py-2">Naziv Sredstva / Opreme</th>
                  <th className="py-2">Dobavljač</th>
                  <th className="py-2">Serijski Broj</th>
                  <th className="py-2">Datum Nabave</th>
                  <th className="py-2 text-right">Nabavna Vrijednost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {analitika.dugotrajnaImovinaPopis.map((di) => (
                  <tr key={di.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2 font-sans font-medium text-white">{di.opis}</td>
                    <td className="py-2 text-slate-400">{di.dobavljacNaziv}</td>
                    <td className="py-2 text-slate-400">{di.serijskiBroj || '-'}</td>
                    <td className="py-2 text-slate-400">{formatHrvatskiDatum(di.datumRacuna)}</td>
                    <td className="py-2 text-right font-bold text-indigo-300">
                      {formatHrvatskiIznos(di.iznosEur)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Službeni A4 PDF Modal */}
      <AnnualReportPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        godina={selectedYear}
        analitika={analitika}
        obrtNaziv={obrtNaziv}
        obrtOib={obrtOib}
        obrtVlasnik={obrtVlasnik}
        obrtAdresa={obrtAdresa}
      />
    </div>
  );
};
