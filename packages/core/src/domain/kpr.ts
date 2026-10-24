// packages/core/src/domain/kpr.ts

import type { 
  NaplataPromet, 
  PosdIzvjestaj, 
  KvartalniSazetak 
} from './types';
import type { IKprRepository, IDokumentRepository } from '../storage/interfaces';
import { round2, toCents, fromCents } from '../utils/calculator';

export interface EvidentirajNaplatuInput {
  dokumentId?: string;
  datumNaplate: string; // YYYY-MM-DD
  iznos: number;
  nacinPlacanja: 'GOTOVINA' | 'TRANSAKCIJSKI_RACUN';
  opisPlatitelja: string;
  brojIzvoda?: string;
}

export interface PorezniRazredInfo {
  razred: 1 | 2 | 3 | 4 | 5;
  donjaGranicaEur: number;
  gornjaGranicaEur: number;
  godisnjaPoreznaOsnovicaEur: number;
  godisnjiPorezEur: number; // 12% na godišnju osnovicu (zakon RH)
  tromjesecniPorezEur: number;
}

/**
 * Tablica poreznih razreda za paušalni obrt u RH (EUR) prema Zakonu o porezu na dohodak
 */
export const POREZNI_RAZREDI: PorezniRazredInfo[] = [
  {
    razred: 1,
    donjaGranicaEur: 0.00,
    gornjaGranicaEur: 11500.00,
    godisnjaPoreznaOsnovicaEur: 1725.00,
    godisnjiPorezEur: 207.00,
    tromjesecniPorezEur: 51.75,
  },
  {
    razred: 2,
    donjaGranicaEur: 11500.01,
    gornjaGranicaEur: 15000.00,
    godisnjaPoreznaOsnovicaEur: 2250.00,
    godisnjiPorezEur: 270.00,
    tromjesecniPorezEur: 67.50,
  },
  {
    razred: 3,
    donjaGranicaEur: 15000.01,
    gornjaGranicaEur: 20000.00,
    godisnjaPoreznaOsnovicaEur: 3000.00,
    godisnjiPorezEur: 360.00,
    tromjesecniPorezEur: 90.00,
  },
  {
    razred: 4,
    donjaGranicaEur: 20000.01,
    gornjaGranicaEur: 30000.00,
    godisnjaPoreznaOsnovicaEur: 4500.00,
    godisnjiPorezEur: 540.00,
    tromjesecniPorezEur: 135.00,
  },
  {
    razred: 5,
    donjaGranicaEur: 30000.01,
    gornjaGranicaEur: 40000.00,
    godisnjaPoreznaOsnovicaEur: 6000.00,
    godisnjiPorezEur: 720.00,
    tromjesecniPorezEur: 180.00,
  },
];

/**
 * Određuje kalendarski kvartal (1, 2, 3 ili 4) na temelju datuma naplate (YYYY-MM-DD)
 */
export function odrediKvartal(datum: string): 1 | 2 | 3 | 4 {
  const parts = datum.split('-');
  const mjesec = parseInt(parts[1] || '1', 10);
  if (mjesec >= 1 && mjesec <= 3) return 1;
  if (mjesec >= 4 && mjesec <= 6) return 2;
  if (mjesec >= 7 && mjesec <= 9) return 3;
  return 4;
}

/**
 * Određuje porezni razred za zadani godišnji iznos naplaćenih primitaka
 */
export function odrediPorezniRazred(ukupnoEur: number): PorezniRazredInfo | null {
  const iznos = Math.max(0, round2(ukupnoEur));
  for (const r of POREZNI_RAZREDI) {
    if (iznos >= r.donjaGranicaEur && iznos <= r.gornjaGranicaEur) {
      return r;
    }
  }
  return null; // Iznad 40.000,00 € (prekoračen prag)
}

/**
 * Evidentira naplatu i unosi stavku u Knjigu Prometa (KPR).
 * U paušalnom obrtu račun ulazi u KPR tek činom uplate!
 */
export async function evidentirajNaplatu(
  kprRepo: IKprRepository,
  docRepo: IDokumentRepository,
  input: EvidentirajNaplatuInput
): Promise<NaplataPromet> {
  if (input.iznos === 0) {
    throw new Error('Iznos uplate ne može biti 0,00 €.');
  }

  const parts = input.datumNaplate.split('-');
  const godina = parseInt(parts[0] || '2026', 10);
  const kvartal = odrediKvartal(input.datumNaplate);

  // Dodjela sekvencijalnog rednog broja KPR stavke za tu kalendarsku godinu
  const zadnjiBroj = await kprRepo.getZadnjiBrojKprStavke(godina);
  const brojKprStavke = zadnjiBroj + 1;

  const iznosGotovina = input.nacinPlacanja === 'GOTOVINA' ? round2(input.iznos) : 0;
  const iznosBezgotovinski = input.nacinPlacanja === 'TRANSAKCIJSKI_RACUN' ? round2(input.iznos) : 0;
  const ukupnoNaplaceno = round2(input.iznos);

  const novaStavka: NaplataPromet = {
    id: `kpr-${godina}-${brojKprStavke}-${Date.now()}`,
    dokumentId: input.dokumentId,
    brojKprStavke,
    datumNaplate: input.datumNaplate,
    iznosGotovina,
    iznosBezgotovinski,
    ukupnoNaplaceno,
    kvartal,
    godina,
    opisPlatitelja: input.opisPlatitelja.trim(),
    brojIzvoda: input.brojIzvoda?.trim(),
  };

  await kprRepo.save(novaStavka);

  // Ako je povezano uz dokument, ažuriraj status dokumenta na PLACENO
  if (input.dokumentId) {
    const doc = await docRepo.getById(input.dokumentId);
    if (doc) {
      await docRepo.update(doc.id, {
        status: 'PLACENO',
      });
    }
  }

  return novaStavka;
}

/**
 * Obračunava kvartalne sažetke (Q1, Q2, Q3, Q4) i priprema podatke za Obrazac PO-SD
 */
export function izracunajKprSazetak(
  kprStavke: NaplataPromet[],
  godina: number,
  obrtInfo: { oib: string; naziv: string }
): PosdIzvjestaj {
  const stavkeGodine = kprStavke.filter((s) => s.godina === godina);

  const kvartali: Record<number, { gotovinaCents: number; bezgotovinskiCents: number }> = {
    1: { gotovinaCents: 0, bezgotovinskiCents: 0 },
    2: { gotovinaCents: 0, bezgotovinskiCents: 0 },
    3: { gotovinaCents: 0, bezgotovinskiCents: 0 },
    4: { gotovinaCents: 0, bezgotovinskiCents: 0 },
  };

  for (const s of stavkeGodine) {
    const q = s.kvartal;
    const currentQ = kvartali[q];
    if (currentQ) {
      currentQ.gotovinaCents += toCents(s.iznosGotovina);
      currentQ.bezgotovinskiCents += toCents(s.iznosBezgotovinski);
    }
  }

  const buildKvartal = (q: 1 | 2 | 3 | 4): KvartalniSazetak => {
    const item = kvartali[q] || { gotovinaCents: 0, bezgotovinskiCents: 0 };
    const gEur = fromCents(item.gotovinaCents);
    const bEur = fromCents(item.bezgotovinskiCents);
    return {
      kvartal: q,
      gotovinaUkupno: gEur,
      bezgotovinskiUkupno: bEur,
      ukupno: round2(gEur + bEur),
    };
  };

  const q1 = buildKvartal(1);
  const q2 = buildKvartal(2);
  const q3 = buildKvartal(3);
  const q4 = buildKvartal(4);

  const ukupnoGodina = round2(q1.ukupno + q2.ukupno + q3.ukupno + q4.ukupno);
  const zakonskiPrag = 40000.00; // Zakonski limit za paušalni obrt u RH

  return {
    godina,
    obrtOib: obrtInfo.oib,
    obrtNaziv: obrtInfo.naziv,
    q1,
    q2,
    q3,
    q4,
    ukupnoGodina,
    zakonskiPrag,
    prekoracenPrag: ukupnoGodina > zakonskiPrag,
  };
}
