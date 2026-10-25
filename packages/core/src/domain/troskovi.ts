// packages/core/src/domain/troskovi.ts

import { round2 } from '../utils/calculator';

export type KategorijaTroska = 
  | 'OPREMA_I_HARDVER'      // Računala, 3D printeri, alati, uredski namještaj
  | 'SOFTVERSKE_PRETPLATE'  // Google Workspace, Figma, JetBrains, GitHub, AI alati
  | 'TELEKOMUNIKACIJE_NET'  // Internet, mobitel, hosting domene
  | 'BANKOVNE_NAKNADE'      // Vođenje poslovnog računa, transakcijske naknade, POS provizije
  | 'UREDSKI_MATERIJAL'     // Papir, toneri, filamenti za 3D print, ambalaža
  | 'KNJIGOVODSTVO_PRAVNO'  // Knjigovodstveni servisi, odvjetnici, bilježnici
  | 'KOMUNALIJE_REZANJE'    // Struja, voda, zakup poslovnog prostora
  | 'EDUKACIJA_I_LITERATURA'// Stručne knjige, tečajevi, certifikati
  | 'GORIVO_I_PUTOVANJA'    // Službena putovanja, loko vožnja, cestarine
  | 'OSTALO_POSLOVNO';

export const KATEGORIJE_TROSKA_LABELS: Record<KategorijaTroska, string> = {
  OPREMA_I_HARDVER: 'Oprema i hardver',
  SOFTVERSKE_PRETPLATE: 'Softverske pretplate & Cloud',
  TELEKOMUNIKACIJE_NET: 'Telekomunikacije i internet',
  BANKOVNE_NAKNADE: 'Bankovne naknade i provizije',
  UREDSKI_MATERIJAL: 'Uredski materijal i sirovine',
  KNJIGOVODSTVO_PRAVNO: 'Knjigovodstvene i pravne usluge',
  KOMUNALIJE_REZANJE: 'Komunalije i zakup prostora',
  EDUKACIJA_I_LITERATURA: 'Edukacija i literatura',
  GORIVO_I_PUTOVANJA: 'Gorivo i službena putovanja',
  OSTALO_POSLOVNO: 'Ostali poslovni izdaci',
};

export const PRAG_DUGOTRAJNE_IMOVINE_EUR = 663.61; // 5.000 HRK u EUR

export interface UlazniTrosak {
  id: string;                      // UUID
  brojUlaznogDokumenta: string;    // Npr. "RAČ-2026-981" ili "INV-04128"
  dobavljacNaziv: string;
  dobavljacOib?: string;
  datumRacuna: string;             // YYYY-MM-DD
  datumDospijeca: string;          // YYYY-MM-DD
  datumPlacanja?: string;          // YYYY-MM-DD (ako je plaćeno)
  kategorija: KategorijaTroska;
  opis: string;                    // Npr. "Godišnja pretplata za Google Cloud i STT v2"
  iznosBezPdvEur: number;
  iznosPdvEur: number;
  ukupnoEur: number;               // Ukupni iznos s PDV-om
  nacinPlacanja: 'TRANSAKCIJSKI_RACUN' | 'KARTICA_POSLOVNA' | 'GOTOVINA';
  status: 'PLACENO' | 'NEPLACENO';
  jeDugotrajnaImovina: boolean;    // Iznad 663,61 € i vijek > 1 god.
  serijskiBrojOpreme?: string;
  prilogDataUrl?: string;          // Opcionalno skeniran PDF ili slika računa
  kreirano?: string;
}

export interface TroskovnikSazetak {
  godina: number;
  brojTroskova: number;
  ukupnoTroskovaEur: number;
  ukupnoPlacenoEur: number;
  ukupnoNeplacenoEur: number;
  poKategorijama: Record<KategorijaTroska, number>;
  dugotrajnaImovinaUkupnoEur: number;
}

/**
 * Pomoćna funkcija koja određuje je li iznos iznad zakonskog praga za dugotrajnu imovinu
 */
export function provjeriPragDugotrajneImovine(iznosEur: number): boolean {
  return iznosEur >= PRAG_DUGOTRAJNE_IMOVINE_EUR;
}

/**
 * Izračunava sažetak troškova za zadanu kalendarsku godinu
 */
export function izracunajTroskovnikSazetak(
  troskovi: UlazniTrosak[],
  godina: number
): TroskovnikSazetak {
  const filtered = troskovi.filter(t => {
    const y = parseInt(t.datumRacuna.slice(0, 4), 10);
    return y === godina;
  });

  let ukupno = 0;
  let placeno = 0;
  let neplaceno = 0;
  let dugotrajna = 0;

  const poKategorijama: Record<KategorijaTroska, number> = {
    OPREMA_I_HARDVER: 0,
    SOFTVERSKE_PRETPLATE: 0,
    TELEKOMUNIKACIJE_NET: 0,
    BANKOVNE_NAKNADE: 0,
    UREDSKI_MATERIJAL: 0,
    KNJIGOVODSTVO_PRAVNO: 0,
    KOMUNALIJE_REZANJE: 0,
    EDUKACIJA_I_LITERATURA: 0,
    GORIVO_I_PUTOVANJA: 0,
    OSTALO_POSLOVNO: 0,
  };

  for (const t of filtered) {
    const iznos = round2(t.ukupnoEur);
    ukupno += iznos;

    if (t.status === 'PLACENO') {
      placeno += iznos;
    } else {
      neplaceno += iznos;
    }

    if (t.jeDugotrajnaImovina) {
      dugotrajna += iznos;
    }

    if (poKategorijama[t.kategorija] !== undefined) {
      poKategorijama[t.kategorija] = round2(poKategorijama[t.kategorija] + iznos);
    }
  }

  return {
    godina,
    brojTroskova: filtered.length,
    ukupnoTroskovaEur: round2(ukupno),
    ukupnoPlacenoEur: round2(placeno),
    ukupnoNeplacenoEur: round2(neplaceno),
    poKategorijama,
    dugotrajnaImovinaUkupnoEur: round2(dugotrajna),
  };
}
