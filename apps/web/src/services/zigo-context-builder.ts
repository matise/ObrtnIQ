import type {
  LiveScreenContextSnapshot,
  ActiveScreenView,
  ContextualActionChip,
  ScreenInvoiceSnapshot,
  ScreenFinancialRadarSnapshot,
  ScreenSystemTelemetrySnapshot,
} from '../types/zigo-context';
import type { FormItem } from '../engine/types';
import type { PoreznaZona } from '@obrtniq/core';

export interface BuildContextInput {
  activeScreen?: ActiveScreenView;
  openDrawers?: Record<string, boolean>;
  form?: {
    partnerNaziv?: string;
    oib?: string;
    isOibValid?: boolean;
    iban?: string;
    isIbanValid?: boolean;
    taxZone?: PoreznaZona;
    nacinPlacanja?: string;
    datumIzdavanja?: string;
    datumDospijeca?: string;
    datumIsporuke?: string;
  };
  items?: {
    items?: FormItem[];
    ukupniIznos?: number;
  };
  workflow?: {
    docType?: string;
    docStatus?: string;
    brojDokumenta?: string;
  };
  stats?: {
    kprTotalEur?: number;
  };
  telemetry?: {
    isOnline?: boolean;
    isGoogleDriveConnected?: boolean;
    googleDriveUserEmail?: string;
    geminiModel?: string;
    hasGeminiKey?: boolean;
    posljednjaGreska?: {
      poruka: string;
      vrijeme: string;
      scope?: string;
    };
    posljednjiWarn?: {
      poruka: string;
      vrijeme: string;
      scope?: string;
    };
  };
  currentDate?: Date;
}

export const PAUSALNI_PRAG_EUR = 40000;

/**
 * Gradi strukturirani snimak ekrana u stvarnom vremenu (Omni-Context Snapshot)
 */
export function buildLiveScreenContextSnapshot(input: BuildContextInput): LiveScreenContextSnapshot {
  const now = input.currentDate || new Date();
  const danUTjednu = now.getDay(); // 0 = nedjelja
  const sat = now.getHours();

  // Fjaka mode: nedjelja nakon 20h ili bilo koji dan nakon 23h / prije 05h
  const jeLiVikend = danUTjednu === 0 || danUTjednu === 6;
  const jeLiKasnoNoc = (danUTjednu === 0 && sat >= 20) || (sat >= 23 || sat < 5);

  // Otvoreni draweri
  const otvoreniDraweri: string[] = [];
  if (input.openDrawers) {
    for (const [key, val] of Object.entries(input.openDrawers)) {
      if (val) otvoreniDraweri.push(key);
    }
  }

  // Određivanje aktivnog ekrana ako nije eksplicitno zadan
  let aktivniEkran: ActiveScreenView = input.activeScreen || 'InvoiceDesk';
  if (!input.activeScreen && input.openDrawers) {
    if (input.openDrawers.isKprDrawerOpen) aktivniEkran = 'KprDrawer';
    else if (input.openDrawers.isSettingsDrawerOpen) aktivniEkran = 'SettingsDrawer';
    else if (input.openDrawers.isLogDrawerOpen) aktivniEkran = 'SystemLogDrawer';
    else if (input.openDrawers.isFiscalDrawerOpen) aktivniEkran = 'FiscalDrawer';
    else if (input.openDrawers.isPartnerDrawerOpen) aktivniEkran = 'PartnerDrawer';
    else if (input.openDrawers.isArticleDrawerOpen) aktivniEkran = 'ArticleDrawer';
    else if (input.openDrawers.isDocDrawerOpen) aktivniEkran = 'DocumentDrawer';
  }

  // Obrada stavki računa
  const rawItems = input.items?.items || [];
  let imaNeklasificiranih = false;
  const stavkeSnapshot = rawItems.map((it) => {
    const imaKpd = !!it.kpdSifra && it.kpdSifra.trim().length > 0;
    if (!imaKpd) imaNeklasificiranih = true;
    const ukupno = Math.round((it.kolicina * it.cijena) * 100) / 100;
    return {
      opis: it.kpdNaziv || 'Neimenovana stavka',
      kolicina: it.kolicina || 1,
      cijena: it.cijena || 0,
      ukupno,
      kpdSifra: it.kpdSifra,
      kpdNaziv: it.kpdNaziv,
      imaKpd,
    };
  });

  const ukupniIznosRacuna = input.items?.ukupniIznos !== undefined
    ? input.items.ukupniIznos
    : stavkeSnapshot.reduce((acc, curr) => acc + curr.ukupno, 0);

  const racun: ScreenInvoiceSnapshot = {
    partnerNaziv: input.form?.partnerNaziv || '',
    oib: input.form?.oib || '',
    isOibValid: input.form?.isOibValid || false,
    iban: input.form?.iban || '',
    isIbanValid: input.form?.isIbanValid || false,
    taxZone: input.form?.taxZone || 'DOMACI_B2B',
    datumIzdavanja: input.form?.datumIzdavanja || now.toISOString().slice(0, 10),
    datumDospijeca: input.form?.datumDospijeca || '',
    datumIsporuke: input.form?.datumIsporuke || '',
    nacinPlacanja: input.form?.nacinPlacanja || 'TRANSAKCIJSKI_RACUN',
    vrstaDokumenta: input.workflow?.docType || 'RACUN',
    statusDokumenta: input.workflow?.docStatus || 'DRAFT',
    brojDokumenta: input.workflow?.brojDokumenta || '1/POSL1/1',
    stavke: stavkeSnapshot,
    ukupniIznos: ukupniIznosRacuna,
    brojStavki: stavkeSnapshot.length,
    imaNeklasificiranihStavki: imaNeklasificiranih,
  };

  // Financijski radar (KPR promet i prag 40.000 EUR)
  const kprPrometYtd = input.stats?.kprTotalEur || 0;
  const preostaloDoPraga = Math.max(0, PAUSALNI_PRAG_EUR - kprPrometYtd);
  const hoceLiProbitePrag = (kprPrometYtd + ukupniIznosRacuna) > PAUSALNI_PRAG_EUR;
  const postotakIskoristenostiPraga = Math.min(
    100,
    Math.round(((kprPrometYtd + ukupniIznosRacuna) / PAUSALNI_PRAG_EUR) * 100)
  );

  let statusUgroze: ScreenFinancialRadarSnapshot['statusUgroze'] = 'SIGURNO';
  if (hoceLiProbitePrag) {
    statusUgroze = 'KRITICNO_PREKORACENJE';
  } else if (preostaloDoPraga <= 3500) {
    statusUgroze = 'UPOZORENJE';
  }

  const financije: ScreenFinancialRadarSnapshot = {
    kprPrometYtd,
    porezniPragPausal: PAUSALNI_PRAG_EUR,
    preostaloDoPraga,
    trenutniRacunIznos: ukupniIznosRacuna,
    hoceLiProbitePrag,
    postotakIskoristenostiPraga,
    statusUgroze,
  };

  const sustav: ScreenSystemTelemetrySnapshot = {
    isOnline: input.telemetry?.isOnline !== false,
    isGoogleDriveConnected: !!input.telemetry?.isGoogleDriveConnected,
    googleDriveUserEmail: input.telemetry?.googleDriveUserEmail,
    geminiModel: input.telemetry?.geminiModel || 'gemini-3.8-flash',
    hasGeminiKey: !!input.telemetry?.hasGeminiKey,
    posljednjaGreska: input.telemetry?.posljednjaGreska,
    posljednjiWarn: input.telemetry?.posljednjiWarn,
  };

  return {
    timestamp: now.toISOString(),
    vrijemeFormated: now.toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' }),
    danUTjednu,
    sat,
    jeLiVikend,
    jeLiKasnoNoc,
    aktivniEkran,
    otvoreniDraweri,
    racun,
    financije,
    sustav,
  };
}

/**
 * Generira dinamičke kontekstualne čipove za brze akcije (Quick Contextual Chips)
 */
export function generateContextualChips(snapshot: LiveScreenContextSnapshot): ContextualActionChip[] {
  const chips: ContextualActionChip[] = [];

  // 1. Kritično: Prekoračenje praga od 40.000 EUR
  if (snapshot.financije.hoceLiProbitePrag) {
    chips.push({
      id: 'chip-prag-prekoracenje',
      tekst: '⚠️ Probijanje praga 40k! Što sad?',
      prompt: 'Gledan račun, probijamo li prag od 40.000 € i kako to riješit?',
      prioritet: 'visok',
    });
  } else if (snapshot.financije.statusUgroze === 'UPOZORENJE') {
    chips.push({
      id: 'chip-prag-blizu',
      tekst: `🛡️ Do praga: još ${snapshot.financije.preostaloDoPraga.toLocaleString('hr-HR')} €`,
      prompt: 'Koliko mi točno fali do paušalnog praga od 40.000 €?',
      prioritet: 'srednji',
    });
  }

  // 2. Neispravan OIB kupca
  if (snapshot.racun.oib && !snapshot.racun.isOibValid) {
    chips.push({
      id: 'chip-oib-invalid',
      tekst: '🔍 Provjeri OIB kupca (MOD 11)',
      prompt: `OIB kupca '${snapshot.racun.oib}' ne prolazi kontrolu. Možeš li provjeriti partnera?`,
      prioritet: 'visok',
    });
  }

  // 3. Stavke bez KPD 2025 šifre
  if (snapshot.racun.imaNeklasificiranihStavki && snapshot.racun.brojStavki > 0) {
    chips.push({
      id: 'chip-kpd-missing',
      tekst: '🏷️ Dodijeli KPD 2025 šifre',
      prompt: 'Dodijeli odgovarajuće KPD 2025 šifre svim stavkama kojima nedostaje.',
      prioritet: 'visok',
    });
  }

  // 4. Kontekst ekrana
  if (snapshot.aktivniEkran === 'KprDrawer') {
    chips.push({
      id: 'chip-posd-export',
      tekst: '📑 Pripremi PO-SD XML za ePoreznu',
      prompt: 'Izvezi PO-SD XML obrazac za predaju na ePoreznu.',
      prioritet: 'srednji',
    });
  } else if (snapshot.aktivniEkran === 'SystemLogDrawer' && snapshot.sustav.posljednjaGreska) {
    chips.push({
      id: 'chip-diagnose-error',
      tekst: '🩺 Dijagnosticiraj grešku u dnevniku',
      prompt: `Pojavila se greška: ${snapshot.sustav.posljednjaGreska.poruka}. Što se dogodilo?`,
      prioritet: 'visok',
    });
  } else if (snapshot.aktivniEkran === 'InvoiceDesk' && snapshot.racun.brojStavki > 0) {
    chips.push({
      id: 'chip-check-invoice',
      tekst: '⚖️ Orlandov lakat: Pregledaj račun',
      prompt: 'Žigo, pregledaj ovaj račun: jesu li stavke, porezna zona i KPD šesni?',
      prioritet: 'srednji',
    });
  }

  // 5. Fjaka Mode (Anti-Burnout)
  if (snapshot.jeLiKasnoNoc) {
    chips.push({
      id: 'chip-fjaka-noc',
      tekst: '🌙 Fjaka: Rad kasno u noć',
      prompt: 'Žigo, kasno je, moran li ovo noćas završit?',
      prioritet: 'nizak',
    });
  }

  // 6. Uvijek dostupno: Brzi rez
  chips.push({
    id: 'chip-zigo-presijeci',
    tekst: '🗡️ Žigo, presijeci.',
    prompt: 'Žigo, presijeci.',
    prioritet: 'srednji',
  });

  return chips;
}

/**
 * Formatira snimak ekrana u sažeti Markdown blok za injekciju u sistemsku poruku agenta
 */
export function formatContextForSystemPrompt(snapshot: LiveScreenContextSnapshot): string {
  const r = snapshot.racun;
  const f = snapshot.financije;
  const s = snapshot.sustav;

  let stavkeTekst = 'Nema stavki na računu.';
  if (r.stavke.length > 0) {
    stavkeTekst = r.stavke
      .map(
        (st, idx) =>
          `  ${idx + 1}. "${st.opis}" | ${st.kolicina} x ${st.cijena.toFixed(2)} € = ${st.ukupno.toFixed(2)} € [KPD: ${st.kpdSifra || 'NEDOSTAJE'}]`
      )
      .join('\n');
  }

  return `### TRENUTNO STANJE EKRANA I SUSTAVA (Real-Time Omni-Context Snapshot)
- Vrijeme: ${snapshot.vrijemeFormated} (${snapshot.jeLiVikend ? 'Vikend' : 'Radni dan'}${snapshot.jeLiKasnoNoc ? ' - KASNO NOĆ/FJAKA' : ''})
- Aktivni pogled/ekran: ${snapshot.aktivniEkran}
- Otvoreni prozori: ${snapshot.otvoreniDraweri.length > 0 ? snapshot.otvoreniDraweri.join(', ') : 'Nema otvorenih ladica'}

[RADNI RAČUN NA EKRANU]
- Kupac: ${r.partnerNaziv || '(Nije unesen)'}
- OIB: ${r.oib || '(Nema OIB-a)'} (${r.isOibValid ? 'VALJAN MOD 11' : 'NEVALJAN/PROVJERA'})
- IBAN: ${r.iban || '(Nema IBAN-a)'} | Porezna zona: ${r.taxZone} | Plaćanje: ${r.nacinPlacanja}
- Broj i status: #${r.brojDokumenta} (${r.vrstaDokumenta}, status: ${r.statusDokumenta})
- Ukupni iznos radnog računa: ${r.ukupniIznos.toFixed(2)} EUR
- Stavke (${r.brojStavki} ukupno, ima neklasificiranih KPD: ${r.imaNeklasificiranihStavki ? 'DA' : 'NE'}):
${stavkeTekst}

[ORLANDOV FINANCIJSKI RADAR]
- KPR promet tekuće godine: ${f.kprPrometYtd.toFixed(2)} EUR
- Godišnji paušalni prag: ${f.porezniPragPausal.toFixed(2)} EUR
- Preostalo do praga bez ovog računa: ${f.preostaloDoPraga.toFixed(2)} EUR
- Hoće li OVAJ račun probiti limit od 40.000 €: ${f.hoceLiProbitePrag ? 'KRITIČNO: DA, PROBIJA LIMIT!' : 'NE, UNUTAR PRAGA JE'}
- Status ugroze: ${f.statusUgroze} (iskorištenost praga s ovim računom: ${f.postotakIskoristenostiPraga}%)

[TELEMETRIJA SUSTAVA]
- Mreža: ${s.isOnline ? 'Online' : 'Offline / Bez interneta'} | Google Drive: ${s.isGoogleDriveConnected ? 'Povezan (' + (s.googleDriveUserEmail || 'OK') + ')' : 'Nije povezan'}
${s.posljednjaGreska ? `- Posljednja greška u sustavu: [${s.posljednjaGreska.scope || 'SYSTEM'}] "${s.posljednjaGreska.poruka}" (${s.posljednjaGreska.vrijeme})` : '- Nema aktivnih grešaka u sustavnom dnevniku.'}
`;
}
