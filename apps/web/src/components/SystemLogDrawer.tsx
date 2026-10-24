import { useState, useMemo } from 'react';
import { 
  Terminal, 
  X, 
  Download, 
  Trash2, 
  Search, 
  AlertCircle, 
  AlertTriangle, 
  ChevronRight, 
  ChevronDown,
  Copy,
  Check
} from 'lucide-react';
import { LogLevel, LogEntry } from '@obrtniq/core';
import { useSystemLogs } from '../hooks/useSystemLogs';

interface SystemLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SystemLogDrawer({ isOpen, onClose }: SystemLogDrawerProps) {
  const { 
    logs, 
    activeLevel, 
    setLogLevel, 
    clearLogs, 
    exportLogs, 
    errorCount, 
    warnCount 
  } = useSystemLogs();

  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtriranje zapisa po razini i tekstualnom upitu
  const filteredLogs = useMemo(() => {
    return logs.filter((entry) => {
      if (filterLevel !== 'ALL' && entry.level !== filterLevel) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesContext = entry.context.toLowerCase().includes(query);
        const matchesMessage = entry.message.toLowerCase().includes(query);
        return matchesContext || matchesMessage;
      }
      return true;
    });
  }, [logs, filterLevel, searchQuery]);

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
      entry.data ? JSON.stringify(entry.data, null, 2) : ''
    } ${entry.error?.stack || ''}`;
    navigator.clipboard.writeText(text);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-[var(--bg-canvas)] border-t border-[var(--border-strong)] shadow-2xl flex flex-col h-[400px] max-h-[80vh] transition-all no-print">
      {/* Top Header Bar */}
      <div className="px-4 py-2.5 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-white">
            <Terminal className="w-4 h-4 text-[var(--accent-primary)]" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider">
              Sustavni Dnevnik &bull; Kronološki Zapisnik
            </span>
          </div>

          <div className="flex items-center space-x-1.5 text-[11px] font-mono">
            {errorCount > 0 && (
              <span className="px-2 py-0.5 bg-[#EF4444]/20 border border-[#EF4444]/40 text-[#EF4444] font-bold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errorCount}
              </span>
            )}
            {warnCount > 0 && (
              <span className="px-2 py-0.5 bg-[#F59E0B]/20 border border-[#F59E0B]/40 text-[#F59E0B] font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {warnCount}
              </span>
            )}
            <span className="text-[var(--text-muted)] text-[10px] hidden sm:inline">
              ({logs.length}/500 zapisa)
            </span>
          </div>
        </div>

        {/* Level Selector & Controls */}
        <div className="flex items-center space-x-2">
          {/* Active Level Selector */}
          <div className="flex items-center space-x-1.5 text-xs font-mono">
            <span className="text-[var(--text-muted)] text-[11px] hidden md:inline">Prag bilježenja:</span>
            <select
              value={activeLevel}
              onChange={(e) => setLogLevel(e.target.value as LogLevel)}
              className="bg-[var(--bg-canvas)] text-white text-[11px] font-mono border border-[var(--border-subtle)] px-2 py-1 outline-none focus:border-[var(--accent-primary)] cursor-pointer"
            >
              <option value="ERROR">ERROR</option>
              <option value="WARN">WARN</option>
              <option value="INFO">INFO (Zadano)</option>
              <option value="DEBUG">DEBUG</option>
              <option value="VERBOSE">VERBOSE</option>
            </select>
          </div>

          {/* Export JSON Button */}
          <button
            type="button"
            onClick={exportLogs}
            disabled={logs.length === 0}
            title="Preuzmi sanitizirani dijagnostički JSON paket"
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

          {/* Close Drawer Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[var(--text-muted)] hover:text-white border border-transparent hover:border-[var(--border-strong)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-4 py-2 bg-[var(--bg-canvas)] border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        {/* Level Tabs */}
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => setFilterLevel('ALL')}
            className={`px-2 py-0.5 transition-colors ${
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
            className={`px-2 py-0.5 transition-colors flex items-center gap-1 ${
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
            className={`px-2 py-0.5 transition-colors flex items-center gap-1 ${
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
            className={`px-2 py-0.5 transition-colors ${
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
            className={`px-2 py-0.5 transition-colors ${
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
            className={`px-2 py-0.5 transition-colors ${
              filterLevel === 'VERBOSE'
                ? 'bg-slate-400 text-black font-bold'
                : 'text-slate-400 hover:bg-slate-700/20'
            }`}
          >
            Verbose ({counts.VERBOSE})
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-48 sm:w-64">
          <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pretraži poruke i module..."
            className="w-full bg-[var(--bg-surface)] text-white text-xs pl-8 pr-2 py-1 border border-[var(--border-subtle)] outline-none focus:border-[var(--accent-primary)] placeholder:text-[var(--text-muted)]"
          />
        </div>
      </div>

      {/* Main Log Console Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-xs select-text bg-[var(--bg-canvas)]">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[var(--text-muted)] text-xs">
            Nema zapisa koji odgovaraju odabranom filteru.
          </div>
        ) : (
          filteredLogs.map((entry) => {
            const isExpanded = expandedId === entry.id;
            const isError = entry.level === 'ERROR';
            const isWarn = entry.level === 'WARN';
            const isDebug = entry.level === 'DEBUG';
            const isVerbose = entry.level === 'VERBOSE';

            const levelBadgeColor = isError
              ? 'bg-[#EF4444] text-white'
              : isWarn
              ? 'bg-[#F59E0B] text-black font-bold'
              : isDebug
              ? 'bg-[#3B82F6] text-white'
              : isVerbose
              ? 'bg-slate-600 text-slate-200'
              : 'bg-[#10B981] text-black font-bold';

            const rowBorder = isError
              ? 'border-l-2 border-[#EF4444] bg-[#EF4444]/5'
              : isWarn
              ? 'border-l-2 border-[#F59E0B] bg-[#F59E0B]/5'
              : 'border-l border-[var(--border-subtle)] hover:bg-[var(--bg-surface)]/60';

            const hasDetails = entry.data !== undefined || entry.error !== undefined;

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
                      >
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
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

                    <span className={`text-xs ${isError ? 'text-[#EF4444]' : isWarn ? 'text-[#F59E0B]' : 'text-slate-200'}`}>
                      {entry.message}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
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

                {/* Sklopivi detalji (data / error stack) */}
                {isExpanded && hasDetails && (
                  <div className="mt-2 ml-6 p-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px] space-y-2 overflow-x-auto">
                    {entry.data !== undefined && (
                      <div>
                        <span className="text-[10px] uppercase text-[var(--text-muted)] block mb-1">
                          Podaci (Data Payload):
                        </span>
                        <pre className="text-slate-300 font-mono text-[11px] leading-relaxed">
                          {JSON.stringify(entry.data, null, 2)}
                        </pre>
                      </div>
                    )}

                    {entry.error && (
                      <div className="border-t border-[var(--border-subtle)] pt-1.5">
                        <span className="text-[10px] uppercase text-[#EF4444] font-bold block mb-1">
                          Greška (Error Stack Trace):
                        </span>
                        <div className="text-[#EF4444] font-semibold">{entry.error.name}: {entry.error.message}</div>
                        {entry.error.stack && (
                          <pre className="text-[10px] text-slate-400 mt-1 whitespace-pre-wrap">
                            {entry.error.stack}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Console Bottom Info Bar */}
      <div className="px-4 py-1.5 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
        <div>
          Cirkularni spremnik: 500 zapisa (FIFO) &bull; Zero-server privatnost (100% lokalno u memoriji)
        </div>
        <div className="flex items-center space-x-2">
          <span>ObrtnIQ Engine v3.0</span>
        </div>
      </div>
    </div>
  );
}
