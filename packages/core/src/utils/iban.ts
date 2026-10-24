/**
 * ISO 13616 / MOD 97-10 Validacija IBAN-a i prepoznavanje domaćih banaka (RH)
 */

/**
 * Registar vodećih brojeva banaka u RH (VBDI - 7 znamenki)
 * Izvor: Hrvatska narodna banka (HNB)
 */
export const HR_BANKE_VBDI: Record<string, string> = {
  '2360000': 'Zagrebačka banka d.d.',
  '2340009': 'Privredna banka Zagreb d.d.',
  '2402006': 'Erste & Steiermärkische Bank d.d.',
  '2407000': 'OTP banka d.d.',
  '2484008': 'Raiffeisenbank Austria d.d.',
  '2390001': 'Hrvatska poštanska banka d.d.',
  '2485001': 'Agram banka d.d.',
  '2386002': 'KentBank d.d.',
  '2411006': 'BKS Bank AG',
  '2403009': 'Samoborska banka d.d.',
  '2408002': 'Podravska banka d.d.',
  '2490005': 'Istarska kreditna banka Umag d.d.',
  '2500009': 'Hrvatska narodna banka',
  '2503007': 'Addiko Bank d.d.',
};

/**
 * Standardne duljine IBAN-a po državama (ISO 13616)
 */
const IBAN_LENGTHS: Record<string, number> = {
  HR: 21,
  DE: 22,
  AT: 20,
  SI: 19,
  IT: 27,
  FR: 27,
  ES: 24,
  NL: 18,
  BE: 16,
  CH: 21,
  GB: 22,
  IE: 22,
  CZ: 24,
  SK: 24,
  PL: 28,
  HU: 28,
  BA: 20,
  RS: 22,
  ME: 22,
};

/**
 * Čisti IBAN od razmaka, crtica i prebacuje u velika slova
 */
export function sanitizeIban(iban: string): string {
  return iban.replace(/[\s-]/g, '').toUpperCase();
}

/**
 * Formatira IBAN u blokove po 4 znaka radi preglednosti
 * Npr. HR1234567890123456789 -> HR12 3456 7890 1234 5678 9
 */
export function formatIban(iban: string): string {
  const clean = sanitizeIban(iban);
  return clean.replace(/(.{4})/g, '$1 ').trim();
}

/**
 * Validira IBAN prema ISO 13616 (MOD 97-10 algoritam)
 * 
 * @param iban - IBAN string
 * @returns true ako je format i kontrolni broj matematički ispravan
 */
export function validateIban(iban: string | null | undefined): boolean {
  if (!iban) return false;

  const clean = sanitizeIban(iban);

  // Provjera minimalne strukture (ISO kod države + 2 kontrolne znamenke + BBAN)
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(clean)) {
    return false;
  }

  // Provjera dužine za poznate države
  const countryCode = clean.slice(0, 2);
  const expectedLength = IBAN_LENGTHS[countryCode];
  if (expectedLength && clean.length !== expectedLength) {
    return false;
  }

  // Za RH: mora imati točno 21 znak, a nakon HR i 2 kontrolna broja slijedi 17 brojčanih znamenki
  if (countryCode === 'HR') {
    if (clean.length !== 21 || !/^HR\d{19}$/.test(clean)) {
      return false;
    }
  }

  // ISO 7064 MOD 97-10 algoritam:
  // 1. Pomakni prva 4 znaka na kraj niza
  const rearranged = clean.slice(4) + clean.slice(0, 4);

  // 2. Pretvori slova u brojeve (A=10, B=11, ..., Z=35)
  let numericString = '';
  for (let i = 0; i < rearranged.length; i++) {
    const char = rearranged.charAt(i);
    const code = char.charCodeAt(0);
    if (code >= 65 && code <= 90) {
      numericString += (code - 55).toString();
    } else {
      numericString += char;
    }
  }

  // 3. Računanje modulo 97 u blokovima (izbjegavanje premašivanja brojeva u JS)
  let remainder = 0;
  for (let i = 0; i < numericString.length; i += 7) {
    const chunk = remainder.toString() + numericString.slice(i, i + 7);
    remainder = parseInt(chunk, 10) % 97;
  }

  return remainder === 1;
}

/**
 * Vraća naziv banke za hrvatski IBAN na temelju vodećeg broja banke (VBDI).
 * 
 * @param iban - Hrvatski IBAN
 * @returns Naziv banke ili undefined ako nije pronađena
 */
export function getBankNameFromIban(iban: string): string | undefined {
  const clean = sanitizeIban(iban);
  if (!clean.startsWith('HR') || clean.length < 11) {
    return undefined;
  }

  // VBDI se nalazi od pozicije 4 do 11 (7 znamenki)
  const vbdi = clean.slice(4, 11);
  return HR_BANKE_VBDI[vbdi];
}
