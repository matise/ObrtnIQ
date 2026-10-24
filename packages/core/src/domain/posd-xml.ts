// packages/core/src/domain/posd-xml.ts

import type { PosdIzvjestaj } from './types';
import { validateOib } from '../utils/oib';
import { odrediPorezniRazred } from './kpr';
import { round2 } from '../utils/calculator';

export interface PosdXmlParams {
  izvjestaj: PosdIzvjestaj;
  vlasnikImePrezime?: string;
  adresa?: string;
  djelatnostNkd?: string;
  datumPodnosenja?: string;
}

export interface PosdValidationResult {
  valid: boolean;
  errors: string[];
  godina?: number;
  oib?: string;
  ukupnoPrimici?: number;
  porezniRazred?: number;
}

/**
 * Generira službeni XML za Obrazac PO-SD (Pravilnik o paušalnom oporezivanju RH / ePorezna)
 */
export function generatePosdXml(params: PosdXmlParams): string {
  const { izvjestaj } = params;
  const oibClean = izvjestaj.obrtOib.trim();

  if (!validateOib(oibClean)) {
    throw new Error(`Neispravan OIB obveznika za PO-SD obrazac: "${oibClean}".`);
  }

  const razredInfo = odrediPorezniRazred(izvjestaj.ukupnoGodina);
  const razredBroj = razredInfo ? razredInfo.razred : 5;
  const poreznaOsnovica = razredInfo ? razredInfo.godisnjaPoreznaOsnovicaEur.toFixed(2) : '0.00';
  const godisnjiPorez = razredInfo ? razredInfo.godisnjiPorezEur.toFixed(2) : '0.00';

  const nowIso = new Date().toISOString();
  const datumPodnosenja = params.datumPodnosenja || `${izvjestaj.godina + 1}-01-15`;
  const datumOd = `${izvjestaj.godina}-01-01`;
  const datumDo = `${izvjestaj.godina}-12-31`;

  const escapeXml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ObrazacPOSD xmlns="http://e-porezna.porezna-uprava.hr/sheme/zahtjevi/ObrazacPOSD/v2_0" verzijaSheme="2.0">
  <Metapodaci>
    <Naslov>Izvješće o paušalnom dohotku od samostalne djelatnosti (Obrazac PO-SD)</Naslov>
    <DatumGeneriranja>${nowIso}</DatumGeneriranja>
    <Generator>ObrtnIQ v3.0 Local-First Engine</Generator>
  </Metapodaci>
  <Zaglavlje>
    <RazdobljeOd>${datumOd}</RazdobljeOd>
    <RazdobljeDo>${datumDo}</RazdobljeDo>
    <DatumPodnosenja>${datumPodnosenja}</DatumPodnosenja>
    <PorezniObveznik>
      <OIB>${oibClean}</OIB>
      <Naziv>${escapeXml(izvjestaj.obrtNaziv)}</Naziv>
      <ImePrezime>${escapeXml(params.vlasnikImePrezime || izvjestaj.obrtNaziv)}</ImePrezime>
      <Adresa>${escapeXml(params.adresa || 'Hrvatska')}</Adresa>
      <DjelatnostNKD>${escapeXml(params.djelatnostNkd || '62.01')}</DjelatnostNKD>
    </PorezniObveznik>
  </Zaglavlje>
  <PodaciOPrometu>
    <Kvartal1>
      <Gotovina>${izvjestaj.q1.gotovinaUkupno.toFixed(2)}</Gotovina>
      <Bezgotovinski>${izvjestaj.q1.bezgotovinskiUkupno.toFixed(2)}</Bezgotovinski>
      <Ukupno>${izvjestaj.q1.ukupno.toFixed(2)}</Ukupno>
    </Kvartal1>
    <Kvartal2>
      <Gotovina>${izvjestaj.q2.gotovinaUkupno.toFixed(2)}</Gotovina>
      <Bezgotovinski>${izvjestaj.q2.bezgotovinskiUkupno.toFixed(2)}</Bezgotovinski>
      <Ukupno>${izvjestaj.q2.ukupno.toFixed(2)}</Ukupno>
    </Kvartal2>
    <Kvartal3>
      <Gotovina>${izvjestaj.q3.gotovinaUkupno.toFixed(2)}</Gotovina>
      <Bezgotovinski>${izvjestaj.q3.bezgotovinskiUkupno.toFixed(2)}</Bezgotovinski>
      <Ukupno>${izvjestaj.q3.ukupno.toFixed(2)}</Ukupno>
    </Kvartal3>
    <Kvartal4>
      <Gotovina>${izvjestaj.q4.gotovinaUkupno.toFixed(2)}</Gotovina>
      <Bezgotovinski>${izvjestaj.q4.bezgotovinskiUkupno.toFixed(2)}</Bezgotovinski>
      <Ukupno>${izvjestaj.q4.ukupno.toFixed(2)}</Ukupno>
    </Kvartal4>
    <UkupnoOstvareniPrimici>${izvjestaj.ukupnoGodina.toFixed(2)}</UkupnoOstvareniPrimici>
    <PorezniRazred>${razredBroj}</PorezniRazred>
    <GodisnjaPoreznaOsnovica>${poreznaOsnovica}</GodisnjaPoreznaOsnovica>
    <GodisnjiPorezniDug>${godisnjiPorez}</GodisnjiPorezniDug>
  </PodaciOPrometu>
</ObrazacPOSD>`;

  return xml.trim();
}

/**
 * Validira generiranu PO-SD XML datoteku protiv službenih pravila Porezne uprave
 */
export function validatePosdXml(xmlString: string): PosdValidationResult {
  const errors: string[] = [];

  // 1. Sintaksna provjera zaglavlja
  if (!xmlString.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) {
    errors.push('XML mora započeti sa standardnom deklaracijom <?xml version="1.0" encoding="UTF-8"?>.');
  }

  if (!xmlString.includes('<ObrazacPOSD') || !xmlString.includes('</ObrazacPOSD>')) {
    errors.push('Nedostaje korijenski element <ObrazacPOSD>.');
  }

  if (!xmlString.includes('xmlns="http://e-porezna.porezna-uprava.hr/sheme/zahtjevi/ObrazacPOSD/v2_0"')) {
    errors.push('Neispravan XML namespace za ePoreznu PO-SD v2.0.');
  }

  // 2. Provjera OIB-a
  const oibMatch = xmlString.match(/<OIB>(\d{11})<\/OIB>/);
  const oib = oibMatch ? oibMatch[1] : undefined;
  if (!oib || !validateOib(oib)) {
    errors.push(`Neispravan ili nepostojeći OIB u XML-u: "${oib}".`);
  }

  // 3. Provjera razdoblja i godine
  const razdobljeOdMatch = xmlString.match(/<RazdobljeOd>(\d{4})-\d{2}-\d{2}<\/RazdobljeOd>/);
  const godina = razdobljeOdMatch && razdobljeOdMatch[1] ? parseInt(razdobljeOdMatch[1], 10) : undefined;
  if (!godina) {
    errors.push('Nedostaje ili je neispravan element <RazdobljeOd>.');
  }

  // 4. Provjera kvartala i matematičkog zbroja
  const extractKvartal = (qNum: number): { g: number; b: number; u: number } => {
    const qBlock = xmlString.match(new RegExp(`<Kvartal${qNum}>([\\s\\S]*?)<\\/Kvartal${qNum}>`));
    if (!qBlock || !qBlock[1]) return { g: 0, b: 0, u: 0 };
    const content = qBlock[1];
    const gMatch = content.match(/<Gotovina>([\d.]+)<\/Gotovina>/);
    const bMatch = content.match(/<Bezgotovinski>([\d.]+)<\/Bezgotovinski>/);
    const uMatch = content.match(/<Ukupno>([\d.]+)<\/Ukupno>/);
    const g = parseFloat(gMatch && gMatch[1] ? gMatch[1] : '0');
    const b = parseFloat(bMatch && bMatch[1] ? bMatch[1] : '0');
    const u = parseFloat(uMatch && uMatch[1] ? uMatch[1] : '0');
    return { g, b, u };
  };

  const q1 = extractKvartal(1);
  const q2 = extractKvartal(2);
  const q3 = extractKvartal(3);
  const q4 = extractKvartal(4);

  // Provjera sume unutar svakog kvartala
  [q1, q2, q3, q4].forEach((q, idx) => {
    if (round2(q.g + q.b) !== round2(q.u)) {
      errors.push(`Matematička neusklađenost u Kvartalu ${idx + 1}: Gotovina (${q.g}) + Bezgotovinski (${q.b}) != Ukupno (${q.u}).`);
    }
  });

  // Provjera ukupnog zbroja
  const ukupnoPrimiciMatch = xmlString.match(/<UkupnoOstvareniPrimici>([\d.]+)<\/UkupnoOstvareniPrimici>/);
  const ukupnoPrimici = ukupnoPrimiciMatch && ukupnoPrimiciMatch[1] ? parseFloat(ukupnoPrimiciMatch[1]) : 0;
  const sumaKvartala = round2(q1.u + q2.u + q3.u + q4.u);

  if (round2(ukupnoPrimici) !== sumaKvartala) {
    errors.push(`Neusklađena ukupna suma: Zbroj kvartala (${sumaKvartala} €) se ne podudara s <UkupnoOstvareniPrimici> (${ukupnoPrimici} €).`);
  }

  const razredMatch = xmlString.match(/<PorezniRazred>(\d)<\/PorezniRazred>/);
  const porezniRazred = razredMatch && razredMatch[1] ? parseInt(razredMatch[1], 10) : undefined;

  return {
    valid: errors.length === 0,
    errors,
    godina,
    oib,
    ukupnoPrimici,
    porezniRazred,
  };
}
