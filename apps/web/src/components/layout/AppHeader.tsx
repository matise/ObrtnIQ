import { useState } from 'react';
import { 
  Cloud,
  CloudOff,
  RefreshCw,
  Download,
  WifiOff,
} from 'lucide-react';
import { ObrtIcon, ObrtBadge } from '../icons';
import { NotificationStreamButton } from './NotificationStreamButton';
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
  onOpenStartHub?: () => void;
  onOpenDocs: () => void;
  onOpenKpr: () => void;
  onOpenFiscal: () => void;
  onOpenSettings: () => void;
  onOpenPartners: () => void;
  onOpenArticles?: () => void;
  onOpenLogs?: () => void;
  onToggleLogDrawer?: () => void;
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
  onOpenStartHub,
  onOpenDocs,
  onOpenKpr,
  onOpenFiscal,
  onOpenSettings,
  onOpenPartners,
  onOpenArticles,
  onOpenLogs,
  onToggleLogDrawer,
  onOpenZigo,
  googleIdentity,
  cloudSyncStatus = 'IDLE',
  lastSyncTime,
  onSyncClick,
}) => {
  const { isInstallable, isOffline, promptInstall } = usePwaInstall();

  return (
    <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur px-3 sm:px-5 lg:px-6 py-2 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-50 no-print">
      {/* 1. Službeni amblem i Start Centar aplikacije: Orlando Cyber-Stone Seal & Start Hub (Lijevo sidro - Uvijek fiksne širine) */}
      <div className="flex items-center shrink-0">
        <div 
          className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer group p-1 -m-1 transition-all rounded hover:bg-white/5 select-none"
          onClick={onOpenStartHub || onNavigateHome}
          title="Start Centar Obrta (Alt+S ili Ctrl+K) • Brze radnje, pretraga i svi moduli"
        >
          <div className="relative shrink-0">
            <ObrtBadge 
              name="zigo-emblem" 
              size={42} 
              glow 
              colorMode="gold"
              className="hover:scale-105 active:scale-95 transition-transform" 
              label="Start Centar ObrtnIQ" 
            />
            <span className="absolute -bottom-1 -right-1 bg-[#18191e] border border-[#b89758]/80 text-[#ffd700] text-[8px] font-mono font-black px-1 py-0.2 rounded-none tracking-widest shadow-md">
              START
            </span>
          </div>

          <div className="flex flex-col justify-center">
            <div className="flex items-baseline">
              <span className="font-black text-xl sm:text-2xl tracking-tight text-white leading-none group-hover:text-slate-100 transition-colors">
                Obrtn
              </span>
              <span className="font-black text-xl sm:text-2xl tracking-tight text-[var(--accent-primary)] leading-none ml-1.5 sm:ml-2 font-mono">
                IQ
              </span>
              <span className="hidden 2xl:inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono font-bold bg-[#1e2025] text-[#b89758] group-hover:text-[#ffd700] border border-[#b89758]/40 group-hover:border-[#ffd700] ml-2.5 transition-colors">
                <span>CENTAR</span>
                <kbd className="text-[8px] bg-black/40 px-1 rounded border border-white/10 text-slate-300">Ctrl+K</kbd>
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-[0.14em] uppercase text-[#F59E0B] mt-1 sm:mt-1.5 leading-none drop-shadow-[0_0_8px_rgba(245,158,11,0.25)] hidden md:block">
              Dubrovačka Kripto-Republika
            </span>
          </div>
        </div>
      </div>

      <div className="h-6 w-[1px] bg-[var(--border-subtle)] mx-1 hidden xl:block shrink-0" />

      {/* 2. Ujednačeni Navigacijski Toolbar — 4 Kontekstualna Otoka (Središnja fluidna traka: min-w-0 flex-1, zaštićena od preklapanja) */}
      <nav className="flex items-center space-x-1 sm:space-x-1.5 min-w-0 flex-1 justify-start md:justify-center overflow-x-auto lg:overflow-visible scrollbar-none py-0.5">
        {/* ========================================================
            OTOK 1: RADNI PROSTOR & ARHIVA (Fakturiranje)
           ======================================================== */}
        <div className="flex items-center space-x-1 shrink-0">
          {/* 1.1. Radna Ploha (Home) */}
          <button
            type="button"
            onClick={onNavigateHome}
            aria-label="Radna Ploha — Izrada novog računa (Alt+1 / Alt+H)"
            className={`relative group flex items-center justify-center w-10 h-10 transition-all cursor-pointer rounded-none shrink-0 ${
                activeView === 'home'
                  ? 'bg-[var(--bg-elevated)] border-2 border-[var(--accent-primary)] shadow-[0_0_14px_var(--icon-layer-glow)] text-white'
                  : 'bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] text-slate-300 hover:text-white border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]'
              }`}
            >
              <ObrtIcon name="app-seal" size={20} isAnimated />
              {activeView === 'home' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[var(--accent-primary)] rounded-full" />
              )}
              {/* Tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 hidden group-hover:flex flex-col items-center pointer-events-none z-[70] whitespace-nowrap">
                <div className="w-2 h-2 bg-[#121316] border-t border-l border-[var(--border-strong)] rotate-45 -mb-1 z-10" />
                <div className="bg-[#121316]/95 backdrop-blur-md text-[#e4e4e7] text-xs font-mono px-3 py-1.5 border border-[var(--border-strong)] shadow-2xl flex items-center gap-2">
                  <span className="font-bold text-white">Radna Ploha</span>
                  <span className="text-[10px] text-[var(--accent-primary)]">Alt+1 &bull; Alt+H</span>
                </div>
              </div>
            </button>

            {/* 1.2. Dokumenti & Arhiva */}
            <button
              type="button"
              onClick={onOpenDocs}
              aria-label={`Dokumenti (${totalSavedDocs} spremljenih računa, Alt+2)`}
              className={`relative group flex items-center justify-center w-10 h-10 transition-all cursor-pointer rounded-none shrink-0 ${
                activeView === 'documents'
                  ? 'bg-[var(--bg-elevated)] border-2 border-[var(--accent-primary)] shadow-[0_0_14px_var(--icon-layer-glow)] text-white'
                  : 'bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] text-slate-300 hover:text-white border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]'
              }`}
            >
              <ObrtIcon name="invoice-document" size={20} isAnimated />
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
                  <span className="text-[10px] text-[var(--accent-primary)]">({totalSavedDocs}) &bull; Alt+2</span>
                </div>
              </div>
            </button>
          </div>

          {/* Razdjelnik Otoka 1 i 2 */}
          <div className="h-5 w-[1px] bg-[var(--border-subtle)] mx-0.5 sm:mx-1 hidden sm:block shrink-0" />

          {/* ========================================================
              OTOK 2: FINANCIJE & REGISTRI (Knjigovodstvo, B2B, Cjenik)
             ======================================================== */}
          <div className="flex items-center space-x-1 shrink-0">
            {/* 2.1. Knjigovodstvo: KPR, Doprinosi, PO-SD */}
            <button
              type="button"
              onClick={onOpenKpr}
              aria-label="Knjigovodstvo: KPR, Doprinosi, Troškovi i Izvodi (Alt+3)"
              className={`relative group flex items-center justify-center w-10 h-10 transition-all cursor-pointer rounded-none shrink-0 ${
                activeView === 'bookkeeping'
                  ? 'bg-[var(--bg-elevated)] border-2 border-[var(--accent-primary)] shadow-[0_0_14px_var(--icon-layer-glow)] text-white'
                  : 'bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] text-slate-300 hover:text-white border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]'
              }`}
            >
              <ObrtIcon name="kpr-tower" size={20} isAnimated />
              {activeView === 'bookkeeping' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[var(--accent-primary)] rounded-full" />
              )}
              {/* Tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 hidden group-hover:flex flex-col items-center pointer-events-none z-[70] whitespace-nowrap">
                <div className="w-2 h-2 bg-[#121316] border-t border-l border-[var(--border-strong)] rotate-45 -mb-1 z-10" />
                <div className="bg-[#121316]/95 backdrop-blur-md text-[#e4e4e7] text-xs font-mono px-3 py-1.5 border border-[var(--border-strong)] shadow-2xl flex items-center gap-2">
                  <span className="font-bold text-white">Knjigovodstvo</span>
                  <span className="text-[10px] text-[#10B981]">KPR &bull; Alt+3</span>
                </div>
              </div>
            </button>

            {/* 2.2. Adresar Partnera */}
            <button
              type="button"
              onClick={onOpenPartners}
              aria-label="Adresar Poslovnih Partnera (B2B imenik, Alt+4)"
              className={`relative group flex items-center justify-center w-10 h-10 transition-all cursor-pointer rounded-none shrink-0 ${
                activeView === 'partners'
                  ? 'bg-[var(--bg-elevated)] border-2 border-[var(--accent-primary)] shadow-[0_0_14px_var(--icon-layer-glow)] text-white'
                  : 'bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] text-slate-300 hover:text-white border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]'
              }`}
            >
              <ObrtIcon name="b2b-partners" size={20} isAnimated />
              {activeView === 'partners' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[var(--accent-primary)] rounded-full" />
              )}
              {/* Tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 hidden group-hover:flex flex-col items-center pointer-events-none z-[70] whitespace-nowrap">
                <div className="w-2 h-2 bg-[#121316] border-t border-l border-[var(--border-strong)] rotate-45 -mb-1 z-10" />
                <div className="bg-[#121316]/95 backdrop-blur-md text-[#e4e4e7] text-xs font-mono px-3 py-1.5 border border-[var(--border-strong)] shadow-2xl flex items-center gap-2">
                  <span className="font-bold text-white">Adresar Partnera</span>
                  <span className="text-[10px] text-[var(--accent-primary)]">B2B &bull; Alt+4</span>
                </div>
              </div>
            </button>

            {/* 2.3. Cjenik Artikala & Usluga */}
            {onOpenArticles && (
              <button
                type="button"
                onClick={onOpenArticles}
                aria-label="Cjenik Artikala i Usluga s KPD 2025 (Alt+5)"
                className={`relative group flex items-center justify-center w-10 h-10 transition-all cursor-pointer rounded-none shrink-0 ${
                  activeView === 'articles'
                    ? 'bg-[var(--bg-elevated)] border-2 border-[var(--accent-primary)] shadow-[0_0_14px_var(--icon-layer-glow)] text-white'
                    : 'bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] text-slate-300 hover:text-white border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]'
                }`}
              >
                <ObrtIcon name="catalog-pricing" size={20} isAnimated />
                {activeView === 'articles' && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[var(--accent-primary)] rounded-full" />
                )}
                {/* Tooltip */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 hidden group-hover:flex flex-col items-center pointer-events-none z-[70] whitespace-nowrap">
                  <div className="w-2 h-2 bg-[#121316] border-t border-l border-[var(--border-strong)] rotate-45 -mb-1 z-10" />
                  <div className="bg-[#121316]/95 backdrop-blur-md text-[#e4e4e7] text-xs font-mono px-3 py-1.5 border border-[var(--border-strong)] shadow-2xl flex items-center gap-2">
                    <span className="font-bold text-white">Cjenik Artikala</span>
                    <span className="text-[10px] text-[#F59E0B]">KPD &bull; Alt+5</span>
                  </div>
                </div>
              </button>
            )}
          </div>

          {/* Razdjelnik Otoka 2 i 3 */}
          <div className="h-5 w-[1px] bg-[var(--border-subtle)] mx-0.5 sm:mx-1 hidden sm:block shrink-0" />

          {/* ========================================================
              OTOK 3: PROPISI, POSTAVKE & NADZOR (Fiskal, Postavke, Tok)
             ======================================================== */}
          <div className="flex items-center space-x-1 shrink-0">
            {/* 3.1. Fiskalizacija & e-Račun */}
            <button
              type="button"
              onClick={onOpenFiscal}
              aria-label="Fiskalizacija 1.0 i 2.0 e-Račun (Alt+6)"
              className={`relative group flex items-center justify-center w-10 h-10 transition-all cursor-pointer rounded-none shrink-0 ${
                activeView === 'fiscal'
                  ? 'bg-[var(--bg-elevated)] border-2 border-[var(--accent-primary)] shadow-[0_0_14px_var(--icon-layer-glow)] text-white'
                  : 'bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] text-slate-300 hover:text-white border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]'
              }`}
            >
              <ObrtIcon name="fiscal-quill" size={20} isAnimated />
              {activeView === 'fiscal' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[var(--accent-primary)] rounded-full" />
              )}
              {/* Tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 hidden group-hover:flex flex-col items-center pointer-events-none z-[70] whitespace-nowrap">
                <div className="w-2 h-2 bg-[#121316] border-t border-l border-[var(--border-strong)] rotate-45 -mb-1 z-10" />
                <div className="bg-[#121316]/95 backdrop-blur-md text-[#e4e4e7] text-xs font-mono px-3 py-1.5 border border-[var(--border-strong)] shadow-2xl flex items-center gap-2">
                  <span className="font-bold text-white">Fiskalizacija</span>
                  <span className="text-[10px] text-[#3B82F6]">UBL &bull; Alt+6</span>
                </div>
              </div>
            </button>

            {/* 3.2. Postavke Obrta & Memorandum */}
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Postavke Obrta i Memorandum (Alt+7)"
              className={`relative group flex items-center justify-center w-10 h-10 transition-all cursor-pointer rounded-none shrink-0 ${
                activeView === 'settings'
                  ? 'bg-[var(--bg-elevated)] border-2 border-[var(--accent-primary)] shadow-[0_0_14px_var(--icon-layer-glow)] text-white'
                  : 'bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] text-slate-300 hover:text-white border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]'
              }`}
            >
              <ObrtIcon name="obrt-tools" size={20} isAnimated />
              {activeView === 'settings' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[var(--accent-primary)] rounded-full" />
              )}
              {/* Tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 hidden group-hover:flex flex-col items-center pointer-events-none z-[70] whitespace-nowrap">
                <div className="w-2 h-2 bg-[#121316] border-t border-l border-[var(--border-strong)] rotate-45 -mb-1 z-10" />
                <div className="bg-[#121316]/95 backdrop-blur-md text-[#e4e4e7] text-xs font-mono px-3 py-1.5 border border-[var(--border-strong)] shadow-2xl flex items-center gap-2">
                  <span className="font-bold text-white">Postavke Obrta</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Trezor &bull; Alt+7</span>
                </div>
              </div>
            </button>

            {/* 3.3. Potihi Tok Obavijesti & Telemetrija */}
            <NotificationStreamButton
              onOpenFullLogs={onOpenLogs || (() => {})}
              onToggleDrawer={onToggleLogDrawer}
              activeView={activeView}
            />
          </div>

          {/* Razdjelnik Otoka 3 i 4 */}
          {onOpenZigo && (
            <div className="h-5 w-[1px] bg-[var(--border-subtle)] mx-0.5 sm:mx-1 hidden sm:block shrink-0" />
          )}

          {/* ========================================================
              OTOK 4: KOPILOT (Žigo AI - Digitalni Orlando)
             ======================================================== */}
          {onOpenZigo && (
            <button
              type="button"
              onClick={onOpenZigo}
              aria-label="Žigo (Digitalni Orlando) - Autonomni agent sustava (Alt+Z)"
              className="relative group flex items-center justify-center w-10 h-10 bg-[#1e2025] hover:bg-[#252830] border border-[#b89758]/60 hover:border-[#ffd700] hover:shadow-[0_0_14px_rgba(255,215,0,0.35)] transition-all cursor-pointer rounded-none shadow-sm shrink-0"
            >
              <ObrtIcon name="zigo-emblem" size={20} isAnimated colorMode="gold" />
              {/* Tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 hidden group-hover:flex flex-col items-center pointer-events-none z-[70] whitespace-nowrap">
                <div className="w-2 h-2 bg-[#121316] border-t border-l border-[#b89758]/60 rotate-45 -mb-1 z-10" />
                <div className="bg-[#121316]/95 backdrop-blur-md text-[#f0e6d2] text-xs font-mono px-3 py-1.5 border border-[#b89758]/60 shadow-2xl flex items-center gap-2">
                  <span className="font-bold text-[#ffd700]">Žigo AI</span>
                  <span className="text-[10px] text-[#e0cfab]">Copilot &bull; Alt+Z</span>
                </div>
              </div>
            </button>
          )}
        </nav>

      {/* 3. Desna sekcija: Google Identity + Theme Selector + Paušalni Prag Widget (Desno sidro - shrink-0) */}
      <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
        {/* Google Identity & Cloud Sync Badge */}
        <div className="flex items-center shrink-0">
          {googleIdentity ? (
            <div 
              onClick={onOpenSettings}
              className="h-10 flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-2.5 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] hover:border-[#4285F4] cursor-pointer transition-all shrink-0"
              title={`Prijavljen: ${googleIdentity.email} (Google Sub: ${googleIdentity.googleSub})`}
            >
              <GoogleAvatarBadge 
                pictureUrl={googleIdentity.pictureUrl} 
                name={googleIdentity.name || googleIdentity.email} 
              />
              <span className="text-xs font-mono text-white hidden xl:inline truncate max-w-[90px]">
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
              className="h-10 flex items-center space-x-1.5 px-2 sm:px-2.5 bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[#4285F4] text-xs font-mono text-[var(--text-muted)] hover:text-white transition-all cursor-pointer shrink-0"
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
            className="h-10 flex items-center space-x-1.5 px-2.5 bg-amber-500/10 border border-amber-500/40 text-amber-400 text-xs font-mono select-none shrink-0"
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
            className="h-10 flex items-center space-x-1.5 px-2 sm:px-2.5 bg-gradient-to-r from-[var(--accent-primary)]/20 to-[var(--accent-primary)]/10 hover:from-[var(--accent-primary)]/30 hover:to-[var(--accent-primary)]/20 border border-[var(--accent-primary)] text-white text-xs font-mono transition-all cursor-pointer animate-pulse shrink-0"
            title="Instalirajte ObrtnIQ kao PWA aplikaciju na vaše računalo ili mobitel za samostalan rad bez interneta."
          >
            <Download className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
            <span className="hidden xl:inline font-bold">Instaliraj</span>
          </button>
        )}

        {/* Dynamic Theme Selector (Standardiziran na h-10) */}
        <ThemeSelector />

        {/* Dinamički Paušalni Prag Widget - Prikazuje se na >= xl ekranima radi eliminacije gužvanja */}
        <div 
          onClick={onOpenKpr}
          title="Kliknite za pregled Knjige Prometa i Obrasca PO-SD"
          className="hidden xl:flex flex-col items-end text-right cursor-pointer hover:opacity-90 transition-opacity justify-center h-10 shrink-0"
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
