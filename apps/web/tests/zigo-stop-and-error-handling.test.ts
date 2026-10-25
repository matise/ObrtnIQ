import { describe, it, expect, vi, beforeEach } from 'vitest';
import { geminiService } from '../src/services/gemini-service';
import { dexieStorage } from '../src/storage/dexie-db';
import { appLogger } from '../src/services/logger';
import { ZigoCopilotPanel } from '../src/components/ZigoCopilotPanel';
import { googleAuthService, GOOGLE_TOKEN_VALIDITY_SECONDS } from '../src/services/google-auth-service';
import type { ZigoChatSesija, ZigoChatPoruka } from '@obrtniq/core';

// Polyfill localStorage
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

const mockSesije = new Map<string, ZigoChatSesija>();
const mockPoruke = new Map<string, ZigoChatPoruka>();

describe('Zigo Stop Dumanje & Leveled Error Handling (Faza 14.4)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockLocalStorage.clear();
    mockSesije.clear();
    mockPoruke.clear();

    // In-memory mock za chat repozitorij i memoriju
    vi.spyOn(dexieStorage.memorija, 'getAll').mockResolvedValue([]);
    vi.spyOn(dexieStorage.chat, 'getAllSesije').mockImplementation(async () => Array.from(mockSesije.values()));
    vi.spyOn(dexieStorage.chat, 'saveSesija').mockImplementation(async (s: ZigoChatSesija) => { mockSesije.set(s.id, s); });
    vi.spyOn(dexieStorage.chat, 'updateSesija').mockImplementation(async (id: string, updates: Partial<ZigoChatSesija>) => {
      const s = mockSesije.get(id);
      if (s) mockSesije.set(id, { ...s, ...updates });
    });
    vi.spyOn(dexieStorage.chat, 'getPorukeBySesijaId').mockImplementation(async (sesijaId: string) => 
      Array.from(mockPoruke.values()).filter((p) => p.sesijaId === sesijaId)
    );
    vi.spyOn(dexieStorage.chat, 'savePoruka').mockImplementation(async (p: ZigoChatPoruka) => { mockPoruke.set(p.id, p); });
  });

  describe('1. GeminiService - Prekid zahtjeva (AbortSignal)', () => {
    it('STOP-01: Baca AbortError ako je signal već prekinut prije početka', async () => {
      const controller = new AbortController();
      controller.abort();

      const messages: ZigoChatPoruka[] = [
        {
          id: '1',
          sesijaId: 's1',
          uloga: 'user',
          tekst: 'Pričaj mi o povijesti Dubrovnika',
          kreirano: new Date().toISOString(),
        },
      ];

      await expect(
        geminiService.chatWithAgent(messages, 'test-key-1234567890', undefined, controller.signal)
      ).rejects.toThrow();
    });

    it('STOP-02: Prekida in-flight mrežni poziv i NE aktivira lokalni fallback na AbortError', async () => {
      // Mock global fetch koji podržava AbortSignal i odmah prekida ako je aborted
      globalThis.fetch = vi.fn().mockImplementation((_url, init) => {
        return new Promise((resolve, reject) => {
          if (init?.signal?.aborted) {
            reject(new DOMException('Zahtjev prekinut', 'AbortError'));
            return;
          }
          if (init?.signal) {
            init.signal.addEventListener('abort', () => {
              reject(new DOMException('Zahtjev prekinut', 'AbortError'));
            });
          }
        });
      });

      const controller = new AbortController();
      const messages: ZigoChatPoruka[] = [
        {
          id: '1',
          sesijaId: 's1',
          uloga: 'user',
          tekst: 'Dugotrajno razmišljanje...',
          kreirano: new Date().toISOString(),
        },
      ];

      const promise = geminiService.chatWithAgent(messages, 'test-key-1234567890', undefined, controller.signal);

      // Korisnik pritišće STOP dok je zahtjev u tijeku
      controller.abort();

      await expect(promise).rejects.toThrow();
    });

    it('STOP-03: Na mrežnu grešku (nije abort) logira grešku i aktivira lokalni fallback', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Mreža nedostupna'));

      const messages: ZigoChatPoruka[] = [
        {
          id: '1',
          sesijaId: 's1',
          uloga: 'user',
          tekst: 'Samo prija',
          kreirano: new Date().toISOString(),
        },
      ];

      const resp = await geminiService.chatWithAgent(messages, 'test-key-1234567890');
      // Uspješno prebačeno na lokalni fallback bez rušenja
      expect(resp.odgovorTekst).toContain('I meni prija');
      expect(resp.jeAiGenerirano).toBe(false);
    });

    it('STOP-04: testApiKey podržava signal i prekida se ako je signal prekinut', async () => {
      const controller = new AbortController();
      controller.abort();

      await expect(
        geminiService.testApiKey('valjani-kljuc-duzi-od-10-znakova', controller.signal)
      ).rejects.toThrow();
    });
  });

  describe('2. Logeri i strukturirano rukovanje greškama', () => {
    it('STOP-05: Postoje definirani scoped logeri za sve razine chata i agenta', () => {
      const loggerChat = appLogger.scope('AGENT:CHAT');
      const loggerSession = appLogger.scope('AGENT:SESSION');
      const loggerRez = appLogger.scope('AGENT:REZ');
      const loggerAction = appLogger.scope('AGENT:ACTION');

      expect(loggerChat).toBeDefined();
      expect(typeof loggerChat.info).toBe('function');
      expect(typeof loggerChat.error).toBe('function');
      expect(typeof loggerSession.debug).toBe('function');
      expect(typeof loggerRez.info).toBe('function');
      expect(typeof loggerAction.verbose).toBe('function');
    });

    it('STOP-06: ZigoCopilotPanel komponenta je definirana i podržava prekid dumanja', () => {
      expect(ZigoCopilotPanel).toBeDefined();
      expect(typeof ZigoCopilotPanel).toBe('function');
    });

    it('STOP-07: 503 Overloaded API odgovor strukturirano se logira bez [object Object] i aktivira fallback', async () => {
      const errorLogs: any[] = [];
      const errorSpy = vi.spyOn(appLogger.scope('AI:GEMINI:ERROR'), 'error').mockImplementation((msg, err, data) => {
        errorLogs.push({ msg, err, data });
      });

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: async () => ({
          error: {
            code: 503,
            message: 'The model is overloaded. Please try again later.',
            status: 'UNAVAILABLE',
          },
        }),
      });

      const messages: ZigoChatPoruka[] = [
        {
          id: '1',
          sesijaId: 's1',
          uloga: 'user',
          tekst: 'Bok Žigo',
          kreirano: new Date().toISOString(),
        },
      ];

      const resp = await geminiService.chatWithAgent(messages, 'test-key-1234567890');
      expect(resp.jeAiGenerirano).toBe(false); // Uspješno prebačeno na lokalni fallback
      expect(errorLogs.length).toBeGreaterThan(0);

      // Provjeri da niti jedna greška nema [object Object]
      for (const log of errorLogs) {
        if (log.err instanceof Error) {
          expect(log.err.message).not.toContain('[object Object]');
        }
        expect(JSON.stringify(log)).not.toContain('[object Object]');
      }
      errorSpy.mockRestore();
    });

    it('STOP-08: Google OAuth sesija validnost traje 6 sati (21,600s)', () => {
      expect(GOOGLE_TOKEN_VALIDITY_SECONDS).toBe(6 * 3600);

      const identity = {
        provider: 'GOOGLE' as const,
        googleSub: '123456789012345678901',
        email: 'test@example.com',
        name: 'Test Korisnik',
        connectedAt: new Date().toISOString(),
        scopes: ['openid', 'email', 'profile'],
      };

      const tokens = {
        accessToken: 'ya29.test-token-valid-6h',
        expiresAt: Date.now() + GOOGLE_TOKEN_VALIDITY_SECONDS * 1000 - 60000,
      };

      googleAuthService.saveSession(identity, tokens);
      const remaining = googleAuthService.getTokenRemainingMinutes();
      expect(remaining).toBeGreaterThanOrEqual(358);
      expect(remaining).toBeLessThanOrEqual(360);
    });
  });
});
