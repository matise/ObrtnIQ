// apps/web/src/components/KprDrawer.tsx

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  X, 
  BookOpen, 
  Download, 
  CheckCircle2, 
  CreditCard, 
  Banknote, 
  TrendingUp, 
  AlertTriangle, 
  RefreshCw,
  Plus,
  FileCode,
  Printer
} from 'lucide-react';
import { dexieStorage } from '../storage/dexie-db';
import { 
  evidentirajNaplatu, 
  izracunajKprSazetak, 
  odrediPorezniRazred,
  generatePosdXml, 
  validatePosdXml,
  generateKprCsv,
  formatHrvatskiIznos, 
  formatHrvatskiDatum,
  type NaplataPromet, 
  type PosdIzvjestaj 
} from '@obrtniq/core';
import { appLogger } from '../services/logger';

export interface KprDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  obrtOib: string;
  obrtNaziv: string;
  obrtVlasnik: string;
  obrtAdresa: string;
  onKprUpdated?: () => void;
}

export function KprDrawer({
  isOpen,
  onClose,
  obrtOib,
  obrtNaziv,
  obrtVlasnik,
  obrtAdresa,
  onKprUpdated,
}: KprDrawerProps) {
  const [activeTab, setActiveTab] = useState<'kpr' | 'posd' | 'prag'>('kpr');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [kprStavke, setKprStavke] = useState<NaplataPromet[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal za ručni unos uplate
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualDatum, setManualDatum] = useState('2026-10-24');
  const [manualIznos, setManualIznos] = useState('1250.00');
  const [manualNacin, setManualNacin] = useState<'TRANSAKCIJSKI_RACUN' | 'GOTOVINA'>('TRANSAKCIJSKI_RACUN');
  const [manualOpis, setManualOpis] = useState('Uplata kupca po računu');
  const [manualIzvod, setManualIzvod] = useState('Izvod 1/2026');

  const loadKprData = useCallback(async () => {
    setIsLoading(true);
    try {
      const items = await dexieStorage.kpr.getAll(selectedYear);
      setKprStavke(items);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    if (isOpen) {
      loadKprData();
    }
  }, [isOpen, loadKprData]);

  // Obračun PO-SD sažetka za odabranu godinu
  const posdIzvjestaj: PosdIzvjestaj = useMemo(() => {
    return izracunajKprSazetak(kprStavke, selectedYear, {
      oib: obrtOib,
      naziv: obrtNaziv,
    });
  }, [kprStavke, selectedYear, obrtOib, obrtNaziv]);

  // Porezni razred
  const porezniRazredInfo = useMemo(() => {
    return odrediPorezniRazred(posdIzvjestaj.ukupnoGodina);
  }, [posdIzvjestaj.ukupnoGodina]);

  // Generiranje PO-SD XML-a
  const posdXml = useMemo(() => {
    try {
      return generatePosdXml({
        izvjestaj: posdIzvjestaj,
        vlasnikImePrezime: obrtVlasnik,
        adresa: obrtAdresa,
        djelatnostNkd: '62.01',
      });
    } catch {
      return '';
    }
  }, [posdIzvjestaj, obrtVlasnik, obrtAdresa]);

  const xmlValidation = useMemo(() => {
    if (!posdXml) return null;
    return validatePosdXml(posdXml);
  }, [posdXml]);

  // Preuzimanje PO-SD XML datoteke za ePoreznu
  const handleDownloadXml = () => {
    if (!posdXml) return;
    const blob = new Blob([posdXml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PO-SD_${selectedYear}_${obrtOib}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    appLogger.scope('POSD:XML').info(`Korisnik preuzeo službeni PO-SD XML za ePoreznu (${selectedYear})`, {
      godina: selectedYear,
      oib: obrtOib,
      ukupno: posdIzvjestaj.ukupnoGodina,
      razred: porezniRazredInfo?.razred || 5,
    });
  };

  // Preuzimanje KPR tablice u CSV formatu za Microsoft Excel (UTF-8 BOM, točka-zarez delimiter)
  const handleDownloadCsv = () => {
    try {
      const csvContent = generateKprCsv(kprStavke, selectedYear, {
        obrtNaziv,
        obrtOib,
      });
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `KPR_${selectedYear}_${obrtOib}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      appLogger.scope('KPR:EXPORT').info(`Preuzet službeni KPR CSV/Excel dokument (${selectedYear})`, {
        godina: selectedYear,
        oib: obrtOib,
        brojStavaka: kprStavke.length,
      });
    } catch (err: any) {
      alert(`Greška pri generiranju CSV dokumenta: ${err?.message || 'Nepoznata greška'}`);
    }
  };

  // Spremanje ručne uplate u KPR
  const handleSaveManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const iznosNum = parseFloat(manualIznos);
    if (!iznosNum || iznosNum <= 0) {
      alert('Molimo unesite valjani iznos uplate.');
      return;
    }

    try {
      await evidentirajNaplatu(dexieStorage.kpr, dexieStorage.dokumenti, {
        datumNaplate: manualDatum,
        iznos: iznosNum,
        nacinPlacanja: manualNacin,
        opisPlatitelja: manualOpis,
        brojIzvoda: manualIzvod,
      });

      setIsManualModalOpen(false);
      await loadKprData();
      if (onKprUpdated) onKprUpdated();

      appLogger.scope('KPR:PAYMENT').info(`Evidentirana uplata u KPR: ${manualOpis} (${formatHrvatskiIznos(iznosNum)})`, {
        iznos: iznosNum,
        datum: manualDatum,
        nacin: manualNacin,
      });
    } catch (err: any) {
      alert(`Greška pri upisu u KPR: ${err?.message || 'Nepoznata greška'}`);
    }
  };

  if (!isOpen) return null;

  // Izračun praga
  const pragLimit = 40000;
  const postotakPraga = Math.min(100, (posdIzvjestaj.ukupnoGodina / pragLimit) * 100);
  const isPragWarn75 = postotakPraga >= 75 && postotakPraga < 90;
  const isPragWarn90 = postotakPraga >= 90 && postotakPraga <= 100;
  const isPragOver = posdIzvjestaj.ukupnoGodina > pragLimit;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all duration-200 no-print">
      <div className="w-full max-w-4xl bg-[var(--bg-surface)] border-l border-[var(--border-strong)] flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-canvas)]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white flex items-center gap-2">
                Knjigovodstvo: Knjiga Prometa (KPR) &amp; PO-SD
                <span className="text-xs font-mono font-normal text-[#10B981] bg-[#064E3B] px-2 py-0.5 border border-[#10B981]/30">
                  Faza 6 Aktivan
                </span>
              </h2>
              <p className="text-xs font-mono text-[var(--text-muted)]">
                Pravilnik o paušalnom oporezivanju RH &bull; ePorezna XSD v2.0
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Godina selector */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="bg-[var(--bg-elevated)] text-white text-xs font-mono px-2.5 py-1 border border-[var(--border-strong)] outline-none"
            >
              <option value={2026}>Godina 2026</option>
              <option value={2025}>Godina 2025</option>
            </select>

            <button
              type="button"
              onClick={loadKprData}
              title="Osvježi podatke"
              className="p-1.5 text-[var(--text-muted)] hover:text-white border border-transparent hover:border-[var(--border-subtle)] transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Summary Bar: Prag & Ukupno */}
        <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[var(--bg-canvas)] p-3 border border-[var(--border-subtle)]">
            <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">Ukupno Naplaćeno {selectedYear}:</span>
            <span className="text-lg font-bold font-mono text-[#10B981] tabular-nums">
              {formatHrvatskiIznos(posdIzvjestaj.ukupnoGodina)}
            </span>
          </div>

          <div className="bg-[var(--bg-canvas)] p-3 border border-[var(--border-subtle)]">
            <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">Porezni Razred:</span>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold font-mono text-white">
                {porezniRazredInfo ? `Razred ${porezniRazredInfo.razred}` : 'PREKORAČEN'}
              </span>
              {porezniRazredInfo && (
                <span className="text-[11px] font-mono text-[var(--text-muted)]">
                  (Porez: {porezniRazredInfo.godisnjiPorezEur.toFixed(2)} €/god)
                </span>
              )}
            </div>
          </div>

          <div className="bg-[var(--bg-canvas)] p-3 border border-[var(--border-subtle)]">
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-[var(--text-muted)] uppercase">Paušalni Prag (40.000 €):</span>
              <span className={`font-bold tabular-nums ${isPragOver ? 'text-[#EF4444]' : isPragWarn90 ? 'text-[#EF4444]' : isPragWarn75 ? 'text-[#F59E0B]' : 'text-[#10B981]'}`}>
                {postotakPraga.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-2 bg-[var(--bg-elevated)] mt-1.5 overflow-hidden border border-[var(--border-subtle)]">
              <div 
                className={`h-full transition-all duration-300 ${
                  isPragOver 
                    ? 'bg-[#EF4444]' 
                    : isPragWarn90 
                    ? 'bg-[#EF4444]' 
                    : isPragWarn75 
                    ? 'bg-[#F59E0B]' 
                    : 'bg-[#10B981]'
                }`}
                style={{ width: `${Math.min(100, postotakPraga)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-[var(--bg-canvas)] px-4 pt-3 border-b border-[var(--border-subtle)] text-xs font-mono space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('kpr')}
            className={`py-2 px-4 border-b-2 font-bold transition-all ${
              activeTab === 'kpr'
                ? 'border-[var(--accent-primary)] text-white bg-[var(--bg-surface)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-white'
            }`}
          >
            Knjiga Prometa ({kprStavke.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('posd')}
            className={`py-2 px-4 border-b-2 font-bold transition-all ${
              activeTab === 'posd'
                ? 'border-[var(--accent-primary)] text-white bg-[var(--bg-surface)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-white'
            }`}
          >
            Obrazac PO-SD &amp; ePorezna XML
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('prag')}
            className={`py-2 px-4 border-b-2 font-bold transition-all ${
              activeTab === 'prag'
                ? 'border-[var(--accent-primary)] text-white bg-[var(--bg-surface)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-white'
            }`}
          >
            Nadzor Praga 40.000 €
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* TAB 1: KNJIGA PROMETA (KPR) */}
          {activeTab === 'kpr' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs font-mono text-[var(--text-secondary)]">
                  <span>Službena Knjiga Prometa prema čl. 82. Zakona o porezu na dohodak</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsManualModalOpen(true)}
                    className="px-3 py-1.5 bg-[#10B981] hover:bg-[#059669] text-black font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Unesi uplatu u KPR
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] text-white border border-[var(--border-strong)] font-mono font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                    Ispiši KPR
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadCsv}
                    className="px-3 py-1.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] text-white border border-[var(--border-strong)] font-mono font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer hover:border-[#10B981]"
                    title="Preuzmi Knjigu prometa u CSV formatu za Microsoft Excel (UTF-8 BOM)"
                  >
                    <Download className="w-3.5 h-3.5 text-[#10B981]" />
                    Preuzmi CSV
                  </button>
                </div>
              </div>

              {/* KPR Tablica */}
              <div className="border border-[var(--border-subtle)] overflow-x-auto text-xs font-mono">
                <table className="w-full text-left">
                  <thead className="bg-[var(--bg-canvas)] border-b border-[var(--border-subtle)] text-[11px] uppercase text-[var(--text-muted)]">
                    <tr>
                      <th className="p-2.5 text-center w-12">Rbr.</th>
                      <th className="p-2.5 w-24">Datum</th>
                      <th className="p-2.5">Opis Platitelja / Izvoda</th>
                      <th className="p-2.5 text-right w-28">Gotovina</th>
                      <th className="p-2.5 text-right w-32">Bezgotovinski</th>
                      <th className="p-2.5 text-right w-28">Ukupno</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]/40">
                    {kprStavke.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-[var(--text-muted)]">
                          Nema evidentiranih uplata u Knjizi prometa za {selectedYear}. godinu.
                        </td>
                      </tr>
                    ) : (
                      kprStavke.map((stavka) => (
                        <tr key={stavka.id} className="hover:bg-[var(--bg-elevated)]/30 transition-colors">
                          <td className="p-2.5 text-center font-bold text-white tabular-nums">
                            {stavka.brojKprStavke}
                          </td>
                          <td className="p-2.5 text-[var(--text-secondary)] whitespace-nowrap">
                            {formatHrvatskiDatum(stavka.datumNaplate)}
                          </td>
                          <td className="p-2.5">
                            <div className="font-semibold text-white">{stavka.opisPlatitelja}</div>
                            {stavka.brojIzvoda && (
                              <div className="text-[10px] text-[var(--accent-primary)] font-bold">
                                {stavka.brojIzvoda}
                              </div>
                            )}
                          </td>
                          <td className="p-2.5 text-right tabular-nums text-[var(--text-secondary)]">
                            {stavka.iznosGotovina > 0 ? `${formatHrvatskiIznos(stavka.iznosGotovina, false)} €` : '—'}
                          </td>
                          <td className="p-2.5 text-right tabular-nums text-[var(--text-secondary)]">
                            {stavka.iznosBezgotovinski > 0 ? `${formatHrvatskiIznos(stavka.iznosBezgotovinski, false)} €` : '—'}
                          </td>
                          <td className="p-2.5 text-right tabular-nums font-bold text-white">
                            {formatHrvatskiIznos(stavka.ukupnoNaplaceno)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {kprStavke.length > 0 && (
                    <tfoot className="border-t-2 border-[var(--border-strong)] bg-[var(--bg-canvas)] font-bold">
                      <tr>
                        <td colSpan={3} className="p-2.5 text-right uppercase text-[var(--text-muted)] text-[10px]">
                          Ukupno za godinu {selectedYear}:
                        </td>
                        <td className="p-2.5 text-right tabular-nums text-[var(--text-secondary)]">
                          {formatHrvatskiIznos(
                            kprStavke.reduce((sum, s) => sum + s.iznosGotovina, 0),
                            false
                          )} €
                        </td>
                        <td className="p-2.5 text-right tabular-nums text-[var(--text-secondary)]">
                          {formatHrvatskiIznos(
                            kprStavke.reduce((sum, s) => sum + s.iznosBezgotovinski, 0),
                            false
                          )} €
                        </td>
                        <td className="p-2.5 text-right tabular-nums text-[#10B981] text-sm">
                          {formatHrvatskiIznos(posdIzvjestaj.ukupnoGodina)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: OBRAZAC PO-SD */}
          {activeTab === 'posd' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Godišnje Izvješće o Paušalnom Dohotku (PO-SD) za {selectedYear}. godinu
                  </h3>
                  <p className="text-xs font-mono text-[var(--text-muted)]">
                    Elektronička predaja na ePoreznu do 15. siječnja {selectedYear + 1}. godine
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadXml}
                  className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-black font-mono font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-[#10B981]/20 active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Preuzmi PO-SD XML (ePorezna)
                </button>
              </div>

              {/* Kvartalni pregled kartice */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
                {[
                  { name: 'I. Kvartal (Q1)', data: posdIzvjestaj.q1, period: '01.01. - 31.03.' },
                  { name: 'II. Kvartal (Q2)', data: posdIzvjestaj.q2, period: '01.04. - 30.06.' },
                  { name: 'III. Kvartal (Q3)', data: posdIzvjestaj.q3, period: '01.07. - 30.09.' },
                  { name: 'IV. Kvartal (Q4)', data: posdIzvjestaj.q4, period: '01.10. - 31.12.' },
                ].map((q) => (
                  <div key={q.name} className="bg-[var(--bg-canvas)] p-3.5 border border-[var(--border-subtle)] space-y-2">
                    <div className="flex items-center justify-between border-b border-[var(--border-subtle)]/50 pb-1.5">
                      <span className="font-bold text-white">{q.name}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">{q.period}</span>
                    </div>
                    <div className="space-y-1 text-[11px] text-[var(--text-secondary)]">
                      <div className="flex justify-between">
                        <span>Gotovina:</span>
                        <span className="tabular-nums font-mono">{formatHrvatskiIznos(q.data.gotovinaUkupno, false)} €</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bezgotovinski:</span>
                        <span className="tabular-nums font-mono">{formatHrvatskiIznos(q.data.bezgotovinskiUkupno, false)} €</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-[var(--border-subtle)]/30 font-bold text-white">
                        <span>Ukupno:</span>
                        <span className="tabular-nums text-[#10B981]">{formatHrvatskiIznos(q.data.ukupno)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Porezni obračun box */}
              <div className="bg-[var(--bg-canvas)] p-4 border border-[var(--border-subtle)] space-y-3 font-mono text-xs">
                <div className="font-bold text-white uppercase text-[11px] tracking-wider text-[var(--accent-primary)]">
                  Obračun Porezne Obveze za {selectedYear}. godinu
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">Ukupni ostvareni primici:</span>
                    <span className="text-base font-bold text-[#10B981] tabular-nums">
                      {formatHrvatskiIznos(posdIzvjestaj.ukupnoGodina)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">Dodijeljeni porezni razred:</span>
                    <span className="text-base font-bold text-white">
                      {porezniRazredInfo ? `Razred ${porezniRazredInfo.razred}` : 'Prekoračen prag!'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">Godišnja porezna osnovica:</span>
                    <span className="text-base font-bold text-white tabular-nums">
                      {porezniRazredInfo ? `${porezniRazredInfo.godisnjaPoreznaOsnovicaEur.toFixed(2)} €` : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">Godišnji porez (12%):</span>
                    <span className="text-base font-bold text-[#F59E0B] tabular-nums">
                      {porezniRazredInfo ? `${porezniRazredInfo.godisnjiPorezEur.toFixed(2)} €` : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* XML Validacija status */}
              <div className={`flex items-center justify-between p-3 border text-xs font-mono ${
                xmlValidation?.valid 
                  ? 'bg-[#064E3B]/30 border-[#10B981]/40 text-[#10B981]' 
                  : 'bg-[#7F1D1D]/30 border-[#EF4444]/40 text-[#EF4444]'
              }`}>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    {xmlValidation?.valid 
                      ? 'PO-SD XML struktura validirana prema službenoj shemi ePorezne (v2.0)'
                      : `Neispravan XML: ${xmlValidation?.errors.join(', ')}`}
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 ${
                  xmlValidation?.valid ? 'bg-[#10B981] text-black' : 'bg-[#EF4444] text-white'
                }`}>
                  {xmlValidation?.valid ? 'XSD SHEMA OK' : 'GREŠKA'}
                </span>
              </div>

              {/* XML Preview kod */}
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 text-xs font-mono text-[var(--text-muted)]">
                  <FileCode className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  <span>Pregled generiranog XML-a za predaju:</span>
                </div>
                <pre className="p-3 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 leading-relaxed">
                  {posdXml}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: NADZOR PRAGA 40.000 € */}
          {activeTab === 'prag' && (
            <div className="space-y-5 font-mono text-xs">
              <div className="bg-[var(--bg-canvas)] p-5 border border-[var(--border-subtle)] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-white">Zakonski Prag Paušalnog Obrta (2026)</h3>
                    <p className="text-[11px] text-[var(--text-muted)]">Maksimalni godišnji primitak iznosi 40.000,00 EUR</p>
                  </div>
                  <span className={`text-base font-bold tabular-nums ${isPragOver ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
                    {formatHrvatskiIznos(posdIzvjestaj.ukupnoGodina)} / 40.000,00 €
                  </span>
                </div>

                {/* Veliki vizualni progress bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-4 bg-[var(--bg-elevated)] overflow-hidden border border-[var(--border-strong)] relative">
                    {/* Markeri 75% i 90% */}
                    <div className="absolute top-0 bottom-0 left-[75%] w-[1px] bg-[#F59E0B] z-10" title="75% (30.000 €)" />
                    <div className="absolute top-0 bottom-0 left-[90%] w-[1px] bg-[#EF4444] z-10" title="90% (36.000 €)" />
                    <div 
                      className={`h-full transition-all duration-500 ${
                        isPragOver 
                          ? 'bg-[#EF4444]' 
                          : isPragWarn90 
                          ? 'bg-[#EF4444]' 
                          : isPragWarn75 
                          ? 'bg-[#F59E0B]' 
                          : 'bg-[#10B981]'
                      }`}
                      style={{ width: `${Math.min(100, postotakPraga)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                    <span>0 €</span>
                    <span>75% (30.000 €)</span>
                    <span>90% (36.000 €)</span>
                    <span>100% (40.000 €)</span>
                  </div>
                </div>

                {/* Upozorenje / Status alert */}
                {isPragOver ? (
                  <div className="p-3 bg-[#7F1D1D]/40 border border-[#EF4444] text-[#EF4444] flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">PAŽNJA: PREKORAČEN ZAKONSKI PRAG OD 40.000 €!</span>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Prema Zakonu o porezu na dohodak i Zakonu o PDV-u, obrtnik koji u kalendarskoj godini ostvari primitke veće od 40.000,00 € gubi pravo na paušalno oporezivanje te je obvezan ući u sustav PDV-a i prijeći na vođenje poslovnih knjiga (dohodak/dobit) od 1. siječnja sljedeće godine.
                      </p>
                    </div>
                  </div>
                ) : isPragWarn90 ? (
                  <div className="p-3 bg-[#7F1D1D]/20 border border-[#EF4444]/60 text-[#EF4444] flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">UPOZORENJE NA 90% PRAGA: Preostalo manje od 4.000 €!</span>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Do zakonskog limita od 40.000 € preostalo je točno {formatHrvatskiIznos(pragLimit - posdIzvjestaj.ukupnoGodina)}. Svaka sljedeća naplata može uzrokovati izlazak iz paušalnog režima.
                      </p>
                    </div>
                  </div>
                ) : isPragWarn75 ? (
                  <div className="p-3 bg-[#78350F]/20 border border-[#F59E0B]/60 text-[#F59E0B] flex items-start gap-2.5">
                    <TrendingUp className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">OBAVIJEST: Dosegli ste 75% paušalnog limita (30.000 €)</span>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Preostalo je {formatHrvatskiIznos(pragLimit - posdIzvjestaj.ukupnoGodina)} do zakonskog praga. Planirajte dospijeća računa u zadnjem kvartalu.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-[#064E3B]/20 border border-[#10B981]/40 text-[#10B981] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Sigurna zona: Ostvareno je {postotakPraga.toFixed(1)}% limita. Do praga je preostalo {formatHrvatskiIznos(pragLimit - posdIzvjestaj.ukupnoGodina)}.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal za ručni unos uplate u KPR */}
        {isManualModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-strong)] p-6 max-w-md w-full space-y-4 font-mono text-xs shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <span className="font-bold text-white uppercase tracking-wider text-sm">
                  Unos Naplate u Knjigu Prometa (KPR)
                </span>
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="text-[var(--text-muted)] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveManualPayment} className="space-y-4">
                <div>
                  <label className="text-[var(--text-secondary)] font-semibold block mb-1">
                    Datum Naplate (dan izvoda ili primitka gotovine) *
                  </label>
                  <input
                    type="date"
                    required
                    value={manualDatum}
                    onChange={(e) => setManualDatum(e.target.value)}
                    className="w-full bg-[var(--bg-canvas)] text-white px-3 py-2 border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[var(--text-secondary)] font-semibold block mb-1">
                    Način Plaćanja *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setManualNacin('TRANSAKCIJSKI_RACUN')}
                      className={`py-2 px-3 flex items-center justify-center gap-1.5 border transition-all ${
                        manualNacin === 'TRANSAKCIJSKI_RACUN'
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/20 text-white font-bold'
                          : 'border-[var(--border-subtle)] text-[var(--text-muted)]'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Račun (Banka)
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualNacin('GOTOVINA')}
                      className={`py-2 px-3 flex items-center justify-center gap-1.5 border transition-all ${
                        manualNacin === 'GOTOVINA'
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/20 text-white font-bold'
                          : 'border-[var(--border-subtle)] text-[var(--text-muted)]'
                      }`}
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      Gotovina
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[var(--text-secondary)] font-semibold block mb-1">
                    Iznos Uplate (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={manualIznos}
                    onChange={(e) => setManualIznos(e.target.value)}
                    className="w-full bg-[var(--bg-canvas)] text-white px-3 py-2 border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none text-right font-bold"
                  />
                </div>

                <div>
                  <label className="text-[var(--text-secondary)] font-semibold block mb-1">
                    Opis Platitelja / Svrha *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualOpis}
                    onChange={(e) => setManualOpis(e.target.value)}
                    placeholder="npr. Alpha d.o.o. - Račun 1/POSL1/1"
                    className="w-full bg-[var(--bg-canvas)] text-white px-3 py-2 border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[var(--text-secondary)] font-semibold block mb-1">
                    Broj Bankovnog Izvoda (opcionalno)
                  </label>
                  <input
                    type="text"
                    value={manualIzvod}
                    onChange={(e) => setManualIzvod(e.target.value)}
                    placeholder="npr. Izvod 42/2026"
                    className="w-full bg-[var(--bg-canvas)] text-white px-3 py-2 border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-[var(--border-subtle)]">
                  <button
                    type="button"
                    onClick={() => setIsManualModalOpen(false)}
                    className="px-4 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] text-white border border-[var(--border-strong)]"
                  >
                    Odustani
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-black font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Spremi Uplatu
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
