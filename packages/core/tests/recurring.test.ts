// packages/core/tests/recurring.test.ts
// Faza 20: Testovi za pretplate i ponavljajuće račune

import { describe, it, expect } from 'vitest';
import {
  izracunajUkupnoPretplate,
  izracunajSljedeceDospijece,
  jeDospjeloZaIzdavanje,
  validirajRecurringProfil,
  RecurringProfile,
  RecurringItem,
} from '../src';

describe('Faza 20: Ponavljajući računi (Subscriptions) & Domenska logika', () => {
  const sampleItems: RecurringItem[] = [
    {
      naziv: 'Održavanje web sustava',
      kolicina: 1,
      cijena: 100.0,
      popustPostotak: 10, // 90.00
    },
    {
      naziv: 'Hosting & Sigurnosne kopije',
      kolicina: 2,
      cijena: 15.5, // 31.00
    },
  ];

  it('V20-1: Točno izračunava ukupni iznos pretplate s popustima i zaokruživanjem', () => {
    // 90.00 + 31.00 = 121.00 €
    const ukupno = izracunajUkupnoPretplate(sampleItems);
    expect(ukupno).toBe(121.0);

    expect(izracunajUkupnoPretplate([])).toBe(0);
  });

  it('V20-1: Mjesečno dospijeće prelazi točno u sljedeći mjesec i novu godinu', () => {
    // Mjesečni korak unutar iste godine
    const sljedeci = izracunajSljedeceDospijece('2026-05-10', 10, 'MJESECNO');
    expect(sljedeci).toBe('2026-06-10');

    // Mjesečni korak s prijelazom u novu godinu
    const novogodisnji = izracunajSljedeceDospijece('2026-12-15', 15, 'MJESECNO');
    expect(novogodisnji).toBe('2027-01-15');
  });

  it('V20-1: Ispravno reže dane na maksimalni dan u mjesecu (veljača, 30. dan)', () => {
    // 31. dan u siječnju 2026. (2026 nije prijestupna -> veljača ima 28 dana)
    const veljaca2026 = izracunajSljedeceDospijece('2026-01-31', 31, 'MJESECNO');
    expect(veljaca2026).toBe('2026-02-28');

    // Prijestupna godina (2024 -> veljača ima 29 dana)
    const veljaca2024 = izracunajSljedeceDospijece('2024-01-31', 31, 'MJESECNO');
    expect(veljaca2024).toBe('2024-02-29');

    // Travanj ima 30 dana (31. dan prelazi u 30. travnja)
    const travanj = izracunajSljedeceDospijece('2026-03-31', 31, 'MJESECNO');
    expect(travanj).toBe('2026-04-30');
  });

  it('V20-1: Kvartalna i godišnja frekvencija', () => {
    const kvartal = izracunajSljedeceDospijece('2026-02-15', 15, 'KVARTALNO');
    expect(kvartal).toBe('2026-05-15');

    const kvartalNovaGodina = izracunajSljedeceDospijece('2026-11-01', 1, 'KVARTALNO');
    expect(kvartalNovaGodina).toBe('2027-02-01');

    const godisnje = izracunajSljedeceDospijece('2026-03-01', 1, 'GODISNJE');
    expect(godisnje).toBe('2027-03-01');
  });

  it('V20-1: jeDospjeloZaIzdavanje ispravno evaluira datume', () => {
    expect(jeDospjeloZaIzdavanje('2026-04-10', '2026-04-10')).toBe(true);
    expect(jeDospjeloZaIzdavanje('2026-04-09', '2026-04-10')).toBe(true);
    expect(jeDospjeloZaIzdavanje('2026-04-15', '2026-04-10')).toBe(false);
  });

  it('V20-1: validirajRecurringProfil pronalazi pogreške i validira ispravan profil', () => {
    const nevazeci: Partial<RecurringProfile> = {
      nazivPredloska: '',
      partnerNaziv: '',
      danUMjesecu: 35,
      stavke: [],
    };

    const res1 = validirajRecurringProfil(nevazeci);
    expect(res1.valjano).toBe(false);
    expect(res1.greske.length).toBeGreaterThanOrEqual(4);

    const vazeci: RecurringProfile = {
      id: 'rec_1',
      nazivPredloska: 'Mjesečni IT paušal',
      partnerId: 'part_1',
      partnerNaziv: 'Acme d.o.o.',
      partnerOib: '12345678901',
      partnerTaxZone: 'DOMACI',
      stavke: sampleItems,
      frekvencija: 'MJESECNO',
      danUMjesecu: 1,
      nacinPlacanja: 'TRANSAKCIJSKI_RACUN',
      rokPlacanjaDana: 15,
      aktivan: true,
      datumPocetka: '2026-01-01',
      sljedeceDospijeceDatum: '2026-05-01',
    };

    const res2 = validirajRecurringProfil(vazeci);
    expect(res2.valjano).toBe(true);
    expect(res2.greske).toHaveLength(0);
  });
});
