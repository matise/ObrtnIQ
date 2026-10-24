import { describe, it, expect, beforeEach } from 'vitest';
import { geminiService } from '../src/services/gemini-service';
import { googleAuthService } from '../src/services/google-auth-service';

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

describe('Faza 10: Gemini AI & Zero-Server Cloud Integration', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  describe('V10-4: Inteligentna RH Heuristika za KPD 2025 (100% Offline)', () => {
    it('ispravno klasificira razvoj softvera i web stranica', async () => {
      const rec = await geminiService.recommendKpd('izrada responzivne web aplikacije u reactu i node.js api');
      expect(rec.kpdSifra).toBe('62.01.11');
      expect(rec.kpdNaziv).toContain('softvera');
      expect(rec.preporucenaJedinica).toBe('sat');
      expect(rec.preporucenaCijena).toBe(60);
      expect(rec.jeAiGenerirano).toBe(false);
      expect(rec.objasnjenje).toContain('KPD 2025');
    });

    it('ispravno klasificira grafički dizajn i brending', async () => {
      const rec = await geminiService.recommendKpd('dizajn logotipa, knjige grafičkih standarda i letaka');
      expect(rec.kpdSifra).toBe('74.10.11');
      expect(rec.kpdNaziv).toContain('dizajna');
      expect(rec.preporucenaJedinica).toBe('sat');
      expect(rec.preporucenaCijena).toBe(45);
      expect(rec.jeAiGenerirano).toBe(false);
    });

    it('ispravno klasificira poslovno savjetovanje i menadžment', async () => {
      const rec = await geminiService.recommendKpd('poslovno savjetovanje i strateško planiranje za poduzeće');
      expect(rec.kpdSifra).toBe('70.22.11');
      expect(rec.kpdNaziv).toContain('poslovanjem i upravljanjem');
      expect(rec.preporucenaJedinica).toBe('sat');
      expect(rec.preporucenaCijena).toBe(75);
      expect(rec.jeAiGenerirano).toBe(false);
    });

    it('ispravno klasificira prevođenje i jezične usluge', async () => {
      const rec = await geminiService.recommendKpd('stručni prijevod tehničke dokumentacije s engleskog');
      expect(rec.kpdSifra).toBe('74.30.11');
      expect(rec.kpdNaziv).toContain('prevođenja');
      expect(rec.preporucenaJedinica).toBe('kartica');
      expect(rec.preporucenaCijena).toBe(15);
      expect(rec.jeAiGenerirano).toBe(false);
    });

    it('ispravno klasificira održavanje računala i mreža', async () => {
      const rec = await geminiService.recommendKpd('održavanje servera i tehnička podrška računalnih mreža');
      expect(rec.kpdSifra).toBe('62.02.20');
      expect(rec.kpdNaziv).toContain('tehničke podrške');
      expect(rec.preporucenaJedinica).toBe('sat');
      expect(rec.preporucenaCijena).toBe(50);
      expect(rec.jeAiGenerirano).toBe(false);
    });

    it('vraća siguran opći fallback za nepoznate opise', async () => {
      const rec = await geminiService.recommendKpd('neki sasvim neuobičajeni pojam xyz123');
      expect(rec.kpdSifra).toBe('62.01.11');
      expect(rec.preporucenaJedinica).toBe('sat');
      expect(rec.jeAiGenerirano).toBe(false);
    });
  });

  describe('V10-5: Google Identity Demo i Invarijante', () => {
    it('generira deterministički demo identitet za offline rad i testiranje', () => {
      const demoUser = googleAuthService.loginDemoUser();
      expect(demoUser).toBeDefined();
      expect(demoUser.googleSub).toBe('108392174981273981273');
      expect(demoUser.email).toBe('obrtnik.demo@gmail.com');
      expect(demoUser.name).toBe('Matija Obrtnik (Google Demo)');

      const stored = googleAuthService.getStoredIdentity();
      expect(stored).toEqual(demoUser);

      googleAuthService.clearSession();
      expect(googleAuthService.getStoredIdentity()).toBeNull();
    });
  });

  describe('V10-6: Pohrana API Ključa i Modela', () => {
    it('ispravno sprema i čita korisnički Gemini API ključ', () => {
      expect(geminiService.getStoredApiKey()).toBe('');
      geminiService.setStoredApiKey('AIzaSyTestApiKey123456');
      expect(geminiService.getStoredApiKey()).toBe('AIzaSyTestApiKey123456');

      geminiService.setStoredApiKey('');
      expect(geminiService.getStoredApiKey()).toBe('');
    });

    it('upravlja odabranim Gemini modelom uz fallback na default', () => {
      expect(geminiService.getStoredModel()).toBe('gemini-3.8-flash');
      geminiService.setStoredModel('gemini-1.5-pro');
      expect(geminiService.getStoredModel()).toBe('gemini-1.5-pro');

      geminiService.setStoredModel('');
      expect(geminiService.getStoredModel()).toBe('gemini-3.8-flash');
    });

    it('automatski migrira zastarjeli model gemini-2.0-flash na gemini-3.8-flash', () => {
      localStorage.setItem('obrtniq_gemini_model', 'gemini-2.0-flash');
      expect(geminiService.getStoredModel()).toBe('gemini-3.8-flash');
    });
  });
});
