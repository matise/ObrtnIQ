// packages/core/src/utils/cashflow.ts

import { round2 } from './calculator';

export interface CashFlowAnalizaInput {
  ukupnoNaplacenoKprEur: number;     // KPR ukupni primici
  ukupnoPlaceniTroskoviEur: number;  // Troškovnik plaćeni izdaci
  ukupnoPlaceniDoprinosiEur: number; // MIO 1 + MIO 2 + HZZO
  ukupnoPlaceniPorezEur: number;     // Paušalni porez
  zakonskiPragEur?: number;          // Zadano: 40.000,00 €
}

export interface CashFlowRezultat {
  ukupniPrimiciEur: number;
  ukupniIzdaciEur: number;
  netoDobitEur: number;
  poreznoOpterecenjePostotak: number; // (doprinosi + porez) / primici * 100
  profitnaMarzaPostotak: number;      // netoDobit / primici * 100
  preostaloDoPragaEur: number;
  postotakIskoristenostiPraga: number;
}

/**
 * Izračunava cjeloviti Cash-Flow i financijski rezultat obrta
 */
export function izracunajCashFlow(input: CashFlowAnalizaInput): CashFlowRezultat {
  const primici = round2(input.ukupnoNaplacenoKprEur);
  const troskovi = round2(input.ukupnoPlaceniTroskoviEur);
  const doprinosi = round2(input.ukupnoPlaceniDoprinosiEur);
  const porez = round2(input.ukupnoPlaceniPorezEur);
  const prag = input.zakonskiPragEur ?? 40000;

  const ukupniIzdaciEur = round2(troskovi + doprinosi + porez);
  const netoDobit = round2(primici - ukupniIzdaciEur);

  const javnaDavanja = round2(doprinosi + porez);
  const poreznoOpterecenjePostotak = primici > 0 
    ? round2((javnaDavanja / primici) * 100) 
    : 0;

  const profitnaMarzaPostotak = primici > 0 
    ? round2((netoDobit / primici) * 100) 
    : 0;

  const preostaloDoPraga = round2(Math.max(0, prag - primici));
  const postotakIskoristenostiPraga = round2(Math.min(100, (primici / prag) * 100));

  return {
    ukupniPrimiciEur: primici,
    ukupniIzdaciEur,
    netoDobitEur: netoDobit,
    poreznoOpterecenjePostotak,
    profitnaMarzaPostotak,
    preostaloDoPragaEur: preostaloDoPraga,
    postotakIskoristenostiPraga,
  };
}
