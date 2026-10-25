// apps/web/tests/tax-calendar-ui.test.ts
// Faza 20: Testovi za porezni kalendar i proaktivni sentinel (Gate-Check V20-3)

import { describe, it, expect } from 'vitest';
import {
  generirajPorezniKalendar,
  izracunajPreostaleDane,
  odrediStatusRoka,
  dohvatiSljedeciPorezniRok,
  generateHub3Payload,
  generateEpcQrForGovPayment,
} from '@obrtniq/core';

describe('Faza 20: Porezni Kalendar RH & Proaktivni Sentinel (Gate-Check V20-3)', () => {
  const oib = '79102730089';
  const obrtNaziv = 'ROBOT HAND MADE, vl. Matija';
  const obrtAdresa = 'Ulica slobode 1, Split';

  it('V20-3: Generira cjeloviti službeni porezni kalendar za 2026. godinu', () => {
    const calendar = generirajPorezniKalendar(2026, oib);
    expect(calendar).toHaveLength(17);

    // Provjera PO-SD (15. siječnja)
    const posd = calendar.find((r) => r.vrsta === 'POSD_OBRAZAC');
    expect(posd).toBeDefined();
    expect(posd?.datumDospijeca).toBe('2026-01-15');
    expect(posd?.pozivNaBroj).toContain(oib);

    // Provjera doprinosa (12 mjeseci, dospijevaju 15. u sljedećem mjesecu)
    const doprinosi = calendar.filter((r) => r.vrsta === 'DOPRINOSI');
    expect(doprinosi).toHaveLength(12);
    // Svibanj (mjesec 5) dospijeva 15. lipnja
    const svibanj = doprinosi.find((d) => d.mjesec === 5);
    expect(svibanj?.datumDospijeca).toBe('2026-06-15');

    // Provjera paušalnog poreza (4 kvartala: zadnji dan svakog tromjesečja)
    const porezi = calendar.filter((r) => r.vrsta === 'PAUSALNI_POREZ');
    expect(porezi).toHaveLength(4);
    expect(porezi.map((p) => p.datumDospijeca)).toEqual([
      '2026-03-31',
      '2026-06-30',
      '2026-09-30',
      '2026-12-31',
    ]);
  });

  it('V20-3: Sentinel aktivira hitno upozorenje unutar 7 dana do dospijeća', () => {
    const calendar = generirajPorezniKalendar(2026, oib);

    // 10. studenog 2026. - 5 dana do doprinosa 15. studenog -> hitno!
    const hitno = dohvatiSljedeciPorezniRok(calendar, '2026-11-10');
    expect(hitno).not.toBeNull();
    expect(hitno?.jeHitno).toBe(true);
    expect(hitno?.preostaloDana).toBe(5);

    // 1. studenog 2026. - 14 dana do doprinosa 15. studenog -> nije hitno
    const nijeHitno = dohvatiSljedeciPorezniRok(calendar, '2026-11-01');
    expect(nijeHitno).not.toBeNull();
    expect(nijeHitno?.jeHitno).toBe(false);
    expect(nijeHitno?.preostaloDana).toBe(14);
  });

  it('V20-3: Točno generira HUB-3 PDF417 i EPC-QR payload za porezne obveze', () => {
    const calendar = generirajPorezniKalendar(2026, oib);
    const doprinos = calendar.find((r) => r.vrsta === 'DOPRINOSI')!;

    const hub3 = generateHub3Payload({
      iznosEur: doprinos.okvirniIznosEur || 219.04,
      platiteljImeAdresa: `${obrtNaziv}, ${obrtAdresa}`,
      primateljImeAdresa: doprinos.primateljNaziv,
      primateljIban: doprinos.primateljIban,
      model: doprinos.model,
      pozivNaBroj: doprinos.pozivNaBroj,
      sifraNamjene: 'GOVT',
      opisPlacanja: doprinos.naslov,
    });

    expect(hub3).toContain('HRVHUB30');
    expect(hub3).toContain(doprinos.primateljIban);
    expect(hub3).toContain(doprinos.pozivNaBroj);

    const epcQr = generateEpcQrForGovPayment({
      nazivPrimatelja: doprinos.primateljNaziv,
      iban: doprinos.primateljIban,
      iznosEur: doprinos.okvirniIznosEur || 219.04,
      model: doprinos.model,
      pozivNaBroj: doprinos.pozivNaBroj,
      opis: doprinos.naslov,
    });

    expect(epcQr).toContain('BCD');
    expect(epcQr).toContain('002');
    expect(epcQr).toContain(doprinos.primateljIban);
    expect(epcQr).toContain(doprinos.pozivNaBroj);
  });
});
