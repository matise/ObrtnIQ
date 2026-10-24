import { useState, useCallback, useEffect } from 'react';
import { dexieStorage } from '../storage/dexie-db';
import { appLogger } from '../services/logger';

export interface UseAppStatsReturn {
  totalSavedDocs: number;
  totalKprNaplaceno: number;
  refreshDocCount: () => Promise<void>;
  refreshKprTotal: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

export function useAppStats(): UseAppStatsReturn {
  const [totalSavedDocs, setTotalSavedDocs] = useState(0);
  const [totalKprNaplaceno, setTotalKprNaplaceno] = useState(0);

  const refreshDocCount = useCallback(async () => {
    try {
      const all = await dexieStorage.dokumenti.getAll();
      setTotalSavedDocs(all.length);
    } catch {
      // ignore
    }
  }, []);

  const refreshKprTotal = useCallback(async () => {
    try {
      const all = await dexieStorage.kpr.getAll(2026);
      const sum = all.reduce((acc, s) => acc + s.ukupnoNaplaceno, 0);
      setTotalKprNaplaceno(sum);
    } catch {
      // ignore
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshDocCount(), refreshKprTotal()]);
  }, [refreshDocCount, refreshKprTotal]);

  useEffect(() => {
    refreshAll();
    appLogger.scope('SYSTEM:BOOT').info('ObrtnIQ sustav uspješno pokrenut (Offline OPFS Ready, Logging Engine aktivan)', {
      vrijeme: new Date().toLocaleTimeString('hr-HR'),
      okruzenje: 'Lokalni preglednik',
    });
  }, [refreshAll]);

  return {
    totalSavedDocs,
    totalKprNaplaceno,
    refreshDocCount,
    refreshKprTotal,
    refreshAll,
  };
}
