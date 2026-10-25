// apps/web/src/components/bookkeeping/TroskovnikTab.tsx

import { useState, type FormEvent } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Check, 
  Tag
} from 'lucide-react';
import { 
  formatHrvatskiIznos, 
  formatHrvatskiDatum, 
  KATEGORIJE_TROSKA_LABELS,
  PRAG_DUGOTRAJNE_IMOVINE_EUR,
  type UlazniTrosak, 
  type KategorijaTroska, 
  type TroskovnikSazetak,
  type CashFlowRezultat
} from '@obrtniq/core';

export interface TroskovnikTabProps {
  troskovi: UlazniTrosak[];
  filtriraniTroskovi: UlazniTrosak[];
  sazetak: TroskovnikSazetak;
  cashFlow: CashFlowRezultat;
  godina: number;
  filterKategorija: KategorijaTroska | 'SVE';
  setFilterKategorija: (k: KategorijaTroska | 'SVE') => void;
  filterStatus: 'SVE' | 'PLACENO' | 'NEPLACENO';
  setFilterStatus: (s: 'SVE' | 'PLACENO' | 'NEPLACENO') => void;
  searchTerm: string;
  setSearchTerm: (q: string) => void;
  onDodajTrosak: (t: Omit<UlazniTrosak, 'id' | 'jeDugotrajnaImovina' | 'kreirano'>) => Promise<any>;
  onAzurirajTrosak: (id: string, partial: Partial<UlazniTrosak>) => Promise<void>;
  onObrisiTrosak: (id: string) => Promise<void>;
}

export function TroskovnikTab({
  filtriraniTroskovi,
  sazetak,
  cashFlow,
  godina,
  filterKategorija,
  setFilterKategorija,
  filterStatus,
  setFilterStatus,
  searchTerm,
  setSearchTerm,
  onDodajTrosak,
  onAzurirajTrosak,
  onObrisiTrosak,
}: TroskovnikTabProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Forma za novi trošak
  const [dobavljacNaziv, setDobavljacNaziv] = useState('');
  const [dobavljacOib, setDobavljacOib] = useState('');
  const [brojRacuna, setBrojRacuna] = useState('');
  const [datumRacuna, setDatumRacuna] = useState(new Date().toISOString().slice(0, 10));
  const [datumDospijeca, setDatumDospijeca] = useState(new Date().toISOString().slice(0, 10));
  const [kategorija, setKategorija] = useState<KategorijaTroska>('SOFTVERSKE_PRETPLATE');
  const [opis, setOpis] = useState('');
  const [iznosUkupno, setIznosUkupno] = useState('');
  const [nacinPlacanja, setNacinPlacanja] = useState<'TRANSAKCIJSKI_RACUN' | 'KARTICA_POSLOVNA' | 'GOTOVINA'>('TRANSAKCIJSKI_RACUN');
  const [status, setStatus] = useState<'PLACENO' | 'NEPLACENO'>('PLACENO');
  const [serijskiBroj, setSerijskiBroj] = useState('');

  const handleSaveExpense = async (e: FormEvent) => {
    e.preventDefault();
    const ukupnoNum = parseFloat(iznosUkupno);
    if (!ukupnoNum || ukupnoNum <= 0) {
      alert('Molimo unesite valjani iznos troška.');
      return;
    }
    if (!dobavljacNaziv.trim()) {
      alert('Molimo unesite naziv dobavljača.');
      return;
    }

    // Približni izračun osnovice i PDV-a ako nije unesen
    const osnovica = Math.round((ukupnoNum / 1.25) * 100) / 100;
    const pdv = Math.round((ukupnoNum - osnovica) * 100) / 100;

    await onDodajTrosak({
      brojUlaznogDokumenta: brojRacuna.trim() || `UL-${Date.now()}`,
      dobavljacNaziv: dobavljacNaziv.trim(),
      dobavljacOib: dobavljacOib.trim() || undefined,
      datumRacuna,
      datumDospijeca,
      datumPlacanja: status === 'PLACENO' ? datumRacuna : undefined,
      kategorija,
      opis: opis.trim() || KATEGORIJE_TROSKA_LABELS[kategorija],
      iznosBezPdvEur: osnovica,
      iznosPdvEur: pdv,
      ukupnoEur: ukupnoNum,
      nacinPlacanja,
      status,
      serijskiBrojOpreme: serijskiBroj.trim() || undefined,
    });

    // Reset forme i zatvori modal
    setIsAddModalOpen(false);
    setDobavljacNaziv('');
    setDobavljacOib('');
    setBrojRacuna('');
    setOpis('');
    setIznosUkupno('');
    setSerijskiBroj('');
  };

  const iznosNum = parseFloat(iznosUkupno) || 0;
  const isAutoDugotrajna = iznosNum >= PRAG_DUGOTRAJNE_IMOVINE_EUR;

  return (
    <div className="space-y-6">
      {/* Cash-Flow i financijski rezultat banner */}
      <div className="p-4 bg-slate-900/80 border border-slate-700/80 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <span className="text-xs text-slate-400 font-medium">Financijska slika obrta ({godina})</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {formatHrvatskiIznos(cashFlow.netoDobitEur)}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                Čista neto dobit
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">KPR PRIMICI:</span>
              <span className="text-slate-200 font-semibold">{formatHrvatskiIznos(cashFlow.ukupniPrimiciEur)}</span>
            </div>
            <div className="text-slate-500">−</div>
            <div>
              <span className="text-slate-400 block text-[10px]">IZDACI & HARRAČ:</span>
              <span className="text-rose-300 font-semibold">{formatHrvatskiIznos(cashFlow.ukupniIzdaciEur)}</span>
            </div>
            <div className="text-slate-500">=</div>
            <div>
              <span className="text-slate-400 block text-[10px]">PROFITNA MARŽA:</span>
              <span className="text-indigo-300 font-semibold">{cashFlow.profitnaMarzaPostotak}%</span>
            </div>
          </div>
        </div>

        {/* Donji mini info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-3 text-xs">
          <div>
            <span className="text-slate-400">Plaćeni poslovni troškovi:</span>
            <span className="font-mono text-slate-200 block font-semibold">{formatHrvatskiIznos(sazetak.ukupnoPlacenoEur)}</span>
          </div>
          <div>
            <span className="text-slate-400">Neplaćeni ulazni računi:</span>
            <span className="font-mono text-amber-300 block font-semibold">{formatHrvatskiIznos(sazetak.ukupnoNeplacenoEur)}</span>
          </div>
          <div>
            <span className="text-slate-400">Dugotrajna imovina (strojevi/alati):</span>
            <span className="font-mono text-indigo-300 block font-semibold">{formatHrvatskiIznos(sazetak.dugotrajnaImovinaUkupnoEur)}</span>
          </div>
          <div>
            <span className="text-slate-400">Ukupno zavedenih računa:</span>
            <span className="font-mono text-slate-200 block font-semibold">{sazetak.brojTroskova} računa</span>
          </div>
        </div>
      </div>

      {/* Kontrolna traka: Pretraga, filtri i gumb za dodavanje */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          {/* Pretraživač */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pretraži po dobavljaču, opisu ili računu..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Filter kategorije */}
          <select
            value={filterKategorija}
            onChange={(e) => setFilterKategorija(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="SVE">Sve kategorije</option>
            {Object.entries(KATEGORIJE_TROSKA_LABELS).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>

          {/* Filter statusa */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="SVE">Svi statusi</option>
            <option value="PLACENO">Plaćeno</option>
            <option value="NEPLACENO">Neplaćeno</option>
          </select>
        </div>

        {/* Tipka Dodaj trošak */}
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Evidentiraj ulazni račun
        </button>
      </div>

      {/* Tablica ulaznih troškova */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/60 text-slate-400 font-medium border-b border-slate-700/80">
            <tr>
              <th className="py-2.5 px-3">Datum</th>
              <th className="py-2.5 px-3">Dobavljač & Opis</th>
              <th className="py-2.5 px-3">Kategorija</th>
              <th className="py-2.5 px-3">Broj računa</th>
              <th className="py-2.5 px-3 text-right">Iznos (€)</th>
              <th className="py-2.5 px-3 text-center">Status</th>
              <th className="py-2.5 px-3 text-right">Akcija</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-300">
            {filtriraniTroskovi.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                  Nema evidentiranih troškova za odabrane kriterije.
                </td>
              </tr>
            ) : (
              filtriraniTroskovi.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-slate-400">
                    {formatHrvatskiDatum(t.datumRacuna)}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-white">{t.dobavljacNaziv}</div>
                    <div className="text-[11px] text-slate-400">{t.opis}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                      <Tag className="w-2.5 h-2.5 text-indigo-400" />
                      {KATEGORIJE_TROSKA_LABELS[t.kategorija] || t.kategorija}
                    </span>
                    {t.jeDugotrajnaImovina && (
                      <span className="block text-[10px] text-indigo-400 font-medium mt-0.5">
                        📦 Dugotrajna imovina
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">
                    {t.brojUlaznogDokumenta}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-white">
                    {formatHrvatskiIznos(t.ukupnoEur)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {t.status === 'PLACENO' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Check className="w-2.5 h-2.5" /> Plaćeno
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onAzurirajTrosak(t.id, { status: 'PLACENO', datumPlacanja: new Date().toISOString().slice(0, 10) })}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-emerald-600 hover:text-white transition-colors"
                        title="Klikni za označavanje kao plaćeno"
                      >
                        Čeka uplatu
                      </button>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Sigurno želite obrisati trošak "${t.dobavljacNaziv} - ${t.opis}"?`)) {
                          onObrisiTrosak(t.id);
                        }
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                      title="Obriši trošak"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal za dodavanje novog troška */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700">
              <h3 className="text-sm font-semibold text-white">Unos ulaznog računa / troška</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-6 space-y-4 text-xs">
              {/* Dobavljač i OIB */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Naziv dobavljača *</label>
                  <input
                    type="text"
                    required
                    value={dobavljacNaziv}
                    onChange={(e) => setDobavljacNaziv(e.target.value)}
                    placeholder="npr. Google Cloud, T-Com, Pevex..."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">OIB dobavljača (opcija)</label>
                  <input
                    type="text"
                    maxLength={11}
                    value={dobavljacOib}
                    onChange={(e) => setDobavljacOib(e.target.value)}
                    placeholder="11 znamenki"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Broj računa i kategorija */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Broj ulaznog računa</label>
                  <input
                    type="text"
                    value={brojRacuna}
                    onChange={(e) => setBrojRacuna(e.target.value)}
                    placeholder="npr. RAČ-2026-081"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Kategorija troška</label>
                  <select
                    value={kategorija}
                    onChange={(e) => setKategorija(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    {Object.entries(KATEGORIJE_TROSKA_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Datumi */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Datum računa</label>
                  <input
                    type="date"
                    value={datumRacuna}
                    onChange={(e) => setDatumRacuna(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Datum dospijeća</label>
                  <input
                    type="date"
                    value={datumDospijeca}
                    onChange={(e) => setDatumDospijeca(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Opis */}
              <div>
                <label className="block text-slate-400 mb-1">Opis nabave / usluge</label>
                <input
                  type="text"
                  value={opis}
                  onChange={(e) => setOpis(e.target.value)}
                  placeholder="npr. Godišnja pretplata, filamenti, uredski pribor..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Iznos i način plaćanja */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Ukupni iznos (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={iznosUkupno}
                    onChange={(e) => setIznosUkupno(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-xs font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Način plaćanja</label>
                  <select
                    value={nacinPlacanja}
                    onChange={(e) => setNacinPlacanja(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="TRANSAKCIJSKI_RACUN">Transakcijski račun</option>
                    <option value="KARTICA_POSLOVNA">Poslovna kartica</option>
                    <option value="GOTOVINA">Gotovina</option>
                  </select>
                </div>
              </div>

              {/* Indikator dugotrajne imovine */}
              {isAutoDugotrajna && (
                <div className="p-3 bg-indigo-950/40 border border-indigo-800/60 rounded text-indigo-300 text-xs space-y-2">
                  <p className="font-semibold">📦 Iznos prelazi prag dugotrajne imovine (663,61 €)</p>
                  <div>
                    <label className="block text-indigo-200 text-[11px] mb-1">Serijski broj opreme / inventarna oznaka</label>
                    <input
                      type="text"
                      value={serijskiBroj}
                      onChange={(e) => setSerijskiBroj(e.target.value)}
                      placeholder="npr. SN-892173B"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-indigo-700/60 rounded text-white text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    checked={status === 'PLACENO'}
                    onChange={() => setStatus('PLACENO')}
                    className="text-indigo-600"
                  />
                  <span className="text-slate-300">Račun je već plaćen</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    checked={status === 'NEPLACENO'}
                    onChange={() => setStatus('NEPLACENO')}
                    className="text-indigo-600"
                  />
                  <span className="text-slate-300">Čeka plaćanje</span>
                </label>
              </div>

              {/* Gumbi akcije */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
                >
                  Odustani
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded text-xs shadow transition-colors"
                >
                  Spremi trošak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
