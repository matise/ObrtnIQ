import { useState, useEffect, useMemo, useCallback, type FormEvent } from 'react';
import { 
  X, 
  BookOpen, 
  Download, 
  CheckCircle2, 
  Banknote, 
  AlertTriangle, 
  Plus,
  FileCode,
  Printer,
  ShieldCheck,
  Receipt,
  FileSpreadsheet,
  TrendingUp,
  Home,
  ArrowLeft,
  Calendar,
} from 'lucide-react';
import { dexieStorage } from '../../storage/dexie-db';
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
import { appLogger } from '../../services/logger';
import { useDoprinosi } from '../../hooks/useDoprinosi';
import { useTroskovnik } from '../../hooks/useTroskovnik';
import { useBankStatementParser } from '../../hooks/useBankStatementParser';
import { DoprinosiTab } from './DoprinosiTab';
import { TroskovnikTab } from './TroskovnikTab';
import { BankStatementTab } from './BankStatementTab';
import { AnalitikaTab } from './AnalitikaTab';
import { PorezniKalendarTab } from './PorezniKalendarTab';

export type BookkeepingTabType = 'kpr' | 'posd' | 'doprinosi' | 'troskovi' | 'izvodi' | 'analitika' | 'kalendar';


export interface BookkeepingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  obrtOib: string;
  obrtNaziv: string;
  obrtVlasnik: string;
  obrtAdresa: string;
  onKprUpdated?: () => void;
  initialTab?: BookkeepingTabType;
  isEmbedded?: boolean;
  onNavigateHome?: () => void;
}

export function BookkeepingDrawer({
  isOpen,
  onClose,
  obrtOib,
  obrtNaziv,
  obrtVlasnik,
  obrtAdresa,
  onKprUpdated,
  initialTab = 'kpr',
  isEmbedded = false,
  onNavigateHome,
}: BookkeepingDrawerProps) {
  const [activeTab, setActiveTab] = useState<BookkeepingTabType>(initialTab);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [kprStavke, setKprStavke] = useState<NaplataPromet[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal za ručni unos uplate u KPR
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualDatum, setManualDatum] = useState('2026-10-24');
  const [manualIznos, setManualIznos] = useState('1250.00');
  const [manualNacin, setManualNacin] = useState<'TRANSAKCIJSKI_RACUN' | 'GOTOVINA'>('TRANSAKCIJSKI_RACUN');
  const [manualOpis, setManualOpis] = useState('Uplata kupca po računu');
  const [manualIzvod, setManualIzvod] = useState('Izvod 1/2026');

  // Učitavanje KPR podataka
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

  // Hook za Doprinose
  const doprinosiState = useDoprinosi({
    oib: obrtOib,
    godina: selectedYear,
    ukupniPrometKprEur: posdIzvjestaj.ukupnoGodina,
  });

  // Hook za Troškovnik
  const troskovnikState = useTroskovnik({
    godina: selectedYear,
    ukupniPrometKprEur: posdIzvjestaj.ukupnoGodina,
    ukupnoPlaceniDoprinosiEur: doprinosiState.statistika.ukupnoUplacenoDoprinosa,
    ukupnoPlaceniPorezEur: doprinosiState.statistika.ukupnoUplacenoPoreza,
  });

  // Hook za Bankovne Izvode
  const statementParser = useBankStatementParser(async () => {
    await loadKprData();
    if (onKprUpdated) onKprUpdated();
  });

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

    appLogger.scope('POSD:XML').info(`Preuzet službeni PO-SD XML za ePoreznu (${selectedYear})`);
  };

  // Preuzimanje KPR tablice u CSV formatu za Microsoft Excel
  const handleDownloadCsv = () => {
    try {
      const csvContent = generateKprCsv(kprStavke, selectedYear, {
        obrtOib,
        obrtNaziv,
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

      appLogger.scope('KPR:EXPORT').info(`Preuzet službeni KPR CSV/Excel dokument (${selectedYear})`);
    } catch (err: any) {
      alert(`Greška pri generiranju CSV dokumenta: ${err?.message || 'Nepoznata greška'}`);
    }
  };

  // Spremanje ručne uplate u KPR
  const handleSaveManualPayment = async (e: FormEvent) => {
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

      appLogger.scope('KPR:PAYMENT').info(`Evidentirana uplata u KPR: ${manualOpis} (${formatHrvatskiIznos(iznosNum)})`);
    } catch (err: any) {
      alert(`Greška pri upisu u KPR: ${err?.message || 'Nepoznata greška'}`);
    }
  };

  if (!isOpen) return null;

  // Prag 40k izračuni
  const pragLimit = 40000;
  const postotakPraga = Math.min(100, (posdIzvjestaj.ukupnoGodina / pragLimit) * 100);
  const isPragWarn75 = postotakPraga >= 75 && postotakPraga < 90;
  const isPragWarn90 = postotakPraga >= 90 && postotakPraga <= 100;
  const isPragOver = posdIzvjestaj.ukupnoGodina > pragLimit;

  const content = (
    <div 
      className={
        isEmbedded
          ? "w-full bg-slate-950/90 border border-slate-800 rounded-2xl shadow-2xl flex flex-col min-h-[calc(100vh-160px)] overflow-hidden animate-in fade-in duration-200"
          : "w-full max-w-5xl bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col h-full overflow-hidden"
      }
      onClick={(e) => e.stopPropagation()}
    >
      {/* Zaglavlje ladice / workspacea */}
      <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            {isEmbedded && (
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <button
                  type="button"
                  onClick={onNavigateHome || onClose}
                  className="hover:text-amber-400 flex items-center gap-1.5 transition-colors font-medium"
                >
                  <Home className="w-3.5 h-3.5 text-amber-400" />
                  <span>Radna ploha (Home)</span>
                </button>
                <span className="text-slate-600">/</span>
                <span className="text-indigo-400 font-semibold">Knjigovodstvo i Financije</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">Knjigovodstvo i Financije Obrta</h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Faza 17
              </span>
            </div>
            <p className="text-xs text-slate-400">{obrtNaziv || 'Obrt'} • OIB: {obrtOib || '—'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Odabir godine */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700">
            <span className="text-xs text-slate-400">Godina:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              <option value={2026} className="bg-slate-900 text-white">2026.</option>
              <option value={2025} className="bg-slate-900 text-white">2025.</option>
              <option value={2024} className="bg-slate-900 text-white">2024.</option>
            </select>
            {isLoading && (
              <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          {isEmbedded ? (
            <button
              type="button"
              onClick={onNavigateHome || onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors"
              title="Povratak na radnu plohu (Alt+H)"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
              <span>Povratak na Radnu plohu</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Zatvori ladicu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

        {/* Navigacijski tabovi (5 tabova) */}
        <div className="flex items-center gap-1 px-6 bg-slate-900/60 border-b border-slate-800 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('kpr')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'kpr'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Banknote className="w-4 h-4" />
            1. Knjiga Prometa (KPR)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('posd')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'posd'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            2. Obrazac PO-SD (XML)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('doprinosi')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'doprinosi'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            3. Obvezni Doprinosi & Porezi
            {doprinosiState.statistika.brojNeplacenihDospjelih > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('troskovi')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'troskovi'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            4. Troškovnik & Izdaci
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('izvodi')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'izvodi'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            5. Uvoz Izvoda & Saldiranje
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analitika')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'analitika'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            6. Godišnja Analitika & Izvještaji
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('kalendar')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'kalendar'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            7. Porezni Kalendar RH
          </button>
        </div>


        {/* Glavni sadržaj ladice */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: KNJIGA PROMETA (KPR) */}
          {activeTab === 'kpr' && (
            <div className="space-y-6">
              {/* Status praga paušalnog obrta (40.000 €) */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">Zakonski prag paušalnog obrta (40.000,00 €)</span>
                    {isPragOver && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        PREKORAČEN PRAG
                      </span>
                    )}
                    {isPragWarn90 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        UPOZORENJE (&gt;90%)
                      </span>
                    )}
                    {isPragWarn75 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                        OPREZ (&gt;75%)
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-medium text-slate-300">
                    {formatHrvatskiIznos(posdIzvjestaj.ukupnoGodina)} / {formatHrvatskiIznos(pragLimit)} ({postotakPraga.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      isPragOver ? 'bg-rose-500' : isPragWarn90 ? 'bg-rose-400' : isPragWarn75 ? 'bg-amber-400' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${Math.min(100, postotakPraga)}%` }}
                  />
                </div>
              </div>

              {/* KPR Sažetne kartice */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                  <span className="text-xs text-slate-400 font-medium">Ukupni promet ({selectedYear})</span>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {formatHrvatskiIznos(posdIzvjestaj.ukupnoGodina)}
                  </div>
                  <span className="text-[11px] text-slate-500">{kprStavke.length} zabilježenih uplata</span>
                </div>

                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                  <span className="text-xs text-indigo-400 font-medium">Bezgotovinski (Žiro)</span>
                  <div className="text-xl font-bold font-mono text-indigo-300 mt-1">
                    {formatHrvatskiIznos(
                      posdIzvjestaj.q1.bezgotovinskiUkupno +
                      posdIzvjestaj.q2.bezgotovinskiUkupno +
                      posdIzvjestaj.q3.bezgotovinskiUkupno +
                      posdIzvjestaj.q4.bezgotovinskiUkupno
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500">Bankovni izvodi</span>
                </div>

                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                  <span className="text-xs text-emerald-400 font-medium">Gotovina (Fiskal)</span>
                  <div className="text-xl font-bold font-mono text-emerald-300 mt-1">
                    {formatHrvatskiIznos(
                      posdIzvjestaj.q1.gotovinaUkupno +
                      posdIzvjestaj.q2.gotovinaUkupno +
                      posdIzvjestaj.q3.gotovinaUkupno +
                      posdIzvjestaj.q4.gotovinaUkupno
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500">Gotovinske naplate</span>
                </div>

                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                  <span className="text-xs text-amber-400 font-medium">Porezni razred</span>
                  <div className="text-xl font-bold font-mono text-amber-300 mt-1">
                    {porezniRazredInfo ? `Razred ${porezniRazredInfo.razred}` : 'Limit!'}
                  </div>
                  <span className="text-[11px] text-slate-500">Godišnji porez: {formatHrvatskiIznos(porezniRazredInfo?.godisnjiPorezEur || 720)}</span>
                </div>
              </div>

              {/* Akcijska traka KPR-a */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-white tracking-wide">
                  Popis stavaka Knjige Prometa ({selectedYear}.)
                </h3>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadCsv}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Preuzmi CSV za Excel
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Ispiši KPR
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsManualModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Evidentiraj uplatu
                  </button>
                </div>
              </div>

              {/* KPR Tablica */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/60 text-slate-400 font-medium border-b border-slate-700/80">
                    <tr>
                      <th className="py-2.5 px-3">R.br.</th>
                      <th className="py-2.5 px-3">Datum naplate</th>
                      <th className="py-2.5 px-3">Broj temeljnice / Izvoda</th>
                      <th className="py-2.5 px-3">Opis / Platitelj</th>
                      <th className="py-2.5 px-3 text-right">Gotovina (€)</th>
                      <th className="py-2.5 px-3 text-right">Žiro-račun (€)</th>
                      <th className="py-2.5 px-3 text-right">Ukupno (€)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {kprStavke.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                          Nema zabilježenih uplata u Knjizi Prometa za {selectedYear}. godinu.
                        </td>
                      </tr>
                    ) : (
                      kprStavke.map((st) => (
                        <tr key={st.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-400">
                            {st.brojKprStavke}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-300">
                            {formatHrvatskiDatum(st.datumNaplate)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-400">
                            {st.brojIzvoda || 'Izvod'}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-white">
                            {st.opisPlatitelja}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                            {st.iznosGotovina > 0 ? formatHrvatskiIznos(st.iznosGotovina) : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                            {st.iznosBezgotovinski > 0 ? formatHrvatskiIznos(st.iznosBezgotovinski) : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                            {formatHrvatskiIznos(st.ukupnoNaplaceno)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: OBRAZAC PO-SD */}
          {activeTab === 'posd' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Službeni Obrazac PO-SD za ePoreznu ({selectedYear}.)</h3>
                  <p className="text-xs text-slate-400">Izvješće o paušalnom dohotku usklađeno s važećom XSD shemom Porezne uprave v2.0</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadXml}
                    disabled={!posdXml}
                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Preuzmi PO-SD XML
                  </button>
                </div>
              </div>

              {/* 4 kvartalne kartice */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {[posdIzvjestaj.q1, posdIzvjestaj.q2, posdIzvjestaj.q3, posdIzvjestaj.q4].map((q) => (
                  <div key={q.kvartal} className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-indigo-400">Q{q.kvartal} Kvartal</span>
                    <div className="text-lg font-bold font-mono text-white">
                      {formatHrvatskiIznos(q.ukupno)}
                    </div>
                    <div className="text-[11px] text-slate-400 space-y-0.5 pt-1 border-t border-slate-800">
                      <div className="flex justify-between">
                        <span>Žiro:</span>
                        <span className="font-mono text-slate-300">{formatHrvatskiIznos(q.bezgotovinskiUkupno)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gotovina:</span>
                        <span className="font-mono text-slate-300">{formatHrvatskiIznos(q.gotovinaUkupno)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* XML validacija */}
              {xmlValidation && (
                <div className={`p-4 rounded-xl border text-xs ${
                  xmlValidation.valid 
                    ? 'bg-emerald-950/20 border-emerald-800/50 text-emerald-300' 
                    : 'bg-rose-950/20 border-rose-800/50 text-rose-300'
                }`}>
                  <div className="flex items-center gap-2 font-bold mb-1">
                    {xmlValidation.valid ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
                    <span>{xmlValidation.valid ? 'PO-SD XML je 100% valjan i spreman za predaju na ePoreznu' : 'PO-SD XML sadrži validacijske greške'}</span>
                  </div>
                  {xmlValidation.errors.length > 0 && (
                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                      {xmlValidation.errors.map((e, idx) => <li key={idx}>{e}</li>)}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DOPRINOSI I POREZI */}
          {activeTab === 'doprinosi' && (
            <DoprinosiTab
              obrtOib={obrtOib}
              obrtNaziv={obrtNaziv}
              obrtAdresa={obrtAdresa}
              godina={selectedYear}
              mjesecniDoprinosi={doprinosiState.mjesecniDoprinosi}
              kvartalniPorezi={doprinosiState.kvartalniPorezi}
              statistika={doprinosiState.statistika}
              onOznaciDoprinosUplacenim={doprinosiState.oznaciDoprinosUplacenim}
              onPonistiUplatuDoprinosa={doprinosiState.ponistiUplatuDoprinosa}
              onOznaciPorezUplacenim={doprinosiState.oznaciPorezUplacenim}
            />
          )}

          {/* TAB 4: TROŠKOVNIK I IZDACI */}
          {activeTab === 'troskovi' && (
            <TroskovnikTab
              troskovi={troskovnikState.troskovi}
              filtriraniTroskovi={troskovnikState.filtriraniTroskovi}
              sazetak={troskovnikState.sazetak}
              cashFlow={troskovnikState.cashFlow}
              godina={selectedYear}
              filterKategorija={troskovnikState.filterKategorija}
              setFilterKategorija={troskovnikState.setFilterKategorija}
              filterStatus={troskovnikState.filterStatus}
              setFilterStatus={troskovnikState.setFilterStatus}
              searchTerm={troskovnikState.searchTerm}
              setSearchTerm={troskovnikState.setSearchTerm}
              onDodajTrosak={troskovnikState.dodajTrosak}
              onAzurirajTrosak={troskovnikState.azurirajTrosak}
              onObrisiTrosak={troskovnikState.obrisiTrosak}
            />
          )}

          {/* TAB 5: UVOZ BANKOVNIH IZVODA & SALDIRANJE */}
          {activeTab === 'izvodi' && (
            <BankStatementTab
              statementData={statementParser.statementData}
              isProcessing={statementParser.isProcessing}
              errorMessage={statementParser.errorMessage}
              onParseFile={statementParser.parseFile}
              onProknjiziUKpr={statementParser.proknjiziUplatuUKpr}
              onResetStatement={statementParser.resetStatement}
            />
          )}

          {/* TAB 6: GODIŠNJA ANALITIKA & IZVJEŠTAJI */}
          {activeTab === 'analitika' && (
            <AnalitikaTab
              selectedYear={selectedYear}
              kprStavke={kprStavke}
              troskovi={troskovnikState.troskovi}
              mjesecniDoprinosi={doprinosiState.mjesecniDoprinosi}
              kvartalniPorezi={doprinosiState.kvartalniPorezi}
              obrtNaziv={obrtNaziv}
              obrtOib={obrtOib}
              obrtVlasnik={obrtVlasnik}
              obrtAdresa={obrtAdresa}
            />
          )}

          {/* TAB 7: POREZNI KALENDAR RH */}
          {activeTab === 'kalendar' && (
            <PorezniKalendarTab
              godina={selectedYear}
              obrtOib={obrtOib}
              obrtNaziv={obrtNaziv}
              obrtAdresa={obrtAdresa}
            />
          )}
        </div>


        {/* Modal za ručni unos uplate u KPR */}
        {isManualModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
              className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700">
                <h3 className="text-sm font-semibold text-white">Evidencija uplate u KPR</h3>
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveManualPayment} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Datum stvarne uplate *</label>
                  <input
                    type="date"
                    required
                    value={manualDatum}
                    onChange={(e) => setManualDatum(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Iznos naplate (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={manualIznos}
                    onChange={(e) => setManualIznos(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-xs font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Način plaćanja</label>
                  <select
                    value={manualNacin}
                    onChange={(e) => setManualNacin(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="TRANSAKCIJSKI_RACUN">Transakcijski račun (Izvod banke)</option>
                    <option value="GOTOVINA">Gotovina (Fiskalizirano)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Opis platitelja / Račun *</label>
                  <input
                    type="text"
                    required
                    value={manualOpis}
                    onChange={(e) => setManualOpis(e.target.value)}
                    placeholder="npr. ACME Solutions po računu 12/POSL1/1"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Broj izvoda / temeljnice</label>
                  <input
                    type="text"
                    value={manualIzvod}
                    onChange={(e) => setManualIzvod(e.target.value)}
                    placeholder="npr. Izvod 12/2026"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsManualModalOpen(false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
                  >
                    Odustani
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded text-xs shadow transition-colors"
                  >
                    Upiši u KPR
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {content}
    </div>
  );
}
