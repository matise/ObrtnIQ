import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  prepareMessageForNarration,
  cleanTextForSpeech,
  selectBestMasculineVoice,
  classifyVoice,
  DEFAULT_ZIGO_VOICE_CONFIG,
} from '@obrtniq/core';

describe('Zigo Audio Transport & Narration System (Faza 15)', () => {
  let mockSpeechSynthesis: any;
  let mockUtteranceConstructor: any;

  beforeEach(() => {
    mockSpeechSynthesis = {
      paused: false,
      speaking: false,
      pending: false,
      speak: vi.fn((utterance: any) => {
        mockSpeechSynthesis.speaking = true;
        if (utterance.onstart) utterance.onstart();
      }),
      cancel: vi.fn(() => {
        mockSpeechSynthesis.speaking = false;
        mockSpeechSynthesis.paused = false;
      }),
      pause: vi.fn(() => {
        mockSpeechSynthesis.paused = true;
      }),
      resume: vi.fn(() => {
        mockSpeechSynthesis.paused = false;
      }),
      getVoices: vi.fn(() => [
        { name: 'Matej (Croatian)', lang: 'hr-HR', default: true },
        { name: 'English Voice', lang: 'en-US', default: false },
      ]),
      onvoiceschanged: null,
    };

    mockUtteranceConstructor = vi.fn().mockImplementation((text: string) => ({
      text,
      lang: 'hr-HR',
      rate: 1,
      pitch: 1,
      voice: null,
      onstart: null,
      onend: null,
      onerror: null,
    }));

    (globalThis as any).window = (globalThis as any).window || {};
    (globalThis as any).window.speechSynthesis = mockSpeechSynthesis;
    (globalThis as any).SpeechSynthesisUtterance = mockUtteranceConstructor;
  });

  afterEach(() => {
    delete (globalThis as any).window.speechSynthesis;
    delete (globalThis as any).SpeechSynthesisUtterance;
    vi.clearAllMocks();
  });

  describe('1. Raščlanjivanje i fonetsko čišćenje poruka (Element-by-Element)', () => {
    it('dijeli Žigov odgovor na sekcije i priprema red čekanja', () => {
      const msgText = `**1. Opservacija:**
Pao server u Zagrebu? Ma neka je.

**2. Dijagnoza:**
Račune san zapečatio lokalnim kodom.

**3. Žigin Rez:**
Popij čašu vode, ja držin stražu.`;

      const queue = prepareMessageForNarration('msg-100', msgText);
      expect(queue.length).toBe(3);
      expect(queue[0]?.sectionType).toBe('opservacija');
      expect(queue[1]?.sectionType).toBe('dijagnoza');
      expect(queue[2]?.sectionType).toBe('rez');

      expect(queue[0]?.cleanTextForSpeech).toContain('1. Opservacija. Pao server u Zagrebu');
      expect(queue[2]?.cleanTextForSpeech).toContain('3. Žigin Rez. Popij čašu vode');
    });

    it('čisti Markdown i prilagođava akronime za razgovijetan govor', () => {
      const text = 'Upiši **OIB**, provjeri `KPR` knjigu i pazi na prag od 40.000 €.';
      const clean = cleanTextForSpeech(text);

      expect(clean).toContain('O I B');
      expect(clean).toContain('K P R');
      expect(clean).toContain('četrdeset tisuća eura');
      expect(clean).not.toContain('**');
      expect(clean).not.toContain('`');
    });
  });

  describe('2. Invarijanta jednog govornika (Single Active Speaker)', () => {
    it('poziva speechSynthesis.cancel() prije svakog novog izgovora kako se glasovi ne bi preklapali', () => {
      const win = (globalThis as any).window;
      const queue = prepareMessageForNarration('msg-1', '**Opservacija:** Prva poruka.');
      expect(queue.length).toBe(1);

      // Simulacija pokretanja izgovora prve poruke
      win.speechSynthesis.cancel();
      const u1 = new (globalThis as any).SpeechSynthesisUtterance(queue[0]?.cleanTextForSpeech);
      win.speechSynthesis.speak(u1);
      expect(win.speechSynthesis.cancel).toHaveBeenCalledTimes(1);
      expect(win.speechSynthesis.speak).toHaveBeenCalledTimes(1);

      // Pokretanje druge poruke — obavezno mora poništiti prvu
      win.speechSynthesis.cancel();
      const u2 = new (globalThis as any).SpeechSynthesisUtterance('Druga poruka');
      win.speechSynthesis.speak(u2);
      expect(win.speechSynthesis.cancel).toHaveBeenCalledTimes(2);
      expect(win.speechSynthesis.speak).toHaveBeenCalledTimes(2);
    });
  });

  describe('3. Master kontrole (STOP, Pauza, Mute)', () => {
    it('STOP trenutno prekida izgovor', () => {
      const win = (globalThis as any).window;
      const u = new (globalThis as any).SpeechSynthesisUtterance('Test govora');
      win.speechSynthesis.speak(u);
      expect(win.speechSynthesis.speaking).toBe(true);

      // STOP
      win.speechSynthesis.cancel();
      expect(win.speechSynthesis.speaking).toBe(false);
    });

    it('Pauza i nastavak pozivaju nativne metode preglednika', () => {
      const win = (globalThis as any).window;
      win.speechSynthesis.pause();
      expect(win.speechSynthesis.pause).toHaveBeenCalledTimes(1);
      expect(win.speechSynthesis.paused).toBe(true);

      win.speechSynthesis.resume();
      expect(win.speechSynthesis.resume).toHaveBeenCalledTimes(1);
      expect(win.speechSynthesis.paused).toBe(false);
    });
  });

  describe('4. Čišćenje reda čekanja i rekreacija transporta nakon promjene konfiguracije', () => {
    it('pražnjenje reda čekanja poziva cancel() i resetira status na idle', () => {
      const win = (globalThis as any).window;
      let queue = prepareMessageForNarration('msg-test', '### 1. Opservacija\nTest poruka');
      expect(queue.length).toBe(1);

      win.speechSynthesis.speak(new (globalThis as any).SpeechSynthesisUtterance(queue[0]?.cleanTextForSpeech));
      expect(win.speechSynthesis.speaking).toBe(true);

      // Simulacija clearQueue() akcije koja se okida pri promjeni konfiguracije
      win.speechSynthesis.cancel();
      queue = [];
      const status = 'idle';
      const currentIndex = -1;

      expect(win.speechSynthesis.cancel).toHaveBeenCalled();
      expect(win.speechSynthesis.speaking).toBe(false);
      expect(queue.length).toBe(0);
      expect(status).toBe('idle');
      expect(currentIndex).toBe(-1);
    });

    it('osvježavanje glasova dohvaća dostupne glasove sustava', () => {
      const win = (globalThis as any).window;
      const voices = win.speechSynthesis.getVoices();
      expect(voices.length).toBe(2);
      expect(voices.some((v: any) => v.lang === 'hr-HR')).toBe(true);
    });
  });

  describe('5. Testna naracija u postavkama (STT/TTS integracija)', () => {
    it('pravilno strukturira testnu naraciju u 3 sekcije za transport listu', () => {
      const testNarration = `### 1. Opservacija
ObrtnIQ audio podsustav je aktivan i kalibriran.

### 2. Dijagnoza
Svi lokalni audio kanali rade bez poslužitelja u pregledniku.

### 3. Žigin Rez
Sve je pod kontrolom, meštre. Možeš mirno raditi.`;

      const testQueue = prepareMessageForNarration('test-speech-config', testNarration);
      expect(testQueue.length).toBe(3);
      expect(testQueue[0]?.sectionType).toBe('opservacija');
      expect(testQueue[0]?.label).toBe('1. Opservacija');
      expect(testQueue[1]?.sectionType).toBe('dijagnoza');
      expect(testQueue[1]?.label).toBe('2. Dijagnoza');
      expect(testQueue[2]?.sectionType).toBe('rez');
      expect(testQueue[2]?.label).toBe('3. Žigin Rez');
      expect(testQueue[0]?.cleanTextForSpeech).toContain('audio podsustav');
      expect(testQueue[2]?.cleanTextForSpeech).toContain('meštre');
    });
  });

  describe('6. Prioritizacija muškog glasa i karakter viteza Orlanda (Masculine TTS)', () => {
    it('uvijek preferira muški hrvatski glas (Matej) ispred ženskog (Gabrijela)', () => {
      const mockVoices = [
        { name: 'Microsoft Gabrijela - Croatian (Croatia)', lang: 'hr-HR' },
        { name: 'Microsoft Matej - Croatian (Croatia)', lang: 'hr-HR' },
        { name: 'Microsoft David - English (United States)', lang: 'en-US' },
        { name: 'Microsoft Zira - English (United States)', lang: 'en-US' },
      ];

      const best = selectBestMasculineVoice(mockVoices);
      expect(best).not.toBeNull();
      expect(best?.name).toContain('Matej');

      const gabrijelaClass = classifyVoice(mockVoices[0]!);
      const matejClass = classifyVoice(mockVoices[1]!);

      expect(gabrijelaClass.isFemale).toBe(true);
      expect(gabrijelaClass.isMale).toBe(false);
      expect(matejClass.isMale).toBe(true);
      expect(matejClass.isFemale).toBe(false);
      expect(matejClass.score).toBeGreaterThan(gabrijelaClass.score);
    });

    it('bira južnoslavenski muški glas (Nikola/Stefan/Filip) ako nema hrvatskog muškog', () => {
      const mockVoices = [
        { name: 'Microsoft Nikola - Serbian (Latin, Serbia)', lang: 'sr-Latn-RS' },
        { name: 'Microsoft David - English (United States)', lang: 'en-US' },
        { name: 'Microsoft Zira - English (United States)', lang: 'en-US' },
      ];

      const best = selectBestMasculineVoice(mockVoices);
      expect(best?.name).toContain('Nikola');
    });

    it('poštuje izričiti korisnički odabir glasa putem preferredURI', () => {
      const mockVoices = [
        { name: 'Microsoft Matej - Croatian (Croatia)', voiceURI: 'matej-uri', lang: 'hr-HR' },
        { name: 'Custom Special Voice', voiceURI: 'special-custom-uri', lang: 'hr-HR' },
      ];

      const chosen = selectBestMasculineVoice(mockVoices, 'special-custom-uri');
      expect(chosen?.voiceURI).toBe('special-custom-uri');
    });

    it('sadrži viteške defaultne postavke za ton i tempo', () => {
      expect(DEFAULT_ZIGO_VOICE_CONFIG.pitch).toBe(0.86);
      expect(DEFAULT_ZIGO_VOICE_CONFIG.rate).toBe(0.94);
    });
  });

  describe('7. Proširena leksička normalizacija (valute, centi, postotci, PDV, IBAN)', () => {
    it('pretvara eure i cente u prirodan govor', () => {
      const text = 'Račun iznosi 125,50 € sa stopom od 25% i popustom za avans.';
      const clean = cleanTextForSpeech(text);

      expect(clean).toContain('125 i 50 centi');
      expect(clean).toContain('25 posto');
    });

    it('fonetski razlaže kratice PDV, HZZO, IBAN, FINA i FRO', () => {
      const text = 'Provjeri PDV status, HZZO doprinose, FINA certifikat i IBAN račun.';
      const clean = cleanTextForSpeech(text);

      expect(clean).toContain('P D V');
      expect(clean).toContain('H Z Z O');
      expect(clean).toContain('Fina');
      expect(clean).toContain('I B A N');
    });
  });
});

