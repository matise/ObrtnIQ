# ObrtnIQ: Glavni Tehnički i Dizajn Dokument Sustava (Master Blueprint & Roadmap)

**Verzija:** 3.0 (Konsolidirano izdanje)  
**Status:** Spreman za faznu implementaciju  
**Pravni okvir:** Zakon o porezu na dohodak RH (paušalisti i dohodaši), Pravilnik o paušalnom oporezivanju, Zakon o fiskalizaciji u prometu gotovinom (Fiskalizacija 1.0 - B2C), Zakon o fiskalizaciji (Fiskalizacija 2.0 - B2B/B2G e-Račun EN 16931 s KPD 2025 standardom).

---

## 1. Izvršni Sažetak i Filozofija Sustava

**ObrtnIQ** je lagana, responzivna i zakonski usklađena web aplikacija dizajnirana za vođenje paušalnih obrta i obrta na dohotku u Republici Hrvatskoj.

### 1.1 Temeljni Inženjerski Principi
1. **Local-First (Preglednik na prvom mjestu):** Svi operativni podaci, katalozi, klijenti, računi i porezne evidencije žive unutar korisničkog preglednika (SQLite Wasm preko OPFS-a ili IndexedDB). Aplikacija radi 100% offline s latencijom sučelja manjom od 2 ms.
2. **Nula troškova poslužiteljske infrastrukture:** Nema centralne baze podataka koja košta na mjesečnoj bazi. Podaci pripadaju isključivo korisniku uz mogućnost 1-klik kriptiranog izvoza/uvoza.
3. **Stateless CORS Proxy:** Za komunikaciju s Poreznom upravom (CIS SOAP) i informacijskim posrednicima (e-Račun REST), koristi se bezstanjski mikro-proxy (Cloudflare Worker ili lagani kontejner) koji ne sprema bazu niti financijske podatke, već samo premošćuje CORS zabrane browsera.
4. **Precision Minimalist / Sharp Utility:** Sučelje visoke gustoće informacija, tamno-ljubičasta tema, tabularni monospace brojevi, oštri rubovi (`rounded-none` / `rounded-xs`) bez dekorativnog otpada.
5. **Inkrementalna izgradnja s verifikacijom ("Gate-Check"):** Nijedna viša faza se ne započinje dok temeljna faza nije pokrivena testovima i validirana u praksi.

---

## 2. Sistemska Arhitektura i Slojevi

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                  KORISNIKOV PREGLEDNIK                                  │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  KORISNIČKO SUČELJE (React 19 + Tailwind CSS + Lucide Icons)                           │
│  ├── Sharp Theme Engine (Midnight Amethyst & Signal Accents)                           │
│  ├── Split-Screen Desktop / Bottom-Sheet Mobile radna ploha                             │
│  └── Set specijaliziranih HR/EU kontrola (OIB, IBAN, KPD 2025, CurrencyInput)           │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  APSTRAKTNO REPOZITORIJSKO SUČELJE (Domain Storage Abstraction Layer)                    │
│  ├── IObrtRepository (profil, certifikati, postavke)                                    │
│  ├── IPartnerRepository (kupci, dobavljači, VIES status)                                │
│  ├── IArtiklRepository (usluge, robe, KPD 2025 klasifikacija)                           │
│  ├── IDokumentRepository (računi, ponude, storno, sekvence)                             │
│  └── IKprRepository (naplate, uplate, PO-SD agregacija, prag 40.000 €)                   │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  PLUG-IN POHRANA (Storage Adapter):                                                     │
│  ├── Primarni: SQLite Wasm (OPFS - Origin Private File System)                          │
│  ├── Reaktivni: RxDB / Dexie.js (IndexedDB fallback)                                    │
│  └── Kriptirani Export / Import (AES-256-GCM Backup JSON/SQLite)                        │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  LOKALNI ENGINEI I GENERATORI (Client-Side Workers):                                    │
│  ├── HUB-3 Barkod Generator (PDF417 standard HRVHUB30)                                  │
│  ├── EPC QR / Fiskalni QR Generator (SVG/Canvas rendering)                             │
│  ├── PDF Engine (@react-pdf/renderer ili jsPDF)                                         │
│  ├── e-Račun CIUS-HR UBL 2.1 XML Generator                                              │
│  └── Web Crypto Trezor (AES-GCM enkripcija FINA certifikata, ZKI izračun)               │
└───────────────────────────────────────────┬─────────────────────────────────────────────┘
                                            │ Kriptirani HTTPS (Samo potpisani payload)
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                     BEZSTANJSKI PROXY (Cloudflare Worker / Stateless)                   │
│  - NEMA BAZU PODATAKA (Zero Storage)                                                    │
│  - Premošćuje CORS ograničenja web preglednika                                          │
├───────────────────────────────────────────┬─────────────────────────────────────────────┤
│                                           │                                             │
│ SOAP XML (HTTPS sa certifikatom)          │ REST JSON (e-Račun API posrednika)         │
▼                                           ▼                                             │
Porezna uprava CIS (Fiskalizacija 1.0)      Posrednik: FINA / Moj-eRačun (Fisk. 2.0)       │
```

---

## 3. Kompletna Tipizacija i Model Podataka (Domain Types)

Svi identifikatori su UUID v4 stringovi. Svi novčani iznosi su decimalni stringovi ili integeri u centima kako bi se izbjegle pogreške s pomičnim zarezom (`float`).

```typescript
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
```

---

## 4. Ključni Algoritmi i Poslovna Matematika

### 4.1 OIB Validacija (ISO 7064, MOD 11, 10)
Svaki OIB u Hrvatskoj sastoji se od točno 11 znamenki, pri čemu je zadnja znamenka kontrolna, izračunata prema ISO 7064 standardu:

```typescript
// packages/core/src/utils/oib.ts

export function validateOib(oib: string): boolean {
  if (!/^\d{11}$/.test(oib)) return false;

  let a = 10;
  for (let i = 0; i < 10; i++) {
    a = a + parseInt(oib.charAt(i), 10);
    a = a % 10;
    if (a === 0) a = 10;
    a = (a * 2) % 11;
  }

  let kontrolna = 11 - a;
  if (kontrolna === 10) kontrolna = 0;

  return kontrolna === parseInt(oib.charAt(10), 10);
}
```

### 4.2 Generator HUB-3 / HUB-3A Barkoda (PDF417 Standard)
Prema specifikaciji Hrvatske udruge banaka (HUB), string se sastoji od polja odvojenih novim redom (`\n`), sa striktnim formatom iznosa u centima dopunjenim vodećim nulama do 15 mjesta:

```typescript
// packages/core/src/utils/hub3.ts

export interface Hub3Nalog {
  iznosEur: number;
  platiteljImeAdresa: string;
  primateljImeAdresa: string;
  primateljIban: string;
  model: string; // Npr. "HR00" ili "HR01"
  pozivNaBroj: string; // Npr. "12-2026"
  sifraNamjene: string; // "GDSV" (Goods/Services) ili "OTHR"
  opisPlacanja: string; // Npr. "Račun 12/POSL1/1"
}

export function generateHub3Payload(nalog: Hub3Nalog): string {
  // Iznos u centima, točno 15 znamenki s vodećim nulama (npr. 125.50 € -> 000000000012550)
  const centi = Math.round(nalog.iznosEur * 100);
  const iznosFormatiran = centi.toString().padStart(15, '0');

  const lines = [
    'HRVHUB30',
    'EUR',
    iznosFormatiran,
    nalog.platiteljImeAdresa.slice(0, 35),
    '', // Adresa platitelja (opcionalno)
    '', // Grad platitelja (opcionalno)
    nalog.primateljImeAdresa.slice(0, 35),
    '', // Adresa primatelja
    '', // Grad primatelja
    nalog.primateljIban.replace(/\s+/g, ''),
    nalog.model.trim(),
    nalog.pozivNaBroj.trim(),
    nalog.sifraNamjene.trim().slice(0, 4),
    nalog.opisPlacanja.slice(0, 35),
  ];

  return lines.join('\n');
}
```

### 4.3 Izračun ZKI Hasha (Zaštitni Kod Izdavatelja)
Za B2C transakcije, ZKI se stvara ulančavanjem ključnih elemenata računa, potpisivanjem RSA privatnim ključem iz FINA certifikata, te konačnim MD5 sažimanjem:
$$\text{ZKI\_Input} = \text{OIB} + \text{DatumVrijeme (dd.MM.yyyy HH:mm:ss)} + \text{BrojDok} + \text{Prostor} + \text{Uredjaj} + \text{UkupnoIznos (0.00)}$$
$$\text{ZKI} = \text{MD5}(\text{RSA\_SHA1\_Sign}(\text{ZKI\_Input}, \text{PrivKey}))$$

---

## 5. UI/UX Implementacijska Specifikacija (Precision Minimalist)

### 5.1 CSS Varijable Sustava Teme i Dinamička Rotacija Tona (Hue Engine)

Sustav koristi parametrizirani **HSL (Hue, Saturation, Lightness)** mehanizam u kojem se sve podloge, granice i akcenti računaju u realnom vremenu iz kuta tona (`--theme-hue`, 0° do 360°), čime je korisniku omogućena trenutna rotacija palete ili odabir između 5 kuriranih preseta:

* **Midnight Amethyst (Zadana):** `268°` — Tamno-ljubičasta mat baza s neonskim akcentima.
* **Obsidian Emerald:** `155°` — Duboka smaragdno-zelena podloga visokog kontrasta.
* **Cyber Cobalt:** `218°` — Financijska safirno-plava tema s analitičkim ugođajem.
* **Titanium Bronze:** `34°` — Topla ugljen-jantarna tema industrijskog karaktera.
* **Carbon Monolith:** `0°` (Sat. 0%) — Neutralna crno-bijela monokromatska radna površina (`data-theme="carbon"`).

```css
:root {
  /* Zadani kut tona boje: 268° (Midnight Amethyst) */
  --theme-hue: 268;
  --theme-sat-factor: 1;

  /* Dinamičke HSL podloge računane iz kuta tona */
  --bg-canvas:   hsl(var(--theme-hue) calc(40% * var(--theme-sat-factor)) 5%);
  --bg-surface:  hsl(var(--theme-hue) calc(35% * var(--theme-sat-factor)) 9%);
  --bg-elevated: hsl(var(--theme-hue) calc(32% * var(--theme-sat-factor)) 14%);
  --bg-subtle:   hsl(var(--theme-hue) calc(28% * var(--theme-sat-factor)) 20%);
  
  /* Granice i fokus */
  --border-subtle: hsl(var(--theme-hue) calc(25% * var(--theme-sat-factor)) 18%);
  --border-strong: hsl(var(--theme-hue) calc(30% * var(--theme-sat-factor)) 30%);
  --border-focus:  hsl(var(--theme-hue) calc(85% * var(--theme-sat-factor)) 65%);
  
  /* Tekstovi */
  --text-primary: #FFFFFF;
  --text-secondary: hsl(var(--theme-hue) calc(60% * var(--theme-sat-factor)) 85%);
  --text-muted:     hsl(var(--theme-hue) calc(25% * var(--theme-sat-factor)) 60%);
  
  /* Glavni tematski akcent */
  --accent-primary:       hsl(var(--theme-hue) calc(85% * var(--theme-sat-factor)) 60%);
  --accent-primary-hover: hsl(var(--theme-hue) calc(85% * var(--theme-sat-factor)) 50%);
  --accent-primary-glow:  hsla(var(--theme-hue), calc(85% * var(--theme-sat-factor)), 60%, 0.25);

  /* Pravni i statusni signali (neovisni o temi radi propisa) */
  --signal-green: #10B981;
  --signal-green-bg: #064E3B;
  --signal-red: #EF4444;
  --signal-red-bg: #450A0A;
  --signal-amber: #F59E0B;
}
```

### 5.2 Struktura Ekran-Editora (Desktop Split-Screen)
```
┌───────────────────────────────────────────────────────────────────────────────────┐
│ HEADER: [ObrtnIQ Logo]  [Novi Račun #14/POSL1/1]  [Prag: 28.450/40.000 € (71%)]    │
├─────────────────────────────────────────┬─────────────────────────────────────────┤
│ LIJEVI PANEL (55%): UNOS I RAD          │ DESNI PANEL (45%): A4 REAL-TIME PREVIEW │
│ 1. Klijent (OIB lookup / Select)        │ [Zaglavlje obrta s logotipom]           │
│ 2. Datumi (Izdavanje, Valuta, Isporuka) │ Podaci o kupcu (OIB, Adresa)            │
│ 3. Porezna Zona: [HR B2B] [B2C] [EU RC] │ Broj: 14/POSL1/1                        │
│ 4. Stavke Tablica (Data-dense grid):    │                                         │
│    - KPD šifra                          │ Stavke s cijenama i KPD šiframa         │
│    - Naziv, Kol, Cijena, Popust         │                                         │
│    [ + Dodaj stavku (Alt+N) ]           │ Ukupno za platiti: 1.250,00 €           │
│ 5. Način plaćanja: [Transakcijski]      │ Zakonska napomena (čl. 90 st. 2)        │
│ 6. Akcije: [Spremi] [Fiskaliziraj (F2)] │ [PDF417 Barkod]    [Fiskalni/EPC QR]    │
└─────────────────────────────────────────┴─────────────────────────────────────────┘
```

---

## 6. Plan Fazne Izgradnje (7-Step Phased Implementation Roadmap)

Implementacija se provodi striktno u 7 faza. Svaka faza ima definiran radni opseg, datoteke koje se kreiraju i **Gate-Check kriterij** (eliminacijski test). Prijelaz na sljedeću fazu dopušten je isključivo kada su svi testovi prethodne faze zeleni.

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ FAZA 1  │ ──► │ FAZA 2  │ ──► │ FAZA 3  │ ──► │ FAZA 4  │ ──► │ FAZA 5  │ ──► │ FAZA 6  │ ──► │ FAZA 7  │
│ Domena  │     │ Storage │     │ Editor  │     │ Kodovi  │     │ Dokument│     │ KPR i   │     │ Fiskal. │
│ & Mat.  │     │ Adapter │     │ Kontrole│     │ & PDF   │     │ & Tijek │     │ PO-SD   │     │ Proxy   │
└─────────┘     └─────────┘     └─────────┘     └─────────┘     └─────────┘     └─────────┘     └─────────┘
```

---

### FAZA 1: Domena, Validacije i Poslovna Matematika (Core Engine)
* **Cilj:** Uspostaviti neovisni TypeScript paket bez UI-a koji sadrži sve tipove, validacije i kalkulacije.
* **Radni zadaci:**
  1. Kreiranje modela tipova (`types.ts`).
  2. Implementacija `validateOib(oib)` s testovima na stvarnim i lažnim OIB-ovima.
  3. Implementacija `validateIban(iban)` za HR i EU IBAN-ove (MOD 97).
  4. Implementacija financijskog kalkulatora za stavke računa (osnovica, porez, popust, zaokruživanje na 2 decimale bez grešaka).
  5. Implementacija generatora HUB-3 teksta prema standardu Hrvatske udruge banaka.
* **Gate-Check Kriterij (Faza 1):**
  * Pokretanje Vitest paketa: 100% prolaznost testova za ISO 7064 OIB algoritam, MOD 97 IBAN algoritam, kalkulacije popusta i HUB-3 formatting.

---

### FAZA 2: Apstraktni Sloj Pohrane i Lokalni Adapter (Storage Layer)
* **Cilj:** Implementirati Repository Pattern i funkcionalni in-browser storage (SQLite Wasm / IndexedDB).
* **Radni zadaci:**
  1. Definiranje sučelja: `IObrtRepository`, `IPartnerRepository`, `IArtiklRepository`, `IDokumentRepository`, `IKprRepository`.
  2. Implementacija `LocalSqliteRepository` (korištenjem `@sqlite.org/sqlite-wasm` ili Dexie.js za IndexedDB).
  3. Kreiranje migracijskih skripti za kreiranje tablica.
  4. Implementacija sekvencijalnog generatora broja računa (`broj_sekvenca` + 1 po godini, prostoru i uređaju).
  5. Implementacija `ExportImportService` za sigurnosnu kopiju (JSON snapshot i AES-256 kriptirana arhiva).
* **Gate-Check Kriterij (Faza 2):**
  * Integracijski test u memoriji: Kreiranje novog obrta, unos 5 partnera, kreiranje računa sa sekvencom `1/POSL1/1`, storniranje i provjera da sekvenca `2/POSL1/1` nema rupa. Uspješan export i import baze.

---

### FAZA 3: Dizajn Sustav i Specijalizirani Set Editor Kontrola (UI Primitives)
* **Cilj:** Izgraditi oštre, responzivne UI komponente u tamno-ljubičastoj temi prema UI specifikaciji.
* **Radni zadaci:**
  1. Postavljanje Tailwind konfiguracije s oštrim rubovima (`rounded-none`, `rounded-xs`) i paletom boja.
  2. Izrada `OibInput`: Maskiranje 11 znamenki, vizualna zelena/crvena indikacija valjanosti u realnom vremenu.
  3. Izrada `IbanInput`: Automatsko formatiranje u blokove po 4 znaka i auto-detekcija domaće banke.
  4. Izrada `CurrencyInput`: Podrška za unos eura s točkom/zarezom i tabularnim monospace prikazom.
  5. Izrada `KpdPicker`: Command Palette pretraživač KPD 2025 šifri s hijerarhijom djelatnosti.
  6. Izrada `TaxZoneToggle`: Segmentirana kontrola za prebacivanje zona (HR B2B, B2C, EU RC, Izvoz).
* **Gate-Check Kriterij (Faza 3):**
  * Komponente se renderiraju na mobitelu (375px) i desktopu (1440px) bez prelamanja ili pomaka piksela. Unos neispravnog OIB-a odmah blokira formu, unos ispravnog IBAN-a automatski ispisuje naziv banke.

---

### FAZA 4: Generator Kodova i PDF Engine (Payment & Print Engine)
* **Cilj:** Omogućiti renderiranje barkodova i generiranje pixel-perfect A4 PDF računa u browseru.
* **Radni zadaci:**
  1. Implementacija klijentskog PDF417 generatora za HUB-3 barkod (Canvas/SVG).
  2. Implementacija QR generatora za EPC SEPA transfer i Fiskalni QR Porezne uprave.
  3. Izrada A4 PDF predloška računa s ugrađenim logotipom, tabularnim stavkama, zakonskom klauzulom za paušaliste (čl. 90 st. 2) i barkodovima na dnu.
  4. Izrada preglednika računa uživo (Live Preview komponenta s desne strane split-screena).
* **Gate-Check Kriterij (Faza 4):**
  * Skeniranje generiranog HUB-3 barkoda kamerom m-banking aplikacije točno prepoznaje IBAN, model, poziv na broj i iznos u centima. PDF se generira u manje od 300 ms unutar preglednika bez servera.

---

### FAZA 5: Ekran za Izdavanje Računa i Poslovni Tijek (Invoice Workflow)
* **Cilj:** Spajanje kontrola, storagea i preglednika u funkcionalan desktop i mobilni workflow.
* **Radni zadaci:**
  1. Izrada Desktop Split-Screen radne plohe (lijevo forma, desno živi A4 preview).
  2. Izrada Mobile radnog toka s Bottom-Sheet modalima i sticky akcijskom trakom za palac.
  3. Podrška za brzi rad s tipkovnicom (`F2` - Fiskaliziraj, `Alt+N` - Nova stavka, `Enter` navigacija).
  4. Implementacija statusnog automata: `NACRT` -> `IZDANO` (zaključavanje izmjena) -> `STORNIRANO`.
  5. Logika konverzije ponude u gotov račun jednim klikom.
* **Gate-Check Kriterij (Faza 5):**
  * Korisnik može unijeti partnera, 3 stavke i izdati račun isključivo tipkovnicom u manje od 30 sekundi. Izdani račun je trajno zaključan za izmjene (immutability).

---

### FAZA 6: Knjigovodstvo: Knjiga Prometa (KPR) i Obrazac PO-SD
* **Cilj:** Automatizacija zakonskih evidencija za paušalni obrt.
* **Radni zadaci:**
  1. Implementacija `naplate_promet` toka: račun se unosi u KPR tek kad se označi kao naplaćen (datum izvoda banke ili fiskalna gotovina).
  2. Praćenje zakonskog poreznog praga od 40.000 €:
     * Vizualni progress bar na nadzornoj ploči.
     * Upozorenja na 75% (30.000 €) i 90% (36.000 €).
  3. Automatski obračun kvartala (Q1, Q2, Q3, Q4) za odabranu kalendarsku godinu.
  4. Generator službene XML datoteke za **Obrazac PO-SD** prema XSD shemi Porezne uprave za predaju na ePoreznu.
* **Gate-Check Kriterij (Faza 6):**
  * Generirani PO-SD XML uspješno prolazi validaciju protiv službene XSD sheme ePorezne bez ijedne sintaksne pogreške.

---

### FAZA 7: Fiskalizacija 1.0 (CIS) i Fiskalizacija 2.0 (e-Račun Proxy)
* **Cilj:** Povezivanje sustava s vanjskim poreznim i posredničkim servisima.
* **Radni zadaci:**
  1. Implementacija Web Crypto trezora: Učitavanje FINA `.p12` datoteke, lokalna AES enkripcija privatnog ključa uz korisnički PIN.
  2. Izrada stateless Cloudflare Worker proxyja (prosljeđivanje SOAP zahtjeva prema CIS-u i REST prema posredniku).
  3. Implementacija fallback offline moda (ZKI se izdaje odmah, račun dobiva oznaku `OFFLINE_ZKI_IZDAN` s rokom od 48h za slanje).
  4. Implementacija generatora **UBL 2.1 CIUS-HR XML** dokumenta s obaveznim KPD 2025 šiframa za Fiskalizaciju 2.0 (B2B).
* **Gate-Check Kriterij (Faza 7):**
  * Uspješan prolaz kroz FINA/Porezna DEMO testno okruženje: Dohvat valjanog JIR-a za gotovinski račun i uspješna isporuka UBL 2.1 e-Računa s KPD šifrom na testni endpoint posrednika.

---

## 7. Verifikacijska Matrica i Definicija Gotovosti (Definition of Done)

Svaki modul i svaki redak koda u sustavu ObrtnIQ mora zadovoljiti sljedeću matricu:

| Područje | Kriterij |
|---|---|
| **Pouzdanost podataka** | Svi financijski izračuni verificirani jediničnim testovima s točnošću na razini centa bez `IEEE 754` decimalnih anomalija. |
| **Pravna sukladnost** | Trodijelni format broja računa bez preskoka u godini; KPD 2025 šifra prisutna na svakoj B2B stavci; zakonska klauzula čl. 90 st. 2 automatska. |
| **Sigurnost certifikata** | Privatni ključ nikada ne napušta preglednik u neenkriptiranom obliku; proxy poslužitelj je 100% bezstanjski (stateless). |
| **Responzivnost i UX** | Puni rad na mobitelu i desktopu; tamna ljubičasta tema s oštrim rubovima; tabularni monospace prikaz financijskih podataka. |
| **Local-First otpornost** | Aplikacija radi bez interneta; automatski nudi snapshot backup u JSON/SQLite formatu. |