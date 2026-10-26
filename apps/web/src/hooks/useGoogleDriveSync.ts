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
import { googleAuthService } from '../services/google-auth-service';
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
  getAccessToken: (forceRefresh?: boolean) => Promise<string | null>,
  refreshAccessToken?: () => Promise<string | null>
): UseGoogleDriveSyncReturn {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_LAST_SYNC);
  });
  const [error, setError] = useState<string | null>(null);
  const [driveBackups, setDriveBackups] = useState<DriveBackupFile[]>([]);

  /**
   * Izvršava operaciju nad Google Driveom, a u slučaju 401 Unauthorized greške
   * automatski čisti nevažeći token, obnavlja ga i ponavlja operaciju jednom.
   */
  const executeWithTokenRetry = useCallback(async <T>(
    operation: (token: string) => Promise<T>
  ): Promise<T> => {
    let token = await getAccessToken();
    if (!token) {
      throw new Error('Nema valjanog Google tokena autorizacije. Prijavite se ponovno.');
    }

    try {
      return await operation(token);
    } catch (err: any) {
      const errMsg = err?.message || '';
      // Ako je greška 401 Unauthorized, token je istekao ili nevažeći
      if (errMsg.includes('401') || errMsg.toLowerCase().includes('unauthorized') || errMsg.includes('nevažeći')) {
        appLogger.scope('DRIVE:RETRY').warn('Detektiran 401 Unauthorized. Čistim nevažeći token i pokušavam obnavljanje...');
        googleAuthService.clearStoredTokens();

        // Pokušaj tiho ili interaktivno osvježavanje tokena
        const refreshedToken = refreshAccessToken
          ? await refreshAccessToken()
          : await getAccessToken(true);

        if (refreshedToken) {
          appLogger.scope('DRIVE:RETRY').info('Pristupni token uspješno obnovljen. Ponavljam Google Drive operaciju...');
          return await operation(refreshedToken);
        }

        throw new Error('Google prijava je istekla (401). Molimo kliknite "Obnovi prijavu" kako biste ponovno autorizirali pristup Google Driveu.');
      }
      throw err;
    }
  }, [getAccessToken, refreshAccessToken]);

  const refreshDriveBackups = useCallback(async () => {
    if (!identity) {
      setDriveBackups([]);
      setError(null);
      return;
    }

    try {
      const list = await executeWithTokenRetry((token) => googleDriveService.listBackups(token));
      setDriveBackups(list);
      setError(null);
    } catch (err: any) {
      const msg = err?.message || 'Osvježavanje popisa backupa nije uspjelo.';
      appLogger.scope('DRIVE:HOOK').warn('Osvježavanje popisa backupa nije uspjelo:', { error: msg });
      setError(msg);
    }
  }, [identity, executeWithTokenRetry]);

  useEffect(() => {
    // Automatski dohvat popisa backupa vrši se samo ako je korisnik prijavljen I token je još važeći
    // Ako je token istekao, ne pokrećemo mrežne zahtjeve na mountu da ne prekidamo korisnika
    if (identity && googleAuthService.getTokenRemainingMinutes() > 0) {
      refreshDriveBackups();
    } else if (!identity) {
      setDriveBackups([]);
      setError(null);
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

      // 1. Kreiraj lokalni snapshot baze
      const snapshot = await createBackupSnapshot(dexieStorage);

      // 2. Kriptiraj AES-256-GCM paket koristeći Google Sub kao kripto sidro
      const encrypted = await encryptBackupWithGoogleSub(snapshot, identity.googleSub, userPin);

      // 3. Pošalji u appDataFolder na Google Driveu
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const timeStr = new Date().toTimeString().slice(0, 5).replace(/:/g, '');
      const filename = `obrtniq_cloud_${dateStr}_${timeStr}.obrtniq`;

      await executeWithTokenRetry((token) =>
        googleDriveService.uploadBackup(token, JSON.stringify(encrypted, null, 2), filename)
      );

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
  }, [identity, executeWithTokenRetry, refreshDriveBackups]);

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

      // 1. Preuzmi sadržaj datoteke s Drivea uz automatski retry na 401
      const content = await executeWithTokenRetry((token) =>
        googleDriveService.downloadBackup(token, fileId)
      );

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
