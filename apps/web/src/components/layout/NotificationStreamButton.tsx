// apps/web/src/components/layout/NotificationStreamButton.tsx
// ObrtnIQ v3.0 — Potihi Tok Obavijesti i Signalizator Grešaka u Glavnoj Alatnoj Traci

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Terminal,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Trash2,
  ExternalLink,
  X,
  Clock
} from 'lucide-react';
import { useSystemLogs } from '../../hooks/useSystemLogs';
import { ObrtIcon } from '../icons';
import type { LogEntry } from '@obrtniq/core';

export interface NotificationStreamButtonProps {
  onOpenFullLogs: () => void;
  onToggleDrawer?: () => void;
  activeView?: string;
}

export const NotificationStreamButton: React.FC<NotificationStreamButtonProps> = ({
  onOpenFullLogs,
  onToggleDrawer,
  activeView
}) => {
  const { logs, errorCount, warnCount, clearLogs } = useSystemLogs();
  const [isOpen, setIsOpen] = useState(false);
  const [popoverCoords, setPopoverCoords] = useState<{ top: number; right: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Pozicioniranje i zatvaranje na klik izvan popovera
  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const rightEdge = Math.max(12, Math.round(window.innerWidth - rect.right));
      setPopoverCoords({
        top: Math.round(rect.bottom + 8),
        right: rightEdge,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedContainer = containerRef.current?.contains(target);
      const clickedPopover = popoverRef.current?.contains(target);
      if (!clickedContainer && !clickedPopover) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Posljednjih 8 unosa (najnoviji na vrhu)
  const recentLogs = [...logs].reverse().slice(0, 8);

  const hasErrors = errorCount > 0;
  const hasWarnings = warnCount > 0 && !hasErrors;
  const isHealthy = !hasErrors && !hasWarnings;

  return (
    <div ref={containerRef} className="relative inline-block shrink-0">
      {/* 1. Gumb u alatnoj traci (40x40px uniformna kapsula) */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        aria-label={
          hasErrors
            ? `Upozorenje: ${errorCount} grešaka zabilježeno u dnevniku`
            : hasWarnings
            ? `Upozorenje: ${warnCount} upozorenja u dnevniku`
            : 'Sustavni Dnevnik i Tok Obavijesti (Sve mirno)'
        }
        className={`relative group flex items-center justify-center w-10 h-10 transition-all cursor-pointer rounded-none shrink-0 ${
          isOpen || activeView === 'logs'
            ? 'bg-[var(--bg-elevated)] border-2 border-[var(--accent-primary)] shadow-[0_0_14px_var(--icon-layer-glow)] text-white'
            : hasErrors
            ? 'bg-[#EF4444]/15 border-2 border-[#EF4444] shadow-[0_0_14px_rgba(239,68,68,0.45)] text-[#EF4444] animate-pulse'
            : hasWarnings
            ? 'bg-[#F59E0B]/15 border-2 border-[#F59E0B] shadow-[0_0_12px_rgba(245,158,11,0.35)] text-[#F59E0B]'
            : 'bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] text-slate-300 hover:text-white border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]'
        }`}
      >
        <ObrtIcon 
          name="telemetry-terminal" 
          size={20} 
          glow={hasErrors || hasWarnings} 
          colorMode={hasErrors ? 'signal-error' : hasWarnings ? 'signal-warning' : 'themed'}
        />

        {/* Statusni Bedž s brojem grešaka ili upozorenja */}
        {hasErrors ? (
          <span className="absolute -top-1.5 -right-1.5 bg-[#EF4444] text-white font-mono font-black text-[9px] min-w-[17px] h-4 px-1 rounded-full flex items-center justify-center shadow-lg border border-[var(--bg-surface)] tabular-nums pointer-events-none animate-bounce">
            {errorCount}
          </span>
        ) : hasWarnings ? (
          <span className="absolute -top-1.5 -right-1.5 bg-[#F59E0B] text-black font-mono font-black text-[9px] min-w-[17px] h-4 px-1 rounded-full flex items-center justify-center shadow-lg border border-[var(--bg-surface)] tabular-nums pointer-events-none">
            {warnCount}
          </span>
        ) : isHealthy ? (
          <span 
            className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-[#10B981] pointer-events-none shadow-[0_0_4px_#10B981]" 
            title="Sustav radi bez grešaka"
          />
        ) : null}

        {/* Lebdeći Tooltip (samo kada popover nije otvoren) */}
        {!isOpen && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 hidden group-hover:flex flex-col items-center pointer-events-none z-[70] whitespace-nowrap">
            <div className="w-2 h-2 bg-[#121316] border-t border-l border-[var(--border-strong)] rotate-45 -mb-1 z-10" />
            <div className="bg-[#121316]/95 backdrop-blur-md text-[#e4e4e7] text-xs font-mono px-3 py-1.5 border border-[var(--border-strong)] shadow-2xl flex items-center gap-2">
              <span className="font-bold text-white">Tok Obavijesti</span>
              <span className="text-[10px] text-[var(--accent-primary)] font-bold">Alt+9</span>
              {hasErrors ? (
                <span className="text-[10px] text-[#EF4444] font-bold">
                  ({errorCount} {errorCount === 1 ? 'greška' : 'greške'})
                </span>
              ) : hasWarnings ? (
                <span className="text-[10px] text-[#F59E0B] font-bold">
                  ({warnCount} {warnCount === 1 ? 'upozorenje' : 'upozorenja'})
                </span>
              ) : (
                <span className="text-[10px] text-[#10B981]">Sustav miran</span>
              )}
            </div>
          </div>
        )}
      </button>

      {/* 2. Potihi Plutajući Prozorčić (Notification Stream Popover) - Renderiran kroz Portal radi sprječavanja overflow clippinga */}
      {isOpen && popoverCoords && typeof document !== 'undefined' && createPortal(
        <div 
          ref={popoverRef}
          style={{ top: `${popoverCoords.top}px`, right: `${popoverCoords.right}px` }}
          className="fixed w-[360px] sm:w-[420px] max-w-[calc(100vw-24px)] bg-[#121316]/98 backdrop-blur-xl border border-[var(--border-strong)] shadow-2xl z-[9999] font-mono text-xs overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Zaglavlje Popovera */}
          <div className="px-3.5 py-2.5 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-[var(--accent-primary)]" />
              <span className="font-bold text-white text-xs">
                Tok Obavijesti &bull; Telemetrija
              </span>
              {hasErrors ? (
                <span className="text-[9px] px-1.5 py-0.2 bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40 font-bold">
                  {errorCount} {errorCount === 1 ? 'greška' : 'greške'}
                </span>
              ) : hasWarnings ? (
                <span className="text-[9px] px-1.5 py-0.2 bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40 font-bold">
                  {warnCount} {warnCount === 1 ? 'upozorenje' : 'upozorenja'}
                </span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.2 bg-[#064E3B] text-[#10B981] border border-[#10B981]/30 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Stabilno
                </span>
              )}
            </div>

            <div className="flex items-center space-x-1.5">
              {logs.length > 0 && (
                <button
                  type="button"
                  onClick={clearLogs}
                  className="p-1 hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
                  title="Očisti sve zapise iz međuspremnika"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
                title="Zatvori prozor"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Lista Obavijesti u Stvarnom Vremenu */}
          <div className="max-h-[320px] overflow-y-auto divide-y divide-[var(--border-subtle)] p-1">
            {recentLogs.length === 0 ? (
              <div className="py-8 px-4 text-center text-[var(--text-muted)] space-y-1">
                <CheckCircle2 className="w-6 h-6 text-[#10B981] mx-auto opacity-70 mb-1.5" />
                <p className="font-semibold text-white">Nema zabilježenih grešaka</p>
                <p className="text-[11px]">Sve komponente rade tiho i stabilno u pozadini.</p>
              </div>
            ) : (
              recentLogs.map((entry, idx) => (
                <NotificationLogItem key={idx} entry={entry} />
              ))
            )}
          </div>

          {/* Podnožje Popovera: Poveznica na Donju Konzolu i Puni Dnevnik */}
          <div className="p-2.5 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] gap-2">
            <span className="text-[var(--text-muted)] text-[10px] hidden sm:inline">
              {logs.length} zabilježeno
            </span>
            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              {onToggleDrawer && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onToggleDrawer();
                  }}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-[var(--bg-elevated)] hover:bg-[var(--bg-canvas)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] text-slate-200 hover:text-white transition-colors cursor-pointer text-[10px]"
                  title="Otvori konzolu na dnu ekrana bez napuštanja trenutnog prikaza"
                >
                  <Terminal className="w-3 h-3 text-[var(--accent-primary)]" />
                  <span>Konzola (dno)</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenFullLogs();
                }}
                className="flex items-center space-x-1.5 px-2.5 py-1 bg-[var(--accent-primary)] hover:brightness-110 text-black font-bold transition-all cursor-pointer text-[10px]"
              >
                <span>Puni radni prostor</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

interface NotificationLogItemProps {
  entry: LogEntry;
}

const NotificationLogItem: React.FC<NotificationLogItemProps> = ({ entry }) => {
  const isError = entry.level === 'ERROR';
  const isWarn = entry.level === 'WARN';

  const timeStr = entry.timestamp 
    ? new Date(entry.timestamp).toLocaleTimeString('hr-HR') 
    : '';

  return (
    <div className={`p-2.5 transition-colors ${
      isError 
        ? 'bg-[#EF4444]/10 hover:bg-[#EF4444]/15' 
        : isWarn 
        ? 'bg-[#F59E0B]/10 hover:bg-[#F59E0B]/15' 
        : 'hover:bg-[var(--bg-surface)]'
    }`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5">
          {isError ? (
            <span className="px-1 py-0.2 bg-[#EF4444] text-white text-[9px] font-bold rounded-xs flex items-center gap-0.5">
              <AlertOctagon className="w-2.5 h-2.5" /> ERR
            </span>
          ) : isWarn ? (
            <span className="px-1 py-0.2 bg-[#F59E0B] text-black text-[9px] font-bold rounded-xs flex items-center gap-0.5">
              <AlertTriangle className="w-2.5 h-2.5" /> WARN
            </span>
          ) : (
            <span className="px-1 py-0.2 bg-[var(--bg-elevated)] text-[var(--accent-primary)] text-[9px] font-bold rounded-xs">
              INFO
            </span>
          )}

          {entry.context && (
            <span className="text-[10px] text-slate-300 font-bold truncate max-w-[140px]">
              [{entry.context}]
            </span>
          )}
        </div>

        {timeStr && (
          <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 shrink-0">
            <Clock className="w-2.5 h-2.5" /> {timeStr}
          </span>
        )}
      </div>

      <p className={`mt-1 text-[11px] leading-relaxed break-words ${
        isError ? 'text-red-200 font-semibold' : isWarn ? 'text-amber-200' : 'text-slate-300'
      }`}>
        {entry.message}
      </p>
    </div>
  );
};
