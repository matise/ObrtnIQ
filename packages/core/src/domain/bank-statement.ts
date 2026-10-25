// packages/core/src/domain/bank-statement.ts

import { round2 } from '../utils/calculator';

export type SmjerTransakcije = 'UPLATA' | 'ISPLATA';

export interface StavkaIzvoda {
  id: string;
  brojIzvoda: string;
  datumKnjizenja: string;          // YYYY-MM-DD
  nazivPartnera: string;
  oibPartnera?: string;
  ibanPartnera?: string;
  smjer: SmjerTransakcije;
  iznosEur: number;
  pozivNaBroj?: string;
  opisPlacanja: string;
  
  // Status povezivanja (Reconciliation)
  statusPovezivanja: 'POVEZANO_KPR' | 'POVEZANO_TROSAK' | 'NEPOVEZANO' | 'IGNORIRANO';
  povezaniDokumentId?: string;
  povezaniTrosakId?: string;
}

export interface BankStatementParseResult {
  brojIzvoda: string;
  datumIzvoda: string;
  ibanRacuna?: string;
  brojStavaka: number;
  ukupnoUplateEur: number;
  ukupnoIsplateEur: number;
  stavke: StavkaIzvoda[];
}

/**
 * Pomoćna funkcija za normalizaciju datuma u YYYY-MM-DD format
 * Podržava DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD
 */
export function normalizirajDatum(rawDatum: string): string {
  const trimmed = rawDatum.trim();
  
  // Ako je već YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // DD.MM.YYYY ili DD.MM.YYYY.
  const dotMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\.?$/);
  if (dotMatch) {
    const day = dotMatch[1]!.padStart(2, '0');
    const month = dotMatch[2]!.padStart(2, '0');
    const year = dotMatch[3]!;
    return `${year}-${month}-${day}`;
  }

  // DD/MM/YYYY
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const day = slashMatch[1]!.padStart(2, '0');
    const month = slashMatch[2]!.padStart(2, '0');
    const year = slashMatch[3]!;
    return `${year}-${month}-${day}`;
  }

  return trimmed;
}

/**
 * Pomoćna funkcija za parsiranje novčanih iznosa iz teksta
 * Podržava "1.250,50", "1250.50", "-35,00", "+500,00"
 */
export function parsirajIznos(rawIznos: string): number {
  if (!rawIznos) return 0;
  let s = rawIznos.trim().replace(/\s/g, '');
  
  // Ukloni valutu ako postoji
  s = s.replace(/EUR|€/gi, '');

  // Ako sadrži i točku i zarez (npr. "1.250,50")
  if (s.includes('.') && s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',')) {
    // Samo zarez (npr. "1250,50")
    s = s.replace(',', '.');
  }

  const n = parseFloat(s);
  return isNaN(n) ? 0 : round2(Math.abs(n));
}

/**
 * Univerzalni parser bankovnih CSV izvoda za hrvatske banke (ZABA, PBZ, Erste, HPB, OTP)
 * i Revolut Business tabličnih izvoda.
 */
export function parseBankStatementCsv(csvText: string): BankStatementParseResult {
  const lines = csvText
    .replace(/^\uFEFF/, '') // Ukloni UTF-8 BOM ako postoji
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length < 2) {
    throw new Error('CSV datoteka je prazna ili ne sadrži podatke o transakcijama.');
  }

  // Detekcija delimitera (zarez ili točka-zarez)
  const headerLine = lines[0]!;
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  const commaCount = (headerLine.match(/,/g) || []).length;
  const delimiter = semicolonCount >= commaCount ? ';' : ',';

  // Parsiranje zaglavlja
  const headers = headerLine.split(delimiter).map(h => h.trim().toLowerCase().replace(/["']/g, ''));

  // Detekcija indeksa stupaca
  let dateIdx = headers.findIndex(h => h.includes('datum') || h.includes('date') || h.includes('knjiž') || h.includes('valuta'));
  let partnerIdx = headers.findIndex(h => h.includes('partner') || h.includes('platitelj') || h.includes('primatelj') || h.includes('naziv') || h.includes('opis') || h.includes('beneficiary'));
  let amountIdx = headers.findIndex(h => h.includes('iznos') || h.includes('amount') || h.includes('promet') || h.includes('uplata') || h.includes('isplata'));
  let pozivIdx = headers.findIndex(h => h.includes('poziv') || h.includes('referenc') || h.includes('pnb') || h.includes('model'));
  let ibanIdx = headers.findIndex(h => h.includes('iban') || h.includes('račun') || h.includes('account'));

  // Ako poziv nije pronađen, potraži specifičnije
  if (pozivIdx === -1) {
    pozivIdx = headers.findIndex(h => (h.includes('broj') && !h.includes('iban') && !h.includes('izvoda')));
  }

  // Fallback mapiranja ako zaglavlja nisu eksplicitna
  if (dateIdx === -1) dateIdx = 0;
  if (partnerIdx === -1) partnerIdx = Math.min(1, headers.length - 1);
  if (amountIdx === -1) amountIdx = Math.min(2, headers.length - 1);

  const stavke: StavkaIzvoda[] = [];
  let ukupnoUplate = 0;
  let ukupnoIsplate = 0;
  const brojIzvoda = `IZV-${Date.now()}`;
  let datumIzvoda = new Date().toISOString().slice(0, 10);

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i]!.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
    if (row.length < 2) continue;

    const rawDate = row[dateIdx] || '';
    const normDate = normalizirajDatum(rawDate);
    if (i === 1 && normDate) {
      datumIzvoda = normDate;
    }

    const rawPartner = row[partnerIdx] || 'Transakcija';
    const rawAmount = row[amountIdx] || '0';
    const parsedAmount = parsirajIznos(rawAmount);

    if (parsedAmount === 0) continue;

    // Detekcija smjera (je li uplata ili isplata)
    // Ako iznos u retku ima minus ili stupac označava terećenje/isplatu
    const isNegative = rawAmount.includes('-') || 
      (headers[amountIdx]?.includes('isplata') ?? false) || 
      (headers[amountIdx]?.includes('terećenje') ?? false) ||
      (headers[amountIdx]?.includes('debit') ?? false);

    const smjer: SmjerTransakcije = isNegative ? 'ISPLATA' : 'UPLATA';

    if (smjer === 'UPLATA') {
      ukupnoUplate = round2(ukupnoUplate + parsedAmount);
    } else {
      ukupnoIsplate = round2(ukupnoIsplate + parsedAmount);
    }

    const poziv = pozivIdx !== -1 && row[pozivIdx] ? row[pozivIdx] : undefined;
    const iban = ibanIdx !== -1 && row[ibanIdx] ? row[ibanIdx] : undefined;

    stavke.push({
      id: `trx-${Date.now()}-${i}`,
      brojIzvoda,
      datumKnjizenja: normDate || datumIzvoda,
      nazivPartnera: rawPartner,
      ibanPartnera: iban,
      smjer,
      iznosEur: parsedAmount,
      pozivNaBroj: poziv,
      opisPlacanja: rawPartner,
      statusPovezivanja: 'NEPOVEZANO',
    });
  }

  return {
    brojIzvoda,
    datumIzvoda,
    brojStavaka: stavke.length,
    ukupnoUplateEur: round2(ukupnoUplate),
    ukupnoIsplateEur: round2(ukupnoIsplate),
    stavke,
  };
}

/**
 * Pomoćna funkcija za automatsko uparivanje transakcije s izdanim računom
 * Uspoređuje poziv na broj (npr. "HR00 12-2026" ili "12/POSL1/1") i iznos
 */
export function upariTransakcijuSRacunom(
  stavka: StavkaIzvoda,
  dokumenti: Array<{ id: string; brojDokumenta: string; pozivNaBroj?: string; ukupnoIznos: number; status: string }>
): string | null {
  if (stavka.smjer !== 'UPLATA') return null;

  for (const doc of dokumenti) {
    if (doc.status === 'PLACENO') continue;

    // Provjera podudaranja poziva na broj
    if (stavka.pozivNaBroj && doc.pozivNaBroj) {
      const cleanTrxPoziv = stavka.pozivNaBroj.replace(/\D/g, '');
      const cleanDocPoziv = doc.pozivNaBroj.replace(/\D/g, '');
      if (cleanTrxPoziv.length >= 4 && cleanDocPoziv.length >= 4 && cleanTrxPoziv.includes(cleanDocPoziv)) {
        return doc.id;
      }
    }

    // Provjera ako je broj dokumenta (npr. "1/POSL1/1") sadržan u opisu ili pozivu
    if (stavka.opisPlacanja.includes(doc.brojDokumenta) || (stavka.pozivNaBroj && stavka.pozivNaBroj.includes(doc.brojDokumenta))) {
      return doc.id;
    }

    // Provjera točnog iznosa uz podudaranje broja računa
    if (round2(doc.ukupnoIznos) === round2(stavka.iznosEur)) {
      const shortBroj = doc.brojDokumenta.split('/')[0]!;
      if (stavka.opisPlacanja.includes(shortBroj) || (stavka.pozivNaBroj && stavka.pozivNaBroj.includes(shortBroj))) {
        return doc.id;
      }
    }
  }

  return null;
}
