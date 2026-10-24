import { describe, it, expect } from 'vitest';
import { validateOib, sanitizeOib } from '../src/utils/oib';

// Pomoćna funkcija za izračun kontrolne znamenke prema ISO 7064
function calculateExpectedCheckDigit(first10Digits: string): number {
  let a = 10;
  for (let i = 0; i < 10; i++) {
    a = a + parseInt(first10Digits.charAt(i), 10);
    a = a % 10;
    if (a === 0) a = 10;
    a = (a * 2) % 11;
  }
  let kontrolna = 11 - a;
  if (kontrolna === 10) kontrolna = 0;
  return kontrolna;
}

describe('ISO 7064, MOD 11, 10 - OIB Validacija', () => {
  // Testni podaci s valjanim OIB-ovima
  const validniOibovi = [
    '69435151530',
    '01234567896', // kontrolna je 6
    '12345678903', // kontrolna je 3
    '98765432100', // izračunato prema formuli
    '11111111113', // izračunato prema formuli
  ].map(oib10 => {
    const base10 = oib10.slice(0, 10);
    const check = calculateExpectedCheckDigit(base10);
    return base10 + check.toString();
  });

  it('treba prepoznati matematički ispravne OIB-ove', () => {
    for (const oib of validniOibovi) {
      expect(validateOib(oib), `OIB ${oib} bi trebao biti valjan`).toBe(true);
    }
  });

  it('treba tolerirati vodeće i prateće razmake kod valjanog OIB-a', () => {
    expect(validateOib(' 69435151530 ')).toBe(true);
  });

  it('treba odbiti OIB s pogrešnom kontrolnom znamenkom', () => {
    for (const oib of validniOibovi) {
      const base = oib.slice(0, 10);
      const actualCheck = parseInt(oib.charAt(10), 10);
      const wrongCheck = (actualCheck + 1) % 10;
      expect(validateOib(base + wrongCheck)).toBe(false);
    }
  });

  it('treba odbiti OIB koji nema točno 11 znamenki', () => {
    expect(validateOib('1234567890')).toBe(false); // 10 znamenki
    expect(validateOib('123456789012')).toBe(false); // 12 znamenki
    expect(validateOib('')).toBe(false);
  });

  it('treba odbiti OIB koji sadrži slova ili specijalne znakove', () => {
    expect(validateOib('6943515153A')).toBe(false);
    expect(validateOib('6943515-530')).toBe(false);
    expect(validateOib('ABCDEFGHIJK')).toBe(false);
  });

  it('treba vratiti false za null ili undefined', () => {
    expect(validateOib(null as unknown as string)).toBe(false);
    expect(validateOib(undefined as unknown as string)).toBe(false);
  });

  it('sanitizeOib treba ukloniti sve ne-brojčane znakove i skratiti na 11', () => {
    expect(sanitizeOib(' 694-351-515 30 ')).toBe('69435151530');
    expect(sanitizeOib('HR 69435151530')).toBe('69435151530');
    expect(sanitizeOib('123456789012345')).toBe('12345678901');
  });
});
