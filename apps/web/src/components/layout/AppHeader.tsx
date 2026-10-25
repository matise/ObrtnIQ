import { useState } from 'react';
import { 
  Cloud,
  CloudOff,
  RefreshCw,
  Download,
  WifiOff,
  Home,
} from 'lucide-react';
import { ObrtIcon, ObrtBadge } from '../icons';
import { ThemeSelector } from '../ThemeSelector';
import { formatHrvatskiIznos, type GoogleAuthIdentity } from '@obrtniq/core';
import { usePwaInstall } from '../../hooks/usePwaInstall';
import type { WorkspaceView } from '../../hooks/useWorkspaceRouter';

interface GoogleAvatarBadgeProps {
  pictureUrl?: string;
  name?: string;
}

const GoogleAvatarBadge: React.FC<GoogleAvatarBadgeProps> = ({ pictureUrl, name }) => {
  const [hasError, setHasError] = useState(false);
  const initial = name && name.trim() ? name.trim().charAt(0).toUpperCase() : 'G';

  if (!pictureUrl || hasError) {
    return (
      <div 
        className="w-5 h-5 rounded-full bg-[#4285F4] text-white font-bold text-[10px] flex items-center justify-center font-mono shrink-0 shadow-sm"
        title={name || 'Google račun'}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={pictureUrl}
      alt={name || 'Google Avatar'}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      onError={() => setHasError(true)}
      className="w-5 h-5 rounded-full object-cover shrink-0 border border-white/10"
    />
  );
};

export interface AppHeaderProps {
  totalSavedDocs: number;
  totalKprNaplaceno: number;
  activeView?: WorkspaceView;
  onNavigateHome?: () => void;
  onOpenDocs: () => void;
  onOpenKpr: () => void;
  onOpenFiscal: () => void;
  onOpenSettings: () => void;
  onOpenPartners: () => void;
  onOpenArticles?: () => void;
  onOpenZigo?: () => void;
  googleIdentity?: GoogleAuthIdentity | null;
  cloudSyncStatus?: 'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR';
  lastSyncTime?: string | null;
  onSyncClick?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  totalSavedDocs,
  totalKprNaplaceno,
  activeView = 'home',
  onNavigateHome,
  onOpenDocs,
  onOpenKpr,
  onOpenFiscal,
  onOpenSettings,
  onOpenPartners,
  onOpenArticles,
  onOpenZigo,
  googleIdentity,
  cloudSyncStatus = 'IDLE',
  lastSyncTime,
  onSyncClick,
}) => {
  const { isInstallable, isOffline, promptInstall } = usePwaInstall();

  return (
    <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur px-4 sm:px-6 py-2 flex items-center justify-between sticky top-0 z-50 no-print">
      {/* 1. Lijeva sekcija: Glavni Orlando amblem (veći) + Ujednačeni navigacijski bar s većim ikonama i tooltipovima */}
      <div className="flex items-center space-x-3 sm:space-x-5">
        {/* Službeni amblem aplikacije: Orlando Cyber-Stone Seal (Znatno veći, size 48) */}
        <div className="flex items-center space-x-3">
          <ObrtBadge 
            name="zigo-emblem" 
            size={48} 
            glow 
            colorMode="gold"
            className="cursor-pointer hover:scale-105 active:scale-95 transition-transform shrink-0" 
            onClick={onNavigateHome || onOpenDocs} 
            label="ObrtnIQ - Radna Ploha (Home)" 
          />
          <div 
            className="flex flex-col justify-center cursor-pointer select-none"
            onClick={onNavigateHome}
            title="Povratak na Radnu Plohu (Home)"
          >
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-white leading-none">
                ObrtnIQ
              </span>
              <span className="text-[9px] font-mono font-bold uppercase bg-[var(--bg-elevated)] text-[var(--accent-primary)] px-1.5 py-0.5 border border-[var(--border-strong)] leading-none">
                v3.0
              </span>
            </div>
            <span className="text-[10px] font-mono text-[var(--text-muted)] tracking-wider uppercase mt-1 hidden sm:block leading-none">
              Dubrovačka Kripto-Republika
            </span>
          </div>
        </div>

        <div className="h-6 w-[1px] bg-[var(--border-subtle)] mx-1 hidden sm:block" />

        {/* Ujednačeni Navigacijski Gumbi (Uniform 40x40px kapsule, veće ikone 22px, bogati floating tooltipovi) */}
        <nav className="flex items-center space-x-1.5 sm:space-x-2">
          {/* 0. Gumb: Home / Radna Ploha (Novi račun) */}
          <button
            type="button"
            onClick={onNavigateHome}
            aria-label="Radna Ploha — Izrada novog računa (Alt+H)"
            className={`relative group flex items-center justify-center w-10 h-10 transition-all cursor-pointer rounded-none ${
              activeView === 'home'
                ? 'bg-[var(--bg-elevated)] border-2 border-[var(--accent-primary)] shadow-[0_0_14px_var(--icon-layer-glow)] text-white'
                : 'bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] text-slate-300 hover:text-white border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]'
            }`}
          >
            <Home className="w-5 h-5 text-[var(--accent-primary)]" />
            {activeView === 'home' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[var(--accent-primary)] rounded-full" />
            )}
            {/* Tooltip */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 hidden group-hover:flex flex-col items-center pointer-events-none z-[70] whitespace-nowrap">
              <div className="w-2 h-2 bg-[#121316] border-t border-l border-[var(--border-strong)] rotate-45 -mb-1 z-10" />
              <div className="bg-[#121316]/95 backdrop-blur-md text-[#e4e4e7] text-xs font-mono px-3 py-1.5 border border-[var(--border-strong)] shadow-2xl flex items-center gap-2">
                <span className="font-bold text-white">Radna Ploha (Home)</span>
                <span className="text-[10px] text-[var(--accent-primary)]">Novi račun &bull; Alt+H</span>
              </div>
            </div>
          </button>

          {/* 1. Gumb: Dokumenti & Računi */}
          <button
            type="button"
            onClick={onOpenDocs}
            aria-label={`Dokumenti (${totalSavedDocs} spremljenih računa)`}
            className={`relative group flex items-center justify-center w-10 h-10 transition-all cursor-pointer rounded-none ${
              activeView === 'documents'
                ? 'bg-[var(--bg-elevated)] border-2 border-[var(--accent-primary)] shadow-[0_0_14px_var(--icon-layer-glow)] text-white'
                : 'bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] text-white border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] hover:shadow-[0_0_12px_var(--icon-layer-glow)]'
            }`}
          >
            <ObrtIcon name="invoice-document" size={22} isAnimated />
            {activeView === 'documents' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[var(--accent-primary)] rounded-full" />
            )}
            {totalSavedDocs > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[var(--accent-primary)] text-black font-mono font-black text-[9px] min-w-[17px] h-4 px-1 rounded-full flex items-center justify-center shadow-lg border border-[var(--bg-surface)] tabular-nums pointer-events-none">
                {totalSavedDocs}
              </span>
            )}
            {/* Tooltip */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 hidden group-hover:flex flex-col items-center pointer-events-none z-[70] whitespace-nowrap">
              <div className="w-2 h-2 bg-[#121316] border-t border-l border-[var(--border-strong)] rotate-45 -mb-1 z-10" />
              <div className="bg-[#121316]/95 backdrop-blur-md text-[#e4e4e7] text-xs font-mono px-3 py-1.5 border border-[var(--border-strong)] shadow-2xl flex items-center gap-2">
                <span className="font-bold text-white">Dokumenti</span>
                <span className="text-[10px] text-[var(--accent-primary)]">({totalSavedDocs} spremljeno)</span>
              </div>
            </div>
          </button>

          {/* 2. Gumb: KPR & PO-SD */}
          <button
            type="button"
            onClick={onOpenKpr}
            aria-label="Knjigovodstvo: KPR, Doprinosi, Troškovi i Izvodi"
            className={`relative group flex items-center justify-center w-10 h-10 transition-all cursor-pointer rounded-none ${
              activeView === 'bookkeeping'
                ? 'bg-[#10B981]/20 border-2 border-[#10B981] shadow-[0_0_14px_rgba(16,185,129,0.4)] text-white'
                : 'bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] text-white border border-[var(--border-subtle)] hover:border-[#10B981] hover:shadow-[0_0_12px_rgba(16,185,129,0.3)]'
            }`}
          >
            <ObrtIcon name="kpr-tower" size={22} isAnimated />
            {activeView === 'bookkeeping' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#10B981] rounded-full" />
            )}
            {/* Tooltip */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 hidden group-hover:flex flex-col items-center pointer-events-none z-[70] whitespace-nowrap">
              <div className="w-2 h-2 bg-[#121316] border-t border-l border-[var(--border-strong)] rotate-45 -mb-1 z-10" />
              <div className="bg-[#121316]/95 backdrop-blur-md text-[#e4e4e7] text-xs font-mono px-3 py-1.5 border border-[var(--border-strong)] shadow-2xl flex items-center gap-2">
                <span className="font-bold text-white">Knjigovodstvo</span>
                <span className="text-[10px] text-[#10B981]">Doprinosi &bull; KPR &bull; Troškovi &bull; Izvodi</span>
              </div>
            </div>
          </button>

          {/* 3. Gumb: Fiskalizacija & e-Račun */}
          <button
            type="button"
            onClick={onOpenFiscal}
            aria-label="Fiskalizacija 1.0 i 2.0 e-Račun"
            className={`relative group flex items-center justify-center w-10 h-10 transition-all cursor-pointer rounded-none ${
              activeView === 'fiscal'
                ? 'bg-[#3B82F6]/20 border-2 border-[#3B82F6] shadow-[0_0_14px_rgba(59,130,246,0.4)] text-white'
                : 'bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] text-white border border-[var(--border-subtle)] hover:border-[#3B82F6] hover:shadow-[0_0_12px_rgba(59,130,246,0.3)]'
            }`}
          >
            <ObrtIcon name="fiscal-quill" size={22} isAnimated />
            {activeView === 'fiscal' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#3B82F6] rounded-full" />
            )}
            {/* Tooltip */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 hidden group-hover:flex flex-col items-center pointer-events-none z-[70] whitespace-nowrap">
              <div className="w-2 h-2 bg-[#121316] border-t border-l border-[var(--border-strong)] rotate-45 -mb-1 z-10" />
              <div className="bg-[#121316]/95 backdrop-blur-md text-[#e4e4e7] text-xs font-mono px-3 py-1.5 border border-[var(--border-strong)] shadow-2xl flex items-center gap-2">
                <span className="font-bold text-white">Fiskalizacija &amp; e-Račun</span>
                <span className="text-[10px] text-[#3B82F6]">ZKI &bull; JIR &bull; UBL 2.1</span>
              </div>
            </div>
          </button>

          {/* 4. Gumb: Cjenik Artikala i Usluga */}
          {onOpenArticles && (
            <button
              type="button"
              onClick={onOpenArticles}
              aria-label="Cjenik Artikala i Usluga s KPD 2025"
              className={`relative group flex items-center justify-center w-10 h-10 transition-all cursor-pointer rounded-none ${
                activeView === 'articles'
                  ? 'bg-[#F59E0B]/20 border-2 border-[#F59E0B] shadow-[0_0_14px_rgba(245,158,11,0.4)] text-white'
                  : 'bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] text-white border border-[var(--border-subtle)] hover:border-[#F59E0B] hover:shadow-[0_0_12px_rgba(245,158,11,0.3)]'
              }`}
            >
              <ObrtIcon name="catalog-pricing" size={22} isAnimated />
              {activeView === 'articles' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#F59E0B] rounded-full" />
              )}
              {/* Tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 hidden group-hover:flex flex-col items-center pointer-events-none z-[70] whitespace-nowrap">
                <div className="w-2 h-2 bg-[#121316] border-t border-l border-[var(--border-strong)] rotate-45 -mb-1 z-10" />
                <div className="bg-[#121316]/95 backdrop-blur-md text-[#e4e4e7] text-xs font-mono px-3 py-1.5 border border-[var(--border-strong)] shadow-2xl flex items-center gap-2">
                  <span className="font-bold text-white">Cjenik Artikala &amp; Usluga</span>
                  <span className="text-[10px] text-[#F59E0B]">KPD 2025 Katalog</span>
                </div>
              </div>
            </button>
          )}

          {/* 5. Gumb: Adresar Partnera */}
          <button
            type="button"
            onClick={onOpenPartners}
            aria-label="Adresar Poslovnih Partnera (B2B imenik)"
            className={`relative group flex items-center justify-center w-10 h-10 transition-all cursor-pointer rounded-none ${
              activeView === 'partners'
                ? 'bg-[var(--bg-elevated)] border-2 border-[var(--accent-primary)] shadow-[0_0_14px_var(--icon-layer-glow)] text-white'
                : 'bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] text-white border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] hover:shadow-[0_0_12px_var(--icon-layer-glow)]'
            }`}
          >
            <ObrtIcon name="b2b-partners" size={22} isAnimated />
            {activeView === 'partners' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[var(--accent-primary)] rounded-full" />
            )}
            {/* Tooltip */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 hidden group-hover:flex flex-col items-center pointer-events-none z-[70] whitespace-nowrap">
              <div className="w-2 h-2 bg-[#121316] border-t border-l border-[var(--border-strong)] rotate-45 -mb-1 z-10" />
              <div className="bg-[#121316]/95 backdrop-blur-md text-[#e4e4e7] text-xs font-mono px-3 py-1.5 border border-[var(--border-strong)] shadow-2xl flex items-center gap-2">
                <span className="font-bold text-white">Adresar Partnera</span>
                <span className="text-[10px] text-[var(--accent-primary)]">B2B Adresar &bull; OIB</span>
              </div>
            </div>
          </button>

          {/* 6. Gumb: Postavke Obrta & Memorandum */}
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Postavke Obrta i Memorandum"
            className={`relative group flex items-center justify-center w-10 h-10 transition-all cursor-pointer rounded-none ${
              activeView === 'settings'
                ? 'bg-[var(--bg-elevated)] border-2 border-[var(--accent-primary)] shadow-[0_0_14px_var(--icon-layer-glow)] text-white'
                : 'bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] text-white border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] hover:shadow-[0_0_12px_var(--icon-layer-glow)]'
            }`}
          >
            <ObrtIcon name="obrt-tools" size={22} isAnimated />
            {activeView === 'settings' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[var(--accent-primary)] rounded-full" />
            )}
            {/* Tooltip */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 hidden group-hover:flex flex-col items-center pointer-events-none z-[70] whitespace-nowrap">
              <div className="w-2 h-2 bg-[#121316] border-t border-l border-[var(--border-strong)] rotate-45 -mb-1 z-10" />
              <div className="bg-[#121316]/95 backdrop-blur-md text-[#e4e4e7] text-xs font-mono px-3 py-1.5 border border-[var(--border-strong)] shadow-2xl flex items-center gap-2">
                <span className="font-bold text-white">Postavke Obrta</span>
                <span className="text-[10px] text-[var(--text-muted)]">Profil &bull; Memorandum &bull; Trezor</span>
              </div>
            </div>
          </button>

          {/* 7. Gumb: Žigo AI (Autonomni Klijentski Agent) */}
          {onOpenZigo && (
            <button
              type="button"
              onClick={onOpenZigo}
              aria-label="Žigo (Digitalni Orlando) - Autonomni agent sustava"
              className="relative group flex items-center justify-center w-10 h-10 bg-[#1e2025] hover:bg-[#252830] border border-[#b89758]/60 hover:border-[#ffd700] hover:shadow-[0_0_14px_rgba(255,215,0,0.35)] transition-all cursor-pointer rounded-none shadow-sm"
            >
              <ObrtIcon name="zigo-emblem" size={22} isAnimated colorMode="gold" />
              {/* Tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 hidden group-hover:flex flex-col items-center pointer-events-none z-[70] whitespace-nowrap">
                <div className="w-2 h-2 bg-[#121316] border-t border-l border-[#b89758]/60 rotate-45 -mb-1 z-10" />
                <div className="bg-[#121316]/95 backdrop-blur-md text-[#f0e6d2] text-xs font-mono px-3 py-1.5 border border-[#b89758]/60 shadow-2xl flex items-center gap-2">
                  <span className="font-bold text-[#ffd700]">Žigo AI</span>
                  <span className="text-[10px] text-[#e0cfab]">Autonomni klijentski agent</span>
                </div>
              </div>
            </button>
          )}
        </nav>
      </div>

      {/* 2. Desna sekcija: Google Identity + Theme Selector + Paušalni Prag Widget */}
      <div className="flex items-center space-x-2.5 sm:space-x-4">
        {/* Google Identity & Cloud Sync Badge */}
        <div className="flex items-center">
          {googleIdentity ? (
            <div 
              onClick={onOpenSettings}
              className="h-10 flex items-center space-x-2 px-2.5 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] hover:border-[#4285F4] cursor-pointer transition-all"
              title={`Prijavljen: ${googleIdentity.email} (Google Sub: ${googleIdentity.googleSub})`}
            >
              <GoogleAvatarBadge 
                pictureUrl={googleIdentity.pictureUrl} 
                name={googleIdentity.name || googleIdentity.email} 
              />
              <span className="text-xs font-mono text-white hidden md:inline truncate max-w-[100px]">
                {googleIdentity.name || googleIdentity.email}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSyncClick) onSyncClick();
                  else onOpenSettings();
                }}
                className="hover:scale-110 transition-transform cursor-pointer pl-0.5"
                title={
                  cloudSyncStatus === 'SYNCING'
                    ? 'Sinkronizacija na Google Drive u tijeku...'
                    : lastSyncTime
                    ? `Zadnja sinkronizacija: ${new Date(lastSyncTime).toLocaleTimeString('hr-HR')}`
                    : 'Sinkroniziraj na Google Drive'
                }
              >
                {cloudSyncStatus === 'SYNCING' ? (
                  <RefreshCw className="w-3.5 h-3.5 text-[var(--accent-primary)] animate-spin" />
                ) : cloudSyncStatus === 'ERROR' ? (
                  <CloudOff className="w-3.5 h-3.5 text-[#EF4444]" />
                ) : (
                  <Cloud className="w-3.5 h-3.5 text-[#10B981]" />
                )}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenSettings}
              className="h-10 flex items-center space-x-1.5 px-2.5 bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[#4285F4] text-xs font-mono text-[var(--text-muted)] hover:text-white transition-all cursor-pointer"
              title="Povežite Google račun za besplatnu Drive sinkronizaciju"
            >
              <CloudOff className="w-4 h-4 text-[var(--text-muted)]" />
              <span className="hidden xl:inline">Google Cloud</span>
            </button>
          )}
        </div>

        {/* PWA Offline Indikator */}
        {isOffline && (
          <div 
            className="h-10 flex items-center space-x-1.5 px-2.5 bg-amber-500/10 border border-amber-500/40 text-amber-400 text-xs font-mono select-none"
            title="Aplikacija radi u offline načinu rada. Svi podaci se spremaju lokalno u preglednik (Dexie/IndexedDB)."
          >
            <WifiOff className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Offline (PWA)</span>
          </div>
        )}

        {/* PWA Instalacija Gumb */}
        {isInstallable && (
          <button
            type="button"
            onClick={() => promptInstall()}
            className="h-10 flex items-center space-x-1.5 px-2.5 bg-gradient-to-r from-[var(--accent-primary)]/20 to-[var(--accent-primary)]/10 hover:from-[var(--accent-primary)]/30 hover:to-[var(--accent-primary)]/20 border border-[var(--accent-primary)] text-white text-xs font-mono transition-all cursor-pointer animate-pulse"
            title="Instalirajte ObrtnIQ kao PWA aplikaciju na vaše računalo ili mobitel za samostalan rad bez interneta."
          >
            <Download className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
            <span className="hidden sm:inline font-bold">Instaliraj App</span>
          </button>
        )}

        {/* Dynamic Theme Selector (Standardiziran na h-10) */}
        <ThemeSelector />

        {/* Dinamički Paušalni Prag Widget */}
        <div 
          onClick={onOpenKpr}
          title="Kliknite za pregled Knjige Prometa i Obrasca PO-SD"
          className="hidden lg:flex flex-col items-end text-right cursor-pointer hover:opacity-90 transition-opacity justify-center h-10"
        >
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-[var(--text-muted)] uppercase tracking-wider font-mono text-[11px]">Prag 2026:</span>
            <span className="font-mono font-bold text-[#10B981] tabular-nums">{formatHrvatskiIznos(totalKprNaplaceno)}</span>
            <span className="text-[var(--text-muted)] font-mono text-[10px]">
              / 40k € ({((totalKprNaplaceno / 40000) * 100).toFixed(1)}%)
            </span>
          </div>
          <div className="w-36 sm:w-44 h-1.5 bg-[var(--bg-elevated)] mt-1 overflow-hidden border border-[var(--border-subtle)]">
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
      </div>
    </header>
  );
};
