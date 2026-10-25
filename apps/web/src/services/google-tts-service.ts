import {
  type GoogleTtsConfig,
  DEFAULT_GOOGLE_TTS_CONFIG,
  validateGoogleTtsConfig,
  cleanTextForSpeech,
} from '@obrtniq/core';
import { googleSttService } from './google-stt-service';
import { geminiService } from './gemini-service';
import { googleAuthService } from './google-auth-service';
import { getAppClientApiKey } from './app-client-credentials';
import { appLogger } from './logger';

export interface EffectiveTtsAuth {
  apiKey: string;
  accessToken?: string;
  source: 'custom' | 'app_client_key' | 'stt_shared' | 'gemini_storage' | 'oauth_token' | 'none';
  sourceLabel: string;
}

export interface TestTtsConnectionResult {
  success: boolean;
  latencyMs: number;
  message: string;
  audioUrl?: string;
}

export interface GoogleVoiceOption {
  name: string;
  ssmlGender: string;
  languageCodes: string[];
  naturalSampleRateHertz?: number;
}

export class GoogleTtsService {
  private readonly storageKey = 'obrtniq_google_tts_config';
  private logger = appLogger.scope('SERVICE:GOOGLE_TTS');

  // In-memory audio URL cache: sprječava ponovno plaćanje i trošenje GCP kvote za identičan tekst
  private audioCache = new Map<string, string>();

  private getStorage(): Storage | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage;
    }
    return null;
  }

  /**
   * Dohvaća konfiguraciju Google TTS motora iz lokalne pohrane.
   */
  public getConfig(): GoogleTtsConfig {
    const storage = this.getStorage();
    if (!storage) {
      return { ...DEFAULT_GOOGLE_TTS_CONFIG };
    }

    try {
      const raw = storage.getItem(this.storageKey);
      if (!raw) {
        return { ...DEFAULT_GOOGLE_TTS_CONFIG };
      }
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_GOOGLE_TTS_CONFIG,
        ...parsed,
      };
    } catch (err) {
      this.logger.warn('Greška pri čitanju TTS konfiguracije, vraćam zadano:', err);
      return { ...DEFAULT_GOOGLE_TTS_CONFIG };
    }
  }

  /**
   * Sprema konfiguraciju Google TTS motora lokalno u preglednik (BYOK).
   */
  public saveConfig(config: GoogleTtsConfig): void {
    const storage = this.getStorage();
    if (!storage) return;

    try {
      storage.setItem(this.storageKey, JSON.stringify(config));
      this.logger.info('Google TTS konfiguracija spremljena u localStorage', {
        engine: config.engine,
        hasCustomApiKey: !!config.apiKey,
        useSttApiKey: config.useSttApiKey,
        voiceName: config.voiceName,
        languageCode: config.languageCode,
        speakingRate: config.speakingRate,
        pitchSemitones: config.pitchSemitones,
      });
    } catch (err) {
      this.logger.error('Neuspjelo spremanje Google TTS konfiguracije:', err);
    }
  }

  /**
   * Određuje autentifikaciju za Google TTS.
   * Redoslijed prioriteta:
   * 1. Korisnički prilagođeni ključ (ako ga je korisnik izričito unio u TTS postavkama)
   * 2. Web Client API ključ aplikacije (VITE_GOOGLE_CLIENT_API_KEY / VITE_GOOGLE_API_KEY) ako je zadan
   * 3. Dijeljeni STT ključ (ako je useSttApiKey = true)
   * 4. Naslijeđeni Gemini AI ključ već spremljen u aplikaciji
   * 5. Google OAuth 2.0 Web Client sesija (Bearer token prijavljenog Google računa)
   */
  public getEffectiveAuth(customConfig?: Partial<GoogleTtsConfig>): EffectiveTtsAuth {
    const config = customConfig || this.getConfig();

    // 1. Korisnički izričiti unos u postavkama ima prednost ako je unesen
    if (config.apiKey && config.apiKey.trim()) {
      return {
        apiKey: config.apiKey.trim(),
        source: 'custom',
        sourceLabel: 'Korisnički prilagođeni API ključ (Postavke)',
      };
    }

    // 2. Web Client API ključ aplikacije ako je zadan u okruženju (VITE_GOOGLE_CLIENT_API_KEY / VITE_GOOGLE_API_KEY)
    const appClientKey = getAppClientApiKey();
    if (appClientKey && appClientKey.startsWith('AIza')) {
      return {
        apiKey: appClientKey,
        source: 'app_client_key',
        sourceLabel: 'Aplikacijski Web Client API ključ (.env / sustav)',
      };
    }

    // 3. Nasljeđivanje iz Speech-to-Text V2 modula ako je uključeno
    if (config.useSttApiKey) {
      const sttKey = googleSttService.getEffectiveApiKey();
      if (sttKey && sttKey.startsWith('AIza')) {
        return {
          apiKey: sttKey,
          source: 'stt_shared',
          sourceLabel: 'Dijeljeni ključ iz Speech-to-Text modula',
        };
      }
    }

    // 4. Provjera postojećeg Gemini AI ključa u aplikaciji
    const geminiKey = geminiService.getStoredApiKey();
    if (geminiKey && geminiKey.startsWith('AIza')) {
      return {
        apiKey: geminiKey,
        source: 'gemini_storage',
        sourceLabel: 'Naslijeđeni Google/Gemini ključ iz AI postavki',
      };
    }

    // 5. Prijavljeni Google račun (OAuth 2.0 Web Client)
    try {
      const oauthTokens = googleAuthService.getStoredTokens();
      if (oauthTokens?.accessToken && !oauthTokens.accessToken.startsWith('demo-')) {
        return {
          apiKey: '',
          accessToken: oauthTokens.accessToken,
          source: 'oauth_token',
          sourceLabel: 'Prijavljeni Google račun (OAuth Web Client)',
        };
      }
    } catch {
      // Tihi fallback
    }

    return {
      apiKey: '',
      source: 'none',
      sourceLabel: 'Nije konfiguriran',
    };
  }

  /**
   * Vraća efektivan API ključ (ili token) koji se koristi za komunikaciju.
   */
  public getEffectiveApiKey(customConfig?: Partial<GoogleTtsConfig>): string {
    const auth = this.getEffectiveAuth(customConfig);
    return auth.apiKey || auth.accessToken || '';
  }

  /**
   * Provjerava je li Google Cloud TTS operativan (ima li API ključ ili OAuth pristupni token).
   */
  public isConfigured(): boolean {
    const auth = this.getEffectiveAuth();
    return (!!auth.apiKey && auth.apiKey.startsWith('AIza')) || (!!auth.accessToken && !auth.accessToken.startsWith('demo-'));
  }

  /**
   * Sintetizira tekst u govor pozivom Google Cloud Text-to-Speech REST API-ja.
   * Vraća URL generiranog MP3 Bloba spreman za reprodukciju putem HTML5 Audio elementa.
   */
  public async synthesize(
    rawText: string,
    overrideConfig?: Partial<GoogleTtsConfig>
  ): Promise<{ audioUrl: string; durationEstimateMs: number; isCached: boolean }> {
    const config = { ...this.getConfig(), ...overrideConfig };
    const auth = this.getEffectiveAuth(config);
    const effectiveKey = auth.apiKey || auth.accessToken || '';
    const validation = validateGoogleTtsConfig(config, effectiveKey);

    if (!validation.isValid) {
      throw new Error(validation.error || 'Google TTS konfiguracija nije valjana.');
    }

    const textToSpeak = cleanTextForSpeech(rawText);

    if (!textToSpeak.trim()) {
      throw new Error('Nema teksta za sintezu.');
    }

    // Cache ključ za sprečavanje ponovnih API poziva
    const cacheKey = `${config.voiceName}_${config.speakingRate}_${config.pitchSemitones}_${textToSpeak}`;
    if (this.audioCache.has(cacheKey)) {
      this.logger.debug('Korištenje keširanog audio zapisa za TTS:', { tekstSnippet: textToSpeak.slice(0, 30) });
      return {
        audioUrl: this.audioCache.get(cacheKey)!,
        durationEstimateMs: Math.max(1000, Math.round(textToSpeak.length * 65)),
        isCached: true,
      };
    }

    let endpoint = 'https://texttospeech.googleapis.com/v1/text:synthesize';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (auth.apiKey) {
      endpoint += `?key=${encodeURIComponent(auth.apiKey)}`;
    } else if (auth.accessToken) {
      headers['Authorization'] = `Bearer ${auth.accessToken}`;
    }

    const requestBody = {
      input: {
        text: textToSpeak,
      },
      voice: {
        languageCode: config.languageCode || 'hr-HR',
        name: config.voiceName || 'hr-HR-Wavenet-B',
        ssmlGender: config.ssmlGender || 'MALE',
      },
      audioConfig: {
        audioEncoding: config.audioEncoding || 'MP3',
        speakingRate: config.speakingRate ?? 0.94,
        pitch: config.pitchSemitones ?? -2.0, // Blago dublji bariton viteza Orlanda
      },
    };

    this.logger.info('Šaljem zahtjev prema Google Cloud Text-to-Speech API:', {
      endpoint: 'v1/text:synthesize',
      languageCode: requestBody.voice.languageCode,
      voiceName: requestBody.voice.name,
      speakingRate: requestBody.audioConfig.speakingRate,
      pitchSemitones: requestBody.audioConfig.pitch,
      duljinaTeksta: textToSpeak.length,
    });

    const startTime = performance.now();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    const elapsedMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      let errorMsg = `HTTP ${response.status} (${response.statusText})`;
      try {
        const errorJson = await response.json();
        if (errorJson?.error?.message) {
          errorMsg = errorJson.error.message;
        }
      } catch {
        // Zadrži default status tekst
      }

      let userAdvice = '';
      if (errorMsg.toLowerCase().includes('insufficient authentication scopes')) {
        userAdvice = ' (Prijavljeni Google račun ima OAuth dozvole samo za Google Drive. Za rad TTS sinteze unesite GCP API ključ [AIzaSy...] u postavkama ili u .env kao VITE_GOOGLE_CLIENT_API_KEY).';
      }

      this.logger.error('Google Cloud Text-to-Speech API greška:', {
        status: response.status,
        error: errorMsg,
        advice: userAdvice,
        elapsedMs,
      });

      throw new Error(`Google Cloud TTS greška (${response.status}): ${errorMsg}${userAdvice}`);
    }

    const data = await response.json();
    if (!data.audioContent) {
      throw new Error('Google TTS API odgovor ne sadrži "audioContent".');
    }

    // Dekodiranje base64 audioContenta u Blob
    const binaryString = atob(data.audioContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: 'audio/mp3' });
    const audioUrl = URL.createObjectURL(blob);

    // Pohrana u sesijski cache
    this.audioCache.set(cacheKey, audioUrl);

    this.logger.info('Google Cloud TTS uspješno sintetizirao govor:', {
      elapsedMs,
      velicinaBajtova: bytes.length,
      voiceName: config.voiceName,
    });

    return {
      audioUrl,
      durationEstimateMs: Math.max(1000, Math.round(textToSpeak.length * 65)),
      isCached: false,
    };
  }

  /**
   * Testira vezu s Google Cloud TTS API-jem i vraća audio uzorak ako je uspješno.
   */
  public async testConnection(customConfig?: GoogleTtsConfig): Promise<TestTtsConnectionResult> {
    const config = customConfig || this.getConfig();
    const auth = this.getEffectiveAuth(config);
    const testPhrase = 'Gosparu, provjeravan Google Cloud Text-to-Speech sintezu. Zvuk viteza Orlanda je spreman.';
    const startTime = performance.now();

    try {
      const result = await this.synthesize(testPhrase, config);
      const latencyMs = Math.round(performance.now() - startTime);

      return {
        success: true,
        latencyMs,
        message: `Veza s Google Cloud Text-to-Speech API-jem je uspješno uspostavljena (${latencyMs} ms). Izvor ključa: ${auth.sourceLabel}. Glas: ${config.voiceName}`,
        audioUrl: result.audioUrl,
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        success: false,
        latencyMs,
        message: err?.message || 'Greška pri povezivanju s Google Cloud Text-to-Speech API-jem.',
      };
    }
  }

  /**
   * Dohvaća popis dostupnih glasova s Google Cloud TTS API-ja za zadani jezik.
   */
  public async fetchVoices(
    customApiKey?: string,
    languageCode: string = 'hr-HR'
  ): Promise<GoogleVoiceOption[]> {
    const auth = this.getEffectiveAuth(customApiKey ? { apiKey: customApiKey } : undefined);
    if (!auth.apiKey && !auth.accessToken) {
      throw new Error('Za dohvaćanje popisa Google glasova potreban je API ključ.');
    }

    let endpoint = 'https://texttospeech.googleapis.com/v1/voices';
    const headers: Record<string, string> = {};

    if (auth.apiKey) {
      endpoint += `?key=${encodeURIComponent(auth.apiKey)}`;
    } else if (auth.accessToken) {
      headers['Authorization'] = `Bearer ${auth.accessToken}`;
    }

    const response = await fetch(endpoint, { headers });

    if (!response.ok) {
      let errText = `HTTP ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson?.error?.message) errText = errJson.error.message;
      } catch {}
      throw new Error(`Neuspjelo dohvaćanje Google glasova (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const voices: GoogleVoiceOption[] = data.voices || [];

    if (!languageCode) return voices;

    const langLower = languageCode.toLowerCase();
    return voices.filter((v) =>
      v.languageCodes.some((code) => code.toLowerCase().startsWith(langLower) || langLower.startsWith(code.toLowerCase()))
    );
  }

  /**
   * Prazni keširane audio URL-ove.
   */
  public clearCache(): void {
    for (const url of this.audioCache.values()) {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    }
    this.audioCache.clear();
    this.logger.debug('TTS audio cache ispražnjen.');
  }
}

export const googleTtsService = new GoogleTtsService();
