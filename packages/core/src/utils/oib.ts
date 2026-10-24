/**
 * ISO 7064, MOD 11, 10 validacija OIB-a (Osobni identifikacijski broj RH)
 * Zakon o osobnom identifikacijskom broju (NN 60/08, 125/19)
 */

import { coreLogger } from '../logger';

/**
 * Validira OIB prema međunarodnoj normi ISO 7064, MOD 11, 10.
 * OIB mora imati točno 11 znamenki, pri čemu je 11. znamenka kontrolna.
 * 
 * @param oib - Niz znakova koji predstavlja OIB
 * @returns true ako je OIB matematički ispravan, u suprotnom false
 */
export function validateOib(oib: string | null | undefined): boolean {
  if (!oib) return false;
  
  // Očisti eventualne razmake
  const cleanOib = oib.trim();
  
  // Mora se sastojati od točno 11 brojčanih znamenki
  if (!/^\d{11}$/.test(cleanOib)) {
    return false;
  }

  let a = 10;
  for (let i = 0; i < 10; i++) {
    a = a + parseInt(cleanOib.charAt(i), 10);
    a = a % 10;
    if (a === 0) a = 10;
    a = (a * 2) % 11;
  }

  let kontrolna = 11 - a;
  if (kontrolna === 10) kontrolna = 0;

  const isValid = kontrolna === parseInt(cleanOib.charAt(10), 10);
  if (!isValid) {
    coreLogger.scope('VALIDATION:OIB').warn('OIB ne prolazi ISO 7064 MOD 11,10 provjeru kontrolne znamenke.');
  } else {
    coreLogger.scope('VALIDATION:OIB').verbose('OIB uspješno validiran prema ISO 7064.');
  }

  return isValid;
}

/**
 * Čisti i uklanja sve ne-znamenke iz ulaza (razmaci, crtice itd.)
 */
export function sanitizeOib(input: string): string {
  return input.replace(/\D/g, '').slice(0, 11);
}
