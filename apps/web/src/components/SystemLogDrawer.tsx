import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Download, 
  Trash2, 
  Search, 
  ChevronRight, 
  ChevronDown,
  Copy,
  Check,
  Filter,
  Code,
  Bug,
  Eye,
  EyeOff,
  Zap,
  ArrowDownUp,
  Focus,
  Home,
  ArrowLeft,
} from 'lucide-react';
import { LogLevel, LogEntry } from '@obrtniq/core';
import { appLogger } from '../services/logger';
import { useSystemLogs } from '../hooks/useSystemLogs';
import { ObrtIcon, ObrtBadge } from './icons';

const STORAGE_KEY_LOG_ORDER = 'obrtniq_log_order_newest_first';
const STORAGE_KEY_AUTO_SCROLL = 'obrtniq_log_auto_scroll';

export interface SystemLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isEmbedded?: boolean;
  onNavigateHome?: () => void;
}

export function SystemLogDrawer({
  isOpen,
  onClose,
  isEmbedded = false,
  onNavigateHome,
}: SystemLogDrawerProps) {
  const { 
    logs, 
    activeLevel, 
    autoOpenOnError,
    lastErrorEntry,
    availableContexts,
    setLogLevel, 
    setAutoOpen,
    clearLogs, 
    exportLogs, 
    errorCount, 
    warnCount 
  } = useSystemLogs();

  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [filterContext, setFilterContext] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showVendorFrames, setShowVendorFrames] = useState<Record<string, boolean>>({});

  // Poredak zapisa: zadano unatraške (najnovije poruke dolaze na vrh)
  const [isNewestFirst, setIsNewestFirst] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LOG_ORDER);
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  });

  const toggleOrder = () => {
    setIsNewestFirst((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY_LOG_ORDER, String(next));
      } catch {
        // no-op
      }
      return next;
    });
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-fokus / Auto-scroll stanje: zadano uključeno
  const [autoScroll, setAutoScroll] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_AUTO_SCROLL);
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  });

  const toggleAutoScroll = () => {
    setAutoScroll((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY_AUTO_SCROLL, String(next));
      } catch {
        // no-op
      }
      return next;
    });
  };

  const scrollToFocus = useCallback((smooth = false) => {
    const el = scrollContainerRef.current;
    if (!el) return;

    if (!isNewestFirst) {
      // Kronološki prikaz: zadnje poruke su na samom dnu
      el.scrollTo({
        top: el.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    } else {
      // Najnovije gore: zadnje poruke su na samom vrhu
      el.scrollTo({
        top: 0,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, [isNewestFirst]);

  // Kada se promijeni poredak, otvori panel ili zaprimi nova poruka, automatski pozicioniraj
  useEffect(() => {
    if (!isOpen || !autoScroll) return;
    const rafId = requestAnimationFrame(() => {
      scrollToFocus(false);
    });
    return () => cancelAnimationFrame(rafId);
  }, [isOpen, logs.length, isNewestFirst, autoScroll, scrollToFocus]);

  const emitTestLog = () => {
    appLogger.scope('DIAGNOSTIKA:TEST').info('Uspješan testni zapis u sustavni dnevnik!', {
      vrijeme: new Date().toLocaleTimeString('hr-HR'),
      timestamp: new Date().toISOString(),
      modul: 'DIAGNOSTIKA',
      status: 'OK',
    });
  };

  // Automatski proširi najnoviju grešku kad se panel otvori zbog greške
  useEffect(() => {
    if (isOpen && lastErrorEntry) {
      setExpandedId(lastErrorEntry.id);
    }
  }, [isOpen, lastErrorEntry]);

  // Filtriranje zapisa po razini, kontekstu i tekstu te poredak (najnovije na vrhu)
  const filteredLogs = useMemo(() => {
    const list = logs.filter((entry) => {
      // 1. Filter razine
      if (filterLevel !== 'ALL' && entry.level !== filterLevel) {
        return false;
      }
      // 2. Filter konteksta / modula
      if (filterContext !== 'ALL') {
        if (!entry.context.startsWith(filterContext)) {
          return false;
        }
      }
      // 3. Tekstualna pretraga
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesContext = entry.context.toLowerCase().includes(query);
        const matchesMessage = entry.message.toLowerCase().includes(query);
        const matchesData = entry.data ? JSON.stringify(entry.data).toLowerCase().includes(query) : false;
        const matchesError = entry.error 
          ? (entry.error.message.toLowerCase().includes(query) || (entry.error.stack || '').toLowerCase().includes(query))
          : false;
        return matchesContext || matchesMessage || matchesData || matchesError;
      }
      return true;
    });

    // Ako je uključen obrnuti redoslijed (zadano), najnoviji unosi dolaze na vrh
    return isNewestFirst ? list.slice().reverse() : list;
  }, [logs, filterLevel, filterContext, searchQuery, isNewestFirst]);

  // Brojači za tabove
  const counts = useMemo(() => {
    const c = { ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0, VERBOSE: 0 };
    for (const item of logs) {
      if (item.level in c) {
        c[item.level as keyof typeof c]++;
      }
    }
    return c;
  }, [logs]);

  const copyEntryToClipboard = (entry: LogEntry) => {
    const text = `[${entry.displayTime}] [${entry.level}] [${entry.context}] ${entry.message} ${
      entry.data ? '\nData: ' + JSON.stringify(entry.data, null, 2) : ''
    } ${entry.error?.stack ? '\nStack:\n' + entry.error.stack : ''}`;
    navigator.clipboard.writeText(text);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyStackToClipboard = (entry: LogEntry) => {
    if (!entry.error?.stack) return;
    navigator.clipboard.writeText(entry.error.stack);
    setCopiedId(`stack_${entry.id}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleVendorFrames = (id: string) => {
    setShowVendorFrames((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!isOpen) return null;

  return (
    <div className={
      isEmbedded
        ? "w-full bg-[var(--bg-canvas)] border border-[var(--border-strong)] rounded-2xl shadow-2xl flex flex-col min-h-[calc(100vh-160px)] transition-all font-mono text-xs overflow-hidden animate-in fade-in duration-200"
        : "fixed inset-x-0 bottom-0 z-[60] bg-[var(--bg-canvas)] border-t border-[var(--border-strong)] shadow-2xl flex flex-col h-[420px] max-h-[85vh] transition-all no-print font-mono text-xs"
    }>
      {/* 1. Top Header Bar */}
      <div className="px-4 py-2.5 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-white">
            <ObrtIcon name="telemetry-terminal" size={16} glow />
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
                  <span className="text-white font-semibold">Sustavni Dnevnik</span>
                </div>
              )}
              <span className="font-mono text-xs font-bold uppercase tracking-wider block">
                Sustavni Dnevnik &bull; Telemetrija &amp; Call Stack
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 text-[11px] font-mono">
            {errorCount > 0 && (
              <span className="px-2 py-0.5 bg-[#EF4444]/20 border border-[#EF4444]/40 text-[#EF4444] font-bold flex items-center gap-1 animate-pulse">
                <ObrtIcon name="signal-error" size={12} /> {errorCount}
              </span>
            )}
            {warnCount > 0 && (
              <span className="px-2 py-0.5 bg-[#F59E0B]/20 border border-[#F59E0B]/40 text-[#F59E0B] font-bold flex items-center gap-1">
                <ObrtIcon name="signal-warning" size={12} /> {warnCount}
              </span>
            )}
            <span className="text-[var(--text-muted)] text-[10px] hidden sm:inline">
              ({logs.length}/500 unosa &bull; {isNewestFirst ? 'najnovije gore' : 'kronološki'})
            </span>
          </div>
        </div>

        {/* Level Selector, Auto-Open Switch & Actions */}
        <div className="flex items-center space-x-2.5">
          {/* Poredak zapisa: Najnovije na vrhu (unatraške) / Kronološki */}
          <button
            type="button"
            onClick={toggleOrder}
            title={
              isNewestFirst 
                ? 'Poredak: Zadnje poruke dolaze na vrh (unatraške). Kliknite za kronološki prikaz.' 
                : 'Poredak: Najstarije poruke na vrhu (kronološki). Kliknite za prikaz najnovijih na vrhu.'
            }
            className="px-2 py-1 bg-[var(--bg-canvas)] hover:bg-[var(--bg-surface)] text-[var(--accent-primary)] hover:text-white border border-[var(--border-subtle)] text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer select-none"
          >
            <ArrowDownUp className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{isNewestFirst ? 'Najnovije gore' : 'Kronološki'}</span>
          </button>

          {/* Auto-Fokus / Auto-Scroll Preklopnik */}
          <button
            type="button"
            onClick={toggleAutoScroll}
            title={
              autoScroll
                ? 'Auto-fokus uključen: lista automatski prati najnovije poruke (na dno u kronološkom, na vrh u obrnutom prikazu). Kliknite za isključivanje.'
                : 'Auto-fokus isključen: lista se ne pomiče automatski kod novih poruka. Kliknite za uključivanje.'
            }
            className={`px-2 py-1 text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer select-none border ${
              autoScroll
                ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border-[var(--accent-primary)]/40 font-semibold'
                : 'bg-[var(--bg-canvas)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-white'
            }`}
          >
            <Focus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{autoScroll ? 'Auto-fokus: ON' : 'Auto-fokus: OFF'}</span>
          </button>

          {/* Auto-Open on Error Toggle */}
          <label 
            className="flex items-center space-x-1.5 text-[11px] font-mono text-[var(--text-secondary)] hover:text-white cursor-pointer select-none bg-[var(--bg-canvas)] px-2 py-1 border border-[var(--border-subtle)]"
            title="Kada je uključeno, pojava bilo koje greške (ERROR) automatski otvara ovaj panel"
          >
            <input
              type="checkbox"
              checked={autoOpenOnError}
              onChange={(e) => setAutoOpen(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-[var(--border-strong)] accent-[var(--accent-primary)] cursor-pointer"
            />
            <span className="hidden md:inline">Auto-Open na grešku</span>
          </label>

          {/* Active Recording Threshold Selector */}
          <div className="flex items-center space-x-1.5 text-xs font-mono">
            <span className="text-[var(--text-muted)] text-[11px] hidden lg:inline">Prag zapisa:</span>
            <select
              value={activeLevel}
              onChange={(e) => setLogLevel(e.target.value as LogLevel)}
              className="bg-[var(--bg-canvas)] text-white text-[11px] font-mono border border-[var(--border-subtle)] px-2 py-1 outline-none focus:border-[var(--accent-primary)] cursor-pointer"
              title="Postavlja minimalnu razinu koja se bilježi u memorijski spremnik"
            >
              <option value="ERROR">ERROR</option>
              <option value="WARN">WARN</option>
              <option value="INFO">INFO (Zadano)</option>
              <option value="DEBUG">DEBUG</option>
              <option value="VERBOSE">VERBOSE</option>
            </select>
          </div>

          {/* Emit Test Log Button */}
          <button
            type="button"
            onClick={emitTestLog}
            title="Pošalji trenutni testni zapis u dnevnik (provjera telemetrije)"
            className="px-2 py-1 bg-[var(--bg-elevated)] hover:bg-[var(--accent-primary)] hover:text-black text-[var(--accent-primary)] border border-[var(--border-subtle)] text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Zap className="w-3 h-3 fill-current" />
            <span className="hidden sm:inline">Test</span>
          </button>

          {/* Export JSON Button */}
          <button
            type="button"
            onClick={exportLogs}
            disabled={logs.length === 0}
            title="Preuzmi sanitizirani dijagnostički JSON paket za analizu"
            className="px-2.5 py-1 bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] text-white border border-[var(--border-subtle)] text-[11px] font-mono flex items-center gap-1 disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-3 h-3 text-[var(--accent-primary)]" />
            <span className="hidden sm:inline">Izvezi JSON</span>
          </button>

          {/* Clear Logs Button */}
          <button
            type="button"
            onClick={clearLogs}
            disabled={logs.length === 0}
            title="Isprazni memorijski spremnik dnevnika"
            className="p-1 hover:bg-[#EF4444]/20 text-[var(--text-muted)] hover:text-[#EF4444] border border-transparent hover:border-[#EF4444]/40 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Close or Return Button */}
          {isEmbedded ? (
            <button
              type="button"
              onClick={onNavigateHome || onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-white bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-strong)] transition-colors cursor-pointer"
              title="Povratak na radnu plohu (Alt+H)"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span>Povratak na Radnu plohu</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-[var(--text-muted)] hover:text-white border border-transparent hover:border-[var(--border-strong)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Filter and Search Bar */}
      <div className="px-4 py-2 bg-[var(--bg-canvas)] border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        {/* Level Tabs */}
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => setFilterLevel('ALL')}
            className={`px-2 py-0.5 transition-colors cursor-pointer ${
              filterLevel === 'ALL'
                ? 'bg-[var(--accent-primary)] text-black font-bold'
                : 'text-[var(--text-muted)] hover:text-white'
            }`}
          >
            Sve ({logs.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterLevel('ERROR')}
            className={`px-2 py-0.5 transition-colors flex items-center gap-1 cursor-pointer ${
              filterLevel === 'ERROR'
                ? 'bg-[#EF4444] text-white font-bold'
                : 'text-[#EF4444] hover:bg-[#EF4444]/10'
            }`}
          >
            Error ({counts.ERROR})
          </button>
          <button
            type="button"
            onClick={() => setFilterLevel('WARN')}
            className={`px-2 py-0.5 transition-colors flex items-center gap-1 cursor-pointer ${
              filterLevel === 'WARN'
                ? 'bg-[#F59E0B] text-black font-bold'
                : 'text-[#F59E0B] hover:bg-[#F59E0B]/10'
            }`}
          >
            Warn ({counts.WARN})
          </button>
          <button
            type="button"
            onClick={() => setFilterLevel('INFO')}
            className={`px-2 py-0.5 transition-colors flex items-center gap-1 cursor-pointer ${
              filterLevel === 'INFO'
                ? 'bg-[#10B981] text-black font-bold'
                : 'text-[#10B981] hover:bg-[#10B981]/10'
            }`}
          >
            Info ({counts.INFO})
          </button>
          <button
            type="button"
            onClick={() => setFilterLevel('DEBUG')}
            className={`px-2 py-0.5 transition-colors flex items-center gap-1 cursor-pointer ${
              filterLevel === 'DEBUG'
                ? 'bg-[#3B82F6] text-white font-bold'
                : 'text-[#3B82F6] hover:bg-[#3B82F6]/10'
            }`}
          >
            Debug ({counts.DEBUG})
          </button>
          <button
            type="button"
            onClick={() => setFilterLevel('VERBOSE')}
            className={`px-2 py-0.5 transition-colors flex items-center gap-1 cursor-pointer ${
              filterLevel === 'VERBOSE'
                ? 'bg-slate-400 text-black font-bold'
                : 'text-slate-400 hover:bg-slate-700/20'
            }`}
          >
            Verbose ({counts.VERBOSE})
          </button>
        </div>

        {/* Module / Context Filter & Search Input */}
        <div className="flex items-center space-x-2">
          {/* Context / Module dropdown */}
          <div className="flex items-center space-x-1 bg-[var(--bg-surface)] px-2 py-1 border border-[var(--border-subtle)]">
            <Filter className="w-3 h-3 text-[var(--accent-primary)] flex-shrink-0" />
            <select
              value={filterContext}
              onChange={(e) => setFilterContext(e.target.value)}
              className="bg-transparent text-white text-[11px] font-mono outline-none cursor-pointer pr-1"
            >
              <option value="ALL">Svi moduli ({logs.length})</option>
              {availableContexts.map((ctx) => (
                <option key={ctx} value={ctx}>Modul: {ctx}</option>
              ))}
            </select>
          </div>

          {/* Search input */}
          <div className="relative w-44 sm:w-60">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pretraži tekst i payload..."
              className="w-full bg-[var(--bg-surface)] text-white text-xs pl-8 pr-2 py-1 border border-[var(--border-subtle)] outline-none focus:border-[var(--accent-primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>
        </div>
      </div>

      {/* 3. Main Log Console Stream */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-1 select-text bg-[var(--bg-canvas)]"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] text-xs p-6 text-center space-y-2">
            {logs.length === 0 ? (
              <>
                <ObrtBadge name="telemetry-terminal" size={44} colorMode="steel" className="opacity-40 mb-1" />
                <p className="font-semibold text-slate-300">Spremnik sustavnog dnevnika je prazan (0 unosa)</p>
                <p className="max-w-md text-[11px] text-[var(--text-secondary)]">
                  Dnevnik bilježi događaje u stvarnom vremenu. Ako je &quot;Prag zapisa&quot; postavljen na <code className="text-[var(--accent-primary)] font-bold">{activeLevel}</code>, zapisi niže razine se ne spremaju. Pokrenite neku radnju (izdavanje računa, spremanje postavki, Google operacije) ili promijenite prag zapisa.
                </p>
                <button
                  type="button"
                  onClick={emitTestLog}
                  className="mt-2 px-3 py-1.5 bg-[var(--accent-primary)] hover:opacity-90 text-black font-bold text-xs font-mono flex items-center gap-1.5 cursor-pointer shadow-lg transition-all"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Pošalji testni zapis u dnevnik</span>
                </button>
              </>
            ) : (
              <>
                <Filter className="w-8 h-8 text-[var(--text-muted)] opacity-40 mb-1" />
                <p className="font-semibold text-slate-300">Nema zapisa koji odgovaraju odabranim filterima</p>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  U memorijskom spremniku nalazi se ukupno <strong className="text-white">{logs.length}</strong> zapisa, ali niti jedan ne zadovoljava trenutne filtre (Razina: <code>{filterLevel}</code>, Modul: <code>{filterContext}</code>{searchQuery ? `, Pretraga: "${searchQuery}"` : ''}).
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFilterLevel('ALL');
                    setFilterContext('ALL');
                    setSearchQuery('');
                  }}
                  className="mt-2 px-3 py-1 bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-white text-[11px] font-mono cursor-pointer transition-colors"
                >
                  Poništi filtre (Prikaži sve zapise)
                </button>
              </>
            )}
          </div>
        ) : (
          filteredLogs.map((entry) => {
            const isExpanded = expandedId === entry.id;
            const isError = entry.level === 'ERROR';
            const isWarn = entry.level === 'WARN';
            const isDebug = entry.level === 'DEBUG';
            const isVerbose = entry.level === 'VERBOSE';

            const levelBadgeColor = isError
              ? 'bg-[#EF4444] text-white font-bold'
              : isWarn
              ? 'bg-[#F59E0B] text-black font-bold'
              : isDebug
              ? 'bg-[#3B82F6] text-white font-bold'
              : isVerbose
              ? 'bg-slate-600 text-slate-200'
              : 'bg-[#10B981] text-black font-bold';

            const rowBorder = isError
              ? 'border-l-2 border-[#EF4444] bg-[#EF4444]/5'
              : isWarn
              ? 'border-l-2 border-[#F59E0B] bg-[#F59E0B]/5'
              : 'border-l border-[var(--border-subtle)] hover:bg-[var(--bg-surface)]/60';

            const hasDetails = entry.data !== undefined || entry.error !== undefined;
            const frames = entry.error?.frames || [];
            const appFrames = frames.filter((f) => f.isAppCode);
            const vendorFrames = frames.filter((f) => !f.isAppCode);
            const isShowingVendor = showVendorFrames[entry.id] ?? false;

            return (
              <div 
                key={entry.id} 
                className={`p-1.5 transition-colors rounded-none ${rowBorder}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    {hasDetails ? (
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                        className="text-[var(--text-muted)] hover:text-white p-0.5 cursor-pointer"
                        title={isExpanded ? 'Sažmi detalje' : 'Prikaži detalje i Call Stack'}
                      >
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                    ) : (
                      <div className="w-4" />
                    )}

                    <span className="text-[10px] text-[var(--text-muted)]">
                      {entry.displayTime}
                    </span>

                    <span className={`text-[10px] px-1.5 py-0.2 ${levelBadgeColor}`}>
                      {entry.level}
                    </span>

                    <span className="text-[11px] text-[var(--accent-primary)] font-semibold">
                      [{entry.context}]
                    </span>

                    <span className={`text-xs ${isError ? 'text-[#EF4444] font-semibold' : isWarn ? 'text-[#F59E0B]' : 'text-slate-200'}`}>
                      {entry.message}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    {entry.error?.stack && (
                      <span className="px-1.5 py-0.2 bg-[#EF4444]/20 border border-[#EF4444]/40 text-[#EF4444] text-[10px] flex items-center gap-1 font-bold">
                        <Bug className="w-2.5 h-2.5" /> STACK
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => copyEntryToClipboard(entry)}
                      title="Kopiraj zapis"
                      className="text-[var(--text-muted)] hover:text-white p-1 cursor-pointer"
                    >
                      {copiedId === entry.id ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Sklopivi detalji (Data Payload + Call Stack Inspector) */}
                {isExpanded && hasDetails && (
                  <div className="mt-2 ml-6 p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px] space-y-3 overflow-x-auto">
                    {/* Error & Call Stack Inspector */}
                    {entry.error && (
                      <div className="space-y-2">
                        <div className="p-2 bg-[#EF4444]/15 border border-[#EF4444]/40 text-[#EF4444] flex items-center justify-between gap-2">
                          <div className="font-bold flex items-center gap-1.5 truncate">
                            <Bug className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{entry.error.name}: {entry.error.message}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyStackToClipboard(entry)}
                            className="px-2 py-0.5 bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] border border-[#EF4444]/40 text-[#EF4444] text-[10px] font-bold flex items-center gap-1 cursor-pointer flex-shrink-0"
                            title="Kopiraj cjeloviti Call Stack"
                          >
                            {copiedId === `stack_${entry.id}` ? <Check className="w-2.5 h-2.5 text-[#10B981]" /> : <Copy className="w-2.5 h-2.5" />}
                            Kopiraj Stack
                          </button>
                        </div>

                        {/* Strukturirani Call Stack frames */}
                        {frames.length > 0 ? (
                          <div className="space-y-1.5 pt-1">
                            <div className="text-[10px] font-bold uppercase text-[var(--text-secondary)] flex items-center gap-1">
                              <Code className="w-3 h-3 text-[var(--accent-primary)]" />
                              <span>Strukturirani Call Stack ({frames.length} okvira):</span>
                            </div>

                            {/* Aplikacijski okviri (istaknuti) */}
                            {appFrames.length > 0 ? (
                              <div className="space-y-1">
                                {appFrames.map((frame, idx) => (
                                  <div 
                                    key={idx}
                                    className="p-1.5 bg-[#1E293B] border-l-2 border-cyan-400 text-xs flex items-center justify-between gap-2"
                                  >
                                    <div className="truncate">
                                      <span className="text-[10px] bg-cyan-950 text-cyan-400 px-1 py-0.2 border border-cyan-500/40 font-bold mr-1.5">
                                        APP CODE
                                      </span>
                                      <span className="text-white font-bold">{frame.functionName}()</span>
                                      <span className="text-[var(--text-muted)] text-[11px] ml-1.5">
                                        u <span className="text-cyan-300 underline">{frame.relativePath}</span>:{frame.lineNumber}:{frame.columnNumber}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-[11px] text-[var(--text-muted)] italic">
                                Greška je potekla izvan aplikacijskog koda (nativni preglednik ili biblioteka).
                              </div>
                            )}

                            {/* Vanjski vendor okviri (sklopivi) */}
                            {vendorFrames.length > 0 && (
                              <div className="pt-1">
                                <button
                                  type="button"
                                  onClick={() => toggleVendorFrames(entry.id)}
                                  className="text-[10px] text-[var(--text-muted)] hover:text-white flex items-center gap-1 cursor-pointer font-bold"
                                >
                                  {isShowingVendor ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                  {isShowingVendor ? 'Sakrij' : 'Prikaži'} sistemske / node_modules okvire ({vendorFrames.length})
                                </button>

                                {isShowingVendor && (
                                  <div className="mt-1 space-y-0.5 max-h-36 overflow-y-auto pl-2 border-l border-slate-700">
                                    {vendorFrames.map((frame, idx) => (
                                      <div key={idx} className="text-[10px] text-slate-500 truncate font-mono">
                                        at {frame.functionName} ({frame.relativePath}:{frame.lineNumber}:{frame.columnNumber})
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : entry.error.stack ? (
                          <pre className="text-[10px] text-slate-400 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto bg-[var(--bg-canvas)] p-2 border border-[var(--border-subtle)]">
                            {entry.error.stack}
                          </pre>
                        ) : null}
                      </div>
                    )}

                    {/* Data Payload */}
                    {entry.data !== undefined && (
                      <div className={entry.error ? 'border-t border-[var(--border-subtle)] pt-2' : ''}>
                        <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block mb-1">
                          Podaci (Data Payload):
                        </span>
                        <pre className="text-slate-300 font-mono text-[11px] leading-relaxed bg-[var(--bg-canvas)] p-2 border border-[var(--border-subtle)] max-h-48 overflow-y-auto">
                          {JSON.stringify(entry.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 4. Console Bottom Status Bar */}
      <div className="px-4 py-1.5 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
        <div className="flex items-center space-x-2">
          <span>Prstenasti spremnik: 500 zapisa (FIFO)</span>
          <span>&bull;</span>
          <span className="text-cyan-400">Call Stack Inspector aktivan</span>
        </div>
        <div className="flex items-center space-x-3">
          <span>Prikazano: <b className="text-white">{filteredLogs.length}</b>/{logs.length}</span>
          <span>&bull;</span>
          <span className="text-[#10B981]">Zero-Server Telemetrija</span>
        </div>
      </div>
    </div>
  );
}
