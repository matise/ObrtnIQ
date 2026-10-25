import { useState, useEffect, useMemo, useCallback, useSyncExternalStore } from 'react';
import { LogEntry, LogLevel } from '@obrtniq/core';
import { appLogger, exportDiagnosticLog } from '../services/logger';
import { 
  getAutoOpenOnError, 
  setAutoOpenOnError as setStorageAutoOpen, 
  onAutoOpenTriggered 
} from '../services/global-error-trap';

const emptyLogsSnapshot: LogEntry[] = [];

export function useSystemLogs() {
  // 1. Reaktivni snapshot sinkroniziran izravno s CoreLoggerom (bez propuštanja render ciklusa)
  const logs = useSyncExternalStore(
    useCallback((onStoreChange) => appLogger.subscribe(onStoreChange), []),
    useCallback(() => appLogger.getHistory(), []),
    () => emptyLogsSnapshot
  );

  const activeLevel = useSyncExternalStore(
    useCallback((onStoreChange) => appLogger.subscribe(onStoreChange), []),
    useCallback(() => appLogger.level, []),
    () => 'INFO' as LogLevel
  );

  const [autoOpenOnError, setAutoOpenState] = useState<boolean>(() => getAutoOpenOnError());
  const [lastErrorEntry, setLastErrorEntry] = useState<LogEntry | null>(null);

  useEffect(() => {
    // Pretplata na auto-open signal u slučaju neuhvaćene greške
    const unsubscribeAutoOpen = onAutoOpenTriggered((errorEntry) => {
      setLastErrorEntry(errorEntry);
    });

    return () => {
      unsubscribeAutoOpen();
    };
  }, []);

  const setLogLevel = useCallback((level: LogLevel) => {
    appLogger.setLevel(level);
  }, []);

  const setAutoOpen = useCallback((enabled: boolean) => {
    setStorageAutoOpen(enabled);
    setAutoOpenState(enabled);
  }, []);

  const clearLogs = useCallback(() => {
    appLogger.clear();
    setLastErrorEntry(null);
  }, []);

  const exportLogs = useCallback(() => {
    exportDiagnosticLog(logs);
  }, [logs]);

  // Izračunaj jedinstvene module/kontekste iz povijesti logova (npr. 'AUTH', 'DRIVE', 'INVOICE', 'STORAGE')
  const availableContexts = useMemo(() => {
    const set = new Set<string>();
    for (const entry of logs) {
      if (entry.context) {
        const primary = entry.context.split(':')[0] || entry.context;
        set.add(primary);
      }
    }
    return Array.from(set).sort();
  }, [logs]);

  const { errorCount, warnCount } = useMemo(() => {
    let errs = 0;
    let warns = 0;
    for (const entry of logs) {
      if (entry.level === 'ERROR') errs++;
      else if (entry.level === 'WARN') warns++;
    }
    return { errorCount: errs, warnCount: warns };
  }, [logs]);

  return {
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
    warnCount,
  };
}
