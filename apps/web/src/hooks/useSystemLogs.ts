import { useState, useEffect, useMemo, useCallback } from 'react';
import { LogEntry, LogLevel } from '@obrtniq/core';
import { appLogger, exportDiagnosticLog } from '../services/logger';

export function useSystemLogs() {
  const [logs, setLogs] = useState<LogEntry[]>(() => appLogger.getHistory());
  const [activeLevel, setActiveLevelState] = useState<LogLevel>(() => appLogger.level);

  useEffect(() => {
    // Pretplata na nove log zapise
    const unsubscribe = appLogger.subscribe(() => {
      setLogs(appLogger.getHistory());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const setLogLevel = useCallback((level: LogLevel) => {
    appLogger.setLevel(level);
    setActiveLevelState(level);
  }, []);

  const clearLogs = useCallback(() => {
    appLogger.clear();
    setLogs([]);
  }, []);

  const exportLogs = useCallback(() => {
    exportDiagnosticLog(logs);
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
    setLogLevel,
    clearLogs,
    exportLogs,
    errorCount,
    warnCount,
  };
}
