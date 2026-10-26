import type { PoreznaZona } from '@obrtniq/core';

export type ActiveScreenView =
  | 'InvoiceDesk'
  | 'KprDrawer'
  | 'SettingsDrawer'
  | 'SystemLogDrawer'
  | 'FiscalDrawer'
  | 'PartnerDrawer'
  | 'ArticleDrawer'
  | 'DocumentDrawer'
  | 'DocumentationDrawer';

export interface ScreenInvoiceItemSnapshot {
  opis: string;
  kolicina: number;
  cijena: number;
  ukupno: number;
  kpdSifra?: string;
  kpdNaziv?: string;
  imaKpd: boolean;
}

export interface ScreenInvoiceSnapshot {
  partnerNaziv: string;
  oib: string;
  isOibValid: boolean;
  iban: string;
  isIbanValid: boolean;
  taxZone: PoreznaZona;
  datumIzdavanja: string;
  datumDospijeca: string;
  datumIsporuke: string;
  nacinPlacanja: string;
  vrstaDokumenta: string;
  statusDokumenta: string;
  brojDokumenta: string;
  stavke: ScreenInvoiceItemSnapshot[];
  ukupniIznos: number;
  brojStavki: number;
  imaNeklasificiranihStavki: boolean;
}

export interface ScreenFinancialRadarSnapshot {
  kprPrometYtd: number;
  porezniPragPausal: number; // 40000 EUR
  preostaloDoPraga: number;
  trenutniRacunIznos: number;
  hoceLiProbitePrag: boolean;
  postotakIskoristenostiPraga: number;
  statusUgroze: 'SIGURNO' | 'UPOZORENJE' | 'KRITICNO_PREKORACENJE';
}

export interface ScreenSystemTelemetrySnapshot {
  isOnline: boolean;
  isGoogleDriveConnected: boolean;
  googleDriveUserEmail?: string;
  geminiModel: string;
  hasGeminiKey: boolean;
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
}

export interface LiveScreenContextSnapshot {
  timestamp: string;
  vrijemeFormated: string;
  danUTjednu: number; // 0 = nedjelja, 6 = subota
  sat: number;
  jeLiVikend: boolean;
  jeLiKasnoNoc: boolean; // Fjaka trigger: nedjelja > 21h ili bilo koji dan > 23h
  aktivniEkran: ActiveScreenView;
  otvoreniDraweri: string[];
  racun: ScreenInvoiceSnapshot;
  financije: ScreenFinancialRadarSnapshot;
  sustav: ScreenSystemTelemetrySnapshot;
}

export interface ContextualActionChip {
  id: string;
  tekst: string;
  ikona?: string;
  prompt: string;
  prioritet: 'visok' | 'srednji' | 'nizak';
}
