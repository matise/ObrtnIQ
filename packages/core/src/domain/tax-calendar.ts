// packages/core/src/domain/tax-calendar.ts
// Faza 20: Službeni porezni kalendar Republike Hrvatske za paušalne obrte

export type TaxDeadlineType = 'DOPRINOSI' | 'PAUSALNI_POREZ' | 'POSD_OBRAZAC' | 'POREZNA_PRIJAVA';
export type TaxDeadlineStatus = 'CEKA_UPLATU' | 'UPLACENO' | 'PREKORACENO' | 'PREDANO';

export interface TaxDeadlineEntry {
  id: string;
  vrsta: TaxDeadlineType;
  naslov: string;
  opis: string;
  datumDospijeca: string; // YYYY-MM-DD
  godina: number;
  mjesec?: number; // 1-12
  kvartal?: 1 | 2 | 3 | 4;
  okvirniIznosEur?: number;
  primateljNaziv: string;
  primateljIban: string;
  model: string;
  pozivNaBroj: string;
  zakonskaOsnova: string;
}

/**
 * Pomoćna funkcija za siguran string datuma.
 */
function toDateStr(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/**
 * Generira službeni porezni kalendar za paušalnog obrtnika za zadanu godinu.
 * @param godina Porezna godina (npr. 2026)
 * @param oib OIB vlasnika obrta za uplatnice
 */
export function generirajPorezniKalendar(godina: number, oib: string = '00000000000'): TaxDeadlineEntry[] {
  const entries: TaxDeadlineEntry[] = [];

  // 1. Predaja Obrasca PO-SD za prethodnu godinu (15. siječnja)
  entries.push({
    id: `posd_${godina}_1501`,
    vrsta: 'POSD_OBRAZAC',
    naslov: `Predaja Obrasca PO-SD za ${godina - 1}. godinu`,
    opis: `Zakonski rok za predaju izvješća o paušalnom dohotku Poreznoj upravi putem sustava ePorezna.`,
    datumDospijeca: toDateStr(godina, 1, 15),
    godina,
    primateljNaziv: 'Porezna uprava RH',
    primateljIban: 'HR1210010051863000160',
    model: 'HR68',
    pozivNaBroj: `8443-${oib}`,
    zakonskaOsnova: 'Članak 82. Zakona o porezu na dohodak i Pravilnik o paušalnom oporezivanju',
  });

  // 2. Mjesečni doprinosi (MIO I, MIO II, HZZO) - dospijevaju 15. u svakom mjesecu za prethodni mjesec
  const imenaMjeseci = [
    'siječanj', 'veljaču', 'ožujak', 'travanj', 'svibanj', 'lipanj',
    'srpanj', 'kolovoz', 'rujan', 'listopad', 'studeni', 'prosinac'
  ];

  for (let m = 1; m <= 12; m++) {
    const obracunskiMjesecIme = imenaMjeseci[m - 1];
    // Dospijeće je 15. u sljedećem mjesecu (ili u siječnju sljedeće godine za prosinac)
    let dospijeceGodina = godina;
    let dospijeceMjesec = m + 1;
    if (dospijeceMjesec > 12) {
      dospijeceMjesec = 1;
      dospijeceGodina = godina + 1;
    }

    entries.push({
      id: `doprinosi_${godina}_m${m}`,
      vrsta: 'DOPRINOSI',
      naslov: `Obvezni doprinosi za ${obracunskiMjesecIme} ${godina}.`,
      opis: `MIO I (15%), MIO II (5%) i HZZO (16.5%) doprinosi za samostalnu djelatnost obrta.`,
      datumDospijeca: toDateStr(dospijeceGodina, dospijeceMjesec, 15),
      godina,
      mjesec: m,
      okvirniIznosEur: 219.04, // Referentni iznos za puno radno vrijeme 2026.
      primateljNaziv: 'Državni proračun RH - Doprinosi',
      primateljIban: 'HR1210010051863000160',
      model: 'HR68',
      pozivNaBroj: `8443-${oib}`,
      zakonskaOsnova: 'Zakon o doprinosima RH (čl. 68)',
    });
  }

  // 3. Kvartalni paušalni porez na dohodak (dospijeva zadnji dan svakog kvartala)
  const kvartali: { kvartal: 1 | 2 | 3 | 4; m: number; d: number }[] = [
    { kvartal: 1, m: 3, d: 31 },
    { kvartal: 2, m: 6, d: 30 },
    { kvartal: 3, m: 9, d: 30 },
    { kvartal: 4, m: 12, d: 31 },
  ];

  for (const q of kvartali) {
    entries.push({
      id: `porez_${godina}_q${q.kvartal}`,
      vrsta: 'PAUSALNI_POREZ',
      naslov: `Paušalni porez na dohodak – Q${q.kvartal}/${godina}.`,
      opis: `Akontacija paušalnog poreza na dohodak za ${q.kvartal}. kvartal ${godina}. godine.`,
      datumDospijeca: toDateStr(godina, q.m, q.d),
      godina,
      kvartal: q.kvartal,
      okvirniIznosEur: 67.50, // Prosječni kvartalni razred (270 € / 4)
      primateljNaziv: 'Proračun općine/grada - Porez na dohodak',
      primateljIban: 'HR1210010051863000160',
      model: 'HR68',
      pozivNaBroj: `1414-${oib}`,
      zakonskaOsnova: 'Članak 82. Zakona o porezu na dohodak',
    });
  }

  // Sortiraj kronološki po datumu dospijeća
  return entries.sort((a, b) => a.datumDospijeca.localeCompare(b.datumDospijeca));
}

/**
 * Izračunava broj preostalih dana do zadanog datuma dospijeća.
 * Pozitivan broj = preostalo dana u budućnosti.
 * 0 = danas dospijeva.
 * Negativan broj = prekoračeno dana.
 */
export function izracunajPreostaleDane(datumDospijeca: string, referentniDatum?: string): number {
  const danasStr = referentniDatum || new Date().toISOString().slice(0, 10);
  const tDanas = new Date(danasStr).getTime();
  const tDospijece = new Date(datumDospijeca).getTime();
  const diffMs = tDospijece - tDanas;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Određuje status poreznog roka s obzirom na preostale dane i potvrdu uplate.
 */
export function odrediStatusRoka(preostaloDana: number, jePlaceno: boolean): TaxDeadlineStatus {
  if (jePlaceno) return 'UPLACENO';
  if (preostaloDana < 0) return 'PREKORACENO';
  return 'CEKA_UPLATU';
}

/**
 * Pronalazi sljedeći nadolazeći porezni rok koji još nije prošao ili je unutar 30 dana.
 */
export function dohvatiSljedeciPorezniRok(
  rokovi: TaxDeadlineEntry[],
  referentniDatum?: string
): { rok: TaxDeadlineEntry; preostaloDana: number; jeHitno: boolean } | null {
  const danasStr = referentniDatum || new Date().toISOString().slice(0, 10);

  // Filtriraj rokove koji dospijevaju danas ili u budućnosti, ili su prekoračeni prije manje od 15 dana
  const relevantni = rokovi
    .map((rok) => {
      const preostaloDana = izracunajPreostaleDane(rok.datumDospijeca, danasStr);
      return {
        rok,
        preostaloDana,
        jeHitno: preostaloDana >= 0 && preostaloDana <= 7,
      };
    })
    .filter((item) => item.preostaloDana >= -15)
    .sort((a, b) => a.preostaloDana - b.preostaloDana);

  return (relevantni.length > 0 && relevantni[0]) ? relevantni[0] : null;
}
