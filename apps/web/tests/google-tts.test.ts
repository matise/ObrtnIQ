import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  googleTtsService,
  GoogleTtsService,
  type TestTtsConnectionResult,
} from '../src/services/google-tts-service';
import { googleSttService } from '../src/services/google-stt-service';
import {
  DEFAULT_GOOGLE_TTS_CONFIG,
  validateGoogleTtsConfig,
  type GoogleTtsConfig,
} from '@obrtniq/core';

describe('Google Cloud Text-to-Speech (TTS) Service & Settings (BYOK & Fallback)', () => {
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

    // Mock za URL.createObjectURL i revokeObjectURL
    if (!globalThis.URL.createObjectURL) {
      globalThis.URL.createObjectURL = vi.fn((_blob: any) => 'blob:http://localhost/mock-audio-uuid');
    } else {
      vi.spyOn(globalThis.URL, 'createObjectURL').mockImplementation(() => 'blob:http://localhost/mock-audio-uuid');
    }

    if (!globalThis.URL.revokeObjectURL) {
      globalThis.URL.revokeObjectURL = vi.fn();
    } else {
      vi.spyOn(globalThis.URL, 'revokeObjectURL').mockImplementation(() => {});
    }

    googleTtsService.clearCache();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    googleTtsService.clearCache();
    vi.restoreAllMocks();
  });

  describe('1. Pohrana i dohvat konfiguracije (localStorage)', () => {
    it('vraća zadane postavke kada u localStorage-u nema spremljene konfiguracije', () => {
      const config = googleTtsService.getConfig();
      expect(config.engine).toBe('google_cloud');
      expect(config.voiceName).toBe('hr-HR-Wavenet-B');
      expect(config.languageCode).toBe('hr-HR');
      expect(config.ssmlGender).toBe('MALE');
      expect(config.speakingRate).toBe(0.94);
      expect(config.pitchSemitones).toBe(-2.0);
      expect(config.useSttApiKey).toBe(true);
      expect(config.apiKey).toBe('');
    });

    it('uspješno sprema i dohvaća prilagođenu TTS konfiguraciju', () => {
      const customConfig: GoogleTtsConfig = {
        engine: 'google_cloud',
        useSttApiKey: false,
        apiKey: 'AIzaSyCustomKey98765432101234567890123',
        voiceName: 'hr-HR-Standard-A',
        languageCode: 'hr-HR',
        ssmlGender: 'FEMALE',
        speakingRate: 1.05,
        pitchSemitones: 0.0,
        audioEncoding: 'OGG_OPUS',
      };

      googleTtsService.saveConfig(customConfig);
      const retrieved = googleTtsService.getConfig();

      expect(retrieved.useSttApiKey).toBe(false);
      expect(retrieved.apiKey).toBe('AIzaSyCustomKey98765432101234567890123');
      expect(retrieved.voiceName).toBe('hr-HR-Standard-A');
      expect(retrieved.speakingRate).toBe(1.05);
      expect(retrieved.pitchSemitones).toBe(0.0);
      expect(retrieved.audioEncoding).toBe('OGG_OPUS');
    });

    it('sigurno se oporavlja od korumpiranog JSON-a u localStorage-u', () => {
      mockStorage['obrtniq_google_tts_config'] = '{{nevaljani_json}}';
      const config = googleTtsService.getConfig();
      expect(config.voiceName).toBe('hr-HR-Wavenet-B');
      expect(config.engine).toBe('google_cloud');
    });
  });

  describe('2. Nasljeđivanje API ključa (BYOK Key Inheritance)', () => {
    it('nasljeđuje API ključ iz Speech-to-Text modula kada je useSttApiKey = true', () => {
      // Postavi STT API ključ
      googleSttService.saveConfig({
        ...googleSttService.getConfig(),
        gcpApiKey: 'AIzaSySharedFromSttModule1234567890123',
      });

      googleTtsService.saveConfig({
        ...DEFAULT_GOOGLE_TTS_CONFIG,
        useSttApiKey: true,
        apiKey: '',
      });

      const effectiveKey = googleTtsService.getEffectiveApiKey();
      expect(effectiveKey).toBe('AIzaSySharedFromSttModule1234567890123');
      expect(googleTtsService.isConfigured()).toBe(true);
    });

    it('koristi vlastiti zaseban API ključ ako je unesen, čak i ako postoji STT ključ', () => {
      googleSttService.saveConfig({
        ...googleSttService.getConfig(),
        gcpApiKey: 'AIzaSySharedFromSttModule1234567890123',
      });

      googleTtsService.saveConfig({
        ...DEFAULT_GOOGLE_TTS_CONFIG,
        useSttApiKey: false,
        apiKey: 'AIzaSyDedicatedTtsKey999999999999999',
      });

      const effectiveKey = googleTtsService.getEffectiveApiKey();
      expect(effectiveKey).toBe('AIzaSyDedicatedTtsKey999999999999999');
      expect(googleTtsService.isConfigured()).toBe(true);
    });

    it('vraća prazan ključ i isConfigured() = false kada nijedan ključ nije dostupan', () => {
      googleSttService.saveConfig({
        ...googleSttService.getConfig(),
        gcpApiKey: '',
      });

      googleTtsService.saveConfig({
        ...DEFAULT_GOOGLE_TTS_CONFIG,
        useSttApiKey: true,
        apiKey: '',
      });

      expect(googleTtsService.getEffectiveApiKey()).toBe('');
      expect(googleTtsService.isConfigured()).toBe(false);
    });

    it('prvo pokušava koristiti Web Client API ključ aplikacije ako je zadan u okruženju', () => {
      vi.stubEnv('VITE_GOOGLE_CLIENT_API_KEY', 'AIzaSyAppClientWebKey1234567890123456');

      googleTtsService.saveConfig({
        ...DEFAULT_GOOGLE_TTS_CONFIG,
        apiKey: '',
        useSttApiKey: false,
      });

      const auth = googleTtsService.getEffectiveAuth();
      expect(auth.source).toBe('app_client_key');
      expect(auth.apiKey).toBe('AIzaSyAppClientWebKey1234567890123456');
      expect(googleTtsService.isConfigured()).toBe(true);
      vi.unstubAllEnvs();
    });

    it('omogućuje korisniku da vlastitim ključem nadjača aplikacijski Web Client ključ', () => {
      vi.stubEnv('VITE_GOOGLE_CLIENT_API_KEY', 'AIzaSyAppClientWebKey1234567890123456');

      googleTtsService.saveConfig({
        ...DEFAULT_GOOGLE_TTS_CONFIG,
        apiKey: 'AIzaSyUserExplicitOverrideKey99999999',
        useSttApiKey: false,
      });

      const auth = googleTtsService.getEffectiveAuth();
      expect(auth.source).toBe('custom');
      expect(auth.apiKey).toBe('AIzaSyUserExplicitOverrideKey99999999');
      vi.unstubAllEnvs();
    });

    it('koristi OAuth Bearer token prijavljenog Google računa ako nema definiranog API ključa', async () => {
      googleTtsService.saveConfig({
        ...DEFAULT_GOOGLE_TTS_CONFIG,
        apiKey: '',
        useSttApiKey: false,
      });

      // Simulacija prijavljene Google sesije
      const storage = (globalThis as any).window.localStorage;
      storage.setItem(
        'obrtniq_google_tokens',
        JSON.stringify({
          accessToken: 'ya29.a0AfH6SMTestOAuthAccessToken1234567890',
          expiresAt: Date.now() + 3600000,
        })
      );

      const auth = googleTtsService.getEffectiveAuth();
      expect(auth.source).toBe('oauth_token');
      expect(auth.accessToken).toBe('ya29.a0AfH6SMTestOAuthAccessToken1234567890');
      expect(googleTtsService.isConfigured()).toBe(true);

      // Provjera da synthesize šalje Authorization: Bearer umjesto ?key=
      let capturedUrl = '';
      let capturedHeaders: any = {};
      globalThis.fetch = vi.fn().mockImplementation(async (url: string, opts: any) => {
        capturedUrl = url;
        capturedHeaders = opts.headers;
        return {
          ok: true,
          status: 200,
          json: async () => ({ audioContent: btoa('test') }),
        };
      });

      await googleTtsService.synthesize('Test bearer sinteze', { apiKey: '', useSttApiKey: false });
      expect(capturedUrl).not.toContain('key=');
      expect(capturedHeaders['Authorization']).toBe('Bearer ya29.a0AfH6SMTestOAuthAccessToken1234567890');
    });
  });

  describe('3. Validacija Google TTS konfiguracije (validateGoogleTtsConfig)', () => {
    it('potvrđuje ispravnu konfiguraciju s valjanim ključem', () => {
      const config: GoogleTtsConfig = {
        ...DEFAULT_GOOGLE_TTS_CONFIG,
        apiKey: 'AIzaSyValidKey12345678901234567890123',
      };
      const result = validateGoogleTtsConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.effectiveApiKey).toBe('AIzaSyValidKey12345678901234567890123');
      expect(result.error).toBeUndefined();
    });

    it('javlja grešku ako ključ nedostaje ili nema Google AIza format', () => {
      const config: GoogleTtsConfig = {
        ...DEFAULT_GOOGLE_TTS_CONFIG,
        useSttApiKey: false,
        apiKey: 'invalid-key-format',
      };
      const result = validateGoogleTtsConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('AIza');
    });

    it('provjerava granice brzine govora i visine tona', () => {
      const badRateConfig: GoogleTtsConfig = {
        ...DEFAULT_GOOGLE_TTS_CONFIG,
        apiKey: 'AIzaSyValidKey12345678901234567890123',
        speakingRate: 5.5, // izvan [0.25, 4.0]
      };
      expect(validateGoogleTtsConfig(badRateConfig).isValid).toBe(false);

      const badPitchConfig: GoogleTtsConfig = {
        ...DEFAULT_GOOGLE_TTS_CONFIG,
        apiKey: 'AIzaSyValidKey12345678901234567890123',
        pitchSemitones: -25, // izvan [-20.0, 20.0]
      };
      expect(validateGoogleTtsConfig(badPitchConfig).isValid).toBe(false);
    });
  });

  describe('4. Sinteza govora i In-Memory Caching (synthesize)', () => {
    const validConfig: GoogleTtsConfig = {
      ...DEFAULT_GOOGLE_TTS_CONFIG,
      apiKey: 'AIzaSyMockKeyForTesting1234567890123456',
    };

    // Base64 simulacija jednostavnog MP3 zaglavlja (npr. "AUDIO_BYTES")
    const mockBase64Audio = btoa('RIFF....WAVEfmt ....data....');

    it('šalje ispravno formatiran REST zahtjev i vraća audioUrl', async () => {
      let capturedUrl = '';
      let capturedBody: any = null;

      globalThis.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
        capturedUrl = url;
        capturedBody = JSON.parse(options.body);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            audioContent: mockBase64Audio,
          }),
        };
      });

      const text = 'Gosparu, provjeravam **OIB** i račun od 150 € sa 25% PDV-a.';
      const result = await googleTtsService.synthesize(text, validConfig);

      expect(capturedUrl).toContain('https://texttospeech.googleapis.com/v1/text:synthesize');
      expect(capturedUrl).toContain('key=AIzaSyMockKeyForTesting1234567890123456');

      expect(capturedBody.voice.languageCode).toBe('hr-HR');
      expect(capturedBody.voice.name).toBe('hr-HR-Wavenet-B');
      expect(capturedBody.audioConfig.speakingRate).toBe(0.94);
      expect(capturedBody.audioConfig.pitch).toBe(-2.0);

      // Provjera leksičke normalizacije u tijelu zahtjeva
      expect(capturedBody.input.text).toContain('O I B');
      expect(capturedBody.input.text).toContain('150 eura');
      expect(capturedBody.input.text).toContain('25 posto');
      expect(capturedBody.input.text).toContain('P D V');

      expect(result.audioUrl).toBe('blob:http://localhost/mock-audio-uuid');
      expect(result.isCached).toBe(false);
      expect(result.durationEstimateMs).toBeGreaterThan(1000);
    });

    it('koristi in-memory cache za identičan tekst i parametre bez ponovnog API poziva', async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          audioContent: mockBase64Audio,
        }),
      });
      globalThis.fetch = fetchSpy;

      const phrase = 'Ponavljajuća rečenica viteza Orlanda.';

      // Prvi poziv -> mora okinuti fetch
      const res1 = await googleTtsService.synthesize(phrase, validConfig);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(res1.isCached).toBe(false);

      // Drugi poziv s istim tekstom -> mora vratiti iz cachea bez novog fetcha
      const res2 = await googleTtsService.synthesize(phrase, validConfig);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(res2.isCached).toBe(true);
      expect(res2.audioUrl).toBe(res1.audioUrl);

      // Nakon clearCache() -> ponovni poziv opet poziva fetch
      googleTtsService.clearCache();
      const res3 = await googleTtsService.synthesize(phrase, validConfig);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(res3.isCached).toBe(false);
    });
  });

  describe('5. Rukovanje greškama i dijagnostika (HTTP 400, 403, network failure)', () => {
    const validConfig: GoogleTtsConfig = {
      ...DEFAULT_GOOGLE_TTS_CONFIG,
      apiKey: 'AIzaSyMockKeyForTesting1234567890123456',
    };

    it('baca prepoznatljivu grešku pri HTTP 403 (Onemogućen Cloud TTS API ili zabranjen pristup)', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({
          error: {
            code: 403,
            message: 'Cloud Text-to-Speech API has not been used in project or it is disabled.',
            status: 'PERMISSION_DENIED',
          },
        }),
      });

      await expect(googleTtsService.synthesize('Test poruka', validConfig)).rejects.toThrow(
        /Google Cloud TTS greška \(403\).*Cloud Text-to-Speech API has not been used/
      );
    });

    it('prepoznaje 403 insufficient authentication scopes i pruža savjet za GCP API ključ', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({
          error: {
            code: 403,
            message: 'Request had insufficient authentication scopes.',
            status: 'PERMISSION_DENIED',
          },
        }),
      });

      await expect(googleTtsService.synthesize('Test poruka', validConfig)).rejects.toThrow(
        /insufficient authentication scopes.*Prijavljeni Google račun ima OAuth dozvole samo za Google Drive/
      );
    });

    it('baca grešku pri HTTP 400 (Nevaljan API ključ)', async () => {
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

      await expect(googleTtsService.synthesize('Test poruka', validConfig)).rejects.toThrow(
        /Google Cloud TTS greška \(400\).*API key not valid/
      );
    });

    it('baca grešku ako odgovor ne sadrži audioContent', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          // Nedostaje audioContent
        }),
      });

      await expect(googleTtsService.synthesize('Test poruka', validConfig)).rejects.toThrow(
        /audioContent/
      );
    });

    it('baca grešku ako je ulazni tekst prazan', async () => {
      await expect(googleTtsService.synthesize('   ', validConfig)).rejects.toThrow(
        /Nema teksta za sintezu/
      );
    });
  });

  describe('6. Testiranje i debugiranje veze (testConnection)', () => {
    const validConfig: GoogleTtsConfig = {
      ...DEFAULT_GOOGLE_TTS_CONFIG,
      apiKey: 'AIzaSyMockKeyForTesting1234567890123456',
    };

    it('vraća success: true i mjeri latenciju u milisekundama pri uspješnoj sintezi', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          audioContent: btoa('test audio data'),
        }),
      });

      const result: TestTtsConnectionResult = await googleTtsService.testConnection(validConfig);
      expect(result.success).toBe(true);
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      expect(result.message).toContain('uspješno uspostavljena');
      expect(result.message).toContain('hr-HR-Wavenet-B');
      expect(result.audioUrl).toBeDefined();
    });

    it('vraća success: false i točnu poruku greške pri padu mrežnog poziva', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Neuspješno spajanje (CORS error)'));

      const result: TestTtsConnectionResult = await googleTtsService.testConnection(validConfig);
      expect(result.success).toBe(false);
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      expect(result.message).toContain('Neuspješno spajanje (CORS error)');
      expect(result.audioUrl).toBeUndefined();
    });
  });

  describe('7. Dohvaćanje popisa glasova (fetchVoices)', () => {
    it('uspješno dohvaća i filtrira glasove po zadanom jeziku (hr-HR)', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          voices: [
            {
              name: 'hr-HR-Wavenet-A',
              ssmlGender: 'FEMALE',
              languageCodes: ['hr-HR'],
              naturalSampleRateHertz: 24000,
            },
            {
              name: 'hr-HR-Wavenet-B',
              ssmlGender: 'MALE',
              languageCodes: ['hr-HR'],
              naturalSampleRateHertz: 24000,
            },
            {
              name: 'en-US-Wavenet-D',
              ssmlGender: 'MALE',
              languageCodes: ['en-US'],
              naturalSampleRateHertz: 24000,
            },
          ],
        }),
      });

      const voices = await googleTtsService.fetchVoices('AIzaSyKey12345678901234567890', 'hr-HR');
      expect(voices.length).toBe(2);
      expect(voices.map((v) => v.name)).toEqual(['hr-HR-Wavenet-A', 'hr-HR-Wavenet-B']);
    });

    it('baca grešku ako nema API ključa za dohvaćanje glasova', async () => {
      googleTtsService.saveConfig({
        ...DEFAULT_GOOGLE_TTS_CONFIG,
        useSttApiKey: false,
        apiKey: '',
      });

      await expect(googleTtsService.fetchVoices()).rejects.toThrow(/potreban je API ključ/);
    });
  });
});
