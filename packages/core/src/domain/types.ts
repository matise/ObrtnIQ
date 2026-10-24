// packages/core/src/domain/types.ts

export type Valuta = 'EUR';

export type NacinPlacanja = 
  | 'TRANSAKCIJSKI_RACUN' 
  | 'GOTOVINA' 
  | 'KARTICA' 
  | 'OSTALO';

export type VrstaDokumenta = 
  | 'RACUN' 
  | 'PONUDA' 
  | 'PREDRACUN' 
  | 'STORNO_RACUN';

export type PoreznaZona = 
  | 'DOMACI_B2B' 
  | 'DOMACI_B2C' 
  | 'DOMACI_B2G' 
  | 'EU_B2B' 
  | 'EU_B2C' 
  | 'TRECE_ZEMLJE';

export type StatusDokumenta = 
  | 'NACRT' 
  | 'IZDANO' 
  | 'DJELOMICNO_PLACENO' 
  | 'PLACENO' 
  | 'STORNIRANO';

export type StatusFiskalizacije10 = 
  | 'NIJE_POTREBNO' 
  | 'CEKA_SLANJE' 
  | 'USPJESNO' 
  | 'OFFLINE_ZKI_IZDAN' 
  | 'GRESKA';

export type StatusERacun20 = 
  | 'NIJE_POTREBNO' 
  | 'SPREMNO_ZA_SLANJE' 
  | 'POSLANO_POSREDNIKU' 
  | 'ISPORUCENO_KUPCU' 
  | 'PRIHVACENO' 
  | 'ODBIJENO' 
  | 'GRESKA';

export interface GoogleAuthIdentity {
  provider: 'GOOGLE' | 'LOCAL';
  googleSub?: string;            // Jedinstveni 21-znamenkasti Google User ID (kripto sidro)
  email?: string;
  name?: string;
  pictureUrl?: string;
  connectedAt?: string;
  scopes?: string[];
}

export interface ConnectedServicesConfig {
  googleDriveEnabled: boolean;
  googleDriveLastSync?: string;
  geminiApiKey?: string;         // Korisnikov Google AI Studio API ključ (BYOK)
  geminiModel?: string;          // Zadani model: 'gemini-3.8-flash'
  firebaseConfig?: {
    apiKey: string;
    projectId: string;
    appId: string;
  };
}

export interface ObrtProfil {
  id: string;
  naziv: string;
  kratkiNaziv?: string;
  vlasnikImePrezime: string;
  oib: string; // 11 znamenki, validiran MOD 11, 10
  maticniBroj?: string;
  nkdSifra?: string;
  ulicaIBroj: string;
  postanskiBroj: string;
  mjesto: string;
  drzavaIso: string; // Zadano: "HR"
  email: string;
  telefon?: string;
  iban: string; // Glavni poslovni IBAN
  bicSwift?: string;
  bankaNaziv?: string;
  jePausalist: boolean;
  uSustavuPdv: boolean;
  pdvIdBroj?: string; // Npr. HR79102730089
  poslovniProstorOznaka: string; // Npr. "POSL1"
  naplatniUredjajOznaka: string; // Npr. "1"
  logoImageData?: string; // Base64 data URL
  pecatPotpisImageData?: string; // Base64 data URL
  eracunPosrednik: 'FINA' | 'MOJ_ERACUN' | 'EDOKUMENT' | 'CUSTOM_API' | 'BEZ_POSREDNIKA';
  eracunApiKey?: string;
  authIdentity?: GoogleAuthIdentity;
  connectedServices?: ConnectedServicesConfig;
}

export interface Partner {
  id: string;
  tipPartnera: 'PRAVNA_OSOBA' | 'FIZICKA_OSOBA';
  naziv: string;
  oib?: string; // Obavezno za domaće pravne osobe
  vatId?: string; // Za inozemne EU partnere
  viesValidiran?: boolean;
  viesDatumProvjere?: string;
  adresa: string;
  postanskiBroj: string;
  grad: string;
  drzavaIso: string;
  poreznaZona: PoreznaZona;
  kontaktEmail?: string;
  peppolEndpointId?: string;
  aktivan: boolean;
}

export interface Artikl {
  id: string;
  sifra?: string;
  kpdSifra: string; // Npr. "62.01.11" - Obavezno za Fiskalizaciju 2.0
  naziv: string;
  opis?: string;
  jedinicaMjere: string; // "sat", "kom", "paušal"...
  cijenaOsnovica: number; // Decimal (EUR)
  stopaPdv: number; // 0.00, 25.00, 13.00, 5.00
  pdvKategorijaPoreza: 'E' | 'S' | 'AE' | 'Z'; // E = Exempt, S = Standard, AE = Reverse charge
  jeUsluga: boolean;
  aktivan: boolean;
}

export interface StavkaDokumenta {
  id: string;
  dokumentId: string;
  artiklId?: string;
  redniBroj: number;
  kpdSifra: string;
  naziv: string;
  opis?: string;
  jedinicaMjere: string;
  kolicina: number;
  jedinicnaCijena: number;
  popustPostotak: number;
  iznosPopusta: number;
  osnovica: number;
  stopaPdv: number;
  iznosPdv: number;
  ukupno: number;
}

export interface Dokument {
  id: string;
  partnerId: string;
  partnerNazivSnapshot: string;
  partnerOibSnapshot?: string;
  partnerAdresaSnapshot: string;
  vrstaDokumenta: VrstaDokumenta;
  godina: number;
  brojSekvenca: number;
  brojDokumenta: string; // Zakonski format: "12/POSL1/1"
  izvorniDokumentId?: string; // Kod storna ili ponude
  poslovniProstorOznaka: string;
  naplatniUredjajOznaka: string;
  datumIzdavanja: string; // YYYY-MM-DD
  vrijemeIzdavanja: string; // HH:mm:ss
  datumDospijeca: string; // YYYY-MM-DD
  datumIsporuke: string; // YYYY-MM-DD
  nacinPlacanja: NacinPlacanja;
  iban: string;
  pozivNaBroj: string; // "HR00 12-2026"
  jeReverseCharge: boolean;
  zakonskaNapomena: string;
  status: StatusDokumenta;
  valuta: Valuta;
  ukupnoOsnovica: number;
  ukupnoPdv: number;
  ukupnoIznos: number;
  napomenaZaKupca?: string;
  // B2C Fiskalizacija 1.0 polja
  fiskalizacijaStatus: StatusFiskalizacije10;
  zki?: string;
  jir?: string;
  qrKodUrl?: string;
  fiskalizacijaGreska?: string;
  // B2B Fiskalizacija 2.0 polja
  eracunStatus: StatusERacun20;
  eracunPosrednikTransakcijaId?: string;
  eracunRazlogOdbijanja?: string;
  // Generirani kodovi za plaćanje
  hub3String?: string;
  epcQrString?: string;
  stavke: StavkaDokumenta[];
}

export interface NaplataPromet {
  id: string;
  dokumentId?: string;
  brojKprStavke: number;
  datumNaplate: string; // YYYY-MM-DD
  iznosGotovina: number;
  iznosBezgotovinski: number;
  ukupnoNaplaceno: number;
  kvartal: 1 | 2 | 3 | 4;
  godina: number;
  opisPlatitelja: string;
  brojIzvoda?: string;
}

export interface KvartalniSazetak {
  kvartal: number;
  gotovinaUkupno: number;
  bezgotovinskiUkupno: number;
  ukupno: number;
}

export interface PosdIzvjestaj {
  godina: number;
  obrtOib: string;
  obrtNaziv: string;
  q1: KvartalniSazetak;
  q2: KvartalniSazetak;
  q3: KvartalniSazetak;
  q4: KvartalniSazetak;
  ukupnoGodina: number;
  zakonskiPrag: number; // 40.000,00 EUR
  prekoracenPrag: boolean;
}

export interface ZigoAttachment {
  naziv: string;
  mimeType: string;
  base64Data: string; // Base64 data string (slika ili PDF)
  velicinaBajtova: number;
}

export interface ZigoToolCall {
  imeFunkcije: string;
  argumenti: Record<string, any>;
}

export interface ZigoToolResult {
  uspjeh: boolean;
  podaci?: any;
  poruka?: string;
}

export interface ZigoChatSesija {
  id: string;               // UUID
  naslov: string;           // npr. "Priprema ponude za klijenta"
  kreirano: string;         // ISO datum
  azurirano: string;        // ISO datum
  arhivirano: boolean;
  zadnjiKpdContext?: string;
}

export interface ZigoChatPoruka {
  id: string;               // UUID
  sesijaId: string;         // FK na ZigoChatSesija
  uloga: 'user' | 'assistant' | 'tool';
  tekst: string;
  privitci?: ZigoAttachment[];
  toolPoziv?: ZigoToolCall;
  toolRezultat?: ZigoToolResult;
  kreirano: string;         // ISO datum
}

