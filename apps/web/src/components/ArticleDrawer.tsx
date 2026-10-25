import React, { useState } from 'react';
import { 
  X, 
  BookMarked, 
  Search, 
  Plus, 
  Trash2, 
  ArrowRight,
  Briefcase,
  Package,
  Sparkles,
  Home,
  ArrowLeft,
} from 'lucide-react';
import type { Artikl } from '@obrtniq/core';
import { formatHrvatskiIznos } from '@obrtniq/core';
import { CurrencyInput, KpdPicker } from './controls';
import type { UseArticlesReturn } from '../hooks/useArticles';

export interface ArticleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectArticle?: (artikl: Artikl) => void;
  articlesHook: UseArticlesReturn;
  isEmbedded?: boolean;
  onNavigateHome?: () => void;
}

export const ArticleDrawer: React.FC<ArticleDrawerProps> = ({
  isOpen,
  onClose,
  onSelectArticle,
  articlesHook,
  isEmbedded = false,
  onNavigateHome,
}) => {
  const { 
    filteredArticles, 
    searchQuery, 
    setSearchQuery, 
    filterType,
    setFilterType,
    addArtikl, 
    deleteArtikl,
    seedDefaultArticles,
  } = articlesHook;

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newNaziv, setNewNaziv] = useState('');
  const [newSifra, setNewSifra] = useState('');
  const [newKpdSifra, setNewKpdSifra] = useState('62.01.11');
  const [newKpdNaziv, setNewKpdNaziv] = useState('Razvoj aplikacijskog softvera i programiranje');
  const [newJedinica, setNewJedinica] = useState('sat');
  const [newCijena, setNewCijena] = useState(50.00);
  const [newJeUsluga, setNewJeUsluga] = useState(true);
  const [newOpis, setNewOpis] = useState('');

  if (!isOpen) return null;

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNaziv.trim() || !newKpdSifra.trim()) {
      alert('Naziv i KPD 2025 šifra su obvezni.');
      return;
    }

    const created = await addArtikl({
      naziv: newNaziv.trim(),
      sifra: newSifra.trim() || undefined,
      kpdSifra: newKpdSifra.trim(),
      jedinicaMjere: newJedinica.trim() || 'sat',
      cijenaOsnovica: newCijena,
      stopaPdv: 0.00,
      pdvKategorijaPoreza: 'E',
      jeUsluga: newJeUsluga,
      opis: newOpis.trim() || newKpdNaziv || undefined,
      aktivan: true,
    });

    // Reset forme
    setNewNaziv('');
    setNewSifra('');
    setNewOpis('');
    setNewCijena(50.00);
    setIsAddingNew(false);

    if (onSelectArticle) {
      onSelectArticle(created);
      if (isEmbedded && onNavigateHome) onNavigateHome();
      else onClose();
    }
  };

  const content = (
    <div className={
      isEmbedded
        ? "w-full bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl text-white flex flex-col shadow-2xl overflow-hidden min-h-[calc(100vh-160px)] animate-in fade-in duration-200"
        : "w-screen max-w-2xl bg-[var(--bg-surface)] border-l border-[var(--border-strong)] text-white flex flex-col shadow-2xl"
    }>
      {/* Header */}
      <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-elevated)]/40 flex-wrap gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/40 flex items-center justify-center text-[var(--accent-primary)] shrink-0">
            <BookMarked className="w-4 h-4" />
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
                <span className="text-white font-semibold">Cjenik Usluga &amp; Artikala</span>
              </div>
            )}
            <h2 className="text-sm font-mono font-bold tracking-wider uppercase text-white flex items-center gap-2">
              <span>Cjenik Usluga &amp; Artikala</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#064E3B] text-[#10B981] border border-[#10B981]/40">
                KPD 2025
              </span>
            </h2>
            <p className="text-xs text-[var(--text-muted)] font-mono">
              Baza standardnih usluga i artikala za brzi unos računa
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
            className="text-[var(--text-muted)] hover:text-white p-1 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

          {/* Search, Filter & New Article Action */}
          <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]/60 space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Pretraži cjenik po nazivu, KPD šifri ili opisu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[var(--bg-surface)] text-white pl-9 pr-3 py-2 text-xs font-mono border border-[var(--border-strong)] focus:border-[var(--accent-primary)] outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsAddingNew((prev) => !prev)}
                className="px-3 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-black text-xs font-mono font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                {isAddingNew ? 'Zatvori' : 'Novi artikl'}
              </button>
            </div>

            {/* Filter chips: Sve / Usluge / Roba */}
            <div className="flex items-center gap-1.5 font-mono text-[10px]">
              <span className="text-[var(--text-muted)] mr-1">Filter:</span>
              <button
                type="button"
                onClick={() => setFilterType('SVE')}
                className={`px-2 py-0.5 border transition-all ${
                  filterType === 'SVE'
                    ? 'bg-[var(--accent-primary)] text-black font-bold border-transparent'
                    : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-white'
                }`}
              >
                Sve ({articlesHook.artikli.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('USLUGE')}
                className={`px-2 py-0.5 border transition-all flex items-center gap-1 ${
                  filterType === 'USLUGE'
                    ? 'bg-[var(--accent-primary)] text-black font-bold border-transparent'
                    : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-white'
                }`}
              >
                <Briefcase className="w-2.5 h-2.5" />
                Usluge ({articlesHook.artikli.filter((a) => a.jeUsluga).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('ROBA')}
                className={`px-2 py-0.5 border transition-all flex items-center gap-1 ${
                  filterType === 'ROBA'
                    ? 'bg-[var(--accent-primary)] text-black font-bold border-transparent'
                    : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-white'
                }`}
              >
                <Package className="w-2.5 h-2.5" />
                Roba ({articlesHook.artikli.filter((a) => !a.jeUsluga).length})
              </button>
            </div>
          </div>

          {/* Form for Creating New Article */}
          {isAddingNew && (
            <form onSubmit={handleCreateArticle} className="p-4 bg-[var(--bg-elevated)]/60 border-b border-[var(--border-strong)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[var(--accent-primary)] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Unos novog artikla / usluge u cjenik
                </span>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">Čl. 90 st. 2 (PDV 0%)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-mono text-[var(--text-muted)] mb-1">
                    Naziv usluge / artikla *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="npr. Razvoj web aplikacije"
                    value={newNaziv}
                    onChange={(e) => setNewNaziv(e.target.value)}
                    className="w-full bg-[var(--bg-canvas)] text-white px-2.5 py-1.5 text-xs font-mono border border-[var(--border-strong)] focus:border-[var(--accent-primary)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-[var(--text-muted)] mb-1">
                    Šifra (opcionalno)
                  </label>
                  <input
                    type="text"
                    placeholder="USL-01"
                    value={newSifra}
                    onChange={(e) => setNewSifra(e.target.value)}
                    className="w-full bg-[var(--bg-canvas)] text-white px-2.5 py-1.5 text-xs font-mono border border-[var(--border-strong)] focus:border-[var(--accent-primary)] outline-none"
                  />
                </div>
              </div>

              {/* KPD 2025 Klasifikacija djelatnosti */}
              <div>
                <label className="block text-[10px] font-mono text-[var(--text-muted)] mb-1">
                  KPD 2025 klasifikacija djelatnosti (obavezno za e-Račun) *
                </label>
                <KpdPicker
                  value={newKpdSifra}
                  onChange={(sifra, naziv) => {
                    setNewKpdSifra(sifra);
                    setNewKpdNaziv(naziv);
                  }}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-mono text-[var(--text-muted)] mb-1">
                    Jedinica mjere
                  </label>
                  <select
                    value={newJedinica}
                    onChange={(e) => setNewJedinica(e.target.value)}
                    className="w-full bg-[var(--bg-canvas)] text-white px-2.5 py-1.5 text-xs font-mono border border-[var(--border-strong)] focus:border-[var(--accent-primary)] outline-none"
                  >
                    <option value="sat">sat (radni sat)</option>
                    <option value="kom">kom (komad)</option>
                    <option value="paušal">paušal (paušalni iznos)</option>
                    <option value="dan">dan (radni dan)</option>
                    <option value="mjesec">mjesec</option>
                    <option value="projekt">projekt</option>
                    <option value="kartica">kartica (tekst)</option>
                    <option value="km">km (prijevoz)</option>
                  </select>
                </div>

                <div>
                  <CurrencyInput
                    label="Cijena osnovica (€) *"
                    value={newCijena}
                    onChange={setNewCijena}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[var(--text-muted)] mb-1">
                    Tip stavke
                  </label>
                  <div className="flex items-center gap-1 pt-1">
                    <button
                      type="button"
                      onClick={() => setNewJeUsluga(true)}
                      className={`flex-1 py-1 text-xs font-mono font-bold border transition-all ${
                        newJeUsluga
                          ? 'bg-[var(--accent-primary)] text-black border-transparent'
                          : 'bg-[var(--bg-canvas)] text-[var(--text-muted)] border-[var(--border-strong)]'
                      }`}
                    >
                      Usluga
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewJeUsluga(false)}
                      className={`flex-1 py-1 text-xs font-mono font-bold border transition-all ${
                        !newJeUsluga
                          ? 'bg-[var(--accent-primary)] text-black border-transparent'
                          : 'bg-[var(--bg-canvas)] text-[var(--text-muted)] border-[var(--border-strong)]'
                      }`}
                    >
                      Roba
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[var(--text-muted)] mb-1">
                  Opis stavke (opcionalno)
                </label>
                <input
                  type="text"
                  placeholder="Kratki detaljniji opis stavke za račun..."
                  value={newOpis}
                  onChange={(e) => setNewOpis(e.target.value)}
                  className="w-full bg-[var(--bg-canvas)] text-white px-2.5 py-1 text-xs font-mono border border-[var(--border-strong)] focus:border-[var(--accent-primary)] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 text-xs font-mono text-[var(--text-muted)] hover:text-white"
                >
                  Odustani
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[var(--accent-primary)] text-black font-mono font-bold text-xs hover:bg-[var(--accent-primary-hover)] transition-all cursor-pointer shadow-md"
                >
                  Spremi u cjenik
                </button>
              </div>
            </form>
          )}

          {/* List of Articles */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {filteredArticles.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <BookMarked className="w-10 h-10 text-[var(--text-muted)] mx-auto opacity-40" />
                <p className="text-xs font-mono text-[var(--text-muted)]">
                  {searchQuery ? 'Nema artikala koji odgovaraju traženom pojmu.' : 'Cjenik je trenutno prazan.'}
                </p>
                {!searchQuery && (
                  <button
                    type="button"
                    onClick={seedDefaultArticles}
                    className="px-3 py-1.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-canvas)] border border-[var(--border-strong)] text-xs font-mono font-bold text-[var(--accent-primary)] inline-flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Učitaj ogledni cjenik usluga za paušaliste
                  </button>
                )}
              </div>
            ) : (
              filteredArticles.map((artikl) => (
                <div
                  key={artikl.id}
                  className="p-3 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-all space-y-2 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {artikl.jeUsluga ? (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#064E3B] text-[#10B981] border border-[#10B981]/30 font-bold flex items-center gap-0.5">
                            <Briefcase className="w-2.5 h-2.5" /> USLUGA
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#1E3A8A] text-[#60A5FA] border border-[#60A5FA]/30 font-bold flex items-center gap-0.5">
                            <Package className="w-2.5 h-2.5" /> ROBA
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">
                          KPD: <span className="text-white font-bold">{artikl.kpdSifra}</span>
                        </span>
                        {artikl.sifra && (
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">
                            #{artikl.sifra}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-mono font-bold text-white group-hover:text-[var(--accent-primary)] transition-colors">
                        {artikl.naziv}
                      </h4>
                      {artikl.opis && (
                        <p className="text-[11px] font-mono text-[var(--text-muted)] line-clamp-1">
                          {artikl.opis}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      <div className="text-sm font-mono font-bold text-white tabular-nums">
                        {formatHrvatskiIznos(artikl.cijenaOsnovica)}
                      </div>
                      <div className="text-[10px] font-mono text-[var(--text-muted)]">
                        / {artikl.jedinicaMjere || 'sat'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]/40 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => {
                        const confirmDel = confirm(`Sigurno obrisati "${artikl.naziv}" iz cjenika?`);
                        if (confirmDel) deleteArtikl(artikl.id);
                      }}
                      className="text-[var(--text-muted)] hover:text-[#EF4444] text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      Obriši
                    </button>

                    {onSelectArticle && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectArticle(artikl);
                          if (isEmbedded && onNavigateHome) onNavigateHome();
                          else onClose();
                        }}
                        className="px-2.5 py-1 bg-[var(--accent-primary)] text-black hover:bg-[var(--accent-primary-hover)] font-bold text-[11px] flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm"
                      >
                        Dodaj na račun
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
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
