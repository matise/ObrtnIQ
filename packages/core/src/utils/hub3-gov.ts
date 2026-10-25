// packages/core/src/utils/hub3-gov.ts

import { generateHub3Payload, type Hub3Nalog } from './hub3';
import { generateEpcQrPayload } from './epc-qr';
import type { PojedinacniNalogDoprinosa, KvartalniPorezNalog } from '../domain/doprinosi';

export interface ObrtPlatiteljInfo {
  naziv: string;
  adresa: string;
  grad: string;
  oib: string;
}

/**
 * Generira HUB-3 PDF417 tekstualni payload za uplatu doprinosa u Državni proračun ili REGOS
 */
export function generateHub3ForDoprinos(
  platitelj: ObrtPlatiteljInfo,
  nalog: PojedinacniNalogDoprinosa
): string {
  const hub3Data: Hub3Nalog = {
    iznosEur: nalog.iznosEur,
    platiteljImeAdresa: `${platitelj.naziv}, ${platitelj.adresa}`,
    primateljImeAdresa: nalog.ibanPrimatelja.includes('000213') 
      ? 'REGOS - MIO II. stup, Zagreb' 
      : 'Državni proračun RH, Zagreb',
    primateljIban: nalog.ibanPrimatelja,
    model: nalog.model,
    pozivNaBroj: nalog.pozivNaBroj,
    sifraNamjene: nalog.sifraNamjene || 'GOVT',
    opisPlacanja: nalog.opis,
  };

  return generateHub3Payload(hub3Data);
}

/**
 * Generira HUB-3 PDF417 tekstualni payload za uplatu kvartalnog paušalnog poreza
 */
export function generateHub3ForPorez(
  platitelj: ObrtPlatiteljInfo,
  porezNalog: KvartalniPorezNalog,
  nazivOpcine: string = 'Gradski proračun'
): string {
  const hub3Data: Hub3Nalog = {
    iznosEur: porezNalog.iznosPorezaEur,
    platiteljImeAdresa: `${platitelj.naziv}, ${platitelj.adresa}`,
    primateljImeAdresa: `${nazivOpcine}, Paušalni porez`,
    primateljIban: porezNalog.ibanPrimatelja,
    model: porezNalog.model,
    pozivNaBroj: porezNalog.pozivNaBroj,
    sifraNamjene: 'GOVT',
    opisPlacanja: `Paušalni porez Q${porezNalog.kvartal}/${porezNalog.godina}`,
  };

  return generateHub3Payload(hub3Data);
}

/**
 * Generira EPC SEPA QR kod payload za uplatu doprinosa ili poreza
 */
export function generateEpcQrForGovPayment(
  nalog: {
    nazivPrimatelja: string;
    iban: string;
    iznosEur: number;
    model: string;
    pozivNaBroj: string;
    opis: string;
  }
): string {
  return generateEpcQrPayload({
    bic: '',
    primateljIme: nalog.nazivPrimatelja.slice(0, 70),
    primateljIban: nalog.iban.replace(/\s+/g, ''),
    iznosEur: nalog.iznosEur,
    svrhaKod: 'GOVT',
    pozivNaBroj: `${nalog.model} ${nalog.pozivNaBroj}`,
    opisPlacanja: nalog.opis.slice(0, 140),
  });
}
