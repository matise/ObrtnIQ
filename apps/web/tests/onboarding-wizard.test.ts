// apps/web/tests/onboarding-wizard.test.ts
// ObrtnIQ v3.0 — Testovi za Onboarding Wizard: "Upoznaj Žiga Gospara (Od Treme do Prvog Reza)"

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ONBOARDING_DIALOGUES,
  ONBOARDING_STEPS_META,
  ONBOARDING_EDUCATIONAL_TIPS,
  getOibReactionDialogue,
  getBankReactionDialogue,
  getCompletionCongratulation,
} from '../src/services/onboarding-dialogues';
import {
  PREDEFINED_DJELATNOSTI,
  ONBOARDING_STORAGE_KEY,
} from '../src/hooks/useOnboardingWizard';
import { validateOib, validateIban, getBankNameFromIban } from '@obrtniq/core';

describe('Onboarding Wizard: Upoznaj Žiga Gospara (Faza 21)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Pomoćna funkcija za izračun matematički ispravnih MOD 97 kontrolnih znamenki
  function generateValidHrIban(vbdi: string, racun10: string): string {
    const bban = vbdi + racun10;
    const numericString = bban + '172700';
    let remainder = 0;
    for (let i = 0; i < numericString.length; i += 7) {
      const chunk = remainder.toString() + numericString.slice(i, i + 7);
      remainder = parseInt(chunk, 10) % 97;
    }
    const checkDigits = (98 - remainder).toString().padStart(2, '0');
    return `HR${checkDigits}${bban}`;
  }

  describe('1. Dijalozi i Žigova glasovna naracija (onboarding-dialogues.ts)', () => {
    it('svih 5 činova posjeduje cjelovit narativ s govornim tekstom i naglascima', () => {
      expect(ONBOARDING_STEPS_META).toHaveLength(5);

      for (let act = 1; act <= 5; act++) {
        const meta = ONBOARDING_STEPS_META.find(m => m.step === act);
        expect(meta).toBeDefined();
        expect(meta?.label).toBeTruthy();
        expect(meta?.icon).toBeTruthy();

        const dialogue = ONBOARDING_DIALOGUES[act];
        expect(dialogue).toBeDefined();
        expect(dialogue.speechText).toBeTruthy();
        expect(dialogue.speechText.length).toBeGreaterThan(20);
        expect(dialogue.mentorTip).toBeTruthy();
        expect(dialogue.emphasisPhrase).toBeTruthy();
      }
    });

    it('Čin 1 nosi toplu dubrovačku dobrodošlicu i razbija administrativni strah', () => {
      const act1 = ONBOARDING_DIALOGUES[1];
      expect(act1.speechText.toLowerCase()).toContain('gosparu');
      expect(act1.speechText).toContain('Žigo');
      expect(act1.emphasisPhrase).toContain('sloboda');
    });

    it('Čin 5 vodi izravno na "Prvi Rez" — izdavanje prvog računa', () => {
      const act5 = ONBOARDING_DIALOGUES[5];
      expect(act5.title).toContain('Prvi Rez');
      expect(act5.speechText).toContain('Račun broj 1-1-1');
      expect(act5.emphasisPhrase).toContain('probij led');
    });

    it('reakcija na OIB dinamički prepoznaje valjanost i bodri korisnika', () => {
      const validReaction = getOibReactionDialogue(true);
      expect(validReaction).toContain('Čist OIB');
      expect(validReaction).toContain('MOD 11');

      const invalidReaction = getOibReactionDialogue(false);
      expect(invalidReaction).toContain('Provjeri još jednom');
    });

    it('reakcija na IBAN prepoznaje hrvatsku banku i potvrđuje valjanost', () => {
      const bankReaction = getBankReactionDialogue('Zagrebačka banka d.d.');
      expect(bankReaction).toContain('Zagrebačka banka d.d.');
      expect(bankReaction).toContain('HUB-3');

      const unknownReaction = getBankReactionDialogue(null);
      expect(unknownReaction).toContain('HR');
    });

    it('čestitka na završetku spominje slobodu (Libertas) i prvi rez', () => {
      const congrats = getCompletionCongratulation('Atelijer Ragusa');
      expect(congrats).toContain('Atelijer Ragusa');
      expect(congrats).toContain('Kripto-Republici');
      expect(congrats).toContain('Libertas');
      expect(congrats).toContain('Sretno i pošteno');
    });
  });

  describe('2. Šifarnik KPD 2025 i pretpostavljene djelatnosti', () => {
    it('sadrži ključne paušalne djelatnosti s točnim KPD šiframa', () => {
      expect(PREDEFINED_DJELATNOSTI.length).toBeGreaterThanOrEqual(5);

      const itDjelatnost = PREDEFINED_DJELATNOSTI.find(d => d.id === 'it-dev');
      expect(itDjelatnost).toBeDefined();
      expect(itDjelatnost?.kpdSifra).toBe('62.01.11');

      const savjetovanje = PREDEFINED_DJELATNOSTI.find(d => d.id === 'consulting');
      expect(savjetovanje).toBeDefined();
      expect(savjetovanje?.kpdSifra).toBe('70.22.10');

      const dizajn = PREDEFINED_DJELATNOSTI.find(d => d.id === 'design');
      expect(dizajn).toBeDefined();
      expect(dizajn?.kpdSifra).toBe('74.10.19');
    });
  });

  describe('3. Validacija OIB-a i IBAN-a u kontekstu čarobnjaka', () => {
    it('validira točan i netočan OIB prema ISO 7064 MOD 11, 10 algoritmu', () => {
      // Valjani OIB primjeri
      expect(validateOib('69435151530')).toBe(true);
      expect(validateOib('01234567890')).toBe(false); // neispravna kontrolna znamenka
      expect(validateOib('12345')).toBe(false); // prekratko
      expect(validateOib('')).toBe(false);
    });

    it('validira točan hrvatski IBAN i prepoznaje vodeće banke', () => {
      const zabaIban = generateValidHrIban('2360000', '1101234567');
      expect(validateIban(zabaIban)).toBe(true);
      expect(getBankNameFromIban(zabaIban)).toContain('Zagrebačka');

      const pbzIban = generateValidHrIban('2340009', '3210987654');
      expect(validateIban(pbzIban)).toBe(true);
      expect(getBankNameFromIban(pbzIban)).toContain('Privredna');

      const invalidIban = 'HR0011112222333344445';
      expect(validateIban(invalidIban)).toBe(false);
    });
  });

  describe('4. Postavke pohrane i dovršetka onboardinga', () => {
    it('koristi ispravan ključ u localStorage-u', () => {
      expect(ONBOARDING_STORAGE_KEY).toBe('obrtniq_onboarding_completed');
    });
  });

  describe('5. Edukativni portal i Žigovi savjeti (ONBOARDING_EDUCATIONAL_TIPS)', () => {
    it('sadrži detaljne savjete i ogledne primjere za Čin 2 i Čin 3', () => {
      const tip2 = ONBOARDING_EDUCATIONAL_TIPS[2];
      expect(tip2).toBeDefined();
      expect(tip2.title).toContain('OIB');
      expect(tip2.summary).toBeTruthy();
      expect(tip2.details.length).toBeGreaterThanOrEqual(3);
      expect(tip2.example.naziv).toContain('Orlando Libertas');
      expect(validateOib(tip2.example.oib)).toBe(true);

      const tip3 = ONBOARDING_EDUCATIONAL_TIPS[3];
      expect(tip3).toBeDefined();
      expect(tip3.title).toContain('IBAN');
      expect(tip3.details.length).toBeGreaterThanOrEqual(3);
      expect(tip3.example.iban).toBeTruthy();
      expect(validateIban(tip3.example.iban!)).toBe(true);
      expect(getBankNameFromIban(tip3.example.iban!)).toContain('Zagrebačka');
    });
  });

  describe('6. Validacija koraka i pravila prijelaza (Gate-Checks & Clean Slate)', () => {
    // Simulacija čiste funkcije validacije po koracima
    function checkStepValidity(
      step: number,
      data: {
        naziv: string;
        vlasnik: string;
        oib: string;
        iban: string;
        djelatnostId: string;
        theme: string;
      }
    ): boolean {
      switch (step) {
        case 1:
          return true;
        case 2:
          return (
            data.naziv.trim().length >= 3 &&
            data.vlasnik.trim().split(/\s+/).filter(Boolean).length >= 2 &&
            validateOib(data.oib)
          );
        case 3:
          return validateIban(data.iban) && Boolean(data.djelatnostId);
        case 4:
          return Boolean(data.theme);
        case 5:
          return true;
        default:
          return true;
      }
    }

    it('Čin 1 je uvijek otvoren za odabir načina pokretanja', () => {
      const emptyState = { naziv: '', vlasnik: '', oib: '', iban: '', djelatnostId: '', theme: '' };
      expect(checkStepValidity(1, emptyState)).toBe(true);
    });

    it('Čin 2 blokira prijelaz ako su polja prazna ili OIB nije MOD 11 ispravan', () => {
      const emptyState = { naziv: '', vlasnik: '', oib: '', iban: '', djelatnostId: '', theme: '' };
      expect(checkStepValidity(2, emptyState)).toBe(false);

      // Samo naziv
      const withNaziv = { ...emptyState, naziv: 'Orlando Libertas' };
      expect(checkStepValidity(2, withNaziv)).toBe(false);

      // Naziv + samo jedno ime bez prezimena
      const withSingleName = { ...withNaziv, vlasnik: 'Vlaho' };
      expect(checkStepValidity(2, withSingleName)).toBe(false);

      // Naziv + ime i prezime, ali neispravan OIB
      const withInvalidOib = { ...withSingleName, vlasnik: 'Vlaho Sorkočević', oib: '01234567890' };
      expect(checkStepValidity(2, withInvalidOib)).toBe(false);

      // Potpuno valjani podaci
      const validStep2 = { ...withInvalidOib, oib: '69435151530' };
      expect(checkStepValidity(2, validStep2)).toBe(true);
    });

    it('Čin 3 blokira prijelaz ako IBAN nije 21-znamenkasti MOD 97 valjan ili nema djelatnosti', () => {
      const validStep2State = {
        naziv: 'Orlando Libertas',
        vlasnik: 'Vlaho Sorkočević',
        oib: '69435151530',
        iban: '',
        djelatnostId: 'it-dev',
        theme: 'amethyst',
      };
      // Prazan IBAN
      expect(checkStepValidity(3, validStep2State)).toBe(false);

      // Neispravan IBAN
      const withBadIban = { ...validStep2State, iban: 'HR0011112222333344445' };
      expect(checkStepValidity(3, withBadIban)).toBe(false);

      // Ispravan IBAN, ali nedostaje djelatnost
      const validIban = 'HR6023600001101234567';
      const noDjelatnost = { ...validStep2State, iban: validIban, djelatnostId: '' };
      expect(checkStepValidity(3, noDjelatnost)).toBe(false);

      // Potpuno ispravan Čin 3
      const validStep3 = { ...validStep2State, iban: validIban, djelatnostId: 'it-dev' };
      expect(checkStepValidity(3, validStep3)).toBe(true);
    });

    it('učitavanje oglednog primjera zadovoljava sve validacijske uvjete', () => {
      const tip2 = ONBOARDING_EDUCATIONAL_TIPS[2];
      const tip3 = ONBOARDING_EDUCATIONAL_TIPS[3];

      const exampleData = {
        naziv: tip2.example.naziv,
        vlasnik: tip2.example.vlasnik,
        oib: tip2.example.oib,
        iban: tip3.example.iban!,
        djelatnostId: 'it-dev',
        theme: 'amethyst',
      };

      expect(checkStepValidity(1, exampleData)).toBe(true);
      expect(checkStepValidity(2, exampleData)).toBe(true);
      expect(checkStepValidity(3, exampleData)).toBe(true);
      expect(checkStepValidity(4, exampleData)).toBe(true);
      expect(checkStepValidity(5, exampleData)).toBe(true);
    });
  });
});
