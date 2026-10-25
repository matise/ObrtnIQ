import {
  type ZigoSttConfig,
  DEFAULT_ZIGO_STT_CONFIG,
  validateGcpSttConfig,
  parseServiceAccountJson,
} from '@obrtniq/core';
import { appLogger } from './logger';
import { getAppClientApiKey } from './app-client-credentials';

export interface TestSttConnectionResult {
  success: boolean;
  latencyMs: number;
  message: string;
  recognizersCount?: number;
}

export class GoogleSttService {
  private readonly storageKey = 'obrtniq_stt_config';
  private logger = appLogger.scope('SERVICE:GOOGLE_STT');

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
   * Dohvaća spremljene postavke za STT modul iz lokalne pohrane preglednika.
   */
  public getConfig(): ZigoSttConfig {
    const storage = this.getStorage();
    if (!storage) {
      return { ...DEFAULT_ZIGO_STT_CONFIG };
    }

    try {
      const raw = storage.getItem(this.storageKey);
      if (!raw) {
        return { ...DEFAULT_ZIGO_STT_CONFIG };
      }
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_ZIGO_STT_CONFIG,
        ...parsed,
      };
    } catch (err) {
      this.logger.warn('Greška pri čitanju STT konfiguracije iz localStorage-a, vraćam zadano:', err);
      return { ...DEFAULT_ZIGO_STT_CONFIG };
    }
  }

  /**
   * Sprema STT konfiguraciju lokalno u preglednik (Zero-Server / BYOK).
   */
  public saveConfig(config: ZigoSttConfig): void {
    const storage = this.getStorage();
    if (!storage) return;

    try {
      storage.setItem(this.storageKey, JSON.stringify(config));
      this.logger.info('STT konfiguracija uspješno spremljena u localStorage', {
        engine: config.engine,
        hasApiKey: !!config.gcpApiKey,
        projectId: config.gcpProjectId,
        location: config.gcpLocation,
        model: config.gcpModel,
      });
    } catch (err) {
      this.logger.error('Neuspjelo spremanje STT konfiguracije u localStorage:', err);
      throw err;
    }
  }

  /**
   * Vraća efektivan API ključ za STT modul (prioritet: ručni unos > Web Client ključ aplikacije).
   */
  public getEffectiveApiKey(customConfig?: Partial<ZigoSttConfig>): string {
    const cfg = customConfig || this.getConfig();
    if (cfg.gcpApiKey && cfg.gcpApiKey.trim()) {
      return cfg.gcpApiKey.trim();
    }
    const appClientKey = getAppClientApiKey();
    if (appClientKey && appClientKey.startsWith('AIza')) {
      return appClientKey;
    }
    return '';
  }

  /**
   * Testira ispravnost GCP API ključa, Project ID-ja i lokacije pozivom prema STT V2 REST endpointu.
   */
  public async testConnection(config: ZigoSttConfig): Promise<TestSttConnectionResult> {
    const t0 = performance.now();

    // 1. Statička provjera
    const validation = validateGcpSttConfig(config);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0] || 'Nevaljana konfiguracija.';
      this.logger.warn('Test veze prekinut zbog statičke nevaljanosti:', validation.errors);
      return {
        success: false,
        latencyMs: 0,
        message: firstError,
      };
    }

    // Ako je odabran Service Account način rada
    if (config.authMode === 'service_account') {
      const saParsed = parseServiceAccountJson(config.gcpServiceAccountJson || '');
      if (!saParsed.isValid) {
        return {
          success: false,
          latencyMs: 0,
          message: saParsed.error || 'Nevaljan Service Account JSON.',
        };
      }

      // Ako korisnik nema dodatni API key za REST testiranje, validiramo Service Account
      if (!config.gcpApiKey?.trim()) {
        const latencyMs = Math.round(performance.now() - t0);
        this.logger.info('Service Account JSON uspješno validiran', {
          projectId: saParsed.projectId,
          clientEmail: saParsed.clientEmail,
          location: config.gcpLocation,
        });

        return {
          success: true,
          latencyMs,
          message: `Uspješno validiran Service Account (${saParsed.clientEmail}) za projekt '${saParsed.projectId}' na lokaciji '${config.gcpLocation}' s modelom '${config.gcpModel}'.`,
        };
      }
    }

    const { gcpApiKey, gcpProjectId, gcpLocation } = config;
    const url = `https://speech.googleapis.com/v2/projects/${encodeURIComponent(
      gcpProjectId
    )}/locations/${encodeURIComponent(gcpLocation)}/recognizers?key=${encodeURIComponent(gcpApiKey)}`;

    this.logger.info('Testiranje povezivanja s Google Cloud STT V2 API-jem', {
      projectId: gcpProjectId,
      location: gcpLocation,
    });

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      const latencyMs = Math.round(performance.now() - t0);

      if (response.ok) {
        let recognizersCount = 0;
        try {
          const data = await response.json();
          recognizersCount = Array.isArray(data?.recognizers) ? data.recognizers.length : 0;
        } catch {
          // Tihi fallback ako odgovor nema JSON tijelo
        }

        this.logger.info('Test povezivanja sa Google Cloud STT V2 uspješan', {
          latencyMs,
          recognizersCount,
        });

        return {
          success: true,
          latencyMs,
          message: `Uspješno povezano sa Google Cloud Speech-to-Text V2 (${latencyMs} ms). API je aktivan!`,
          recognizersCount,
        };
      }

      // Obrada specifičnih HTTP grešaka
      let errorDetail = '';
      try {
        const errJson = await response.json();
        errorDetail = errJson?.error?.message || '';
      } catch {
        // Zanemari ako nema json
      }

      this.logger.warn('GCP STT V2 vratio grešku:', {
        status: response.status,
        statusText: response.statusText,
        errorDetail,
      });

      if (response.status === 400) {
        return {
          success: false,
          latencyMs,
          message: errorDetail.includes('API key not valid')
            ? 'Google Cloud API ključ nije valjan (API_KEY_INVALID).'
            : `Neispravan zahtjev (400 Bad Request): ${errorDetail || 'Provjerite unesene parametre.'}`,
        };
      }

      if (response.status === 403) {
        const lower = errorDetail.toLowerCase();
        if (
          lower.includes('disabled') ||
          lower.includes('not been used') ||
          (lower.includes('service') && lower.includes('speech'))
        ) {
          return {
            success: false,
            latencyMs,
            message: 'Cloud Speech-to-Text API nije omogućen na vašem GCP projektu. Omogućite ga u Google Cloud konzoli.',
          };
        }
        return {
          success: false,
          latencyMs,
          message: `Pristup odbijen (403 Forbidden): ${errorDetail || 'API ključ nema dopuštenje za Speech API ili ima IP/HTTP restrikcije.'}`,
        };
      }

      if (response.status === 404) {
        return {
          success: false,
          latencyMs,
          message: `GCP projekt '${gcpProjectId}' ili lokacija '${gcpLocation}' nisu pronađeni (404 Not Found).`,
        };
      }

      return {
        success: false,
        latencyMs,
        message: `Google Cloud STT greška (${response.status} ${response.statusText}): ${errorDetail || 'Provjera nije uspjela.'}`,
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - t0);
      this.logger.error('Mrežna greška pri testiranju GCP STT veze:', err);
      return {
        success: false,
        latencyMs,
        message: `Mrežna greška pri provjeri (${err?.message || 'Neuspjelo povezivanje'}). Provjerite internetsku vezu i CORS postavke.`,
      };
    }
  }
}

export const googleSttService = new GoogleSttService();
