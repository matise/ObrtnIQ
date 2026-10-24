/**
 * PDF Validator i Analizator Strukture
 * Validira ispravnost i cjelovitost generiranih PDF datoteka prema PDF specifikaciji (ISO 32000-1)
 */

export interface PdfValidationResult {
  isValidPdf: boolean;
  version: string;
  byteLength: number;
  hasMagicHeader: boolean;
  hasEofTrailer: boolean;
  hasCatalog: boolean;
  hasPages: boolean;
  errors: string[];
}

/**
 * Validira sirovi PDF sadržaj (string, Uint8Array ili ArrayBuffer)
 */
export function validatePdfStructure(pdfData: string | Uint8Array | ArrayBuffer): PdfValidationResult {
  const errors: string[] = [];

  // Pretvorba u string za tekstualnu analizu zaglavlja i trajlera
  let rawString = '';
  let byteLength = 0;

  if (typeof pdfData === 'string') {
    rawString = pdfData;
    byteLength = new TextEncoder().encode(pdfData).length;
  } else if (pdfData instanceof Uint8Array) {
    rawString = new TextDecoder('latin1').decode(pdfData);
    byteLength = pdfData.byteLength;
  } else if (pdfData instanceof ArrayBuffer) {
    const uint8 = new Uint8Array(pdfData);
    rawString = new TextDecoder('latin1').decode(uint8);
    byteLength = uint8.byteLength;
  }

  // 1. Provjera minimalne veličine
  if (byteLength < 100) {
    errors.push(`PDF datoteka je premala (${byteLength} bajtova) za valjanu strukturu.`);
  }

  // 2. Provjera Magic Header-a (%PDF-1.x) na početku datoteke
  const magicMatch = rawString.slice(0, 1024).match(/%PDF-(\d\.\d)/);
  const hasMagicHeader = magicMatch !== null;
  const version = magicMatch ? magicMatch[1] ?? 'unknown' : 'unknown';

  if (!hasMagicHeader) {
    errors.push('Nedostaju obavezni početni bajtovi (%PDF-1.x).');
  }

  // 3. Provjera završnog markera (%%EOF) u zadnjih 1024 bajta
  const tail = rawString.slice(-1024);
  const hasEofTrailer = tail.includes('%%EOF');

  if (!hasEofTrailer) {
    errors.push('Nedostaje obavezni završni EOF marker (%%EOF).');
  }

  // 4. Provjera objektnog kataloga (/Catalog ili /Root)
  const hasCatalog = rawString.includes('/Catalog') || rawString.includes('/Root');
  if (!hasCatalog) {
    errors.push('U PDF-u nije pronađen objektni katalog (/Catalog ili /Root).');
  }

  // 5. Provjera stabla stranica (/Pages)
  const hasPages = rawString.includes('/Pages');
  if (!hasPages) {
    errors.push('U PDF-u nije pronađeno stablo stranica (/Pages).');
  }

  const isValidPdf = errors.length === 0;

  return {
    isValidPdf,
    version,
    byteLength,
    hasMagicHeader,
    hasEofTrailer,
    hasCatalog,
    hasPages,
    errors,
  };
}
