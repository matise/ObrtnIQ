import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  googleSttService,
  type TestSttConnectionResult,
} from '../src/services/google-stt-service';
import {
  DEFAULT_ZIGO_STT_CONFIG,
  validateGcpSttConfig,
  type ZigoSttConfig,
} from '@obrtniq/core';

describe('Google Speech-to-Text V2 Settings & Service (BYOK & Zero-Server)', () => {
  const originalFetch = globalThis.fetch;
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    const storageMock = {
      getItem: vi.fn((key: string) => mockStorage[key] || null),
      setItem: vi.fn((key: string, val: string) => {
        mockStorage[key] = val;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      }),
    };
    vi.stubGlobal('localStorage', storageMock);
    (globalThis as any).window = (globalThis as any).window || {};
    (globalThis as any).window.localStorage = storageMock;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('1. Pohrana i dohvat konfiguracije (localStorage)', () => {
    it('vraća zadane postavke kada u localStorage-u nema podataka', () => {
      const config = googleSttService.getConfig();
      expect(config.engine).toBe('browser');
      expect(config.gcpLocation).toBe('eu');
      expect(config.gcpModel).toBe('chirp_2');
      expect(config.gcpRecognizerId).toBe('zigo-recognizer-chirp2');
      expect(config.enablePhraseAdaptation).toBe(true);
      expect(config.gcpApiKey).toBe('');
      expect(config.gcpProjectId).toBe('');
    });

    it('uspješno sprema i dohvaća ažurirane STT postavke', () => {
      const novaKonfiguracija: ZigoSttConfig = {
        engine: 'gcp_stt_v2',
        authMode: 'api_key',
        gcpApiKey: 'AIzaSyTestApiKey12345678901234567890123',
        gcpProjectId: 'moj-obrt-prod',
        gcpLocation: 'eu',
        gcpRecognizerId: 'zigo-custom-rec',
        gcpModel: 'chirp_2',
        enablePhraseAdaptation: true,
      };

      googleSttService.saveConfig(novaKonfiguracija);
      const retrieved = googleSttService.getConfig();

      expect(retrieved.engine).toBe('gcp_stt_v2');
      expect(retrieved.authMode).toBe('api_key');
      expect(retrieved.gcpApiKey).toBe('AIzaSyTestApiKey12345678901234567890123');
      expect(retrieved.gcpProjectId).toBe('moj-obrt-prod');
      expect(retrieved.gcpLocation).toBe('eu');
      expect(retrieved.gcpRecognizerId).toBe('zigo-custom-rec');
    });

    it('sigurno se oporavlja od korumpiranog JSON-a u localStorage-u', () => {
      mockStorage['obrtniq_stt_config'] = '{korumpirani-json-';
      const config = googleSttService.getConfig();
      expect(config.engine).toBe('browser');
      expect(config.gcpModel).toBe('chirp_2');
    });
  });

  describe('2. Testiranje mrežne veze prema Google Cloud STT V2 REST endpointu', () => {
    const validConfig: ZigoSttConfig = {
      engine: 'gcp_stt_v2',
      authMode: 'api_key',
      gcpApiKey: 'AIzaSyValidDummyApiKey123456789012345678',
      gcpProjectId: 'obrtniq-prod',
      gcpLocation: 'eu',
      gcpRecognizerId: 'zigo-recognizer-chirp2',
      gcpModel: 'chirp_2',
      enablePhraseAdaptation: true,
    };

    it('zaustavlja provjeru i javlja grešku bez mrežnog poziva ako je konfiguracija statički nevaljana', async () => {
      const fetchSpy = vi.fn();
      globalThis.fetch = fetchSpy;

      const invalidConfig: ZigoSttConfig = {
        ...validConfig,
        gcpApiKey: 'bad-key',
      };

      const result = await googleSttService.testConnection(invalidConfig);
      expect(result.success).toBe(false);
      expect(result.message).toContain('AIza');
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('uspješno verificira vezu kada Google STT V2 API vrati HTTP 200 OK', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          recognizers: [
            { name: 'projects/obrtniq-prod/locations/eu/recognizers/zigo-recognizer-chirp2' },
          ],
        }),
      });

      const result = await googleSttService.testConnection(validConfig);
      expect(result.success).toBe(true);
      expect(result.recognizersCount).toBe(1);
      expect(result.message).toContain('Uspješno povezano');
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('ispravno detektira nevaljan API ključ pri HTTP 400 Bad Request', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          error: {
            code: 400,
            message: 'API key not valid. Please pass a valid API key.',
            status: 'INVALID_ARGUMENT',
          },
        }),
      });

      const result = await googleSttService.testConnection(validConfig);
      expect(result.success).toBe(false);
      expect(result.message).toContain('API_KEY_INVALID');
    });

    it('ispravno detektira neomogućeni Speech API pri HTTP 403 Service Disabled', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({
          error: {
            code: 403,
            message: 'Cloud Speech-to-Text API has not been used in project obrtniq-prod or it is disabled.',
            status: 'PERMISSION_DENIED',
          },
        }),
      });

      const result = await googleSttService.testConnection(validConfig);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Cloud Speech-to-Text API nije omogućen');
    });

    it('ispravno detektira nepostojeći projekt ili regiju pri HTTP 404 Not Found', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({
          error: {
            code: 404,
            message: 'Project not found.',
          },
        }),
      });

      const result = await googleSttService.testConnection(validConfig);
      expect(result.success).toBe(false);
      expect(result.message).toContain('404 Not Found');
    });

    it('sigurno rukuje prekidom internetske veze ili mrežnom iznimkom', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch (CORS/Network error)'));

      const result = await googleSttService.testConnection(validConfig);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Mrežna greška pri provjeri');
    });

    it('uspješno validira Service Account JSON konfiguraciju', async () => {
      const saJson = JSON.stringify({
        type: 'service_account',
        project_id: 'obrtniq-prod',
        private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASC...\n-----END PRIVATE KEY-----\n',
        client_email: 'zigo-stt-runner@obrtniq-prod.iam.gserviceaccount.com',
      });

      const saConfig: ZigoSttConfig = {
        engine: 'gcp_stt_v2',
        authMode: 'service_account',
        gcpApiKey: '',
        gcpProjectId: 'obrtniq-prod',
        gcpServiceAccountJson: saJson,
        gcpClientEmail: 'zigo-stt-runner@obrtniq-prod.iam.gserviceaccount.com',
        gcpLocation: 'eu',
        gcpRecognizerId: 'zigo-recognizer-chirp2',
        gcpModel: 'chirp_2',
        enablePhraseAdaptation: true,
      };

      const result = await googleSttService.testConnection(saConfig);
      expect(result.success).toBe(true);
      expect(result.message).toContain('Uspješno validiran Service Account');
      expect(result.message).toContain('zigo-stt-runner@obrtniq-prod.iam.gserviceaccount.com');
    });
  });
});
