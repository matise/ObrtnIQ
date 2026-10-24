import { describe, it, expect, beforeEach, vi } from 'vitest';
import { googleDriveService } from '../src/services/google-drive-service';

// Mock localStorage za headless Node test okruženje
const store = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => store.set(key, String(value)),
  removeItem: (key: string) => store.delete(key),
  clear: () => store.clear(),
};

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = mockLocalStorage;
}

describe('GoogleDriveService: Sinkronizacija i Upravljanje Arhivama', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Demo način rada (Offline / Zero-Server)', () => {
    const demoToken = 'demo-access-token-12345';

    it('GD-01: testDriveApiAccess u demo načinu vraća uspješan status bez mrežnih poziva', async () => {
      const res = await googleDriveService.testDriveApiAccess(demoToken);
      expect(res.ok).toBe(true);
      expect(res.statusText).toContain('Demo način rada');
    });

    it('GD-02: listBackups vraća praznu listu kada nema spremljenih demo arhiva', async () => {
      const list = await googleDriveService.listBackups(demoToken);
      expect(Array.isArray(list)).toBe(true);
      expect(list).toHaveLength(0);
    });

    it('GD-03: uploadBackup sprema demo arhivu i listBackups je ispravno dohvaća', async () => {
      const dummyContent = JSON.stringify({ sustav: 'ObrtnIQ', verzija: '1.0', test: true });
      const filename = 'obrtniq_backup_2026.obrtniq';

      const uploaded = await googleDriveService.uploadBackup(demoToken, dummyContent, filename);
      expect(uploaded.id).toBeDefined();
      expect(uploaded.id.startsWith('demo-drive-')).toBe(true);
      expect(uploaded.name).toBe(filename);
      expect(uploaded.createdTime).toBeDefined();

      const list = await googleDriveService.listBackups(demoToken);
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe(uploaded.id);
      expect(list[0].name).toBe(filename);
    });

    it('GD-04: downloadBackup vraća točan sadržaj prethodno spremljene demo arhive', async () => {
      const dummyPayload = '{"tajna":"kriptirani_podaci_aes_256"}';
      const filename = 'tajna_arhiva.obrtniq';

      const uploaded = await googleDriveService.uploadBackup(demoToken, dummyPayload, filename);
      const downloaded = await googleDriveService.downloadBackup(demoToken, uploaded.id);

      expect(downloaded).toBe(dummyPayload);
    });

    it('GD-05: downloadBackup baca grešku ako traženi fileId ne postoji u demo memoriji', async () => {
      // 1. Kad je skladište prazno
      await expect(
        googleDriveService.downloadBackup(demoToken, 'nepostojeci-id-999')
      ).rejects.toThrow('Demo datoteka nije pronađena');

      // 2. Kad u skladištu ima drugih datoteka, ali ne i tražene
      await googleDriveService.uploadBackup(demoToken, '{"podatak":1}', 'file1.obrtniq');
      await expect(
        googleDriveService.downloadBackup(demoToken, 'nepostojeci-id-999')
      ).rejects.toThrow('Sadržaj demo datoteke nije pronađen');
    });
  });

  describe('Stvarni API način rada (Network fetch)', () => {
    const realToken = 'ya29.a0AfH6SM...validGoogleToken';

    it('GD-06: testDriveApiAccess detektira uspješan pristup kada Google API vrati 200 OK', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ files: [] }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const res = await googleDriveService.testDriveApiAccess(realToken);
      expect(res.ok).toBe(true);
      expect(res.statusText).toContain('appDataFolder je dostupna');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('spaces=appDataFolder'),
        expect.objectContaining({
          headers: { Authorization: `Bearer ${realToken}` },
        })
      );
    });

    it('GD-07: testDriveApiAccess prepoznaje grešku i parsira link za aktivaciju API-ja', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({
          error: {
            message: 'Google Drive API has not been used. Enable it by visiting https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=123 then retry.',
          },
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const res = await googleDriveService.testDriveApiAccess(realToken);
      expect(res.ok).toBe(false);
      expect(res.enableUrl).toBe('https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=123');
    });

    it('GD-08: uploadBackup generira ispravan multipart/related zahtjev prema Google Drive v3 API-ju', async () => {
      let capturedBody = '';
      let capturedHeaders: any = {};

      const mockFetch = vi.fn().mockImplementation((url, opts) => {
        capturedHeaders = opts.headers;
        capturedBody = opts.body;
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            id: 'google-drive-file-real-id-777',
            name: 'obrtniq_cloud.obrtniq',
            createdTime: '2026-10-24T21:00:00Z',
            size: '2048',
          }),
        });
      });
      vi.stubGlobal('fetch', mockFetch);

      const fileContent = '{"obrt":"Robot Hand Made","stavke":5}';
      const res = await googleDriveService.uploadBackup(realToken, fileContent, 'obrtniq_cloud.obrtniq');

      expect(res.id).toBe('google-drive-file-real-id-777');
      expect(capturedHeaders['Authorization']).toBe(`Bearer ${realToken}`);
      expect(capturedHeaders['Content-Type']).toContain('multipart/related; boundary=');
      expect(capturedBody).toContain('appDataFolder');
      expect(capturedBody).toContain(fileContent);
    });

    it('GD-09: listBackups parsira veličinu i datume iz Google Drive API odgovora', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          files: [
            {
              id: 'file-1',
              name: 'backup1.obrtniq',
              createdTime: '2026-10-24T10:00:00Z',
              size: '10240', // 10 KB
            },
          ],
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const list = await googleDriveService.listBackups(realToken);
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe('file-1');
      expect(list[0].name).toBe('backup1.obrtniq');
      expect(list[0].size).toBe('10.0 KB');
    });

    it('GD-10: downloadBackup dohvaća binarni ili tekstualni sadržaj datoteke s alt=media parametrom', async () => {
      const expectedContent = '{"sigurnost":"kriptirano_aes_gcm"}';
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => expectedContent,
      });
      vi.stubGlobal('fetch', mockFetch);

      const content = await googleDriveService.downloadBackup(realToken, 'file-xyz');
      expect(content).toBe(expectedContent);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.googleapis.com/drive/v3/files/file-xyz?alt=media',
        expect.objectContaining({
          headers: { Authorization: `Bearer ${realToken}` },
        })
      );
    });
  });
});
