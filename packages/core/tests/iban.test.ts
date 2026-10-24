import { describe, it, expect } from 'vitest';
import { validateIban, sanitizeIban, formatIban, getBankNameFromIban } from '../src/utils/iban';

// Pomoćna funkcija za izračun ispravnih MOD 97 kontrolnih znamenki za HR IBAN
function generateValidHrIban(vbdi: string, racun10: string): string {
  const bban = vbdi + racun10; // 17 znamenki
  // "HR00" pomaknut na kraj: bban + "HR00" -> H=17, R=27 -> bban + "172700"
  const numericString = bban + '172700';
  let remainder = 0;
  for (let i = 0; i < numericString.length; i += 7) {
    const chunk = remainder.toString() + numericString.slice(i, i + 7);
    remainder = parseInt(chunk, 10) % 97;
  }
  const checkDigits = (98 - remainder).toString().padStart(2, '0');
  return `HR${checkDigits}${bban}`;
}

describe('ISO 13616 / MOD 97 - IBAN Validacija i Obrada', () => {
  const zabaIban = generateValidHrIban('2360000', '1101234567');
  const pbzIban = generateValidHrIban('2340009', '3210987654');
  const ersteIban = generateValidHrIban('2402006', '1234567890');
  const hpbIban = generateValidHrIban('2390001', '1111222233');

  it('treba prepoznati matematički ispravne HR IBAN-ove', () => {
    expect(validateIban(zabaIban)).toBe(true);
    expect(validateIban(pbzIban)).toBe(true);
    expect(validateIban(ersteIban)).toBe(true);
    expect(validateIban(hpbIban)).toBe(true);
  });

  it('treba tolerirati razmake i crtice unutar IBAN-a', () => {
    const formatted = formatIban(zabaIban);
    expect(validateIban(formatted)).toBe(true);
    expect(validateIban(` ${zabaIban.slice(0, 4)}-${zabaIban.slice(4)} `)).toBe(true);
  });

  it('treba odbiti HR IBAN s pogrešnim kontrolnim brojem', () => {
    const checkNum = parseInt(zabaIban.slice(2, 4), 10);
    const wrongCheck = ((checkNum + 1) % 99).toString().padStart(2, '0');
    const invalidIban = `HR${wrongCheck}${zabaIban.slice(4)}`;
    expect(validateIban(invalidIban)).toBe(false);
  });

  it('treba odbiti HR IBAN neispravne duljine', () => {
    expect(validateIban('HR122360000110123456')).toBe(false); // 20 znakova
    expect(validateIban('HR12236000011012345678')).toBe(false); // 22 znaka
    expect(validateIban('')).toBe(false);
  });

  it('treba podržati i validirati važeće inozemne EU IBAN-ove', () => {
    // Poznati njemački testni IBAN
    const deTest = 'DE89370400440532013000';
    expect(validateIban(deTest)).toBe(true);
  });

  it('treba točno prepoznati naziv hrvatske banke iz VBDI-ja', () => {
    expect(getBankNameFromIban(zabaIban)).toBe('Zagrebačka banka d.d.');
    expect(getBankNameFromIban(pbzIban)).toBe('Privredna banka Zagreb d.d.');
    expect(getBankNameFromIban(ersteIban)).toBe('Erste & Steiermärkische Bank d.d.');
    expect(getBankNameFromIban(hpbIban)).toBe('Hrvatska poštanska banka d.d.');
  });

  it('treba vratiti undefined za nepoznati VBDI ili strani IBAN', () => {
    expect(getBankNameFromIban('HR1299999991234567890')).toBeUndefined();
    expect(getBankNameFromIban('DE89370400440532013000')).toBeUndefined();
  });

  it('formatIban treba grupirati IBAN u blokove po 4 znaka', () => {
    const raw = 'HR1223600001101234567';
    expect(formatIban(raw)).toBe('HR12 2360 0001 1012 3456 7');
  });

  it('sanitizeIban treba ukloniti razmake i pretvoriti u velika slova', () => {
    expect(sanitizeIban('hr12 2360 0001-1012')).toBe('HR12236000011012');
  });
});
