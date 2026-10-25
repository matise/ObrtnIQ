import React from 'react';
import { X, Printer, TrendingUp } from 'lucide-react';
import { 
  formatHrvatskiIznos, 
  formatHrvatskiDatum, 
  type GodisnjaAnalitikaObrta,
  type TrosakKategorijaUdio,
  type TopPartnerStatistika 
} from '@obrtniq/core';

export interface AnnualReportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  godina: number;
  analitika: GodisnjaAnalitikaObrta;
  obrtNaziv: string;
  obrtOib: string;
  obrtVlasnik: string;
  obrtAdresa: string;
}

export const AnnualReportPdfModal: React.FC<AnnualReportPdfModalProps> = ({
  isOpen,
  onClose,
  godina,
  analitika,
  obrtNaziv,
  obrtOib,
  obrtVlasnik,
  obrtAdresa,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#121316] border border-[#b89758]/50 text-slate-100 w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Toolbar (No-Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#18191e] no-print">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-[#ffd700]" />
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Godišnji Financijski Izvještaj Obrta – {godina}.
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                ISO 32000-1 A4 format za arhivu i kreditne institucije
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-[#ffd700] hover:bg-[#ffe234] text-black font-semibold text-xs rounded transition-all cursor-pointer shadow"
            >
              <Printer className="w-4 h-4" /> Ispis / Spremi PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet (A4 Styled container) */}
        <div className="flex-1 overflow-y-auto p-8 sm:p-12 font-sans bg-white text-slate-900 print:p-0 print:m-0 print:bg-white print:text-black">
          {/* Memorandum Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                {obrtNaziv || 'Paušalni Obrt'}
              </h1>
              <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                <p>Vlasnik: <span className="font-semibold text-slate-800">{obrtVlasnik || 'Nositelj obrta'}</span></p>
                <p>Adresa: {obrtAdresa || 'Sjedište obrta, Republika Hrvatska'}</p>
                <p className="font-mono">OIB: <span className="font-semibold">{obrtOib || '12345678901'}</span></p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-800">
                Službeni Izvještaj
              </span>
              <p className="text-xs text-slate-500 mt-2 font-mono">
                Datum izrade: {formatHrvatskiDatum(new Date().toISOString().split('T')[0]!)}
              </p>
              <p className="text-xs text-slate-500 font-mono">
                Porezni status: Paušalni obrt (do {formatHrvatskiIznos(analitika.pragLimitPausalEur)})
              </p>
            </div>
          </div>

          {/* Title Banner */}
          <div className="text-center my-6">
            <h2 className="text-lg font-black tracking-wide uppercase text-slate-900">
              Godišnji Analitički i Financijski Sažetak Poslovanja
            </h2>
            <p className="text-xs font-mono text-slate-600 mt-1">
              Za porezno razdoblje: 01.01.{godina}. – 31.12.{godina}.
            </p>
          </div>

          {/* Key Metric Highlights Box */}
          <div className="grid grid-cols-4 gap-3 my-6">
            <div className="p-3.5 bg-slate-50 border border-slate-300 rounded text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block font-mono">1. KPR Primici</span>
              <span className="text-base font-bold font-mono text-slate-900">
                {formatHrvatskiIznos(analitika.ukupniPrimiciEur)}
              </span>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-300 rounded text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block font-mono">2. Operativni Troškovi</span>
              <span className="text-base font-bold font-mono text-rose-700">
                {formatHrvatskiIznos(analitika.ukupniOperativniTroskoviEur)}
              </span>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-300 rounded text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block font-mono">3. Doprinosi + Porez</span>
              <span className="text-base font-bold font-mono text-slate-800">
                {formatHrvatskiIznos(analitika.ukupnoPlaceniDoprinosiEur + analitika.ukupnoPlaceniPorezEur)}
              </span>
            </div>
            <div className="p-3.5 bg-emerald-50 border-2 border-emerald-600 rounded text-center">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block font-mono">4. Čista Neto Dobit</span>
              <span className="text-base font-black font-mono text-emerald-700">
                {formatHrvatskiIznos(analitika.netoDobitEur)}
              </span>
              <span className="text-[10px] font-mono text-emerald-600 font-bold block mt-0.5">
                Marža: {analitika.profitnaMarzaPostotak}%
              </span>
            </div>
          </div>

          {/* Section: Struktura Troškova */}
          <div className="mt-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-3">
              1. Struktura Poslovnih Rashoda i Izdataka ({godina}.)
            </h3>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-300 text-slate-600 font-mono text-[11px] text-left">
                  <th className="py-1.5 font-bold">Kategorija Izdatka</th>
                  <th className="py-1.5 text-right font-bold">Iznos (EUR)</th>
                  <th className="py-1.5 text-right font-bold">Udio (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {analitika.troskoviPoKategorijama.map((kat: TrosakKategorijaUdio) => (
                  <tr key={kat.kategorija}>
                    <td className="py-1.5 font-sans font-medium text-slate-800">{kat.naziv}</td>
                    <td className="py-1.5 text-right font-bold text-slate-900">{formatHrvatskiIznos(kat.iznosEur)}</td>
                    <td className="py-1.5 text-right text-slate-600">{kat.postotak}%</td>
                  </tr>
                ))}
                <tr className="font-bold bg-slate-50 border-t-2 border-slate-300">
                  <td className="py-2 font-sans">UKUPNO OPERATIVNI TROŠKOVI</td>
                  <td className="py-2 text-right text-rose-700">{formatHrvatskiIznos(analitika.ukupniOperativniTroskoviEur)}</td>
                  <td className="py-2 text-right">100.0%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section: Popis Dugotrajne Imovine */}
          {analitika.dugotrajnaImovinaPopis.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-3">
                2. Popis Dugotrajne Imovine Obrta (Vrijednost &gt; 663,61 €)
              </h3>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-600 font-mono text-[11px] text-left">
                    <th className="py-1.5 font-bold">Naziv Sredstva / Opreme</th>
                    <th className="py-1.5 font-bold">Dobavljač</th>
                    <th className="py-1.5 font-bold">Serijski Broj</th>
                    <th className="py-1.5 font-bold">Datum Nabave</th>
                    <th className="py-1.5 text-right font-bold">Nabavna Vrijednost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {analitika.dugotrajnaImovinaPopis.map((di) => (
                    <tr key={di.id}>
                      <td className="py-1.5 font-sans font-medium text-slate-800">{di.opis}</td>
                      <td className="py-1.5 text-slate-600">{di.dobavljacNaziv}</td>
                      <td className="py-1.5 text-slate-500">{di.serijskiBroj || '-'}</td>
                      <td className="py-1.5 text-slate-600">{formatHrvatskiDatum(di.datumRacuna)}</td>
                      <td className="py-1.5 text-right font-bold text-slate-900">{formatHrvatskiIznos(di.iznosEur)}</td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-slate-50 border-t-2 border-slate-300">
                    <td colSpan={4} className="py-2 font-sans">UKUPNO DUGOTRAJNA IMOVINA</td>
                    <td className="py-2 text-right text-slate-900">
                      {formatHrvatskiIznos(analitika.dugotrajnaImovinaUkupnoEur)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Section: Glavni Partneri */}
          {analitika.topPartneri.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-3">
                3. Glavni Poslovni Partneri po Prometu
              </h3>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-600 font-mono text-[11px] text-left">
                    <th className="py-1.5 font-bold">Naziv Partnera / Kupca</th>
                    <th className="py-1.5 text-center font-bold">Broj Uplata</th>
                    <th className="py-1.5 text-right font-bold">Ukupno Naplaćeno</th>
                    <th className="py-1.5 text-right font-bold">Udio u Prihodu (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {analitika.topPartneri.map((partner: TopPartnerStatistika) => (
                    <tr key={partner.partnerNaziv}>
                      <td className="py-1.5 font-sans font-medium text-slate-800">{partner.partnerNaziv}</td>
                      <td className="py-1.5 text-center text-slate-600">{partner.brojUplata}</td>
                      <td className="py-1.5 text-right font-bold text-slate-900">{formatHrvatskiIznos(partner.ukupnoUplacenoEur)}</td>
                      <td className="py-1.5 text-right text-slate-600">{partner.postotakUdjela}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Verification & Signatures */}
          <div className="mt-14 pt-8 border-t border-slate-400 flex justify-between items-end text-xs">
            <div>
              <p className="font-semibold text-slate-800">U Dubrovniku, {formatHrvatskiDatum(new Date().toISOString().split('T')[0]!)}</p>
              <p className="text-slate-500 text-[11px] mt-1">Izvještaj generiran automatski iz sustava ObrtnIQ</p>
            </div>
            <div className="text-center w-52">
              <div className="border-b border-slate-800 mb-2 pb-8" />
              <p className="font-semibold text-slate-800">{obrtVlasnik || 'Potpis nositelja obrta'}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">M.P. / Potpis</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
