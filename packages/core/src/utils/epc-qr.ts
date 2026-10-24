/**
 * EPC QR Kod Generator i Parser prema European Payments Council (EPC069-12)
 * SEPA Credit Transfer (SCT) Standard v002
 */

export interface EpcQrNalog {
  primateljIme: string;
  primateljIban: string;
  iznosEur: number;
  bic?: string;
  svrhaKod?: string; // Npr. "GDSV" (Goods/Services) ili "OTHR"
  pozivNaBroj?: string; // Strukturirani poziv na broj
  opisPlacanja?: string; // Nestrukturirani opis plaćanja (do 140 znakova)
  informacija?: string;
}

/**
 * Generira tekstualni payload za EPC QR kod (SEPA Credit Transfer)
 * Sukladno EPC069-12 standardu (verzija 002, UTF-8 enkripcija)
 */
export function generateEpcQrPayload(nalog: EpcQrNalog): string {
  const ibanClean = nalog.primateljIban.replace(/\s+/g, '').toUpperCase();
  if (!ibanClean.startsWith('HR') && ibanClean.length < 15) {
    throw new Error(`Neispravan IBAN za EPC QR kod: ${nalog.primateljIban}`);
  }

  // Format iznosa: EUR followed by positive number with 2 decimals e.g. EUR1250.00
  const iznosFormatted = nalog.iznosEur > 0 ? `EUR${nalog.iznosEur.toFixed(2)}` : '';

  const lines = [
    'BCD',                                      // 1. Service Tag (obavezno BCD)
    '002',                                      // 2. Verzija (002)
    '1',                                        // 3. Kodni skup: 1 = UTF-8
    'SCT',                                      // 4. Identifikacija: SEPA Credit Transfer
    (nalog.bic || '').trim().toUpperCase(),     // 5. BIC banke primatelja (opcionalno)
    nalog.primateljIme.trim().slice(0, 70),     // 6. Naziv primatelja (max 70 znakova)
    ibanClean,                                  // 7. IBAN primatelja (do 34 znaka)
    iznosFormatted,                             // 8. Valuta i iznos (EURxx.xx)
    (nalog.svrhaKod || 'GDSV').trim().slice(0, 4), // 9. Svrha plaćanja (4 znaka)
    (nalog.pozivNaBroj || '').trim().slice(0, 35), // 10. Strukturirana referenca
    (nalog.opisPlacanja || '').trim().slice(0, 140), // 11. Nestrukturirana informacija (opis)
    (nalog.informacija || '').trim().slice(0, 70)    // 12. Korisnička informacija
  ];

  return lines.join('\n');
}

/**
 * Parsira EPC QR payload natrag u strukturirani objekt
 */
export function parseEpcQrPayload(raw: string): EpcQrNalog {
  const lines = raw.split(/\r?\n/);
  if (lines.length < 8) {
    throw new Error('Neispravan EPC QR format: Premalo linija');
  }

  if (lines[0] !== 'BCD' || lines[1] !== '002' || lines[3] !== 'SCT') {
    throw new Error('Neispravan EPC QR format zaglavlja');
  }

  let iznosEur = 0;
  const rawIznos = lines[7] || '';
  if (rawIznos.startsWith('EUR')) {
    iznosEur = parseFloat(rawIznos.replace('EUR', '')) || 0;
  }

  return {
    bic: lines[4] || undefined,
    primateljIme: lines[5] || '',
    primateljIban: lines[6] || '',
    iznosEur,
    svrhaKod: lines[8] || undefined,
    pozivNaBroj: lines[9] || undefined,
    opisPlacanja: lines[10] || undefined,
    informacija: lines[11] || undefined,
  };
}
