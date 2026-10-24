import { 
  CoreLogger, 
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

/**
 * Glavna aplikacijska instanca loggera s kapacitetom od 500 unosa
 */
export const appLogger = new CoreLogger(getInitialLogLevel(), 500);

// Prati promjene razine i sinkroniziraj s localStorageom
const originalSetLevel = appLogger.setLevel.bind(appLogger);
appLogger.setLevel = (newLevel: LogLevel) => {
  originalSetLevel(newLevel);
  try {
    localStorage.setItem(STORAGE_KEY, newLevel);
  } catch {
    // ignoriraj
  }
};

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

// Cjevovod prema konzoli preglednika (Console Pipe)
appLogger.subscribe((entry: LogEntry) => {
  if (typeof console === 'undefined') return;

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
