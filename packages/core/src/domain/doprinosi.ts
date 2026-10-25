// packages/core/src/domain/doprinosi.ts

import { round2 } from '../utils/calculator';
import { POREZNI_RAZREDI, type PorezniRazredInfo } from './kpr';

export type StatusDoprinosa = 'CEKA_UPLATU' | 'UPLACENO' | 'PREKORACEN_ROK';

export type TipDjelatnostiObrtnika = 
  | 'GLAVNA_DJELATNOST'       // Obrt je jedino i glavno zanimanje (mjesečni doprinosi)
  | 'DRUGA_DJELATNOST';      // Obrt uz radni odnos (godišnji doprinosi po rješenju)

export interface DoprinosiPostavke {
  godina: number;
  osnovicaMjesecnaEur: number;     // Za 2026: 719,20 €
  stopaMio1: number;               // 0.15 (15%)
  stopaMio2: number;               // 0.05 (5%)
  stopaHzzo: number;               // 0.165 (16.5%)
  ibanDrzavniProracun: string;     // HR1210010051863000160
  ibanRegosMio2: string;           // HR8410010051863000213
  sifraOpćine: string;             // 4 znamenke, npr. "0097" za Dubrovnik
  ibanGradskiProracun?: string;
}

export const DEFAULT_DOPRINOSI_CONFIG_2026: DoprinosiPostavke = {
  godina: 2026,
  osnovicaMjesecnaEur: 719.20,
  stopaMio1: 0.15,
  stopaMio2: 0.05,
  stopaHzzo: 0.165,
  ibanDrzavniProracun: 'HR1210010051863000160',
  ibanRegosMio2: 'HR8410010051863000213',
  sifraOpćine: '0097', // Zadano: Dubrovnik
  ibanGradskiProracun: 'HR1210010051863000160',
};

export const SIFRE_PRIHODA = {
  MIO_1: '8214',
  MIO_2: '2054',
  HZZO: '8478',
  PAUSALNI_POREZ: '1414',
} as const;

export interface PojedinacniNalogDoprinosa {
  naziv: string;                   // npr. "MIO I. stup"
  opis: string;                    // npr. "Doprinos za MIO I 10/2026"
  iznosEur: number;
  ibanPrimatelja: string;
  model: string;                   // "HR68"
  pozivNaBroj: string;             // "8214-79102730089-2610"
  sifraNamjene: string;            // "GOVT"
}

export interface MjesecniObracunDoprinosa {
  id: string;                      // npr. "doprinos-2026-10"
  godina: number;
  mjesec: number;                  // 1-12
  rokPlacanja: string;             // YYYY-MM-DD (15. u idućem mjesecu)
  status: StatusDoprinosa;
  datumUplate?: string;
  
  // 1. MIO I
  iznosMio1Eur: number;
  pozivNaBrojMio1: string;
  ibanMio1: string;

  // 2. MIO II
  iznosMio2Eur: number;
  pozivNaBrojMio2: string;
  ibanMio2: string;

  // 3. HZZO
  iznosHzzoEur: number;
  pozivNaBrojHzzo: string;
  ibanHzzo: string;

  ukupnoDoprinosiEur: number;
}

export interface KvartalniPorezNalog {
  godina: number;
  kvartal: 1 | 2 | 3 | 4;
  rokPlacanja: string;             // YYYY-MM-DD
  razred: 1 | 2 | 3 | 4 | 5;
  iznosPorezaEur: number;
  ibanPrimatelja: string;
  model: string;                   // "HR68"
  pozivNaBroj: string;             // "1414-OIB-SIFRAOPCINE"
  status: 'CEKA_UPLATU' | 'UPLACENO';
  datumUplate?: string;
}

/**
 * Generira standardni poziv na broj modela HR68 za obvezne doprinose:
 * SIFRA_PRIHODA-OIB-GGMM (npr. 8214-79102730089-2610)
 */
export function generirajPozivNaBrojDoprinosa(
  sifraPrihoda: string,
  oib: string,
  godina: number,
  mjesec: number
): string {
  const cistiOib = oib.trim().replace(/\D/g, '');
  const yy = String(godina).slice(-2);
  const mm = String(mjesec).padStart(2, '0');
  return `${sifraPrihoda}-${cistiOib}-${yy}${mm}`;
}

/**
 * Generira poziv na broj modela HR68 za paušalni porez:
 * 1414-OIB-SIFRAOPCINE (npr. 1414-79102730089-0097)
 */
export function generirajPozivNaBrojPoreza(
  oib: string,
  sifraOpcine: string
): string {
  const cistiOib = oib.trim().replace(/\D/g, '');
  const cistaSifra = sifraOpcine.trim().padStart(4, '0');
  return `${SIFRE_PRIHODA.PAUSALNI_POREZ}-${cistiOib}-${cistaSifra}`;
}

/**
 * Izračunava rok plaćanja za doprinose (15. dan idućeg kalendarskog mjeseca)
 */
export function izracunajRokPlacanjaDoprinosa(godina: number, mjesec: number): string {
  let rokGodina = godina;
  let rokMjesec = mjesec + 1;
  if (rokMjesec > 12) {
    rokMjesec = 1;
    rokGodina += 1;
  }
  return `${rokGodina}-${String(rokMjesec).padStart(2, '0')}-15`;
}

/**
 * Izračunava rok plaćanja za kvartalni porez (zadnji dan kvartala)
 */
export function izracunajRokPlacanjaKvartalnogPoreza(godina: number, kvartal: 1 | 2 | 3 | 4): string {
  switch (kvartal) {
    case 1: return `${godina}-03-31`;
    case 2: return `${godina}-06-30`;
    case 3: return `${godina}-09-30`;
    case 4: return `${godina}-12-31`;
  }
}

/**
 * Obračunava mjesečne doprinose za zadani mjesec i godinu
 */
export function obracunajMjesecneDoprinose(
  oib: string,
  godina: number,
  mjesec: number,
  config: DoprinosiPostavke = DEFAULT_DOPRINOSI_CONFIG_2026,
  datumUplate?: string
): MjesecniObracunDoprinosa {
  const osnovica = config.osnovicaMjesecnaEur;
  const iznosMio1 = round2(osnovica * config.stopaMio1);
  const iznosMio2 = round2(osnovica * config.stopaMio2);
  const iznosHzzo = round2(osnovica * config.stopaHzzo);
  const ukupno = round2(iznosMio1 + iznosMio2 + iznosHzzo);

  const rokPlacanja = izracunajRokPlacanjaDoprinosa(godina, mjesec);
  
  // Status
  let status: StatusDoprinosa = 'CEKA_UPLATU';
  if (datumUplate) {
    status = 'UPLACENO';
  } else {
    const today = new Date().toISOString().slice(0, 10);
    if (today > rokPlacanja) {
      status = 'PREKORACEN_ROK';
    }
  }

  return {
    id: `doprinos-${godina}-${String(mjesec).padStart(2, '0')}`,
    godina,
    mjesec,
    rokPlacanja,
    status,
    datumUplate,
    iznosMio1Eur: iznosMio1,
    pozivNaBrojMio1: generirajPozivNaBrojDoprinosa(SIFRE_PRIHODA.MIO_1, oib, godina, mjesec),
    ibanMio1: config.ibanDrzavniProracun,
    iznosMio2Eur: iznosMio2,
    pozivNaBrojMio2: generirajPozivNaBrojDoprinosa(SIFRE_PRIHODA.MIO_2, oib, godina, mjesec),
    ibanMio2: config.ibanRegosMio2,
    iznosHzzoEur: iznosHzzo,
    pozivNaBrojHzzo: generirajPozivNaBrojDoprinosa(SIFRE_PRIHODA.HZZO, oib, godina, mjesec),
    ibanHzzo: config.ibanDrzavniProracun,
    ukupnoDoprinosiEur: ukupno,
  };
}

/**
 * Generira sve mjesečne obveze doprinosa za cijelu kalendarsku godinu
 */
export function generirajGodisnjeDoprinose(
  oib: string,
  godina: number,
  uplaceniMjeseci: Map<number, string> = new Map(),
  config: DoprinosiPostavke = DEFAULT_DOPRINOSI_CONFIG_2026
): MjesecniObracunDoprinosa[] {
  const result: MjesecniObracunDoprinosa[] = [];
  for (let m = 1; m <= 12; m++) {
    const datumUplate = uplaceniMjeseci.get(m);
    result.push(obracunajMjesecneDoprinose(oib, godina, m, config, datumUplate));
  }
  return result;
}

/**
 * Obračunava kvartalne naloge za paušalni porez za cijelu godinu prema važećem poreznom razredu
 */
export function generirajKvartalnePorezneNaloge(
  oib: string,
  godina: number,
  ukupniGodisnjiPrometEur: number,
  uplaceniKvartali: Map<number, string> = new Map(),
  config: DoprinosiPostavke = DEFAULT_DOPRINOSI_CONFIG_2026
): KvartalniPorezNalog[] {
  // Odredi porezni razred
  let razredInfo: PorezniRazredInfo = POREZNI_RAZREDI[0]!;
  for (const r of POREZNI_RAZREDI) {
    if (ukupniGodisnjiPrometEur >= r.donjaGranicaEur && ukupniGodisnjiPrometEur <= r.gornjaGranicaEur) {
      razredInfo = r;
      break;
    }
  }

  const pozivNaBroj = generirajPozivNaBrojPoreza(oib, config.sifraOpćine);
  const iban = config.ibanGradskiProracun || config.ibanDrzavniProracun;

  const nalozi: KvartalniPorezNalog[] = [];
  for (let q = 1 as 1 | 2 | 3 | 4; q <= 4; (q as number)++) {
    const rok = izracunajRokPlacanjaKvartalnogPoreza(godina, q);
    const datumUplate = uplaceniKvartali.get(q);
    nalozi.push({
      godina,
      kvartal: q,
      rokPlacanja: rok,
      razred: razredInfo.razred,
      iznosPorezaEur: razredInfo.tromjesecniPorezEur,
      ibanPrimatelja: iban,
      model: 'HR68',
      pozivNaBroj,
      status: datumUplate ? 'UPLACENO' : 'CEKA_UPLATU',
      datumUplate,
    });
  }

  return nalozi;
}
