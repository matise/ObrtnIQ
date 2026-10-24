import type { Dokument, StavkaDokumenta, VrstaDokumenta, NacinPlacanja, Partner } from '@obrtniq/core';
import type { FormItem, InvoicePreviewItem, PartnerFormData } from './types';

/**
 * Pretvara stavke forme u strogo tipizirane domenske stavke za bazu i izdavanje
 */
export function mapFormItemsToStavkeDokumenta(items: FormItem[], docId: string): StavkaDokumenta[] {
  return items.map((it, idx) => ({
    id: `${docId}-st-${idx + 1}`,
    dokumentId: docId,
    redniBroj: idx + 1,
    kpdSifra: it.kpdSifra,
    naziv: it.kpdNaziv || 'Usluga računalnog programiranja',
    jedinicaMjere: it.jedinicaMjere || 'sat',
    kolicina: it.kolicina,
    jedinicnaCijena: it.cijena,
    popustPostotak: 0,
    iznosPopusta: 0,
    osnovica: it.kolicina * it.cijena,
    stopaPdv: 0,
    iznosPdv: 0,
    ukupno: it.kolicina * it.cijena,
  }));
}

/**
 * Pretvara domenske stavke iz baze u stavke forme za uređivanje na radnoj plohi
 */
export function mapStavkeToFormItems(stavke: StavkaDokumenta[]): FormItem[] {
  return stavke.map((s) => ({
    id: s.id,
    kpdSifra: s.kpdSifra,
    kpdNaziv: s.naziv,
    kolicina: s.kolicina,
    jedinicaMjere: s.jedinicaMjere || 'sat',
    cijena: s.jedinicnaCijena,
  }));
}

/**
 * Formatira stavke forme za živi A4 preglednik
 */
export function mapFormItemsToPreviewItems(items: FormItem[]): InvoicePreviewItem[] {
  return items.map((it, idx) => ({
    id: it.id,
    redniBroj: idx + 1,
    kpdSifra: it.kpdSifra,
    naziv: it.kpdNaziv,
    kolicina: it.kolicina,
    jedinicaMjere: it.jedinicaMjere || 'sat',
    jedinicnaCijena: it.cijena,
    ukupno: it.kolicina * it.cijena,
  }));
}

/**
 * Pomoćna funkcija za mapiranje stringa načina plaćanja u domenski NacinPlacanja enum
 */
export function mapNacinPlacanjaToEnum(nacinPlacanja: string): NacinPlacanja {
  const norm = nacinPlacanja.toUpperCase();
  if (norm.includes('GOTOVINA')) return 'GOTOVINA';
  if (norm.includes('KARTICA')) return 'KARTICA';
  return 'TRANSAKCIJSKI_RACUN';
}

/**
 * Sastavlja nacrt dokumenta prije spremanja i prosljeđivanja u workflow motor
 */
export function buildDraftDokument(params: {
  docId: string;
  docType: VrstaDokumenta;
  partnerNaziv: string;
  oib: string;
  iban: string;
  items: FormItem[];
  ukupniIznos: number;
  datumIzdavanja?: string;
  datumDospijeca?: string;
  datumIsporuke?: string;
  nacinPlacanja?: string;
}): Dokument {
  const stavke = mapFormItemsToStavkeDokumenta(params.items, params.docId);
  const now = new Date();
  const datumIso = now.toISOString().slice(0, 10);

  return {
    id: params.docId,
    partnerId: 'partner-direct',
    partnerNazivSnapshot: params.partnerNaziv,
    partnerOibSnapshot: params.oib,
    partnerAdresaSnapshot: 'Hrvatska',
    vrstaDokumenta: params.docType,
    godina: now.getFullYear(),
    brojSekvenca: 0,
    brojDokumenta: 'NACRT',
    poslovniProstorOznaka: 'POSL1',
    naplatniUredjajOznaka: '1',
    datumIzdavanja: params.datumIzdavanja || datumIso,
    vrijemeIzdavanja: now.toLocaleTimeString('hr-HR'),
    datumDospijeca: params.datumDospijeca || '2026-11-03',
    datumIsporuke: params.datumIsporuke || params.datumIzdavanja || datumIso,
    nacinPlacanja: mapNacinPlacanjaToEnum(params.nacinPlacanja || 'Transakcijski račun'),
    iban: params.iban.replace(/\s+/g, ''),
    pozivNaBroj: '',
    jeReverseCharge: false,
    zakonskaNapomena: 'Paušalni obrt, oslobođeno PDV-a po čl. 90. st. 2. Zakona o PDV-u.',
    status: 'NACRT',
    valuta: 'EUR',
    ukupnoOsnovica: params.ukupniIznos,
    ukupnoPdv: 0,
    ukupnoIznos: params.ukupniIznos,
    fiskalizacijaStatus: 'NIJE_POTREBNO',
    eracunStatus: 'NIJE_POTREBNO',
    stavke,
  };
}

/**
 * Gradi objekt aktivnog dokumenta za FiscalDrawer
 */
export function buildFiscalDrawerDocument(params: {
  docId: string;
  docType: VrstaDokumenta;
  docStatus: any;
  brojDokumenta: string;
  partnerNaziv: string;
  oib: string;
  iban: string;
  datumIzdavanja: string;
  datumDospijeca: string;
  datumIsporuke: string;
  nacinPlacanja: string;
  items: FormItem[];
  ukupniIznos: number;
  zki?: string;
  jir?: string;
  fiskalniQrUrl?: string;
  fiskalizacijaStatus?: string;
}): Dokument {
  return {
    id: params.docId,
    partnerId: 'partner-active',
    partnerNazivSnapshot: params.partnerNaziv,
    partnerOibSnapshot: params.oib,
    partnerAdresaSnapshot: 'Radnička cesta 80, Zagreb',
    vrstaDokumenta: params.docType,
    godina: 2026,
    brojSekvenca: 1,
    brojDokumenta: params.brojDokumenta,
    poslovniProstorOznaka: 'POSL1',
    naplatniUredjajOznaka: '1',
    datumIzdavanja: params.datumIzdavanja,
    vrijemeIzdavanja: '14:30:00',
    datumDospijeca: params.datumDospijeca,
    datumIsporuke: params.datumIsporuke,
    nacinPlacanja: mapNacinPlacanjaToEnum(params.nacinPlacanja),
    iban: params.iban,
    pozivNaBroj: 'HR00 ' + (params.brojDokumenta === 'NACRT' ? '1-2026' : params.brojDokumenta),
    jeReverseCharge: false,
    zakonskaNapomena: 'Paušalni obrt, oslobođeno PDV-a po čl. 90. st. 2. Zakona o PDV-u.',
    status: params.docStatus,
    valuta: 'EUR',
    ukupnoOsnovica: params.ukupniIznos,
    ukupnoPdv: 0,
    ukupnoIznos: params.ukupniIznos,
    fiskalizacijaStatus: (params.fiskalizacijaStatus as any) || 'NIJE_POTREBNO',
    zki: params.zki,
    jir: params.jir,
    qrKodUrl: params.fiskalniQrUrl,
    eracunStatus: 'SPREMNO_ZA_SLANJE',
    stavke: mapFormItemsToStavkeDokumenta(params.items, params.docId),
  };
}

/**
 * Gradi objekt aktivnog partnera za FiscalDrawer
 */
export function buildFiscalPartnerSnapshot(partner: PartnerFormData): Partner {
  return {
    id: 'partner-active',
    tipPartnera: 'PRAVNA_OSOBA',
    naziv: partner.partnerNaziv,
    oib: partner.oib,
    adresa: 'Radnička cesta 80',
    postanskiBroj: '10000',
    grad: 'Zagreb',
    drzavaIso: 'HR',
    poreznaZona: partner.taxZone,
    aktivan: true,
  };
}
