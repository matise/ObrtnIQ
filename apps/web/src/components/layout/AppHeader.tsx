import React from 'react';
import { FolderOpen, BookOpen, ShieldCheck, Users, Settings, BookMarked } from 'lucide-react';
import { ThemeSelector } from '../ThemeSelector';
import { formatHrvatskiIznos } from '@obrtniq/core';

export interface AppHeaderProps {
  totalSavedDocs: number;
  totalKprNaplaceno: number;
  onOpenDocs: () => void;
  onOpenKpr: () => void;
  onOpenFiscal: () => void;
  onOpenSettings: () => void;
  onOpenPartners: () => void;
  onOpenArticles?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  totalSavedDocs,
  totalKprNaplaceno,
  onOpenDocs,
  onOpenKpr,
  onOpenFiscal,
  onOpenSettings,
  onOpenPartners,
  onOpenArticles,
}) => {
  return (
    <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur px-4 sm:px-6 py-2.5 flex items-center justify-between sticky top-0 z-50 no-print">
      <div className="flex items-center space-x-3 sm:space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[var(--accent-primary-hover)] to-[var(--accent-primary)] flex items-center justify-center font-bold font-mono text-sm tracking-wider text-black shadow-inner">
            IQ
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-white">
              ObrtnIQ
            </span>
            <span className="ml-2 text-[10px] font-mono uppercase bg-[var(--bg-elevated)] text-[var(--text-secondary)] px-1.5 py-0.5 border border-[var(--border-strong)]">
              v3.0 Dynamic Theme
            </span>
          </div>
        </div>

        <div className="h-4 w-[1px] bg-[var(--border-subtle)]" />

        {/* Gumb za evidenciju dokumenata */}
        <button
          type="button"
          onClick={onOpenDocs}
          className="flex items-center space-x-1.5 px-2.5 py-1 bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] text-xs font-mono text-white border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] transition-all cursor-pointer"
        >
          <FolderOpen className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
          <span>Dokumenti</span>
          <span className="ml-1 text-[10px] bg-[var(--accent-primary)] text-black px-1.5 py-0.2 font-bold">
            {totalSavedDocs}
          </span>
        </button>

        {/* Gumb za KPR & PO-SD */}
        <button
          type="button"
          onClick={onOpenKpr}
          className="flex items-center space-x-1.5 px-2.5 py-1 bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] text-xs font-mono text-white border border-[var(--border-subtle)] hover:border-[#10B981] transition-all cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5 text-[#10B981]" />
          <span>KPR &amp; PO-SD</span>
        </button>

        {/* Gumb za Fiskalizaciju & e-Račun */}
        <button
          type="button"
          onClick={onOpenFiscal}
          className="flex items-center space-x-1.5 px-2.5 py-1 bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] text-xs font-mono text-white border border-[var(--border-subtle)] hover:border-[#3B82F6] transition-all cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#3B82F6]" />
          <span>Fiskalizacija</span>
        </button>

        {/* Gumb za Cjenik Artikala i Usluga */}
        <button
          type="button"
          onClick={onOpenArticles}
          className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] text-xs font-mono text-white border border-[var(--border-subtle)] hover:border-[#F59E0B] transition-all cursor-pointer"
        >
          <BookMarked className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>Cjenik</span>
        </button>

        {/* Gumb za Adresar Partnera */}
        <button
          type="button"
          onClick={onOpenPartners}
          className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] text-xs font-mono text-white border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] transition-all cursor-pointer"
        >
          <Users className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
          <span>Partneri</span>
        </button>

        {/* Gumb za Postavke Obrta & Memorandum */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex items-center space-x-1.5 px-2.5 py-1 bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] text-xs font-mono text-white border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] transition-all cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
          <span>Postavke</span>
        </button>
      </div>

      {/* Header Right Tools: Theme Selector + Prag Widget */}
      <div className="flex items-center space-x-4 sm:space-x-6">
        {/* Dynamic Theme Selector */}
        <ThemeSelector />

        {/* Dinamički Paušalni Prag Widget */}
        <div 
          onClick={onOpenKpr}
          title="Kliknite za pregled Knjige Prometa i Obrasca PO-SD"
          className="hidden lg:flex flex-col items-end text-right cursor-pointer hover:opacity-90 transition-opacity"
        >
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-[var(--text-muted)] uppercase tracking-wider font-mono">Paušalni Prag 2026:</span>
            <span className="font-mono font-bold text-[#10B981] tabular-nums">{formatHrvatskiIznos(totalKprNaplaceno)}</span>
            <span className="text-[var(--text-muted)] font-mono">
              / 40.000 € ({((totalKprNaplaceno / 40000) * 100).toFixed(1)}%)
            </span>
          </div>
          <div className="w-44 h-1.5 bg-[var(--bg-elevated)] mt-1 overflow-hidden border border-[var(--border-subtle)]">
            <div 
              className={`h-full ${
                totalKprNaplaceno > 40000 
                  ? 'bg-[#EF4444]' 
                  : totalKprNaplaceno >= 36000 
                  ? 'bg-[#EF4444]' 
                  : totalKprNaplaceno >= 30000 
                  ? 'bg-[#F59E0B]' 
                  : 'bg-[#10B981]'
              }`} 
              style={{ width: `${Math.max(2, Math.min(100, (totalKprNaplaceno / 40000) * 100))}%` }} 
            />
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-[11px] font-mono block text-[var(--text-muted)]">Status Sustava</span>
          <span className="text-xs font-mono text-[#10B981] font-semibold">Faza 8 &bull; Postavke, Partneri &amp; Memorandum</span>
        </div>
      </div>
    </header>
  );
};
