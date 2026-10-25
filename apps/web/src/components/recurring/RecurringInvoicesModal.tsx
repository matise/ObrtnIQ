// apps/web/src/components/recurring/RecurringInvoicesModal.tsx
// Faza 20: Modal za upravljanje pretplatama i ponavljajućim računima

import { useState } from 'react';
import {
  X,
  Plus,
  Calendar,
  Repeat,
  CheckCircle2,
  AlertTriangle,
  Play,
  Trash2,
  Edit2,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  type RecurringProfile,
  type RecurringFrequency,
  type Dokument,
  formatHrvatskiIznos,
  izracunajUkupnoPretplate,
  izracunajPreostaleDane,
} from '@obrtniq/core';
import { useRecurringInvoices } from '../../hooks/useRecurringInvoices';

export interface RecurringInvoicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDraft?: (doc: Dokument) => void;
}

export function RecurringInvoicesModal({
  isOpen,
  onClose,
  onOpenDraft,
}: RecurringInvoicesModalProps) {
  const {
    profili,
    dospjeliProfili,
    ukupnoDospjeloEur,
    spasiProfil,
    obrisiProfil,
    promijeniAktivnost,
    generirajNacrt,
    generirajSveDospjele,
  } = useRecurringInvoices();

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [greske, setGreske] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [obavijest, setObavijest] = useState<string | null>(null);

  // Form State
  const [nazivPredloska, setNazivPredloska] = useState('');
  const [partnerNaziv, setPartnerNaziv] = useState('');
  const [partnerOib, setPartnerOib] = useState('');
  const [partnerIban, setPartnerIban] = useState('');
  const [frekvencija, setFrekvencija] = useState<RecurringFrequency>('MJESECNO');
  const [danUMjesecu, setDanUMjesecu] = useState<number>(1);
  const [rokPlacanjaDana, setRokPlacanjaDana] = useState<number>(15);
  const [nacinPlacanja, setNacinPlacanja] = useState<'TRANSAKCIJSKI_RACUN' | 'GOTOVINA' | 'KARTICA'>('TRANSAKCIJSKI_RACUN');
  const [biljeska, setBiljeska] = useState('');
  const [stavke, setStavke] = useState<
    { naziv: string; kolicina: number; cijena: number; popustPostotak?: number; jedinicaMjere?: string }[]
  >([
    { naziv: 'Mjesečni paušal za programske usluge', kolicina: 1, cijena: 500, jedinicaMjere: 'mjesec' },
  ]);

  if (!isOpen) return null;

  const resetForm = () => {
    setEditingId(null);
    setNazivPredloska('');
    setPartnerNaziv('');
    setPartnerOib('');
    setPartnerIban('');
    setFrekvencija('MJESECNO');
    setDanUMjesecu(1);
    setRokPlacanjaDana(15);
    setNacinPlacanja('TRANSAKCIJSKI_RACUN');
    setBiljeska('');
    setStavke([{ naziv: 'Mjesečne usluge', kolicina: 1, cijena: 100, jedinicaMjere: 'kom' }]);
    setGreske([]);
    setIsEditing(false);
  };

  const handleStartEdit = (p: RecurringProfile) => {
    setEditingId(p.id);
    setNazivPredloska(p.nazivPredloska);
    setPartnerNaziv(p.partnerNaziv);
    setPartnerOib(p.partnerOib);
    setPartnerIban(p.partnerIban || '');
    setFrekvencija(p.frekvencija);
    setDanUMjesecu(p.danUMjesecu);
    setRokPlacanjaDana(p.rokPlacanjaDana);
    setNacinPlacanja(p.nacinPlacanja);
    setBiljeska(p.biljeska || '');
    setStavke(
      p.stavke.map((s) => ({
        naziv: s.naziv,
        kolicina: s.kolicina,
        cijena: s.cijena,
        popustPostotak: s.popustPostotak,
        jedinicaMjere: s.jedinicaMjere,
      }))
    );
    setGreske([]);
    setIsEditing(true);
  };

  const handleSave = async () => {
    const danasIso = new Date().toISOString().slice(0, 10);
    const profil: RecurringProfile = {
      id: editingId || `rec-${Date.now()}`,
      nazivPredloska,
      partnerId: `partner-rec-${Date.now()}`,
      partnerNaziv,
      partnerOib,
      partnerTaxZone: 'DOMACI',
      partnerIban,
      stavke,
      frekvencija,
      danUMjesecu: Number(danUMjesecu),
      nacinPlacanja,
      rokPlacanjaDana: Number(rokPlacanjaDana),
      aktivan: true,
      datumPocetka: danasIso,
      sljedeceDospijeceDatum: danasIso,
      biljeska,
    };

    const res = await spasiProfil(profil);
    if (res.uspjeh) {
      resetForm();
      setObavijest('Pretplata uspješno spremljena!');
      setTimeout(() => setObavijest(null), 3000);
    } else if (res.greske) {
      setGreske(res.greske);
    }
  };

  const handleGenerateSingle = async (profilId: string) => {
    setIsGenerating(true);
    const doc = await generirajNacrt(profilId);
    setIsGenerating(false);
    if (doc) {
      setObavijest(`Nacrt računa ${doc.brojDokumenta} uspješno stvoren!`);
      if (onOpenDraft) {
        onOpenDraft(doc);
        onClose();
      }
    }
  };

  const handleGenerateAll = async () => {
    setIsGenerating(true);
    const docs = await generirajSveDospjele();
    setIsGenerating(false);
    setObavijest(`Uspješno stvoreno ${docs.length} novih nacrta računa!`);
    if (docs.length > 0 && onOpenDraft && docs[0]) {
      onOpenDraft(docs[0]);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
                Ponavljajući Računi i Pretplate
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                  {profili.length} ukupno
                </span>
                {dospjeliProfili.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center gap-1 font-medium animate-pulse">
                    <AlertTriangle className="w-3 h-3" />
                    {dospjeliProfili.length} dospjelo
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatizirano periodično fakturiranje mjesečnih paušala i ugovornih klijenata
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Obavijest */}
        {obavijest && (
          <div className="px-6 py-2.5 bg-emerald-500/20 border-b border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {obavijest}
          </div>
        )}

        {/* Overdue Banner */}
        {dospjeliProfili.length > 0 && !isEditing && (
          <div className="px-6 py-3.5 bg-gradient-to-r from-amber-500/15 via-indigo-500/15 to-emerald-500/15 border-b border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-400 animate-spin-slow" />
              <div>
                <p className="text-xs font-semibold text-amber-200">
                  {dospjeliProfili.length} {dospjeliProfili.length === 1 ? 'pretplata čeka' : 'pretplate čekaju'} izdavanje za ovaj mjesec!
                </p>
                <p className="text-[11px] text-slate-400">
                  Ukupan iznos za fakturiranje: <span className="font-semibold text-white">{formatHrvatskiIznos(ukupnoDospjeloEur)}</span>
                </p>
              </div>
            </div>
            <button
              onClick={handleGenerateAll}
              disabled={isGenerating}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-semibold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isGenerating ? 'Generiranje...' : `Pripremi sve dospjele (${dospjeliProfili.length})`}
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isEditing ? (
            /* Forma za uređivanje / novi profil */
            <div className="space-y-4 bg-slate-950/40 p-5 rounded-xl border border-slate-800">
              <h3 className="text-sm font-semibold text-indigo-400 flex items-center gap-2">
                {editingId ? 'Uredi Predložak Pretplate' : 'Novi Profil Ponavljajućeg Računa'}
              </h3>

              {greske.length > 0 && (
                <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs space-y-1">
                  {greske.map((g, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span>•</span>
                      <span>{g}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Naziv Predloška *</label>
                  <input
                    type="text"
                    value={nazivPredloska}
                    onChange={(e) => setNazivPredloska(e.target.value)}
                    placeholder="npr. Mjesečno programsko održavanje"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Naziv Kupca / Partnera *</label>
                  <input
                    type="text"
                    value={partnerNaziv}
                    onChange={(e) => setPartnerNaziv(e.target.value)}
                    placeholder="npr. Adria Digital d.o.o."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">OIB Partnera *</label>
                  <input
                    type="text"
                    value={partnerOib}
                    onChange={(e) => setPartnerOib(e.target.value)}
                    placeholder="11-znamenkasti OIB"
                    maxLength={11}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">IBAN Partnera (opcionalno)</label>
                  <input
                    type="text"
                    value={partnerIban}
                    onChange={(e) => setPartnerIban(e.target.value)}
                    placeholder="HR..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Frekvencija Ponavljanja</label>
                  <select
                    value={frekvencija}
                    onChange={(e) => setFrekvencija(e.target.value as RecurringFrequency)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="MJESECNO">Mjesečno (svaki mjesec)</option>
                    <option value="KVARTALNO">Kvartalno (svaka 3 mjeseca)</option>
                    <option value="GODISNJE">Godišnje (jednom godišnje)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Dan u Mjesecu za Izdavanje (1 - 31)</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={danUMjesecu}
                    onChange={(e) => setDanUMjesecu(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Rok Plaćanja (dana)</label>
                  <input
                    type="number"
                    min={0}
                    max={90}
                    value={rokPlacanjaDana}
                    onChange={(e) => setRokPlacanjaDana(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Način Plaćanja</label>
                  <select
                    value={nacinPlacanja}
                    onChange={(e) => setNacinPlacanja(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="TRANSAKCIJSKI_RACUN">Transakcijski račun</option>
                    <option value="GOTOVINA">Gotovina</option>
                    <option value="KARTICA">Kartica</option>
                  </select>
                </div>
              </div>

              {/* Stavke */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300">Stavke Računa</label>
                  <button
                    type="button"
                    onClick={() =>
                      setStavke([
                        ...stavke,
                        { naziv: 'Nova stavka', kolicina: 1, cijena: 100, jedinicaMjere: 'kom' },
                      ])
                    }
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Dodaj stavku
                  </button>
                </div>

                <div className="space-y-2">
                  {stavke.map((st, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-xs"
                    >
                      <input
                        type="text"
                        value={st.naziv}
                        placeholder="Naziv usluge ili artikla"
                        onChange={(e) => {
                          const c = [...stavke];
                          if (c[idx]) {
                            c[idx].naziv = e.target.value;
                            setStavke(c);
                          }
                        }}
                        className="col-span-5 px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-white"
                      />
                      <input
                        type="number"
                        min={0.01}
                        step={0.01}
                        value={st.kolicina}
                        placeholder="Količina"
                        onChange={(e) => {
                          const c = [...stavke];
                          if (c[idx]) {
                            c[idx].kolicina = Number(e.target.value);
                            setStavke(c);
                          }
                        }}
                        className="col-span-2 px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-white"
                      />
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={st.cijena}
                        placeholder="Cijena €"
                        onChange={(e) => {
                          const c = [...stavke];
                          if (c[idx]) {
                            c[idx].cijena = Number(e.target.value);
                            setStavke(c);
                          }
                        }}
                        className="col-span-2 px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-white"
                      />
                      <input
                        type="text"
                        value={st.jedinicaMjere || 'kom'}
                        placeholder="JM"
                        onChange={(e) => {
                          const c = [...stavke];
                          if (c[idx]) {
                            c[idx].jedinicaMjere = e.target.value;
                            setStavke(c);
                          }
                        }}
                        className="col-span-2 px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-white text-center"
                      />
                      <button
                        type="button"
                        disabled={stavke.length <= 1}
                        onClick={() => setStavke(stavke.filter((_, i) => i !== idx))}
                        className="col-span-1 text-slate-500 hover:text-red-400 p-1 flex justify-center disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bilješka */}
              <div>
                <label className="block text-slate-400 mb-1 text-xs">Napomena na Računu (opcionalno)</label>
                <textarea
                  rows={2}
                  value={biljeska}
                  onChange={(e) => setBiljeska(e.target.value)}
                  placeholder="npr. Račun se izdaje prema ugovoru o održavanju br. 12/2026."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition"
                >
                  Odustani
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Spremi Pretplatu
                </button>
              </div>
            </div>
          ) : (
            /* Popis postojećih pretplata */
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Definirani ugovorni predlošci za automatsku izradu mjesečnih ili kvartalnih računa:
                </p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Novi Profil Pretplate
                </button>
              </div>

              {profili.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
                  <Repeat className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-400">Još nemate definiranih ponavljajućih računa</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Dodajte redovite klijente koji plaćaju mjesečni paušal i generirajte račune jednim klikom svakog 1. u mjesecu.
                  </p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Kreiraj prvi predložak
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {profili.map((p) => {
                    const ukupnoEur = izracunajUkupnoPretplate(p.stavke);
                    const preostaloDana = izracunajPreostaleDane(p.sljedeceDospijeceDatum);
                    const jeDospjelo = p.aktivan && preostaloDana <= 0;

                    return (
                      <div
                        key={p.id}
                        className={`p-4 rounded-xl border transition-all ${
                          jeDospjelo
                            ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-950/10'
                            : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-white">{p.nazivPredloska}</h4>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                  p.aktivan
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}
                              >
                                {p.aktivan ? 'Aktivno' : 'Pauzirano'}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                {p.frekvencija === 'MJESECNO' ? 'Mjesečno' : p.frekvencija === 'KVARTALNO' ? 'Kvartalno' : 'Godišnje'} ({p.danUMjesecu}. u mj.)
                              </span>
                            </div>

                            <p className="text-xs text-slate-400">
                              Kupac: <span className="text-slate-200 font-medium">{p.partnerNaziv}</span> (OIB: {p.partnerOib})
                            </p>

                            <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                Sljedeći termin:{' '}
                                <strong className={jeDospjelo ? 'text-amber-400' : 'text-slate-300'}>
                                  {p.sljedeceDospijeceDatum}
                                </strong>{' '}
                                {jeDospjelo ? (
                                  <span className="text-amber-400 font-bold ml-1">(Dospjelo!)</span>
                                ) : (
                                  <span className="text-slate-500 ml-1">({preostaloDana} dana)</span>
                                )}
                              </span>
                              <span>•</span>
                              <span>
                                Stavke: <span className="text-slate-300">{p.stavke.length}</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-center">
                            <div className="text-right mr-2">
                              <p className="text-xs text-slate-400">Iznos računa</p>
                              <p className="text-base font-bold text-white tracking-tight">
                                {formatHrvatskiIznos(ukupnoEur)}
                              </p>
                            </div>

                            <button
                              onClick={() => handleGenerateSingle(p.id)}
                              disabled={isGenerating}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 ${
                                jeDospjelo
                                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                              }`}
                              title="Stvori nacrt računa u radnoj plohi"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              Stvori Nacrt
                            </button>

                            <button
                              onClick={() => handleStartEdit(p)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                              title="Uredi predložak"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => promijeniAktivnost(p.id, !p.aktivan)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition text-[11px]"
                              title={p.aktivan ? 'Pauziraj pretplatu' : 'Aktiviraj pretplatu'}
                            >
                              {p.aktivan ? 'Pauza' : 'Aktiviraj'}
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(`Obrisati pretplatu ${p.nazivPredloska}?`)) {
                                  obrisiProfil(p.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition"
                              title="Obriši"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/60 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>Paušalni računi automatski poprimaju zakonski format i sljedeći sekvencijalni broj pri službenom izdavanju.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
          >
            Zatvori
          </button>
        </div>

      </div>
    </div>
  );
}
