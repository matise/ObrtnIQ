// packages/core/src/domain/kpr-csv.ts

import type { NaplataPromet } from './types';
import { formatHrvatskiDatum } from '../utils/typography';

/**
 * Formatira broj za CSV s hrvatskim decimalnim zarezom (npr. 1250.50 -> "1250,50")
 */
export function formatCsvIznos(iznos: number): string {
  return iznos.toFixed(2).replace('.', ',');
}

export interface KprCsvOptions {
  obrtNaziv?: string;
  obrtOib?: string;
}

/**
 * Generira službeni tablični CSV izvoz Knjige Prometa (KPR) prilagođen za MS Excel u RH.
 * - Počinje s UTF-8 BOM (\uFEFF) za sprječavanje gubitka hrvatskih dijakritika (Č, Ć, Ž, Š, Đ) u Excelu.
 * - Koristi točka-zarez (;) kao separator stupaca prema standardu regionalnih postavki RH.
 * - Koristi zarez za decimale.
 * - Uključuje zaglavlje stupaca, retke pojedinačnih naplata i rekapitulacijski redak zbroja.
 */
export function generateKprCsv(
  kprStavke: NaplataPromet[],
  godina: number,
  options?: KprCsvOptions
): string {
  const BOM = '\uFEFF';
  const delimiter = ';';
  const lines: string[] = [];

  // Opcionalna metapodatkovna zaglavlja
  if (options?.obrtNaziv) {
    lines.push(`KNJIGA PROMETA (KPR) - ${godina}. GODINA`);
    lines.push(`Porezni obveznik: ${options.obrtNaziv}${options.obrtOib ? ` (OIB: ${options.obrtOib})` : ''}`);
    lines.push('');
  }

  // Stupci propisani Pravilnikom o paušalnom oporezivanju
  const headers = [
    'R.br.',
    'Datum uplate',
    'Broj računa / temeljnice',
    'Naziv uplatitelja / opis',
    'Naplaćeno u gotovini (€)',
    'Naplaćeno bezgotovinski (€)',
    'Ukupno naplaćeno (€)',
    'Kvartal',
  ];
  lines.push(headers.join(delimiter));

  let sumaGotovina = 0;
  let sumaBezgotovinski = 0;
  let sumaUkupno = 0;

  // Kronološko sortiranje po broju stavke
  const sortirane = [...kprStavke].sort((a, b) => a.brojKprStavke - b.brojKprStavke);

  sortirane.forEach((s) => {
    sumaGotovina += s.iznosGotovina;
    sumaBezgotovinski += s.iznosBezgotovinski;
    sumaUkupno += s.ukupnoNaplaceno;

    const redak = [
      s.brojKprStavke.toString(),
      formatHrvatskiDatum(s.datumNaplate),
      s.brojIzvoda ? `${s.brojIzvoda}` : 'Račun',
      `"${s.opisPlatitelja.replace(/"/g, '""')}"`,
      formatCsvIznos(s.iznosGotovina),
      formatCsvIznos(s.iznosBezgotovinski),
      formatCsvIznos(s.ukupnoNaplaceno),
      `Q${s.kvartal}`,
    ];
    lines.push(redak.join(delimiter));
  });

  // Redak rekapitulacije / sume
  const sumRow = [
    'UKUPNO',
    '',
    '',
    '',
    formatCsvIznos(sumaGotovina),
    formatCsvIznos(sumaBezgotovinski),
    formatCsvIznos(sumaUkupno),
    '',
  ];
  lines.push(sumRow.join(delimiter));

  return BOM + lines.join('\r\n');
}
