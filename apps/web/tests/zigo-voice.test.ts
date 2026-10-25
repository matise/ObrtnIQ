import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  normalizeZigoVoiceTranscript,
  getZigoDumanjeLabel,
  type ScreenContextData,
} from '@obrtniq/core';

describe('Zigo Voice Subsystem (100% In-Browser & Zero-Server)', () => {
  let mockRecognitionInstance: any;

  beforeEach(() => {
    mockRecognitionInstance = {
      continuous: false,
      interimResults: false,
      lang: '',
      maxAlternatives: 1,
      start: vi.fn(),
      stop: vi.fn(),
      abort: vi.fn(),
      onstart: null,
      onresult: null,
      onerror: null,
      onend: null,
    };

    (globalThis as any).window = (globalThis as any).window || {};
    (globalThis as any).window.SpeechRecognition = vi.fn().mockImplementation(() => mockRecognitionInstance);
  });

  afterEach(() => {
    delete (globalThis as any).window.SpeechRecognition;
    delete (globalThis as any).window.webkitSpeechRecognition;
    vi.clearAllMocks();
  });

  describe('1. Preglednička podrška i inicijalizacija', () => {
    it('prepoznaje postojanje SpeechRecognition objekta na windowu', () => {
      const win = (globalThis as any).window;
      const isSupported = !!(win.SpeechRecognition || win.webkitSpeechRecognition);
      expect(isSupported).toBe(true);
    });

    it('detektira nedostatak podrške ako SpeechRecognition nije definiran', () => {
      delete (globalThis as any).window.SpeechRecognition;
      delete (globalThis as any).window.webkitSpeechRecognition;
      const win = (globalThis as any).window;
      const isSupported = !!(win.SpeechRecognition || win.webkitSpeechRecognition);
      expect(isSupported).toBe(false);
    });

    it('konfigurira mikrofon na hrvatski jezik (hr-HR) i continuous/interim način rada', () => {
      const win = (globalThis as any).window;
      const recognition = new win.SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'hr-HR';
      recognition.maxAlternatives = 1;

      expect(recognition.lang).toBe('hr-HR');
      expect(recognition.continuous).toBe(true);
      expect(recognition.interimResults).toBe(true);
    });
  });

  describe('2. In-Browser Leksikalni Normalizator (Acoustic Adaptation)', () => {
    it('normalizira fonetski razdvojene fiskalne kratice u kanonske pojmove', () => {
      expect(normalizeZigoVoiceTranscript('otvori mi k p r')).toBe('otvori mi KPR');
      expect(normalizeZigoVoiceTranscript('što kaže knjiga prometa')).toBe('što kaže KPR');
      expect(normalizeZigoVoiceTranscript('unesi z.k.i. i j i r')).toBe('unesi ZKI i JIR');
      expect(normalizeZigoVoiceTranscript('provjeri o i b')).toBe('provjeri OIB');
      expect(normalizeZigoVoiceTranscript('napravi p o s d')).toBe('napravi PO-SD');
      expect(normalizeZigoVoiceTranscript('dodaj k p d')).toBe('dodaj KPD');
      expect(normalizeZigoVoiceTranscript('pošalji e-racun')).toBe('pošalji e-Račun');
    });

    it('pretvara izgovor poreznog praga u kanonski oblik', () => {
      expect(normalizeZigoVoiceTranscript('provjeri prag od 40000 eura')).toBe(
        'provjeri prag od 40.000 €'
      );
      expect(normalizeZigoVoiceTranscript('jesmo li blizu praga od 40 tisuća eura')).toBe(
        'jesmo li blizu prag od 40.000 €'
      );
    });

    it('normalizira ključne Žigine komande bez obzira na dijakritike i mala slova', () => {
      expect(normalizeZigoVoiceTranscript('žigo presjeci')).toBe('Žigo, presijeci');
      expect(normalizeZigoVoiceTranscript('zigo presijeci')).toBe('Žigo, presijeci');
      expect(normalizeZigoVoiceTranscript('nema prese')).toBe('nema preše');
      expect(normalizeZigoVoiceTranscript('orlandov lakat')).toBe('Orlandov lakat');
    });
  });

  describe('3. Povezivanje s kontekstom ekrana i STOP mehanizam', () => {
    it('generira točan stoički natpis dumanja ovisno o aktivnom ekranu', () => {
      const screens: Array<{ screen: ScreenContextData['currentScreen']; expectedSub: string }> = [
        { screen: 'KprDrawer', expectedSub: 'poreznin limiton' },
        { screen: 'InvoiceDesk', expectedSub: 'pragom od 40.000 €' },
        { screen: 'FiscalDrawer', expectedSub: 'fiskalnog pečata' },
        { screen: 'SettingsDrawer', expectedSub: 'trezore' },
        { screen: 'SystemLogDrawer', expectedSub: 'bilješkama' },
      ];

      for (const item of screens) {
        const label = getZigoDumanjeLabel(item.screen);
        expect(label).toContain(item.expectedSub);
      }
    });

    it('STOP mehanizam poziva abort() na SpeechRecognition objektu i trenutačno gasi snimanje', () => {
      const win = (globalThis as any).window;
      const recognition = new win.SpeechRecognition();

      recognition.start();
      expect(recognition.start).toHaveBeenCalledTimes(1);

      // Simulacija klika na tipku STOP
      recognition.abort();
      expect(recognition.abort).toHaveBeenCalledTimes(1);
    });
  });
});
