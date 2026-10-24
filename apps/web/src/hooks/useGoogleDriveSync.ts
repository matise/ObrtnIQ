import { useState, useCallback, useEffect } from 'react';
import { 
  createBackupSnapshot, 
  restoreBackupSnapshot,
  encryptBackupWithGoogleSub,
  decryptBackupWithGoogleSub,
  type GoogleAuthIdentity,
} from '@obrtniq/core';
import { dexieStorage } from '../storage/dexie-db';
import { googleDriveService, type DriveBackupFile } from '../services/google-drive-service';
import { appLogger } from '../services/logger';

export interface UseGoogleDriveSyncReturn {
  isSyncing: boolean;
  syncStatus: 'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR';
  lastSyncTime: string | null;
  error: string | null;
  driveBackups: DriveBackupFile[];
  syncToDrive: (userPin?: string) => Promise<void>;
  restoreFromDrive: (fileId: string, userPin?: string) => Promise<void>;
  refreshDriveBackups: () => Promise<void>;
}

const STORAGE_KEY_LAST_SYNC = 'obrtniq_drive_last_sync';

export function useGoogleDriveSync(
  identity: GoogleAuthIdentity | null,
  getAccessToken: () => Promise<string | null>
): UseGoogleDriveSyncReturn {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_LAST_SYNC);
  });
  const [error, setError] = useState<string | null>(null);
  const [driveBackups, setDriveBackups] = useState<DriveBackupFile[]>([]);

  const refreshDriveBackups = useCallback(async () => {
    if (!identity) {
      setDriveBackups([]);
      return;
    }

    try {
      const token = await getAccessToken();
      if (!token) return;
      const list = await googleDriveService.listBackups(token);
      setDriveBackups(list);
    } catch (err: any) {
      appLogger.scope('DRIVE:HOOK').warn('Osvježavanje popisa backupa nije uspjelo:', { error: err?.message });
    }
  }, [identity, getAccessToken]);

  useEffect(() => {
    if (identity) {
      refreshDriveBackups();
    } else {
      setDriveBackups([]);
    }
  }, [identity, refreshDriveBackups]);

  /**
   * Kriptira lokalnu bazu pomoću Google Sub-a i šalje u skriveni appDataFolder
   */
  const syncToDrive = useCallback(async (userPin?: string) => {
    if (!identity?.googleSub) {
      throw new Error('Za sinkronizaciju na Google Drive morate biti prijavljeni putem Google računa.');
    }

    try {
      setIsSyncing(true);
      setSyncStatus('SYNCING');
      setError(null);

      const token = await getAccessToken();
      if (!token) {
        throw new Error('Nema valjanog Google tokena autorizacije. Prijavite se ponovno.');
      }

      // 1. Kreiraj lokalni snapshot baze
      const snapshot = await createBackupSnapshot(dexieStorage);

      // 2. Kriptiraj AES-256-GCM paket koristeći Google Sub kao kripto sidro
      const encrypted = await encryptBackupWithGoogleSub(snapshot, identity.googleSub, userPin);

      // 3. Pošalji u appDataFolder na Google Driveu
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const timeStr = new Date().toTimeString().slice(0, 5).replace(/:/g, '');
      const filename = `obrtniq_cloud_${dateStr}_${timeStr}.obrtniq`;

      await googleDriveService.uploadBackup(token, JSON.stringify(encrypted, null, 2), filename);

      const now = new Date().toISOString();
      setLastSyncTime(now);
      localStorage.setItem(STORAGE_KEY_LAST_SYNC, now);
      setSyncStatus('SUCCESS');

      appLogger.scope('DRIVE:SYNC').info(`Uspješna sinkronizacija baze na Google Drive (${filename})`, {
        dokumenti: snapshot.dokumenti.length,
        kpr: snapshot.kpr.length,
        artikli: snapshot.artikli.length,
      });

      // Osvježi popis
      await refreshDriveBackups();
    } catch (err: any) {
      const msg = err?.message || 'Greška pri sinkronizaciji na Google Drive.';
      setError(msg);
      setSyncStatus('ERROR');
      appLogger.scope('DRIVE:SYNC').error('Greška pri sinkronizaciji:', { error: msg });
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [identity, getAccessToken, refreshDriveBackups]);

  /**
   * Preuzima sigurnosnu kopiju s Google Drivea, dekriptira i atomski obnavlja lokalnu bazu
   */
  const restoreFromDrive = useCallback(async (fileId: string, userPin?: string) => {
    if (!identity?.googleSub) {
      throw new Error('Za vraćanje sigurnosne kopije morate biti prijavljeni s istim Google računom.');
    }

    try {
      setIsSyncing(true);
      setSyncStatus('SYNCING');
      setError(null);

      const token = await getAccessToken();
      if (!token) {
        throw new Error('Nema valjanog Google tokena autorizacije.');
      }

      // 1. Preuzmi sadržaj datoteke s Drivea
      const content = await googleDriveService.downloadBackup(token, fileId);

      // 2. Dekriptiraj pomoću Google Sub-a (kripto sidro)
      const decrypted = await decryptBackupWithGoogleSub(content, identity.googleSub, userPin);

      // 3. Atomski obnovi lokalnu bazu
      await restoreBackupSnapshot(dexieStorage, decrypted, true);

      setSyncStatus('SUCCESS');
      appLogger.scope('DRIVE:RESTORE').info('Uspješno vraćena baza s Google Drivea', {
        obrt: decrypted.obrt?.naziv,
        dokumenti: decrypted.dokumenti.length,
        partneri: decrypted.partneri.length,
      });
    } catch (err: any) {
      const msg = err?.message || 'Greška pri obnavljanju podataka s Google Drivea.';
      setError(msg);
      setSyncStatus('ERROR');
      appLogger.scope('DRIVE:RESTORE').error('Greška pri vraćanju s Drivea:', { error: msg });
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [identity, getAccessToken]);

  return {
    isSyncing,
    syncStatus,
    lastSyncTime,
    error,
    driveBackups,
    syncToDrive,
    restoreFromDrive,
    refreshDriveBackups,
  };
}
