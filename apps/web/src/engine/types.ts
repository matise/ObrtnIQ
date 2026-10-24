import type { PoreznaZona, VrstaDokumenta, StatusDokumenta, ObrtProfil } from '@obrtniq/core';

export interface FormItem {
  id: string;
  kpdSifra: string;
  kpdNaziv: string;
  kolicina: number;
  jedinicaMjere: string;
  cijena: number;
}

export interface InvoicePreviewItem {
  id: string;
  redniBroj: number;
  kpdSifra: string;
  naziv: string;
  kolicina: number;
  jedinicaMjere: string;
  jedinicnaCijena: number;
  ukupno: number;
}

export type ObrtProfilData = ObrtProfil;

export interface PartnerFormData {
  partnerNaziv: string;
  oib: string;
  isOibValid: boolean;
  taxZone: PoreznaZona;
  iban: string;
  isIbanValid: boolean;
  detectedBank?: string;
  nacinPlacanja: string;
}

export interface DocumentWorkflowState {
  docId: string;
  docType: VrstaDokumenta;
  docStatus: StatusDokumenta;
  brojDokumenta: string;
  datumIzdavanja: string;
  datumDospijeca: string;
  datumIsporuke: string;
  zki?: string;
  jir?: string;
  fiskalniQrUrl?: string;
  fiskalizacijaStatus?: string;
  isLocked: boolean;
}
