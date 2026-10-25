// packages/core/tests/doprinosi.test.ts

import { describe, it, expect } from 'vitest';
import { 
  obracunajMjesecneDoprinose,
  generirajGodisnjeDoprinose,
  generirajKvartalnePorezneNaloge,
  generirajPozivNaBrojDoprinosa,
  generirajPozivNaBrojPoreza,
  izracunajRokPlacanjaDoprinosa,
  DEFAULT_DOPRINOSI_CONFIG_2026,
  SIFRE_PRIHODA,
  generateHub3ForDoprinos,
  generateHub3ForPorez,
  generateEpcQrForGovPayment
} from '../src';

describe('Faza 17: Obvezni Doprinosi i Kvartalni Paušalni Porez (Poslovna Matematika & Nalozi)', () => {
  const testOib = '79102730089';

  it('V17-1: Točnost izračuna doprinosa na razini centa za 2026. godinu', () => {
    // Za osnovicu 719,20 €:
    // MIO 1 (15%): 719.20 * 0.15 = 107.88 €
    // MIO 2 (5%):  719.20 * 0.05 = 35.96 €
    // HZZO (16.5%): 719.20 * 0.165 = 118.668 -> 118.67 €
    // Ukupno: 107.88 + 35.96 + 118.67 = 262.51 €
    const obracun = obracunajMjesecneDoprinose(testOib, 2026, 10, DEFAULT_DOPRINOSI_CONFIG_2026);

    expect(obracun.iznosMio1Eur).toBe(107.88);
    expect(obracun.iznosMio2Eur).toBe(35.96);
    expect(obracun.iznosHzzoEur).toBe(118.67);
    expect(obracun.ukupnoDoprinosiEur).toBe(262.51);
  });

  it('V17-2: Generiranje standardnog poziva na broj modela HR68 za doprinose i porez', () => {
    // Mjesec 10/2026: oznaka je "2610"
    const pozivMio1 = generirajPozivNaBrojDoprinosa(SIFRE_PRIHODA.MIO_1, testOib, 2026, 10);
    const pozivMio2 = generirajPozivNaBrojDoprinosa(SIFRE_PRIHODA.MIO_2, testOib, 2026, 10);
    const pozivHzzo = generirajPozivNaBrojDoprinosa(SIFRE_PRIHODA.HZZO, testOib, 2026, 10);
    const pozivPorez = generirajPozivNaBrojPoreza(testOib, '0097');

    expect(pozivMio1).toBe('8214-79102730089-2610');
    expect(pozivMio2).toBe('2054-79102730089-2610');
    expect(pozivHzzo).toBe('8478-79102730089-2610');
    expect(pozivPorez).toBe('1414-79102730089-0097');
  });

  it('V17-3: Validacija HUB-3 stringa za uplatu u Državni proračun', () => {
    const platitelj = {
      naziv: 'ROBOT HAND MADE',
      adresa: 'Pod Brašinom 48',
      grad: '20207 Mlini',
      oib: testOib,
    };

    const nalog = {
      naziv: 'HZZO zdravstveno',
      opis: 'Doprinos za HZZO 10/2026',
      iznosEur: 118.67,
      ibanPrimatelja: 'HR1210010051863000160',
      model: 'HR68',
      pozivNaBroj: '8478-79102730089-2610',
      sifraNamjene: 'GOVT',
    };

    const hub3String = generateHub3ForDoprinos(platitelj, nalog);
    const lines = hub3String.split('\n');

    expect(lines[0]).toBe('HRVHUB30');
    expect(lines[1]).toBe('EUR');
    expect(lines[2]).toBe('000000000011867'); // 118,67 € u centima
    expect(lines[9]).toBe('HR1210010051863000160'); // IBAN Državnog proračuna
    expect(lines[10]).toBe('HR68');
    expect(lines[11]).toBe('8478-79102730089-2610');
    expect(lines[12]).toBe('GOVT');
  });

  it('V17-4: Obračun kvartalnog poreza prema poreznom razredu (Razred 1 do 5)', () => {
    // Do 11.500 €: Razred 1 (51.75 € kvartalno)
    const naloziR1 = generirajKvartalnePorezneNaloge(testOib, 2026, 8000);
    expect(naloziR1.length).toBe(4);
    expect(naloziR1[0]!.razred).toBe(1);
    expect(naloziR1[0]!.iznosPorezaEur).toBe(51.75);
    expect(naloziR1[0]!.rokPlacanja).toBe('2026-03-31');

    // 15.000,01 do 20.000 €: Razred 3 (90.00 € kvartalno)
    const naloziR3 = generirajKvartalnePorezneNaloge(testOib, 2026, 18500);
    expect(naloziR3[2]!.razred).toBe(3);
    expect(naloziR3[2]!.iznosPorezaEur).toBe(90.00);
    expect(naloziR3[2]!.rokPlacanja).toBe('2026-09-30');
    expect(naloziR3[2]!.pozivNaBroj).toBe('1414-79102730089-0097');
  });

  it('Provjera rokova dospijeća doprinosa i prijelaza godine', () => {
    // Listopad 2026 -> dospijeva 15.11.2026.
    expect(izracunajRokPlacanjaDoprinosa(2026, 10)).toBe('2026-11-15');
    // Prosinac 2026 -> dospijeva 15.01.2027.
    expect(izracunajRokPlacanjaDoprinosa(2026, 12)).toBe('2027-01-15');
  });

  it('Generiranje EPC SEPA QR payload stringa za državna davanja', () => {
    const epcPayload = generateEpcQrForGovPayment({
      nazivPrimatelja: 'Državni proračun RH',
      iban: 'HR1210010051863000160',
      iznosEur: 262.51,
      model: 'HR68',
      pozivNaBroj: '8214-79102730089-2610',
      opis: 'Zbirna uplata doprinosa 10/2026',
    });

    expect(epcPayload).toContain('BCD');
    expect(epcPayload).toContain('Državni proračun RH');
    expect(epcPayload).toContain('HR1210010051863000160');
    expect(epcPayload).toContain('EUR262.51');
    expect(epcPayload).toContain('HR68 8214-79102730089-2610');
  });
});
