// packages/core/tests/tax-calendar.test.ts
// Faza 20: Testovi za službeni porezni kalendar RH za obrtnike

import { describe, it, expect } from 'vitest';
import {
  generirajPorezniKalendar,
  izracunajPreostaleDane,
  odrediStatusRoka,
  dohvatiSljedeciPorezniRok,
} from '../src';

describe('Faza 20: Službeni porezni kalendar RH & Sentinel rokovi', () => {
  const oib = '12345678901';

  it('V20-1: Generira točno 17 zakonskih rokova za paušalnog obrtnika u godini', () => {
    const calendar = generirajPorezniKalendar(2026, oib);
    // 1 PO-SD + 12 mjesečnih doprinosa + 4 kvartalna poreza = 17 rokova
    expect(calendar).toHaveLength(17);

    // Provjera PO-SD obrasca
    const posd = calendar.find((r) => r.vrsta === 'POSD_OBRAZAC');
    expect(posd).toBeDefined();
    expect(posd?.datumDospijeca).toBe('2026-01-15');
    expect(posd?.pozivNaBroj).toContain(oib);

    // Provjera 12 mjesečnih doprinosa
    const doprinosi = calendar.filter((r) => r.vrsta === 'DOPRINOSI');
    expect(doprinosi).toHaveLength(12);
    // Siječanjski doprinos dospijeva 15. veljače
    expect(doprinosi.find((d) => d.mjesec === 1)?.datumDospijeca).toBe('2026-02-15');
    // Prosinački doprinos dospijeva 15. siječnja sljedeće godine
    expect(doprinosi.find((d) => d.mjesec === 12)?.datumDospijeca).toBe('2027-01-15');

    // Provjera 4 kvartala poreza
    const porezi = calendar.filter((r) => r.vrsta === 'PAUSALNI_POREZ');
    expect(porezi).toHaveLength(4);
    expect(porezi[0].datumDospijeca).toBe('2026-03-31');
    expect(porezi[1].datumDospijeca).toBe('2026-06-30');
    expect(porezi[2].datumDospijeca).toBe('2026-09-30');
    expect(porezi[3].datumDospijeca).toBe('2026-12-31');
  });

  it('V20-1: izracunajPreostaleDane točno računa razliku u danima', () => {
    const danas = '2026-03-10';
    expect(izracunajPreostaleDane('2026-03-10', danas)).toBe(0);
    expect(izracunajPreostaleDane('2026-03-15', danas)).toBe(5);
    expect(izracunajPreostaleDane('2026-03-05', danas)).toBe(-5);
  });

  it('V20-1: odrediStatusRoka točno postavlja statuse', () => {
    expect(odrediStatusRoka(5, false)).toBe('CEKA_UPLATU');
    expect(odrediStatusRoka(-2, false)).toBe('PREKORACENO');
    expect(odrediStatusRoka(-2, true)).toBe('UPLACENO');
    expect(odrediStatusRoka(10, true)).toBe('UPLACENO');
  });

  it('V20-1: dohvatiSljedeciPorezniRok pronalazi najbliži rok i postavlja zastavicu hitnosti', () => {
    const calendar = generirajPorezniKalendar(2026, oib);

    // Simuliramo 10. ožujka 2026. - sljedeći rok su doprinosi 15. ožujka (za 5 dana, jeHitno = true)
    const sljedeci = dohvatiSljedeciPorezniRok(calendar, '2026-03-10');
    expect(sljedeci).not.toBeNull();
    expect(sljedeci?.rok.datumDospijeca).toBe('2026-03-15');
    expect(sljedeci?.preostaloDana).toBe(5);
    expect(sljedeci?.jeHitno).toBe(true);

    // Simuliramo 1. lipnja 2026. - sljedeći rok je 15. lipnja (14 dana, jeHitno = false)
    const lipanj = dohvatiSljedeciPorezniRok(calendar, '2026-06-01');
    expect(lipanj).not.toBeNull();
    expect(lipanj?.preostaloDana).toBe(14);
    expect(lipanj?.jeHitno).toBe(false);
  });
});
