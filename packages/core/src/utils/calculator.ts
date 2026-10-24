import { coreLogger } from '../logger';

/**
 * Precizni financijski kalkulator za ObrtnIQ
 * Uklanja IEEE 754 float greške korištenjem integer-in-cents aritmetike i definiranog zaokruživanja na 2 decimale.
 */

export interface KalkulacijaStavkeInput {
  kolicina: number;
  jedinicnaCijena: number; // EUR
  popustPostotak?: number; // 0 - 100
  stopaPdv?: number; // 0, 5, 13, 25...
}

export interface KalkulacijaStavkeOutput {
  kolicina: number;
  jedinicnaCijena: number;
  popustPostotak: number;
  iznosPrijePopusta: number;
  iznosPopusta: number;
  osnovica: number;
  stopaPdv: number;
  iznosPdv: number;
  ukupno: number;
}

export interface RekapitulacijaPorezaStavka {
  stopaPdv: number;
  osnovica: number;
  iznosPdv: number;
  ukupno: number;
}

export interface RekapitulacijaDokumentaOutput {
  ukupnoOsnovica: number;
  ukupnoPdv: number;
  ukupnoIznos: number;
  rekapitulacijaPoreza: RekapitulacijaPorezaStavka[];
}

export interface PaušalniPragStatus {
  ukupnoNaplacenoEur: number;
  zakonskiPragEur: number;
  postotakIskoristenosti: number;
  preostaloDoPragaEur: number;
  upozorenje75: boolean;
  upozorenje90: boolean;
  prekoracenPrag: boolean;
}

/**
 * Zaokružuje decimalni broj na 2 decimale uz izbjegavanje float anomalija
 */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Prebacuje iznos u eurima u cjelobrojne cente (integer)
 */
export function toCents(eur: number): number {
  return Math.round((eur + Number.EPSILON) * 100);
}

/**
 * Prebacuje cjelobrojne cente u eure
 */
export function fromCents(cents: number): number {
  return cents / 100;
}

/**
 * Izračunava sve financijske elemente jedne stavke dokumenta
 */
export function calculateStavka(input: KalkulacijaStavkeInput): KalkulacijaStavkeOutput {
  const kolicina = Number.isFinite(input.kolicina) ? Math.max(0, input.kolicina) : 0;
  const jedinicnaCijena = Number.isFinite(input.jedinicnaCijena) ? input.jedinicnaCijena : 0;
  const popustPostotak = Number.isFinite(input.popustPostotak) ? Math.min(100, Math.max(0, input.popustPostotak!)) : 0;
  const stopaPdv = Number.isFinite(input.stopaPdv) ? Math.max(0, input.stopaPdv!) : 0;

  // Ukupno prije popusta
  const iznosPrijePopusta = round2(kolicina * jedinicnaCijena);

  // Popust
  const iznosPopusta = round2(iznosPrijePopusta * (popustPostotak / 100));

  // Osnovica nakon popusta
  const osnovica = round2(iznosPrijePopusta - iznosPopusta);

  // PDV
  const iznosPdv = round2(osnovica * (stopaPdv / 100));

  // Ukupan iznos sa PDV-om
  const ukupno = round2(osnovica + iznosPdv);

  if (input.popustPostotak !== undefined && (input.popustPostotak < 0 || input.popustPostotak > 100)) {
    coreLogger.scope('CALC:STAVKA').warn(`Neispravan postotak popusta (${input.popustPostotak}%), normalizirano na 0-100.`);
  }

  coreLogger.scope('CALC:STAVKA').verbose(`Izračunata stavka: ${kolicina} kom * ${jedinicnaCijena} EUR - ${popustPostotak}% popusta = ${ukupno} EUR`);

  return {
    kolicina,
    jedinicnaCijena,
    popustPostotak,
    iznosPrijePopusta,
    iznosPopusta,
    osnovica,
    stopaPdv,
    iznosPdv,
    ukupno,
  };
}

/**
 * Izračunava ukupne rekapitularne iznose i raspodjelu poreza za listu stavki
 */
export function calculateDocumentTotals(
  stavke: Array<{
    osnovica: number;
    stopaPdv: number;
    iznosPdv: number;
    ukupno: number;
  }>
): RekapitulacijaDokumentaOutput {
  let ukupnoOsnovicaCents = 0;
  let ukupnoPdvCents = 0;
  let ukupnoIznosCents = 0;

  const porezGrupe: Map<number, { osnovicaCents: number; pdvCents: number; ukupnoCents: number }> = new Map();

  for (const stavka of stavke) {
    const oCents = toCents(stavka.osnovica);
    const pCents = toCents(stavka.iznosPdv);
    const uCents = toCents(stavka.ukupno);

    ukupnoOsnovicaCents += oCents;
    ukupnoPdvCents += pCents;
    ukupnoIznosCents += uCents;

    const stopa = stavka.stopaPdv;
    const postojecaGrupa = porezGrupe.get(stopa) || { osnovicaCents: 0, pdvCents: 0, ukupnoCents: 0 };
    postojecaGrupa.osnovicaCents += oCents;
    postojecaGrupa.pdvCents += pCents;
    postojecaGrupa.ukupnoCents += uCents;
    porezGrupe.set(stopa, postojecaGrupa);
  }

  const rekapitulacijaPoreza: RekapitulacijaPorezaStavka[] = Array.from(porezGrupe.entries())
    .map(([stopaPdv, data]) => ({
      stopaPdv,
      osnovica: fromCents(data.osnovicaCents),
      iznosPdv: fromCents(data.pdvCents),
      ukupno: fromCents(data.ukupnoCents),
    }))
    .sort((a, b) => a.stopaPdv - b.stopaPdv);

  const totals = {
    ukupnoOsnovica: fromCents(ukupnoOsnovicaCents),
    ukupnoPdv: fromCents(ukupnoPdvCents),
    ukupnoIznos: fromCents(ukupnoIznosCents),
    rekapitulacijaPoreza,
  };

  coreLogger.scope('CALC:TOTALS').debug(`Izračunat ukupni iznos dokumenta: ${totals.ukupnoIznos} EUR (${stavke.length} stavki).`);

  return totals;
}

/**
 * Izračunava status poreznog praga za paušalni obrt (40.000,00 EUR)
 */
export function calculatePausalniPragStatus(
  ukupnoNaplacenoEur: number,
  zakonskiPragEur: number = 40000
): PaušalniPragStatus {
  const naplaceno = Math.max(0, round2(ukupnoNaplacenoEur));
  const prag = Math.max(1, round2(zakonskiPragEur));

  const postotak = round2((naplaceno / prag) * 100);
  const preostalo = round2(prag - naplaceno);

  return {
    ukupnoNaplacenoEur: naplaceno,
    zakonskiPragEur: prag,
    postotakIskoristenosti: postotak,
    preostaloDoPragaEur: preostalo,
    upozorenje75: postotak >= 75 && postotak < 90,
    upozorenje90: postotak >= 90 && postotak <= 100,
    prekoracenPrag: naplaceno > prag,
  };
}
