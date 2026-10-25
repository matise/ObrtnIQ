// packages/core/src/domain/recurring.ts
// Faza 20: Domenski model za ponavljajuće račune i pretplate (Recurring Invoices / Subscriptions)

import { round2 } from '../utils/calculator';

export type RecurringFrequency = 'MJESECNO' | 'KVARTALNO' | 'GODISNJE';

export interface RecurringItem {
  id?: string;
  naziv: string;
  kolicina: number;
  cijena: number;
  jedinicaMjere?: string;
  kpdSifra?: string;
  kpdNaziv?: string;
  popustPostotak?: number;
}

export interface RecurringProfile {
  id: string;
  nazivPredloska: string;
  partnerId: string;
  partnerNaziv: string;
  partnerOib: string;
  partnerTaxZone: string;
  partnerAdresa?: string;
  partnerIban?: string;
  stavke: RecurringItem[];
  frekvencija: RecurringFrequency;
  danUMjesecu: number; // 1-31
  nacinPlacanja: 'TRANSAKCIJSKI_RACUN' | 'GOTOVINA' | 'KARTICA';
  rokPlacanjaDana: number;
  aktivan: boolean;
  datumPocetka: string; // YYYY-MM-DD
  datumZavrsetka?: string; // YYYY-MM-DD
  zadnjeGeneriranoDatum?: string; // YYYY-MM-DD
  sljedeceDospijeceDatum: string; // YYYY-MM-DD
  biljeska?: string;
}

/**
 * Izračunava ukupni iznos ponavljajućeg predloška u eurima.
 */
export function izracunajUkupnoPretplate(stavke: RecurringItem[]): number {
  if (!stavke || stavke.length === 0) return 0;
  let ukupno = 0;
  for (const item of stavke) {
    const osnovica = item.kolicina * item.cijena;
    const popust = item.popustPostotak ? osnovica * (item.popustPostotak / 100) : 0;
    ukupno += (osnovica - popust);
  }
  return round2(ukupno);
}

/**
 * Pomoćna funkcija za sigurno kreiranje ISO stringa YYYY-MM-DD.
 */
function toDateString(y: number, m: number, d: number): string {
  const mm = String(m).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

/**
 * Vraća broj dana u zadanom mjesecu i godini.
 */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Izračunava sljedeći datum dospijeća za ponavljajući račun.
 * @param bazniDatum Datum od kojeg se računa sljedeći termin (YYYY-MM-DD)
 * @param danUMjesecu Željeni dan u mjesecu (1-31)
 * @param frekvencija 'MJESECNO', 'KVARTALNO' ili 'GODISNJE'
 */
export function izracunajSljedeceDospijece(
  bazniDatum: string,
  danUMjesecu: number,
  frekvencija: RecurringFrequency
): string {
  const parts = bazniDatum.split('-').map((p) => parseInt(p, 10));
  const p0 = parts[0];
  const p1 = parts[1];
  const p2 = parts[2];
  if (parts.length !== 3 || p0 === undefined || p1 === undefined || p2 === undefined || isNaN(p0) || isNaN(p1) || isNaN(p2)) {
    throw new Error(`Neispravan format datuma: ${bazniDatum}. Očekuje se YYYY-MM-DD.`);
  }

  let targetYear: number = p0;
  let targetMonth: number = p1;

  if (frekvencija === 'MJESECNO') {
    targetMonth += 1;
    if (targetMonth > 12) {
      targetMonth = 1;
      targetYear += 1;
    }
  } else if (frekvencija === 'KVARTALNO') {
    targetMonth += 3;
    while (targetMonth > 12) {
      targetMonth -= 12;
      targetYear += 1;
    }
  } else if (frekvencija === 'GODISNJE') {
    targetYear += 1;
  }

  // Provjera maksimalnog broja dana u ciljnom mjesecu (npr. veljača)
  const maxDays = getDaysInMonth(targetYear, targetMonth);
  const targetDay = Math.min(danUMjesecu, maxDays);

  return toDateString(targetYear, targetMonth, targetDay);
}

/**
 * Provjerava je li ponavljajući račun dospio za izdavanje na zadani datum.
 */
export function jeDospjeloZaIzdavanje(
  sljedeceDospijeceDatum: string,
  danasDatum?: string
): boolean {
  const compareDate = danasDatum || new Date().toISOString().slice(0, 10);
  return sljedeceDospijeceDatum <= compareDate;
}

/**
 * Validira profil ponavljajućeg računa prije spremanja.
 */
export function validirajRecurringProfil(profil: Partial<RecurringProfile>): {
  valjano: boolean;
  greske: string[];
} {
  const greske: string[] = [];

  if (!profil.nazivPredloska || !profil.nazivPredloska.trim()) {
    greske.push('Naziv predloška pretplate je obvezan.');
  }

  if (!profil.partnerNaziv || !profil.partnerNaziv.trim()) {
    greske.push('Naziv kupca/partnera je obvezan.');
  }

  if (!profil.stavke || profil.stavke.length === 0) {
    greske.push('Pretplata mora sadržavati barem jednu stavku.');
  } else {
    for (let i = 0; i < profil.stavke.length; i++) {
      const it = profil.stavke[i];
      if (!it) continue;
      if (!it.naziv || !it.naziv.trim()) {
        greske.push(`Stavka #${i + 1} mora imati naziv.`);
      }
      if (it.kolicina <= 0) {
        greske.push(`Stavka #${i + 1} mora imati količinu veću od 0.`);
      }
      if (it.cijena < 0) {
        greske.push(`Stavka #${i + 1} ne može imati negativnu cijenu.`);
      }
    }
  }

  if (!profil.danUMjesecu || profil.danUMjesecu < 1 || profil.danUMjesecu > 31) {
    greske.push('Dan u mjesecu mora biti broj između 1 i 31.');
  }

  if (!profil.frekvencija || !['MJESECNO', 'KVARTALNO', 'GODISNJE'].includes(profil.frekvencija)) {
    greske.push('Frekvencija mora biti MJESECNO, KVARTALNO ili GODISNJE.');
  }

  return {
    valjano: greske.length === 0,
    greske,
  };
}
