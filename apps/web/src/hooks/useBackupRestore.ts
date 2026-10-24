import { useState, useCallback } from 'react';
import { 
  createBackupSnapshot, 
  encryptBackup, 
  decryptBackup, 
  restoreBackupSnapshot,
  type ObrtnIQBackupData,
  type EncryptedPayloadEnvelope 
} from '@obrtniq/core';
import { dexieStorage } from '../storage/dexie-db';
import { appLogger } from '../services/logger';

export interface RestoreSummary {
  datumIzvoza: string;
  hasObrt: boolean;
  partneriCount: number;
  artikliCount: number;
  dokumentiCount: number;
  kprCount: number;
}

export interface UseBackupRestoreReturn {
  isProcessing: boolean;
  lastActionStatus: string | null;
  error: string | null;
  exportEncryptedBackup: (password: string) => Promise<void>;
  exportJsonSnapshot: () => Promise<void>;
  inspectBackupFile: (file: File) => Promise<{ isEncrypted: boolean; data?: ObrtnIQBackupData }>;
  restoreFromFile: (file: File, password?: string) => Promise<RestoreSummary>;
  resetDatabase: () => Promise<void>;
}

export function useBackupRestore(): UseBackupRestoreReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastActionStatus, setLastActionStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const downloadBlob = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Izvozi AES-256-GCM enkriptirani paket zaštićen lozinkom
   */
  const exportEncryptedBackup = useCallback(async (password: string) => {
    if (!password || password.trim().length < 4) {
      throw new Error('Lozinka za zaštitu sigurnosne kopije mora imati najmanje 4 znaka.');
    }

    try {
      setIsProcessing(true);
      setError(null);
      const snapshot = await createBackupSnapshot(dexieStorage);
      const encrypted = await encryptBackup(snapshot, password);
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const filename = `obrtniq_kriptirani_backup_${dateStr}.obrtniq`;

      downloadBlob(JSON.stringify(encrypted, null, 2), filename, 'application/json');
      setLastActionStatus(`Kriptirana sigurnosna kopija uspješno preuzeta (${filename}).`);
      appLogger.scope('BACKUP:EXPORT').info(`Uspješno izvezen kriptirani backup: ${filename}`, {
        dokumenti: snapshot.dokumenti.length,
        partneri: snapshot.partneri.length,
      });
    } catch (err: any) {
      const msg = err?.message || 'Greška pri izvozu sigurnosne kopije.';
      setError(msg);
      appLogger.scope('BACKUP:EXPORT').error('Greška pri izvozu backupa:', { error: msg });
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Izvozi otvoreni JSON snapshot za tehnički uvid ili knjigovođu
   */
  const exportJsonSnapshot = useCallback(async () => {
    try {
      setIsProcessing(true);
      setError(null);
      const snapshot = await createBackupSnapshot(dexieStorage);
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const filename = `obrtniq_otvoreni_snapshot_${dateStr}.json`;

      downloadBlob(JSON.stringify(snapshot, null, 2), filename, 'application/json');
      setLastActionStatus(`Otvoreni JSON snapshot uspješno preuzet (${filename}).`);
      appLogger.scope('BACKUP:SNAPSHOT').info(`Uspješno izvezen JSON snapshot: ${filename}`);
    } catch (err: any) {
      const msg = err?.message || 'Greška pri izvozu JSON snapshota.';
      setError(msg);
      appLogger.scope('BACKUP:SNAPSHOT').error('Greška:', { error: msg });
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Pregledava datoteku i provjerava je li enkriptirana
   */
  const inspectBackupFile = useCallback(async (file: File) => {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (parsed.format === 'OBRTNIQ-AES-256-GCM') {
      return { isEncrypted: true };
    }
    if (parsed.shemaVerzija === '3.0' && parsed.sustav === 'ObrtnIQ') {
      return { isEncrypted: false, data: parsed as ObrtnIQBackupData };
    }
    throw new Error('Nepoznat ili nevažeći format datoteke sigurnosne kopije.');
  }, []);

  /**
   * Obnavlja cjelokupnu bazu iz datoteke (uz dekripciju ako je enkriptirana)
   */
  const restoreFromFile = useCallback(async (file: File, password?: string): Promise<RestoreSummary> => {
    try {
      setIsProcessing(true);
      setError(null);

      const text = await file.text();
      const parsed = JSON.parse(text);
      let snapshot: ObrtnIQBackupData;

      if (parsed.format === 'OBRTNIQ-AES-256-GCM') {
        if (!password) {
          throw new Error('Za dešifriranje ove sigurnosne kopije potrebna je lozinka.');
        }
        snapshot = await decryptBackup(parsed as EncryptedPayloadEnvelope, password);
      } else if (parsed.shemaVerzija === '3.0') {
        snapshot = parsed as ObrtnIQBackupData;
      } else {
        throw new Error('Datoteka ne sadrži valjanu shemu ObrtnIQ v3.0 sigurnosne kopije.');
      }

      await restoreBackupSnapshot(dexieStorage, snapshot);

      const summary: RestoreSummary = {
        datumIzvoza: snapshot.datumIzvoza,
        hasObrt: snapshot.obrt !== null,
        partneriCount: snapshot.partneri.length,
        artikliCount: snapshot.artikli.length,
        dokumentiCount: snapshot.dokumenti.length,
        kprCount: snapshot.kpr.length,
      };

      setLastActionStatus('Podaci uspješno obnovljeni iz sigurnosne kopije!');
      appLogger.scope('BACKUP:RESTORE').info('Uspješno vraćena baza iz sigurnosne kopije', summary);
      return summary;
    } catch (err: any) {
      const msg = err?.message || 'Greška pri obnavljanju podataka.';
      setError(msg);
      appLogger.scope('BACKUP:RESTORE').error('Neuspjelo obnavljanje baze:', { error: msg });
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Briše sve podatke i vraća bazu na nulu
   */
  const resetDatabase = useCallback(async () => {
    try {
      setIsProcessing(true);
      setError(null);
      await dexieStorage.clearAll();
      setLastActionStatus('Lokalna baza uspješno vraćena na tvorničke postavke.');
      appLogger.scope('BACKUP:RESET').warn('Lokalna baza podataka potpuno ispražnjena.');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    isProcessing,
    lastActionStatus,
    error,
    exportEncryptedBackup,
    exportJsonSnapshot,
    inspectBackupFile,
    restoreFromFile,
    resetDatabase,
  };
}
