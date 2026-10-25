import { useRef, type DragEvent, type ChangeEvent } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Check, 
  ArrowDownLeft, 
  ArrowUpRight, 
  RefreshCw, 
  FileCheck2, 
  HelpCircle,
  Building,
  RotateCcw
} from 'lucide-react';
import { formatHrvatskiIznos, formatHrvatskiDatum, type BankStatementParseResult } from '@obrtniq/core';

export interface BankStatementTabProps {
  statementData: BankStatementParseResult | null;
  isProcessing: boolean;
  errorMessage: string | null;
  onParseFile: (file: File) => Promise<void>;
  onProknjiziUKpr: (stavkaId: string, dokumentId?: string) => Promise<void>;
  onResetStatement: () => void;
}

export function BankStatementTab({
  statementData,
  isProcessing,
  errorMessage,
  onParseFile,
  onProknjiziUKpr,
  onResetStatement,
}: BankStatementTabProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]!;
      onParseFile(file);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]!;
      onParseFile(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Ako još nije učitan izvod: Drag-and-drop zona */}
      {!statementData ? (
        <div className="space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-900/60 hover:bg-slate-900/90 rounded-2xl cursor-pointer transition-all text-center group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,.txt"
              className="hidden"
            />
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center py-6">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
                <p className="text-xs text-indigo-300 font-medium">Analiziram i parsam bankovni izvod...</p>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 group-hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-3 transition-transform group-hover:scale-105">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">
                  Učitajte bankovni izvod (CSV format)
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mb-3">
                  Povucite i ispustite CSV datoteku izvoda ili kliknite za odabir s računala.
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <Building className="w-3.5 h-3.5" />
                  <span>Podržani formati: ZABA, PBZ, Erste, HPB, OTP, Revolut Business</span>
                </div>
              </>
            )}
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-rose-950/40 border border-rose-800 rounded-xl text-xs text-rose-300">
              {errorMessage}
            </div>
          )}

          {/* Upute */}
          <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl text-xs space-y-2 text-slate-300">
            <h5 className="font-semibold text-white flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              Kako radi automatsko saldiranje i knjiženje?
            </h5>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px]">
              <li>Preuzmite CSV izvod sa svog poslovnog računa u m-bankingu ili internet bankarstvu.</li>
              <li>Učitajte ga ovdje – ObrtnIQ automatski analizira uplate klijenata i isplate troškova.</li>
              <li>Sustav prepoznaje pozive na broj (npr. <code>12-2026</code>) i nudi 1-klik knjiženje u KPR te promjenu statusa računa u <code>PLACENO</code>.</li>
            </ol>
          </div>
        </div>
      ) : (
        /* Prikaz parsiranog izvoda */
        <div className="space-y-4">
          {/* Sažetni banner učitanog izvoda */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl gap-3">
            <div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-white">Bankovni izvod {statementData.brojIzvoda}</span>
                <span className="text-xs text-slate-400">({formatHrvatskiDatum(statementData.datumIzvoda)})</span>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono mt-1">
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <ArrowDownLeft className="w-3.5 h-3.5" /> Uplate: {formatHrvatskiIznos(statementData.ukupnoUplateEur)}
                </span>
                <span className="text-rose-400 font-semibold flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" /> Isplate: {formatHrvatskiIznos(statementData.ukupnoIsplateEur)}
                </span>
                <span className="text-slate-400">
                  {statementData.brojStavaka} transakcija
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onResetStatement}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Učitaj drugi izvod
            </button>
          </div>

          {/* Tablica transakcija iz izvoda */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 font-medium border-b border-slate-700/80">
                <tr>
                  <th className="py-2.5 px-3">Datum</th>
                  <th className="py-2.5 px-3">Partner / Opis plaćanja</th>
                  <th className="py-2.5 px-3">Poziv na broj</th>
                  <th className="py-2.5 px-3 text-right">Iznos (€)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Akcija</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {statementData.stavke.map((st) => {
                  const isUplata = st.smjer === 'UPLATA';
                  const isReconciled = st.statusPovezivanja === 'POVEZANO_KPR';

                  return (
                    <tr key={st.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                        {formatHrvatskiDatum(st.datumKnjizenja)}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-white">{st.nazivPartnera}</div>
                        <div className="text-[11px] text-slate-400">{st.opisPlacanja}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {st.pozivNaBroj || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold whitespace-nowrap">
                        <span className={isUplata ? 'text-emerald-400' : 'text-slate-300'}>
                          {isUplata ? '+' : '-'}{formatHrvatskiIznos(st.iznosEur)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {isReconciled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <FileCheck2 className="w-2.5 h-2.5" /> U KPR-u
                          </span>
                        ) : isUplata && st.povezaniDokumentId ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            Upareno s računom
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">
                            {isUplata ? 'Neupareno' : 'Isplata'}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        {isUplata && !isReconciled && (
                          <button
                            type="button"
                            onClick={() => onProknjiziUKpr(st.id, st.povezaniDokumentId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-medium transition-colors"
                          >
                            <Check className="w-3 h-3" /> Knjiži u KPR
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
