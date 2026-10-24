import { describe, it, expect } from 'vitest';
import { 
  validateHrvatskaTipografija, 
  formatHrvatskiIznos, 
  formatHrvatskiDatum, 
  primijeniHrvatskiPrijelom 
} from '../src/utils/typography';

describe('Hrvatska Tipografija i Formatiranje', () => {
  it('ispravno validira prisutnost i očuvanost dijakritika', () => {
    const validanTekst = 'Račun za obrtničke usluge, plaćanje po dospijeću (članak 90. stavak 2.)';
    const res = validateHrvatskaTipografija(validanTekst);

    expect(res.sadrziDijakritike).toBe(true);
    expect(res.jeValjanUtf8).toBe(true);
    expect(res.potencijalnoOsakaceniZnakovi).toHaveLength(0);
    expect(res.upozorenja).toHaveLength(0);
  });

  it('detektira ošišanu latinicu i predlaže točne dijakritike', () => {
    const osisaniTekst = 'Izdaj racun za pausalni obrt i evidentiraj placanje';
    const res = validateHrvatskaTipografija(osisaniTekst);

    expect(res.upozorenja.some(u => u.includes('račun'))).toBe(true);
    expect(res.upozorenja.some(u => u.includes('paušalni'))).toBe(true);
    expect(res.upozorenja.some(u => u.includes('plaćanje'))).toBe(true);
  });

  it('detektira oštećene znakove (gubitak UTF-8)', () => {
    const osteceniTekst = 'Pla?anje ra?una za kupca d.o.o.';
    const res = validateHrvatskaTipografija(osteceniTekst);

    expect(res.jeValjanUtf8).toBe(false);
    expect(res.upozorenja.length).toBeGreaterThan(0);
  });

  it('formatira iznose prema hrvatskom pravopisu (zarez, točka, nedjeljivi razmak i €)', () => {
    expect(formatHrvatskiIznos(1250)).toBe('1.250,00\u00A0€');
    expect(formatHrvatskiIznos(40000.75)).toBe('40.000,75\u00A0€');
    expect(formatHrvatskiIznos(0.5)).toBe('0,50\u00A0€');
    expect(formatHrvatskiIznos(1234567.89)).toBe('1.234.567,89\u00A0€');
  });

  it('formatira datume s obaveznom završnom točkom prema hrvatskom pravopisu', () => {
    expect(formatHrvatskiDatum('2026-10-24')).toBe('24.10.2026.');
    expect(formatHrvatskiDatum('24.10.2026')).toBe('24.10.2026.');
    expect(formatHrvatskiDatum('24.10.2026.')).toBe('24.10.2026.');
  });

  it('primjenjuje nedjeljive razmake iza jednoslovnih veznika i prijedloga radi sprječavanja siročića', () => {
    const tekst = 'Račun se izdaje u Zagrebu i šalje o roku s potpisom.';
    const formatirano = primijeniHrvatskiPrijelom(tekst);

    // Provjeravamo da iza jednoslovnih riječi stoji \u00A0
    expect(formatirano).toContain('u\u00A0Zagrebu');
    expect(formatirano).toContain('i\u00A0šalje');
    expect(formatirano).toContain('o\u00A0roku');
    expect(formatirano).toContain('s\u00A0potpisom');
  });
});
