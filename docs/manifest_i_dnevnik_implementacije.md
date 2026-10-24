# ObrtnIQ: Manifest i Dnevnik Implementacije (Project Progress Log)

Ovaj dokument služi kao jedinstveni izvor istine za praćenje napretka, evidentiranje odluka, faza, kreiranih datoteka i statusa verifikacije ("Gate-Check") prema [Glavnom Dizajn Dokumentu i Planu Implementacije](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/docs/glavni_dizajn_dokument_i_plan_implementacije_obrtniq.md).

---

## 1. Pregled Faza i Trenutni Status

| Faza | Naziv Modula / Cjeline | Status | Gate-Check Kriterij | Zadnja Izmjena |
|---|---|---|---|---|
| **Faza 0** | **Temeljna konfiguracija & Monorepo postavke** | 🟢 **ZAVRŠENO** | Uspješno kompajliranje, konfigurirani aliasi, postavljen test runner | 2026-10-24 |
| **Faza 1** | **Domena, Validacije i Poslovna Matematika (Core Engine)** | 🟢 **ZAVRŠENO** | 100% prolaznost Vitest testova za OIB (ISO 7064), IBAN (MOD 97), popuste i HUB-3 | 2026-10-24 |
| **Faza 2** | **Sloj Pohrane (Storage Abstraction & Adapter)** | 🟢 **ZAVRŠENO** | In-memory CRUD testovi, sekvenca računa bez rupa, export/import | 2026-10-24 |
| **Faza 3** | **Dizajn Sustav & Sharp UI Primitivi** | 🟢 **ZAVRŠENO** | Responzivnost (375px/1440px), OibInput, IbanInput bank lookup | 2026-10-24 |
| **Faza 4** | **Generator Kodova i PDF Engine** | 🟢 **ZAVRŠENO** | HUB-3 PDF417 skenabilan m-bankingom, EPC QR, PDF export < 300ms, ISO 32000-1 validacija | 2026-10-24 |
| **Faza 4.5** | **Sustav Logiranja i Dijagnostički Dnevnik (Logging Engine)** | 🟢 **ZAVRŠENO** | Višerazinski Scoped Logger (VERBOSE do ERROR), Ring Buffer (500 zapisa), UI Drawer konzola, JSON izvoz | 2026-10-24 |
| **Faza 5** | **Ekran za Izdavanje Računa & Workflow** | 🟡 **SLJEDEĆA NA REDU** | Izdavanje računa tipkovnicom < 30s, statusni automat, immutability | - |
| **Faza 6** | **KPR i Obrazac PO-SD (Knjigovodstvo)** | ⚪ Čeka | XML validacija protiv službene XSD sheme Porezne uprave | - |
| **Faza 7** | **Fiskalizacija 1.0 (CIS) & 2.0 (e-Račun)** | ⚪ Čeka | FINA DEMO okruženje: JIR dohvat i UBL 2.1 isporuka posredniku | - |

*Legenda statusa: ⚪ Čeka | 🟡 U tijeku / Sljedeća | 🟢 Završeno (Gate-Check verificiran) | 🔴 Blokirano*

---

## 2. Dnevnik Implementacije (Kronološki Zapisnik Rada)

| Datum / Vrijeme | Faza | Komponenta / Datoteka | Akcija / Opis promjene | Status / Gate-Check |
|---|---|---|---|---|
| 2026-10-24 13:30 | Setup | `.gitignore`, `.git` | Inicijalizacija Git repozitorija, postavljanje pravila ignoriranja | Završeno |
| 2026-10-24 13:32 | Setup | `docs/manifest_i_dnevnik_implementacije.md` | Kreiran manifest i sustav za praćenje statusa implementacije | Završeno |
| 2026-10-24 13:33 | Faza 0 | `package.json`, `tsconfig.base.json` | Konfiguriran korijenski npm workspaces (`packages/*`, `apps/*`) | Završeno |
| 2026-10-24 13:33 | Faza 0 | `packages/core` | Inicijalizacija TypeScript biblioteke za domenu s Vitest konfiguracijom | Završeno |
| 2026-10-24 13:34 | Faza 0 | `apps/web` | Inicijalizacija React 19 + Vite + Tailwind CSS aplikacije s Midnight Amethyst temom i OPFS zaglavljima | Završeno |
| 2026-10-24 13:36 | Faza 0 | Monorepo verifikacija | Pokrenut `npm run build` i `npm run test` (Vitest: 1 passed) | 🟢 Gate-Check PROŠAO |
| 2026-10-24 13:41 | Faza 1 | `packages/core/src/utils/oib.ts` | Implementiran ISO 7064 MOD 11, 10 algoritam za OIB validaciju | Završeno |
| 2026-10-24 13:41 | Faza 1 | `packages/core/src/utils/iban.ts` | Implementiran ISO 13616 MOD 97 IBAN validator i registar banaka HNB | Završeno |
| 2026-10-24 13:42 | Faza 1 | `packages/core/src/utils/calculator.ts` | Precizni kalkulator stavki, rekapitulacije i paušalnog praga (centi) | Završeno |
| 2026-10-24 13:42 | Faza 1 | `packages/core/src/utils/hub3.ts` | HUB-3 / HUB-3A HRVHUB30 generator i parser naloga za plaćanje | Završeno |
| 2026-10-24 13:44 | Faza 1 | `packages/core/tests/*.test.ts` | 32 jedinična testa (OIB, IBAN, calculator, hub3) | 🟢 Gate-Check PROŠAO (32/32) |
| 2026-10-24 13:45 | Faza 1 | `apps/web/src/App.tsx` | Dodan interaktivni Core Engine playground u UI | Završeno |
| 2026-10-24 13:49 | Faza 2 | `packages/core/src/storage/interfaces.ts` | Definiran apstraktni repozitorijski sloj (IObrtnIQStorage) | Završeno |
| 2026-10-24 13:49 | Faza 2 | `packages/core/src/storage/sequence.ts` | Sekvencijalni generator brojeva računa (1/POSL1/1) i storno servis | Završeno |
| 2026-10-24 13:49 | Faza 2 | `packages/core/src/storage/crypto-backup.ts` | AES-256-GCM enkripcija i JSON snapshot backup/restore servis | Završeno |
| 2026-10-24 13:50 | Faza 2 | `packages/core/src/storage/memory-adapter.ts` | In-memory adapter za brzo i izolirano testiranje pohrane | Završeno |
| 2026-10-24 13:50 | Faza 2 | `apps/web/src/storage/dexie-db.ts` | Dexie.js IndexedDB perzistentni adapter za korisnički preglednik | Završeno |
| 2026-10-24 13:50 | Faza 2 | `packages/core/tests/storage.test.ts` | Gate-Check integracijski test: obrt, 5 partnera, sekvenca 1 i 2, storno, AES-256 enkripcija, import | 🟢 Gate-Check PROŠAO (34/34) |
| 2026-10-24 13:54 | Faza 3 | `apps/web/src/components/controls/OibInput.tsx` | OibInput s ISO 7064 validacijom u realnom vremenu i vizualnim signalom | Završeno |
| 2026-10-24 13:54 | Faza 3 | `apps/web/src/components/controls/IbanInput.tsx` | IbanInput s automatskim 4-znakovnim formatiranjem i HNB bank lookupom | Završeno |
| 2026-10-24 13:54 | Faza 3 | `apps/web/src/components/controls/CurrencyInput.tsx` | CurrencyInput s podrškom za unos zareza/točke i monospace € prikaz | Završeno |
| 2026-10-24 13:54 | Faza 3 | `apps/web/src/components/controls/TaxZoneToggle.tsx` | Segmentirani preklopnik poreznih zona sa zakonskim klauzulama | Završeno |
| 2026-10-24 13:55 | Faza 3 | `apps/web/src/components/controls/KpdPicker.tsx` | KpdPicker Command Palette pretraživač službene KPD 2025 baze djelatnosti | Završeno |
| 2026-10-24 13:56 | Faza 3 | `apps/web/src/App.tsx` | Gate-Check: Integriran Showroom kontrola, preklopnik Desktop (1440px) / Mobitel (375px), validacija blokade | 🟢 Gate-Check PROŠAO |
| 2026-10-24 14:00 | UX/Layout | `apps/web/src/App.tsx` | Uklonjen max-w-7xl limit: desktop način rada sada koristi 100% širine prozora (Split-Screen 58/42 s živim A4 preglednikom) | Završeno |
| 2026-10-24 14:05 | Theme | `apps/web/src/hooks/useTheme.ts`, `apps/web/src/components/ThemeSelector.tsx`, `index.css` | Implementiran dinamički Theme Engine (5 preseta: Amethyst, Emerald, Cobalt, Bronze, Carbon + 0°-360° Hue rotacija s localStorage trajnosti) | Završeno |
| 2026-10-24 14:16 | Faza 4 | `packages/core/src/utils/epc-qr.ts` | EPC SEPA Credit Transfer standard (EPC069-12 v002) generator i parser | Završeno |
| 2026-10-24 14:17 | Faza 4 | `packages/core/src/utils/fiscal-qr.ts` | Porezna uprava fiskalni QR kod generator URL-a i parser | Završeno |
| 2026-10-24 14:18 | Faza 4 | `packages/core/tests/epc-qr.test.ts`, `fiscal-qr.test.ts` | 8 novih jediničnih testova (42/42 ukupno prolaznost u 525ms) | 🟢 Gate-Check PROŠAO |
| 2026-10-24 14:19 | Faza 4 | `apps/web/src/utils/barcode.ts` | Klijentski Canvas rendereri za HUB-3 PDF417 i EPC QR (bwip-js, qrcode) | Završeno |
| 2026-10-24 14:20 | Faza 4 | `apps/web/src/utils/pdf-generator.ts` | Službeni A4 PDF generator računa s obrt/kupac podacima, stavkama, KPD 2025, čl. 90 st. 2 klauzulom i barkodovima | Završeno |
| 2026-10-24 14:21 | Faza 4 | `apps/web/src/components/InvoiceLivePreview.tsx` | Živi A4 preglednik računa s preklopnikom Tema / Bijeli papir i instant PDF downloadom | Završeno |
| 2026-10-24 14:22 | Faza 4 | `apps/web/src/App.tsx` | Povezan živi A4 preglednik na formu i live inpute, prikaz performansi (< 100 ms) | 🟢 Gate-Check PROŠAO |
| 2026-10-24 15:00 | Tipografija | `packages/core/src/utils/typography.ts`, `tests/typography.test.ts` | Validacija hrvatske tipografije (Č/Ć/Ž/Š/Đ), zarez decimala, formatiranje datuma, nedjeljivi razmaci (\u00A0) za eliminaciju siročića | 🟢 Verificirano (6 testova) |
| 2026-10-24 15:03 | Print Flow | `apps/web/src/index.css`, `pdf-generator.ts`, `InvoiceLivePreview.tsx` | Implementiran Responsive Flow Print Engine (@media print, DOM-based high-DPI PDF capture, fluid/A4/POS 80mm širine, no-print zaštita) | Završeno |
| 2026-10-24 15:15 | PDF Validacija | `packages/core/src/utils/pdf-validator.ts`, `tests/pdf-validator.test.ts` | Implementiran ISO 32000-1 PDF strukturalni validator (%PDF-1.x magic header, %%EOF trailer, /Catalog, /Pages stablo) | 🟢 Verificirano (4 testa, 52/52 ukupno) |
| 2026-10-24 15:18 | UI & Print Čišćenje | `apps/web/src/App.tsx`, `index.css`, `InvoiceLivePreview.tsx`, `pdf-generator.ts` | Uklonjen showroom switch (desktop/mobitel 375px) u korist pune širine; rigorozna @media print izolacija (visibility: hidden za sve osim računa); bijeli papir onclone sanitizacija | 🟢 Gate-Check PROŠAO |
| 2026-10-24 15:40 | Faza 4.5 | `packages/core/src/logger/*`, `tests/logger.test.ts` | Implementiran Core Logging Engine (RingBuffer, ScopedLogger, level filtering, data sanitization, 7 testova) | 🟢 Gate-Check PROŠAO (59/59) |
| 2026-10-24 15:44 | Faza 4.5 | `apps/web/src/services/logger.ts`, `SystemLogDrawer.tsx`, `useSystemLogs.ts`, `App.tsx` | Izrađen Web logger cjevovod (console pipe, localStorage prag), Drawer konzola, footer widget i log uvezivanje | 🟢 Gate-Check PROŠAO |

---

## 3. Registar Ključnih Arhitektonskih Odluka (ADR)

* **ADR-001 (Monorepo struktura):** Odabran `npm workspaces` pristup (`packages/core` + `apps/web`) kako bi domenska logika, financijska matematika i validacije ostali 100% neovisni o UI-ju i poslužitelju, čime se omogućuje neovisno testiranje i potencijalna ponovna iskoristivost u Web Workeru ili Cloudflare proxyju.
* **ADR-002 (Local-First pohrana):** Koristi se lokalna baza unutar korisničkog preglednika (Dexie.js / SQLite Wasm preko OPFS-a) bez ikakvog centralnog poslužitelja ili mjesečnih troškova infrastrukture.
* **ADR-003 (Precizna financijska matematika):** Svi iznosi se interno računaju u centima (integer) ili decimalnom reprezentacijom s eksplicitnim zaokruživanjem kako bi se eliminirale `IEEE 754 float` anomalije.
* **ADR-004 (Parametrizirani HSL Theme Engine s Hue rotacijom):** Uveden dinamički CSS HSL sustav baziran na kutu tona (`--theme-hue`, 0°-360°). Omogućuje trenutačnu promjenu palete u realnom vremenu uz zadržavanje visokog kontrasta, odabir 5 kuriranih preseta i finu rotaciju, pri čemu su pravni i porezni signali (zeleno, crveno, žuto) fiksirani radi zakonske jasnoće.
* **ADR-005 (Klijentski Barcode & PDF Generiranje bez poslužitelja):** Zbog privatnosti korisnika i zero-server cost arhitekture, generiranje HUB-3 PDF417 barkoda (prema HUB standardu s error correction level 4), EPC SEPA QR koda (EPC069-12) i A4 PDF dokumenta odvija se 100% unutar korisničkog web preglednika koristeći `bwip-js` i `jspdf`. Time se osigurava rad offline, trenutno preuzimanje (< 100 ms, daleko ispod Gate-Check praga od 300 ms) i nulti rizik od curenja poslovnih podataka na vanjske servere.
* **ADR-006 (Hrvatska Pravopisna Tipografija i Responsive Print Flow Layout):** Kako bi se eliminiralo rezanje teksta (slicing) i gubitak dijakritika (Č, Ć, Ž, Š, Đ) koji nastaje kod fiksnih PDF koordinata, sustav uvodi dvostruki Flow mehanizam: (1) Nativni `@media print` CSS engine s A4/POS 80mm podrškom koji se dinamički prilagođava širini papira uz prirodni CSS Grid/Flexbox prekid redaka i zaštitu od lomljenja (`break-inside: avoid`), te (2) DOM-driven klijentski PDF capture koji preslikava točne browser-rasterizirane fontove bez izostavljanja ijednog slova ili retka, uz strogu primjenu hrvatskog pravopisa (zarez za decimale, završne točke na datumima i `\u00A0` nedjeljivi razmaci za sprječavanje siročića).
* **ADR-007 (ISO 32000-1 PDF Validacija i Čistoća Ispisa):** Svaki klijentski generirani PDF automatski prolazi strukturalnu provjeru bajtova (`validatePdfStructure`) koja provjerava zaglavlje `%PDF-1.x`, završni marker `%%EOF`, katalog objekata `/Catalog` i hijerarhiju stranica `/Pages` prije nego se datoteka ponudi korisniku na spremanje. Ujedno, `@media print` stilovi i `html2canvas` `onclone` kuka osiguravaju stopostotnu čistoću fizičkog i digitalnog ispisa: svi alati, zaglavlja, showroom switchevi i navigacija su izolirani i nevidljivi, a račun se uvijek renderira na čistom bijelom papiru (`#FFFFFF`) s tamnim slovima (`#0F172A`) neovisno o temi odabranoj na ekranu.
* **ADR-008 (Lokalni Višerazinski Sustav Logiranja i Cirkularni Ring Buffer):** Zbog apsolutnog poštovanja privatnosti i offline rada, aplikacija ne šalje telemetriju niti greške na vanjske cloud poslužitelje. Umjesto toga, implementira se lagani, strukturirani Scoped Logger s 5 razina (`ERROR`, `WARN`, `INFO`, `DEBUG`, `VERBOSE`). Logovi se zadržavaju u memorijskom cirkularnom spremniku (ring buffer do 500 unosa) kako bi se spriječilo nekontrolirano trošenje memorije, uz mogućnost lokalnog spremanja u IndexedDB. Korisničko sučelje dobiva statusni widget u podnožju i terminalski drawer s filtriranjem, pretraživanjem i mogućnošću preuzimanja sanitiziranog dijagnostičkog JSON paketa bez osjetljivih podataka.

---

## 4. Arhitektonska Specifikacija: Višerazinski Sustav Logiranja i Dijagnostike (Logging & Event Engine)

### 4.1. Hijerarhija Razina (Log Levels)
1. **`ERROR` (Razina 0)**: Prekidajuće greške (npr. neuspjelo spremanje računa u IndexedDB, korumpirani backup, neuspjelo generiranje PDF-a).
2. **`WARN` (Razina 1)**: Upozorenja i automatski fallback mehanizmi (npr. DOM capture prešao na vektorski generator, nevažeći OIB blokira izdavanje, približavanje paušalnom limitu).
3. **`INFO` (Razina 2)**: Ključni životni ciklusi poslovanja (npr. račun izdan pod brojem `1/POSL1/1`, promjena porezne zone, učitana baza banaka, spremljena tema).
4. **`DEBUG` (Razina 3)**: Tehnički detalji (npr. izmjereno vrijeme generiranja PDF-a u ms, sirovi HUB-3 niz od 170 znakova, izračun osnovice i centi).
5. **`VERBOSE` (Razina 4)**: Detaljni trag rada (npr. svaki korak ISO 7064 kalkulacije, kalkulacija HSL vrijednosti pri rotaciji kotačića boja, micro-interakcije unosa).

### 4.2. Tipizirani Model Podataka (`LogEntry`)
```typescript
export type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'VERBOSE';

export interface LogEntry {
  id: string;              // Jedinstveni identifikator zapisa (npr. ULID / timestamp)
  timestamp: string;       // ISO 8601 string ("2026-10-24T15:30:12.450Z")
  displayTime: string;     // Kratko lokalno vrijeme ("15:30:12.450")
  level: LogLevel;         // ERROR | WARN | INFO | DEBUG | VERBOSE
  context: string;         // Oznaka modula (npr. "STORAGE:DEXIE", "PDF:ENGINE", "CORE:CALC")
  message: string;         // Jasna, sažeta poruka
  data?: unknown;          // Strukturirani podaci (sanitizirani)
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}
```

### 4.3. Tok Podataka i Arhitektura
* **Core Scoped Logger (`@obrtniq/core/src/logger`)**: Domenski čista instanca koja omogućuje kreiranje kontekstualnih loggera (`logger.scope('PDF:ENGINE')`) bez ovisnosti o browseru ili Reactu.
* **Cirkularni Ring Buffer (FIFO, max 500 zapisa)**: Osigurava stabilnu memoriju (< 200 KB) bez memory leaka tokom dugotrajnog rada aplikacije.
* **Console Pipe**: Obojani ispis u standardnu konzolu preglednika (`console.debug`, `console.info`, `console.warn`, `console.error`) s CSS HSL oznakama usklađenim s aktivnom temom.
* **Lokalna Perzistencija**: Opcionalno snimanje u Dexie `sustav_dnevnik` tablicu za dugoročnu reviziju rada.

### 4.4. Korisničko Sučelje (UI Console Drawer & Status Widget)
* **Status Widget u Podnožju (Footer)**:
  * Prikazuje status sustava: `🟢 Sustav stabilan • 0 grešaka` ili `🔴 1 greška • 2 upozorenja`.
  * Klik otvara/zatvara konzolu.
* **Terminal Console Drawer (Donji panel)**:
  * Brzi filter po razinama: `Sve`, `Error`, `Warn`, `Info`, `Debug`, `Verbose`.
  * Pretraga po kontekstu i tekstu poruke.
  * Selektor minimalne razine bilježenja (spremanje preferencije u `localStorage`).
  * Gumb **"Preuzmi dijagnostički paket"** (`obrtniq-diagnostic-log.json`).
  * Gumb **"Isprazni zapisnik"**.
  * Monospace prikaz (JetBrains Mono) s tematskim bojama i sklopivim detaljima.

### 4.5. Akcijski Plan Implementacije
1. **Korak 1 (Core)**: Kreirati `packages/core/src/logger/` s tipovima (`LogLevel`, `LogEntry`) i scoped logger klasom.
2. **Korak 2 (Web Adapter)**: Kreirati `apps/web/src/services/logger.ts` s ring bufferom, povezivanjem na `localStorage` prag i konzolu preglednika.
3. **Korak 3 (UI Drawer)**: Izraditi `SystemLogDrawer.tsx` i integrirati statusni widget u podnožje `App.tsx`.
4. **Korak 4 (Uvezivanje)**: Povezati logiranje u ključne module: validacije OIB/IBAN, Dexie sekvence, PDF i Barcode engine.
5. **Korak 5 (Verifikacija)**: Provjeriti ponašanje u pregledniku, testirati filtriranje i izvoz dijagnostike.
