import { appLogger } from './logger';

export interface DriveBackupFile {
  id: string;
  name: string;
  createdTime: string;
  size?: string;
}

const DEMO_DRIVE_STORAGE_KEY = 'obrtniq_demo_drive_backups';

class GoogleDriveService {
  /**
   * Dohvaća popis spremljenih sigurnosnih kopija iz skrivene appDataFolder mape
   */
  public async listBackups(accessToken: string): Promise<DriveBackupFile[]> {
    if (accessToken.startsWith('demo-')) {
      return this.getDemoBackups();
    }

    try {
      const url = 'https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,name,createdTime,size)&orderBy=createdTime%20desc';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        let errorDetails = '';
        try {
          const errData = await res.json();
          errorDetails = errData.error?.message || JSON.stringify(errData.error || errData);
        } catch {
          errorDetails = res.statusText || 'Nepoznata greška';
        }
        if (res.status === 401) {
          throw new Error(`Google Drive API greška (401 Unauthorized): Pristupni token je istekao ili nevažeći. ${errorDetails}`.trim());
        }
        throw new Error(`Google Drive API greška (${res.status}): ${errorDetails}`);
      }

      const data = await res.json();
      return (data.files || []).map((f: any) => ({
        id: f.id,
        name: f.name,
        createdTime: f.createdTime,
        size: f.size ? `${(parseInt(f.size, 10) / 1024).toFixed(1)} KB` : undefined,
      }));
    } catch (err: any) {
      appLogger.scope('DRIVE:LIST').error('Neuspjelo dohvaćanje datoteka s Google Drivea:', { error: err?.message });
      throw err;
    }
  }

  /**
   * Sprema kriptiranu .obrtniq arhivu u skriveni appDataFolder
   */
  public async uploadBackup(accessToken: string, fileContent: string, filename: string): Promise<DriveBackupFile> {
    if (accessToken.startsWith('demo-')) {
      return this.saveDemoBackup(fileContent, filename);
    }

    try {
      const metadata = {
        name: filename,
        parents: ['appDataFolder'],
        description: 'ObrtnIQ Kriptirana Sigurnosna Kopija (AES-256-GCM)',
      };

      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        fileContent +
        closeDelimiter;

      const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,createdTime,size';
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      });

      if (!res.ok) {
        let errorDetails = '';
        try {
          const errData = await res.json();
          errorDetails = errData.error?.message || JSON.stringify(errData.error || errData);
        } catch {
          errorDetails = res.statusText || 'Nepoznata greška';
        }
        if (res.status === 401) {
          throw new Error(`Neuspjelo slanje arhive na Google Drive (401 Unauthorized): Pristupni token je istekao ili nevažeći. ${errorDetails}`.trim());
        }
        throw new Error(`Neuspjelo slanje arhive na Google Drive (${res.status}): ${errorDetails}`);
      }

      const file = await res.json();
      appLogger.scope('DRIVE:UPLOAD').info(`Uspješno spremljen backup na Google Drive: ${filename}`, { id: file.id });

      return {
        id: file.id,
        name: file.name,
        createdTime: file.createdTime || new Date().toISOString(),
        size: file.size ? `${(parseInt(file.size, 10) / 1024).toFixed(1)} KB` : undefined,
      };
    } catch (err: any) {
      appLogger.scope('DRIVE:UPLOAD').error('Greška pri uploadu na Drive:', { error: err?.message });
      throw err;
    }
  }

  /**
   * Preuzima sadržaj sigurnosne kopije prema ID-u datoteke
   */
  public async downloadBackup(accessToken: string, fileId: string): Promise<string> {
    if (accessToken.startsWith('demo-')) {
      return this.getDemoBackupContent(fileId);
    }

    try {
      const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        let errorDetails = '';
        try {
          const errData = await res.json();
          errorDetails = errData.error?.message || JSON.stringify(errData.error || errData);
        } catch {
          errorDetails = res.statusText || 'Nepoznata greška';
        }
        if (res.status === 401) {
          throw new Error(`Neuspjelo preuzimanje backupa s Google Drivea (401 Unauthorized): Pristupni token je istekao ili nevažeći. ${errorDetails}`.trim());
        }
        throw new Error(`Neuspjelo preuzimanje backupa s Google Drivea (${res.status}): ${errorDetails}`);
      }

      return await res.text();
    } catch (err: any) {
      appLogger.scope('DRIVE:DOWNLOAD').error('Greška pri preuzimanju backupa:', { fileId, error: err?.message });
      throw err;
    }
  }

  // --- Demo Mock Storage Pomoćne Funkcije ---

  private getDemoBackups(): DriveBackupFile[] {
    try {
      const raw = localStorage.getItem(DEMO_DRIVE_STORAGE_KEY);
      if (!raw) return [];
      const list = JSON.parse(raw);
      return list.map((item: any) => ({
        id: item.id,
        name: item.name,
        createdTime: item.createdTime,
        size: item.size,
      }));
    } catch {
      return [];
    }
  }

  private saveDemoBackup(content: string, filename: string): DriveBackupFile {
    const list = this.getDemoBackups();
    const newFile: DriveBackupFile = {
      id: `demo-drive-${Date.now()}`,
      name: filename,
      createdTime: new Date().toISOString(),
      size: `${(content.length / 1024).toFixed(1)} KB`,
    };

    const fullItem = {
      ...newFile,
      content,
    };

    const updated = [fullItem, ...list.slice(0, 9)]; // Zadrži zadnjih 10
    localStorage.setItem(DEMO_DRIVE_STORAGE_KEY, JSON.stringify(updated));
    appLogger.scope('DRIVE:DEMO').info(`Spremljen demo backup na Drive: ${filename}`);
    return newFile;
  }

  private getDemoBackupContent(fileId: string): string {
    const raw = localStorage.getItem(DEMO_DRIVE_STORAGE_KEY);
    if (!raw) throw new Error('Demo datoteka nije pronađena.');
    const list = JSON.parse(raw);
    const item = list.find((i: any) => i.id === fileId);
    if (!item || !item.content) {
      throw new Error('Sadržaj demo datoteke nije pronađen.');
    }
    return item.content;
  }

  /**
   * Provjerava je li Google Drive API omogućen u korisničkom Google Cloud projektu
   * i ima li aplikacija dozvolu za pristup appDataFolder mapi.
   */
  public async testDriveApiAccess(accessToken: string): Promise<{
    ok: boolean;
    statusText: string;
    enableUrl?: string;
  }> {
    if (accessToken.startsWith('demo-')) {
      return {
        ok: true,
        statusText: 'Demo način rada: Google Drive simulacija je aktivna i spremna.',
      };
    }

    try {
      const url = 'https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&pageSize=1';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        return {
          ok: true,
          statusText: 'Google Drive API je omogućen i skrivena mapa appDataFolder je dostupna.',
        };
      }

      const errData = await res.json().catch(() => ({}));
      const errMsg: string = errData.error?.message || res.statusText;

      // Pokušaj izvući URL za aktivaciju API-ja ako ga Google vrati u grešci
      const matchUrl = errMsg.match(/https:\/\/[^\s]+/);
      const enableUrl = matchUrl ? matchUrl[0] : undefined;

      return {
        ok: false,
        statusText: errMsg,
        enableUrl,
      };
    } catch (err: any) {
      return {
        ok: false,
        statusText: err?.message || 'Neuspjelo povezivanje s Google Drive poslužiteljem.',
      };
    }
  }
}

export const googleDriveService = new GoogleDriveService();
