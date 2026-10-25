import React, { useState } from 'react';
import { 
  X, 
  Users, 
  Search, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  ArrowRight,
  Building,
  Home,
  ArrowLeft,
} from 'lucide-react';
import type { Partner, PoreznaZona } from '@obrtniq/core';
import { OibInput } from './controls';
import type { UsePartnersReturn } from '../hooks/usePartners';

export interface PartnerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPartner: (partner: Partner) => void;
  partnersHook: UsePartnersReturn;
  isEmbedded?: boolean;
  onNavigateHome?: () => void;
}

export const PartnerDrawer: React.FC<PartnerDrawerProps> = ({
  isOpen,
  onClose,
  onSelectPartner,
  partnersHook,
  isEmbedded = false,
  onNavigateHome,
}) => {
  const { 
    filteredPartneri, 
    searchQuery, 
    setSearchQuery, 
    addPartner, 
    deletePartner 
  } = partnersHook;

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newNaziv, setNewNaziv] = useState('');
  const [newOib, setNewOib] = useState('');
  const [newIsOibValid, setNewIsOibValid] = useState(false);
  const [newAdresa, setNewAdresa] = useState('');
  const [newGrad, setNewGrad] = useState('');
  const [newPostanskiBroj, setNewPostanskiBroj] = useState('');
  const [newTaxZone, setNewTaxZone] = useState<PoreznaZona>('DOMACI_B2B');
  const [newEmail, setNewEmail] = useState('');

  if (!isOpen) return null;

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNaziv.trim() || !newIsOibValid) {
      alert('Naziv i valjani OIB su obvezni.');
      return;
    }

    const created = await addPartner({
      tipPartnera: 'PRAVNA_OSOBA',
      naziv: newNaziv.trim(),
      oib: newOib.trim(),
      adresa: newAdresa.trim() || 'Hrvatska',
      grad: newGrad.trim() || 'Zagreb',
      postanskiBroj: newPostanskiBroj.trim() || '10000',
      drzavaIso: 'HR',
      poreznaZona: newTaxZone,
      aktivan: true,
      kontaktEmail: newEmail.trim() || undefined,
    });

    // Reset forme
    setNewNaziv('');
    setNewOib('');
    setNewAdresa('');
    setNewGrad('');
    setNewPostanskiBroj('');
    setNewEmail('');
    setIsAddingNew(false);

    // Automatski odaberi novoizrađenog partnera
    onSelectPartner(created);
    if (isEmbedded && onNavigateHome) onNavigateHome();
    else onClose();
  };

  const content = (
    <div className={
      isEmbedded
        ? "w-full bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl text-white flex flex-col shadow-2xl overflow-hidden min-h-[calc(100vh-160px)] animate-in fade-in duration-200"
        : "w-screen max-w-xl bg-[var(--bg-surface)] border-l border-[var(--border-strong)] text-white flex flex-col shadow-2xl"
    }>
      {/* Header */}
      <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-elevated)]/40 flex-wrap gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/40 flex items-center justify-center text-[var(--accent-primary)] shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            {isEmbedded && (
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1 font-mono">
                <button
                  type="button"
                  onClick={onNavigateHome || onClose}
                  className="hover:text-[var(--accent-primary)] flex items-center gap-1.5 transition-colors font-medium"
                >
                  <Home className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  <span>Radna ploha (Home)</span>
                </button>
                <span>/</span>
                <span className="text-white font-semibold">Adresar Partnera &amp; Kupaca</span>
              </div>
            )}
            <h2 className="font-bold text-base tracking-tight flex items-center gap-2">
              Adresar Partnera &amp; Kupaca
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--accent-primary)]">
                {filteredPartneri.length}
              </span>
            </h2>
            <p className="text-xs text-[var(--text-muted)] font-mono">
              Baza stalnih klijenata, brzi odabir i porezne zone
            </p>
          </div>
        </div>

        {isEmbedded ? (
          <button
            type="button"
            onClick={onNavigateHome || onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-white bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-strong)] transition-colors"
            title="Povratak na radnu plohu (Alt+H)"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>Povratak na Radnu plohu</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-canvas)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

          {/* Search & Actions Bar */}
          <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)] space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pretraži po nazivu, OIB-u ili gradu..."
                className="w-full bg-[var(--bg-surface)] text-white pl-9 pr-4 py-2 font-mono text-xs border border-[var(--border-strong)] focus:border-[var(--accent-primary)] outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsAddingNew((prev) => !prev)}
              className="w-full py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] text-[var(--accent-primary)] border border-[var(--border-strong)] font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              {isAddingNew ? 'Zatvori formu unosa' : 'Dodaj novog partnera u bazu'}
            </button>
          </div>

          {/* New Partner Inline Form */}
          {isAddingNew && (
            <form onSubmit={handleCreatePartner} className="p-4 bg-[var(--bg-elevated)]/40 border-b border-[var(--border-subtle)] space-y-3 font-mono text-xs">
              <span className="text-[var(--accent-primary)] font-bold block uppercase tracking-wider text-[11px]">
                Novi Partner u Adresaru
              </span>

              <div>
                <label className="block text-[var(--text-muted)] mb-1">Naziv Partnera *</label>
                <input
                  type="text"
                  required
                  value={newNaziv}
                  onChange={(e) => setNewNaziv(e.target.value)}
                  placeholder="npr. Adria Dizajn d.o.o."
                  className="w-full bg-[var(--bg-canvas)] px-3 py-1.5 border border-[var(--border-strong)] text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <OibInput
                  value={newOib}
                  onChange={(val, valid) => {
                    setNewOib(val);
                    setNewIsOibValid(valid);
                  }}
                  required
                />

                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Porezna Zona</label>
                  <select
                    value={newTaxZone}
                    onChange={(e) => setNewTaxZone(e.target.value as PoreznaZona)}
                    className="w-full bg-[var(--bg-canvas)] px-3 py-2 border border-[var(--border-strong)] text-white outline-none"
                  >
                    <option value="DOMACI_B2B">Domaći B2B (RH)</option>
                    <option value="DOMACI_B2C">Domaći B2C (Građani)</option>
                    <option value="EU_B2B">EU B2B (Reverse Charge)</option>
                    <option value="TRECE_ZEMLJE">Inozemstvo (Treće zemlje)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Adresa (Ulica i broj)</label>
                  <input
                    type="text"
                    value={newAdresa}
                    onChange={(e) => setNewAdresa(e.target.value)}
                    placeholder="Ilica 10"
                    className="w-full bg-[var(--bg-canvas)] px-3 py-1.5 border border-[var(--border-strong)] text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Grad</label>
                  <input
                    type="text"
                    value={newGrad}
                    onChange={(e) => setNewGrad(e.target.value)}
                    placeholder="Zagreb"
                    className="w-full bg-[var(--bg-canvas)] px-3 py-1.5 border border-[var(--border-strong)] text-white outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!newIsOibValid || !newNaziv.trim()}
                className="w-full py-2 bg-[#10B981] hover:bg-[#059669] text-black font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all mt-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Spremi i Odaberi za Račun
              </button>
            </form>
          )}

          {/* Partners List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {filteredPartneri.length === 0 ? (
              <div className="text-center py-12 text-[var(--text-muted)] font-mono text-xs">
                Nema partnera koji odgovaraju pretrazi "{searchQuery}".
              </div>
            ) : (
              filteredPartneri.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Building className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                      <span className="font-bold text-xs text-white tracking-tight">
                        {p.naziv}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-[var(--text-muted)]">
                      <span>OIB: <strong className="text-slate-200">{p.oib}</strong></span>
                      {p.grad && <span>&bull; {p.grad}</span>}
                      {p.adresa && <span>({p.adresa})</span>}
                    </div>

                    <div className="pt-1">
                      <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                        {p.poreznaZona === 'DOMACI_B2B'
                          ? 'Domaći B2B'
                          : p.poreznaZona === 'EU_B2B'
                          ? 'EU Reverse Charge'
                          : p.poreznaZona === 'TRECE_ZEMLJE'
                          ? 'Inozemstvo'
                          : p.poreznaZona}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-2 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectPartner(p);
                        if (isEmbedded && onNavigateHome) onNavigateHome();
                        else onClose();
                      }}
                      className="px-3 py-1.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-black font-bold font-mono text-xs flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                    >
                      <span>Odaberi</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Želite li obrisati partnera "${p.naziv}" iz adresara?`)) {
                          deletePartner(p.id);
                        }
                      }}
                      title="Obriši partnera iz adresara"
                      className="p-1.5 text-[var(--text-muted)] hover:text-[#EF4444] transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden no-print">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        {content}
      </div>
    </div>
  );
};
