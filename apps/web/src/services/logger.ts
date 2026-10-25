import { 
  CoreLogger, 
  coreLogger,
  LogLevel, 
  LogEntry 
} from '@obrtniq/core';

const STORAGE_KEY = 'obrtniq_log_level';

// Dohvati spremljenu razinu ili koristi zadanu INFO
function getInitialLogLevel(): LogLevel {
  if (typeof window === 'undefined') return 'INFO';
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as LogLevel | null;
    if (saved && ['ERROR', 'WARN', 'INFO', 'DEBUG', 'VERBOSE'].includes(saved)) {
      return saved;
    }
  } catch {
    // ignoriraj grešku pristupa localStorageu
  }
  return 'INFO';
}

// Globalni referentni objekt koji preživljava Vite Fast Refresh (HMR) re-evaluaciju modula
const globalRef = (typeof window !== 'undefined' ? window : globalThis) as any;

/**
 * Glavna aplikacijska instanca loggera s kapacitetom od 500 unosa.
 * Usidrena na window.__obrtniq_app_logger__ kako bi povijest i pretplatnici ostali sačuvani tijekom HMR-a.
 */
export const appLogger: CoreLogger = 
  globalRef.__obrtniq_app_logger__ ?? 
  (globalRef.__obrtniq_app_logger__ = new CoreLogger(getInitialLogLevel(), 500));

// Izloži na globalRef (window u pregledniku, globalThis u testovima) radi testiranja i DevTools verifikacije
globalRef.__obrtniq_app_logger__ = appLogger;
globalRef.__obrtniq_emit_test_log__ = (msg: string = 'Testni log zapis iz konzole') => {
  return appLogger.scope('DIAGNOSTIKA:TEST').info(msg, {
    vrijeme: new Date().toISOString(),
    lokacija: typeof window !== 'undefined' ? window.location?.href : 'test-env',
  });
};

// Prati promjene razine i sinkroniziraj s localStorageom (samo jednom)
if (!globalRef.__obrtniq_level_sync_registered__) {
  globalRef.__obrtniq_level_sync_registered__ = true;
  const originalSetLevel = appLogger.setLevel.bind(appLogger);
  appLogger.setLevel = (newLevel: LogLevel) => {
    originalSetLevel(newLevel);
    try {
      localStorage.setItem(STORAGE_KEY, newLevel);
    } catch {
      // ignoriraj
    }
  };
}

/**
 * Console Pipe s tematskim HSL / HEX stilovima za preglednik
 */
const BADGE_STYLES: Record<LogLevel, string> = {
  ERROR: 'background: #EF4444; color: #FFFFFF; font-weight: bold; border-radius: 2px; padding: 1px 4px;',
  WARN: 'background: #F59E0B; color: #000000; font-weight: bold; border-radius: 2px; padding: 1px 4px;',
  INFO: 'background: #10B981; color: #000000; font-weight: bold; border-radius: 2px; padding: 1px 4px;',
  DEBUG: 'background: #3B82F6; color: #FFFFFF; font-weight: bold; border-radius: 2px; padding: 1px 4px;',
  VERBOSE: 'background: #475569; color: #E2E8F0; border-radius: 2px; padding: 1px 4px;',
};

// Cjevovod prema konzoli preglednika (Console Pipe - registriraj samo jednom u runtimeu)
if (!globalRef.__obrtniq_console_pipe_registered__) {
  globalRef.__obrtniq_console_pipe_registered__ = true;
  appLogger.subscribe((entry: LogEntry) => {
    if (!entry || typeof console === 'undefined') return;

    const style = BADGE_STYLES[entry.level] || '';
    const prefix = `%c${entry.level}%c [${entry.displayTime}] [${entry.context}]`;
    const resetStyle = 'color: inherit; font-weight: normal;';

    const args: unknown[] = [prefix, style, resetStyle, entry.message];

    if (entry.data !== undefined) {
      args.push(entry.data);
    }
    if (entry.error) {
      args.push(entry.error);
    }

    switch (entry.level) {
      case 'ERROR':
        console.error(...args);
        break;
      case 'WARN':
        console.warn(...args);
        break;
      case 'INFO':
        console.info(...args);
        break;
      case 'DEBUG':
        console.debug(...args);
        break;
      case 'VERBOSE':
      default:
        console.log(...args);
        break;
    }
  });
}

// Most između @obrtniq/core internog logera i aplikacijskog appLoggera
if (!globalRef.__obrtniq_core_logger_piped__) {
  globalRef.__obrtniq_core_logger_piped__ = true;
  coreLogger.subscribe((entry: LogEntry) => {
    if (!entry) return;
    appLogger.log(entry.level, entry.context, entry.message, entry.data, entry.error);
  });
}

/**
 * Pomoćna funkcija za siguran izvoz dijagnostičkog JSON paketa
 */
export function exportDiagnosticLog(logs: LogEntry[]): void {
  const payload = {
    exportedAt: new Date().toISOString(),
    application: 'ObrtnIQ',
    version: '3.0',
    totalEntries: logs.length,
    logs,
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `obrtniq-diagnostic-log-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
