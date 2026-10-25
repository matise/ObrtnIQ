import React, { useState } from 'react';
import { Plus, Trash2, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { IbanInput } from '../../controls';
import type { PoslovanjeTabProps } from '../types';
import {
  validirajOznakuProstora,
  type PoslovniProstorConfig,
} from '@obrtniq/core';

export const PoslovanjeTab: React.FC<PoslovanjeTabProps> = ({
  formData,
  onChange,
}) => {
  const [isAddingProstor, setIsAddingProstor] = useState(false);
  const [novaOznaka, setNovaOznaka] = useState('');
  const [noviNaziv, setNoviNaziv] = useState('');
  const [novaAdresa, setNovaAdresa] = useState('');
  const [novoRadnoVrijeme, setNovoRadnoVrijeme] = useState('Pon-Pet 08:00 - 16:00');
  const [prostorGreska, setProstorGreska] = useState<string | null>(null);

  const prostori: PoslovniProstorConfig[] = formData.poslovniProstori || [
    {
      oznaka: formData.poslovniProstorOznaka || 'POSL1',
      naziv: 'Sjedište obrta',
      adresa: `${formData.ulicaIBroj || ''}, ${formData.mjesto || ''}`.trim() || 'Sjedište obrta',
      radnoVrijeme: 'Pon-Pet 08:00 - 16:00',
      jeZadano: true,
      uredjaji: [{ oznaka: formData.naplatniUredjajOznaka || '1', naziv: 'Glavni uređaj', jeAktivan: true }],
    },
  ];

  const handleDodajProstor = () => {
    const val = validirajOznakuProstora(novaOznaka);
    if (!val.valjano) {
      setProstorGreska(val.poruka || 'Neispravna oznaka prostora.');
      return;
    }

    if (prostori.some((p) => p.oznaka.toUpperCase() === novaOznaka.trim().toUpperCase())) {
      setProstorGreska(`Poslovni prostor s oznakom '${novaOznaka}' već postoji.`);
      return;
    }

    const noviProstor: PoslovniProstorConfig = {
      oznaka: novaOznaka.trim().toUpperCase(),
      naziv: noviNaziv.trim() || `Prostor ${novaOznaka.toUpperCase()}`,
      adresa: novaAdresa.trim() || 'Rad na terenu',
      radnoVrijeme: novoRadnoVrijeme,
      jeZadano: false,
      uredjaji: [{ oznaka: '1', naziv: 'Uređaj 1', jeAktivan: true }],
    };

    const noviPopis = [...prostori, noviProstor];
    onChange('poslovniProstori', noviPopis);
    setNovaOznaka('');
    setNoviNaziv('');
    setNovaAdresa('');
    setProstorGreska(null);
    setIsAddingProstor(false);
  };

  const handleObrisiProstor = (oznaka: string) => {
    if (oznaka === formData.poslovniProstorOznaka) {
      alert('Ne možete obrisati primarni poslovni prostor.');
      return;
    }
    const noviPopis = prostori.filter((p) => p.oznaka !== oznaka);
    onChange('poslovniProstori', noviPopis);
  };

  const handlePostaviPrimarni = (prostor: PoslovniProstorConfig) => {
    const noviPopis = prostori.map((p) => ({
      ...p,
      jeZadano: p.oznaka === prostor.oznaka,
    }));
    onChange('poslovniProstori', noviPopis);
    onChange('poslovniProstorOznaka', prostor.oznaka);
  };

  return (
    <div className="space-y-6">
      <IbanInput
        value={formData.iban}
        onChange={(val, _valid, bank) => {
          onChange('iban', val);
          if (bank) onChange('bankaNaziv', bank);
        }}
        required
      />

      {/* Primarni poslovni prostor i uređaj */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-mono text-[var(--text-secondary)] font-semibold block mb-1">
            Zadana Oznaka Poslovnog Prostora * (čl. 9 Fiskalizacije)
          </label>
          <input
            type="text"
            required
            value={formData.poslovniProstorOznaka}
            onChange={(e) => onChange('poslovniProstorOznaka', e.target.value.toUpperCase())}
            placeholder="npr. POSL1"
            className="w-full bg-[var(--bg-canvas)] text-white px-3.5 py-2.5 font-mono text-sm border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-mono text-[var(--text-secondary)] font-semibold block mb-1">
            Zadana Oznaka Naplatnog Uređaja *
          </label>
          <input
            type="text"
            required
            value={formData.naplatniUredjajOznaka}
            onChange={(e) => onChange('naplatniUredjajOznaka', e.target.value)}
            placeholder="npr. 1"
            className="w-full bg-[var(--bg-canvas)] text-white px-3.5 py-2.5 font-mono text-sm border border-[var(--border-strong)] focus:border-[var(--border-focus)] outline-none"
          />
        </div>
      </div>

      {/* Više Poslovnih Prostora (Multi-Location & Rad na Terenu) */}
      <div className="p-4 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-mono text-[var(--accent-primary)] font-semibold">
              Poslovni Prostori i Lokacije (čl. 9 i 10 Zakona o fiskalizaciji)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsAddingProstor(!isAddingProstor)}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
          >
            <Plus className="w-3.5 h-3.5" /> Dodaj lokaciju / teren
          </button>
        </div>

        <p className="text-[11px] text-slate-400">
          Svaki račun poprima format <span className="text-slate-200 font-mono">Broj/Prostor/Uređaj</span> (npr.{' '}
          <span className="font-mono text-amber-300">1/POSL1/1</span> ili{' '}
          <span className="font-mono text-amber-300">1/TEREN/1</span>) s neovisnim numeričkim slijedom.
        </p>

        {/* Forma za dodavanje nove lokacije */}
        {isAddingProstor && (
          <div className="p-3 bg-slate-900 border border-slate-700 rounded-lg space-y-3 text-xs">
            <span className="font-semibold text-white block">Nova poslovna lokacija ili rad na terenu</span>

            {prostorGreska && (
              <div className="p-2 bg-red-500/10 border border-red-500/30 text-red-300 rounded flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{prostorGreska}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Oznaka prostora (npr. TEREN, URED2) *</label>
                <input
                  type="text"
                  value={novaOznaka}
                  onChange={(e) => setNovaOznaka(e.target.value.toUpperCase())}
                  placeholder="TEREN"
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Naziv lokacije</label>
                <input
                  type="text"
                  value={noviNaziv}
                  onChange={(e) => setNoviNaziv(e.target.value)}
                  placeholder="Rad na terenu kod klijenta"
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Adresa / Opis</label>
                <input
                  type="text"
                  value={novaAdresa}
                  onChange={(e) => setNovaAdresa(e.target.value)}
                  placeholder="Teren RH / Pokretna prodaja"
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Radno vrijeme</label>
                <input
                  type="text"
                  value={novoRadnoVrijeme}
                  onChange={(e) => setNovoRadnoVrijeme(e.target.value)}
                  placeholder="Po dogovoru"
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddingProstor(false)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
              >
                Odustani
              </button>
              <button
                type="button"
                onClick={handleDodajProstor}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded text-xs"
              >
                Spremi Lokaciju
              </button>
            </div>
          </div>
        )}

        {/* Popis lokacija */}
        <div className="space-y-2 pt-1">
          {prostori.map((p) => {
            const isDefault = p.oznaka === formData.poslovniProstorOznaka;
            return (
              <div
                key={p.oznaka}
                className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-3 ${
                  isDefault ? 'bg-indigo-950/20 border-indigo-500/30' : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                    {p.oznaka}
                  </span>
                  <div>
                    <span className="font-semibold text-white">{p.naziv}</span>
                    <span className="text-slate-400 ml-2">({p.adresa})</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isDefault ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Zadani prostor
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handlePostaviPrimarni(p)}
                      className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-slate-800"
                    >
                      Postavi kao zadano
                    </button>
                  )}

                  {!isDefault && (
                    <button
                      type="button"
                      onClick={() => handleObrisiProstor(p.oznaka)}
                      className="text-slate-500 hover:text-red-400 p-1"
                      title="Obriši lokaciju"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Porezni status */}
      <div className="p-4 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-3">
        <span className="text-xs font-mono text-[var(--accent-primary)] font-semibold block">
          Porezni Status
        </span>
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="jePausalist"
            checked={formData.jePausalist}
            onChange={(e) => onChange('jePausalist', e.target.checked)}
            className="w-4 h-4 rounded border-[var(--border-strong)] accent-[var(--accent-primary)] cursor-pointer"
          />
          <label htmlFor="jePausalist" className="text-xs font-mono text-slate-200 cursor-pointer">
            Paušalno oporezivanje samostalne djelatnosti (Dohodak)
          </label>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="uSustavuPdv"
            checked={formData.uSustavuPdv}
            onChange={(e) => onChange('uSustavuPdv', e.target.checked)}
            className="w-4 h-4 rounded border-[var(--border-strong)] accent-[var(--accent-primary)] cursor-pointer"
          />
          <label htmlFor="uSustavuPdv" className="text-xs font-mono text-slate-200 cursor-pointer">
            U sustavu PDV-a (redovni obveznik PDV-a)
          </label>
        </div>
      </div>
    </div>
  );
};
