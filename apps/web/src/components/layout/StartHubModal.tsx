// apps/web/src/components/layout/StartHubModal.tsx
// ObrtnIQ v3.0 — Start Centar & Zapovjedno Središte Obrta (Windows Start & Spotlight Analogon)

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Plus,
  Sparkles,
  X,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { ObrtIcon, ObrtBadge } from '../icons';
import { formatHrvatskiIznos } from '@obrtniq/core';
import type { WorkspaceView } from '../../hooks/useWorkspaceRouter';

export interface StartHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: WorkspaceView) => void;
  onNewInvoice: () => void;
  onOpenZigo?: () => void;
  onOpenOnboarding?: () => void;
  totalKprNaplaceno: number;
  totalSavedDocs: number;
  obrtNaziv: string;
  obrtOib: string;
}

interface ActionItem {
  id: string;
  title: string;
  category: 'RADNI_PROSTOR' | 'FINANCIJE' | 'REGISTRI' | 'SUSTAV' | 'BRZA_RADNJA';
  iconName: string;
  lucideIcon?: React.ReactNode;
  shortcut?: string;
  description: string;
  action: () => void;
  badge?: string;
  accentColor: string;
}

export const StartHubModal: React.FC<StartHubModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onNewInvoice,
  onOpenZigo,
  onOpenOnboarding,
  totalKprNaplaceno,
  totalSavedDocs,
  obrtNaziv,
  obrtOib,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fokusiraj input čim se prozor otvori
  useEffect(() => {
    if (!isOpen) return;
    setSearchQuery('');
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Zatvaranje na Escape tipku i klik izvan
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Definicija svih radnji i modula u sustavu
  const allActions = useMemo<ActionItem[]>(() => [
    // 1. Brze Radnje
    {
      id: 'action-new-invoice',
      title: 'Novi Račun',
      category: 'BRZA_RADNJA',
      iconName: 'invoice-document',
      lucideIcon: <Plus className="w-4 h-4 text-[#38BDF8]" />,
      shortcut: 'Alt+N / F2',
      description: 'Otvori radnu plohu unosa za novi račun s automatskim brojem.',
      action: () => {
        onNewInvoice();
        onClose();
      },
      accentColor: '#38BDF8',
      badge: 'Glavno'
    },
    {
      id: 'action-zigo-ai',
      title: 'Žigo Orlando AI Copilot',
      category: 'BRZA_RADNJA',
      iconName: 'zigo-emblem',
      lucideIcon: <Sparkles className="w-4 h-4 text-[#F59E0B]" />,
      shortcut: 'Alt+Z',
      description: 'Zatraži porezni savjet, provjeru računa ili analizu poslovanja.',
      action: () => {
        onClose();
        onOpenZigo?.();
      },
      accentColor: '#F59E0B',
      badge: 'AI Asistent'
    },
    {
      id: 'action-onboarding-wizard',
      title: 'Upoznaj Žiga (Onboarding Vodič)',
      category: 'BRZA_RADNJA',
      iconName: 'app-seal',
      shortcut: 'Wizard',
      description: 'Glasovni vodič kroz 5 činova: OIB, račun, KPD, tema i prvi rez (izdavanje računa).',
      action: () => {
        onClose();
        onOpenOnboarding?.();
      },
      accentColor: '#F59E0B',
      badge: 'Vodič'
    },
    {
      id: 'action-new-expense',
      title: 'Novi Poslovni Trošak',
      category: 'BRZA_RADNJA',
      iconName: 'legal-scales',
      shortcut: 'KPR Trošak',
      description: 'Unesi operativni trošak, pretplatu ili račun dobavljača.',
      action: () => {
        onNavigate('bookkeeping');
        onClose();
      },
      accentColor: '#10B981'
    },

    // 2. Radni Prostor
    {
      id: 'nav-home',
      title: 'Radna Ploha (Home)',
      category: 'RADNI_PROSTOR',
      iconName: 'app-seal',
      shortcut: 'Alt+H',
      description: 'Glavni ekran: forma za unos i živi A4 PDF račun u realnom vremenu.',
      action: () => {
        onNavigate('home');
        onClose();
      },
      accentColor: '#38BDF8'
    },
    {
      id: 'nav-docs',
      title: 'Dokumenti & Arhiva Računa',
      category: 'RADNI_PROSTOR',
      iconName: 'invoice-document',
      shortcut: 'Arhiva',
      description: `Pregled svih izdanih računa, ponuda i nacrta (${totalSavedDocs} spremljeno).`,
      action: () => {
        onNavigate('documents');
        onClose();
      },
      accentColor: '#38BDF8',
      badge: `${totalSavedDocs}`
    },

    // 3. Financije & Knjigovodstvo
    {
      id: 'nav-bookkeeping',
      title: 'Knjigovodstvo: KPR, Doprinosi & PO-SD',
      category: 'FINANCIJE',
      iconName: 'kpr-tower',
      shortcut: 'KPR / PO-SD',
      description: 'Knjiga prometa, prag 40.000 €, MIO/HZZO doprinosi s HUB-3 uplatnicama i uvoz izvoda.',
      action: () => {
        onNavigate('bookkeeping');
        onClose();
      },
      accentColor: '#10B981'
    },

    // 4. Registri & Šifarnici
    {
      id: 'nav-partners',
      title: 'Adresar Poslovnih Partnera',
      category: 'REGISTRI',
      iconName: 'b2b-partners',
      shortcut: 'B2B',
      description: 'Evidencija kupaca, OIB validacija, porezne zone (Tuzemstvo, EU, Treće zemlje).',
      action: () => {
        onNavigate('partners');
        onClose();
      },
      accentColor: '#F59E0B'
    },
    {
      id: 'nav-articles',
      title: 'Cjenik Artikala & KPD 2025',
      category: 'REGISTRI',
      iconName: 'catalog-pricing',
      shortcut: 'Katalog',
      description: 'Šifarnik usluga i artikala s KPD šiframa za jednostavno fakturiranje.',
      action: () => {
        onNavigate('articles');
        onClose();
      },
      accentColor: '#F59E0B'
    },

    // 5. Usklađenost & Sustav
    {
      id: 'nav-fiscal',
      title: 'Fiskalizacija 1.0 & e-Račun (UBL 2.1)',
      category: 'SUSTAV',
      iconName: 'fiscal-quill',
      shortcut: 'ZKI / JIR',
      description: 'CIS SOAP certifikati, fiskalni QR kod i B2B/B2G e-Račun standard.',
      action: () => {
        onNavigate('fiscal');
        onClose();
      },
      accentColor: '#8B5CF6'
    },
    {
      id: 'nav-settings',
      title: 'Postavke Obrta & Kripto-Trezor',
      category: 'SUSTAV',
      iconName: 'obrt-tools',
      shortcut: 'Profil',
      description: 'Memorandum, logo obrta, pečat i potpis, Google Drive backup i postavke.',
      action: () => {
        onNavigate('settings');
        onClose();
      },
      accentColor: '#94A3B8'
    },
    {
      id: 'nav-documentation',
      title: 'Sustav Dokumentacije & 21 Faza',
      category: 'SUSTAV',
      iconName: 'telemetry-terminal',
      shortcut: '#docs',
      description: 'Implementacijski dnevnik, Gate-Check verifikacije i dubrovački kripto-manifest.',
      action: () => {
        onNavigate('docs');
        onClose();
      },
      accentColor: '#10B981',
      badge: '100%'
    },
    {
      id: 'nav-logs',
      title: 'Sustavni Dnevnik & Telemetrija',
      category: 'SUSTAV',
      iconName: 'telemetry-terminal',
      shortcut: '#logs',
      description: 'Konzola događaja i dijagnostika sustava u realnom vremenu.',
      action: () => {
        onNavigate('logs');
        onClose();
      },
      accentColor: '#94A3B8'
    }
  ], [onNewInvoice, onOpenZigo, onNavigate, onClose, totalSavedDocs]);

  // Filtrirane radnje prema unosu
  const filteredActions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allActions;
    return allActions.filter(item => 
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.shortcut?.toLowerCase().includes(q)
    );
  }, [allActions, searchQuery]);

  if (!isOpen) return null;

  // Izračun praga paušala
  const pragLimit = 40000;
  const pragPostotak = Math.min(100, Math.round((totalKprNaplaceno / pragLimit) * 100));
  const preostaloDoPraga = Math.max(0, pragLimit - totalKprNaplaceno);

  return (
    <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md flex items-start justify-center pt-8 sm:pt-16 p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150 no-print">
      {/* Glavna Start Hub Kapsula (Širina 760px, kao Windows Start / macOS Spotlight) */}
      <div
        ref={containerRef}
        className="w-full max-w-3xl bg-[#0F1115] border border-[var(--border-strong)] shadow-[0_20px_60px_rgba(0,0,0,0.85)] flex flex-col font-mono text-xs overflow-hidden"
      >
        {/* 1. Zaglavlje Start Centra: Amblem, Naziv i Zatvori */}
        <div className="p-4 sm:p-5 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3.5">
            <ObrtBadge name="zigo-emblem" size={42} glow colorMode="gold" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base text-white">Obrtn</span>
                <span className="font-black text-base text-[var(--accent-primary)] font-mono">IQ</span>
                <span className="text-[10px] uppercase font-bold text-[#F59E0B] tracking-wider px-1.5 py-0.2 bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                  Dubrovačka Kripto-Republika
                </span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-0.5 flex items-center gap-2">
                <span className="text-slate-300 font-semibold">{obrtNaziv || 'Moj Paušalni Obrt'}</span>
                {obrtOib && <span>&bull; OIB: {obrtOib}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-[var(--text-muted)] hidden sm:inline">Zatvori: Esc</span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
              title="Zatvori Start Hub (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Traka za Brzu Pretragu / Command Input */}
        <div className="p-3 sm:p-4 bg-[var(--bg-canvas)] border-b border-[var(--border-subtle)]">
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--accent-primary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Pretraži module, naredbe, partnere ili unesi račun..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#16181D] border border-[var(--border-subtle)] focus:border-[var(--accent-primary)] text-sm text-white pl-10 pr-4 py-2.5 outline-none font-mono placeholder:text-[var(--text-muted)] transition-colors shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-white"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* 3. Puls Obrta u 2026. (Financial & Tax Pulse Widget) */}
        {!searchQuery && (
          <div className="px-4 py-3 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Kartica 1: Naplaćeno 2026 */}
            <div className="p-2.5 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-1">
              <span className="text-[10px] uppercase text-[var(--text-muted)] flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-[#10B981]" /> Naplaćeni promet 2026:
              </span>
              <div className="font-bold text-sm text-[#10B981] tabular-nums">
                {formatHrvatskiIznos(totalKprNaplaceno)}
              </div>
            </div>

            {/* Kartica 2: Prag 40.000 € */}
            <div className="p-2.5 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-1">
              <div className="flex items-center justify-between text-[10px] uppercase text-[var(--text-muted)]">
                <span>Paušalni prag 40k €:</span>
                <span className="font-bold text-white tabular-nums">{pragPostotak}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#1F2228] overflow-hidden">
                <div
                  className="h-full bg-[#10B981]"
                  style={{ width: `${pragPostotak}%` }}
                />
              </div>
              <div className="text-[10px] text-[var(--text-muted)] truncate">
                Preostalo: {formatHrvatskiIznos(preostaloDoPraga)}
              </div>
            </div>

            {/* Kartica 3: Porezni Kalendar */}
            <div className="p-2.5 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-1">
              <span className="text-[10px] uppercase text-[var(--text-muted)] flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#F59E0B]" /> Iduća obveza:
              </span>
              <div className="text-[11px] font-bold text-slate-200">
                MIO &amp; HZZO doprinosi
              </div>
              <div className="text-[10px] text-[var(--accent-primary)]">
                Dospijeće: 15. u mjesecu
              </div>
            </div>
          </div>
        )}

        {/* 4. Sadržaj Start Centra: Brze Radnje i Popis Modula */}
        <div className="p-4 sm:p-5 max-h-[50vh] overflow-y-auto space-y-5">
          {filteredActions.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text-muted)] font-mono">
              Nema modula ili naredbi koje odgovaraju upitu "{searchQuery}".
            </div>
          ) : (
            <>
              {/* Sekcija: Brze Radnje */}
              {!searchQuery && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-[var(--accent-primary)] tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-[var(--accent-primary)]" />
                    Brze Radnje
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {allActions.filter(a => a.category === 'BRZA_RADNJA').map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={item.action}
                        className="p-3 bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] text-left transition-all group cursor-pointer flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="p-1.5 bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                            <ObrtIcon name={item.iconName as any} size={16} glow />
                          </div>
                          {item.shortcut && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-[var(--bg-canvas)] text-[var(--accent-primary)] border border-[var(--border-strong)] font-mono">
                              {item.shortcut}
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-white group-hover:text-[var(--accent-primary)] transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-[10px] text-[var(--text-muted)] mt-1 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sekcija: Svi Moduli Raspoređeni po Kontekstu */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
                  {searchQuery ? `Rezultati Pretrage (${filteredActions.length})` : 'Svi Poslovni Moduli & Registri'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredActions.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={item.action}
                      className="p-3 bg-[var(--bg-canvas)] hover:bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-left transition-all group cursor-pointer flex items-start space-x-3"
                    >
                      <div className="p-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] shrink-0 mt-0.5">
                        <ObrtIcon name={item.iconName as any} size={18} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-bold text-xs text-white group-hover:text-[var(--accent-primary)] transition-colors truncate">
                            {item.title}
                          </h4>
                          {item.badge && (
                            <span className="text-[9px] px-1.5 py-0.2 bg-[var(--bg-elevated)] text-[var(--accent-primary)] border border-[var(--border-subtle)] shrink-0">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 5. Podnožje Start Centra: Tipkovničke Upute */}
        <div className="p-3 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)] flex-wrap gap-2">
          <div className="flex items-center space-x-3">
            <span><kbd className="px-1.5 py-0.5 bg-[var(--bg-canvas)] border border-[var(--border-strong)] text-white">Alt+S</kbd> Start Hub</span>
            <span><kbd className="px-1.5 py-0.5 bg-[var(--bg-canvas)] border border-[var(--border-strong)] text-white">Alt+N</kbd> Novi Račun</span>
            <span><kbd className="px-1.5 py-0.5 bg-[var(--bg-canvas)] border border-[var(--border-strong)] text-white">F2</kbd> Izdaj</span>
          </div>

          <div className="flex items-center space-x-1.5 text-[var(--accent-primary)] font-semibold">
            <span>Non bene pro toto libertas venditur auro</span>
          </div>
        </div>
      </div>
    </div>
  );
};
