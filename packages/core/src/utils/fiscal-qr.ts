/**
 * Fiskalni QR Kod Generator prema specifikaciji Porezne uprave RH
 * Sukladno Zakonu o fiskalizaciji u prometu gotovinom
 * URL format: https://porezna.gov.hr/rn?z={ZKI}&d={DATUM_YYYYMMDD}&i={CENTI}[&jir={JIR}]
 */

export interface FiscalQrData {
  zki: string;
  datumIzdavanja: string; // YYYY-MM-DD ili DD.MM.YYYY
  ukupnoEur: number;
  jir?: string;
}

/**
 * Pomoćna funkcija za formatiranje datuma u YYYYMMDD
 */
export function formatDatumZaFiscalQr(datumStr: string): string {
  // Ako je format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(datumStr)) {
    return datumStr.replace(/-/g, '');
  }
  // Ako je format DD.MM.YYYY.
  const parts = datumStr.replace(/\.$/, '').split('.');
  if (parts.length === 3) {
    const dan = (parts[0] ?? '').padStart(2, '0');
    const mjesec = (parts[1] ?? '').padStart(2, '0');
    const godina = parts[2] ?? '';
    if (godina.length === 4) {
      return `${godina}${mjesec}${dan}`;
    }
  }
  // Fallback: očisti sve ne-numeričke znakove
  const digits = datumStr.replace(/\D/g, '');
  if (digits.length >= 8) {
    return digits.slice(0, 8);
  }
  return datumStr;
}

/**
 * Generira službeni URL za provjeru računa na portalu Porezne uprave
 */
export function generateFiscalQrUrl(data: FiscalQrData): string {
  const zkiClean = data.zki.replace(/[^a-fA-F0-9]/g, '').toLowerCase();
  if (zkiClean.length !== 32) {
    throw new Error(`Neispravan ZKI (mora biti točno 32 heksadecimalna znaka): ${data.zki}`);
  }

  const datumFormatiran = formatDatumZaFiscalQr(data.datumIzdavanja);
  const iznosCenti = Math.round(data.ukupnoEur * 100);

  const url = new URL('https://porezna.gov.hr/rn');
  url.searchParams.set('z', zkiClean);
  url.searchParams.set('d', datumFormatiran);
  url.searchParams.set('i', iznosCenti.toString());

  if (data.jir && data.jir.trim().length > 0) {
    url.searchParams.set('jir', data.jir.trim());
  }

  return url.toString();
}

/**
 * Parsira fiskalni QR URL natrag u parametre
 */
export function parseFiscalQrUrl(urlString: string): FiscalQrData {
  const url = new URL(urlString);
  const z = url.searchParams.get('z');
  const d = url.searchParams.get('d');
  const i = url.searchParams.get('i');
  const jir = url.searchParams.get('jir');

  if (!z || !d || !i) {
    throw new Error('Neispravan Porezna uprava fiskalni QR URL: Nedostaju obavezni parametri (z, d, i)');
  }

  const centi = parseInt(i, 10) || 0;
  const ukupnoEur = centi / 100;

  // Pretvori YYYYMMDD natrag u YYYY-MM-DD
  let datumIzdavanja = d;
  if (d.length === 8) {
    datumIzdavanja = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  }

  return {
    zki: z,
    datumIzdavanja,
    ukupnoEur,
    jir: jir || undefined,
  };
}
