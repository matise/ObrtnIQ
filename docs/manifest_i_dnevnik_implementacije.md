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
| **Faza 5** | **Ekran za Izdavanje Računa & Workflow** | 🟢 **ZAVRŠENO** | Multi-stavke, F2/Alt+N prečaci, statusni automat (NACRT->IZDANO->STORNIRANO), immutability, Dexie DocumentDrawer | 2026-10-24 |
| **Faza 6** | **KPR i Obrazac PO-SD (Knjigovodstvo)** | 🟢 **ZAVRŠENO** | XML validacija protiv službene XSD sheme Porezne uprave v2.0, naplate promet, 40k prag | 2026-10-24 |
| **Faza 7** | **Fiskalizacija 1.0 (CIS) & 2.0 (e-Račun)** | 🟢 **ZAVRŠENO** | 100% prolaznost (89/89 testova), FINA DEMO/PROD trezor (AES-256 s PIN-om), ZKI/JIR automati, 48h offline fallback, UBL 2.1 CIUS-HR s KPD 2025 i stateless proxy | 2026-10-24 |
| **Faza 8** | **Postavke Obrta, Adresar Partnera & Memorandum** | 🟢 **ZAVRŠENO** | Dinamički profil obrta u Dexie bazi, adresar partnera s pretragom i brzim odabirom, klijentski upload logotipa i digitalnog pečata/potpisa (Base64), A4 i PDF render | 2026-10-24 |
| **Faza 9** | **Katalog Artikala & Usluga (KPD 2025), KPR CSV & Kriptirani Backup** | 🟢 **ZAVRŠENO** | Cjenik s KPD 2025 šiframa, službeni KPR CSV izvoz s UTF-8 BOM za Excel, lokalni AES-256-GCM / PBKDF2 100k trezor | 2026-10-24 |
| **Faza 10** | **Google Identity Kripto Sidro, Drive AppData Sync & Gemini BYOK** | 🟢 **ZAVRŠENO** | Zero-Server Auth s Google sub sidrom, skriveni Drive AppData folder, klijentska AI analiza | 2026-10-24 |
| **Među-faza 10.5** | **Dijagnostika, Stack Parser & Error Boundary** | 🟢 **ZAVRŠENO** | Automatsko hvatanje neuhvaćenih grešaka, filtriranje stack traceova i auto-open konzola | 2026-10-24 |
| **Faza 11** | **Žigo Autonomni Klijentski Agent (Function Calling & Žigin Rez)** | 🟢 **ZAVRŠENO** | 12 autonomnih alata sustava, perzistentni chat u Dexie bazi, multimodalna obrada (slike/PDF), trijaža i porezni filtar | 2026-10-24 |
| **Faza 12** | **Vektorski Sustav Ikona, Orlando Pečati & Dinamičko Temiranje** | 🟢 **ZAVRŠENO** | 20 klesanih SVG simbola (48x48), mikro-animacije, dinamički SVG Favicon s crvenim alarmom, HSL integracija | 2026-10-24 |
| **Faza 13 & 13.1** | **Žigo Omni-Copilot & Sustav Svjesnosti Konteksta (Eyes-on-Glass)** | 🟢 **ZAVRŠENO** | Docked Sidecar način rada, praćenje forme računa i praga u realnom vremenu, dubrovačka fonologija i stilizirane sekcije odgovora | 2026-10-25 |
| **Faza 14** | **Žigo Glasovni Bedem (In-Browser STT & Akustički Leksikalni Normalizator)** | 🟢 **ZAVRŠENO** | 100% preglednički Web Speech API, fonetska normalizacija kratica (KPR, ZKI, JIR, OIB, PO-SD, e-Račun) | 2026-10-25 |
| **Faza 15** | **Žigo Glasovni Narator & Master Audio Transport (In-Browser TTS)** | 🟢 **ZAVRŠENO** | Centralizirani Audio Transport s invarijantom jednog govornika, auto-read, vizualno praćenje teksta i prekid govora pri STT-u | 2026-10-25 |
| **Faza 16** | **Google Cloud STT V2 & Cloud TTS Primarni Motor s Fallbackom** | 🟢 **ZAVRŠENO** | BYOK GCP STT V2 postavke, WaveNet bariton, latencija i test veza, Google Drive 401 retry, Newest-First dnevnik | 2026-10-25 |
| **Faza 17** | **Sveobuhvatno Knjigovodstvo Obrta: Obvezni Doprinosi, HUB-3 Nalozi & Troškovnik** | 🟢 **ZAVRŠENO** | 100% prolaznost (357/357 testova, 0 tsc grešaka), MIO 1/2 i HZZO doprinosi s HR68 nalozima, kvartalni paušalni porez, troškovnik s dugotrajnom imovinom (>663,61 €), CSV izvod (ZABA, PBZ, Erste, HPB, OTP, Revolut) s 1-klik saldiranjem, HUB-3 i EPC SEPA QR uplatnice i objedinjeni 5-tab BookkeepingDrawer | 2026-10-25 |
| **Faza 18** | **Žigo Inteligentni Knjigovodstveni Copilot, PWA Offline Instalabilnost & Godišnji Analitički Izvještaji** | 🟢 **ZAVRŠENO** | 100% prolaznost (364/364 testova, 0 tsc grešaka), 4 nova AI knjigovodstvena alata, PWA offline rad & Service Worker, Godišnja analitika i A4 PDF izvještaj | 2026-10-25 |
| **Faza 19** | **Modularna Workspace Arhitektura (Home & View Router bez Blur Overlay-a, In-Place Navigacija)** | 🟢 **ZAVRŠENO** | Zamjena modalnih ladica punim in-place radnim prozorima bez backdrop blura i disablinga, trajno aktivni AppHeader s Orlando pečatom, očuvanje stanja računa u memoriji, Alt+H / Esc navigacija, 371/371 testova | 2026-10-25 |
| **Faza 20** | **Poslovno Proširenje Obrta: Ponavljajući Računi (Subscriptions), Porezni Kalendar RH, Multi-Location & 1-Klik ZIP Paket** | 🟡 **SLJEDEĆA** | Ponavljajući paušali, službeni porezni kalendar s odbrojavanjem i uplatnicama, više poslovnih prostora i naplatnih uređaja, klijentsko slanje (Web Share/Mailto) i 1-klik arhivski paket za poreznu | 2026-10-25 |

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
| 2026-10-24 15:48 | PDF DOM Fix | `apps/web/src/utils/pdf-generator.ts`, `package.json` | Zamijenjen html2canvas s html2canvas-pro radi nativne podrške za oklab/oklch boje iz Tailwind CSS v4 | 🟢 Gate-Check PROŠAO |
| 2026-10-24 16:05 | Faza 5 | `packages/core/src/domain/workflow.ts`, `tests/workflow.test.ts` | Implementiran Core Workflow Engine: statusni automat (NACRT -> IZDANO -> STORNIRANO), validacija prije izdavanja, konverzija ponude, immutability blokada | 🟢 Gate-Check PROŠAO (66/66 testova) |
| 2026-10-24 16:08 | Faza 5 | `apps/web/src/components/DocumentDrawer.tsx` | Izrađena ladica za evidenciju dokumenata (Dexie.js IndexedDB) s filtrima Svi/Računi/Ponude/Storno i učitavanjem | Završeno |
| 2026-10-24 16:10 | Faza 5 | `apps/web/src/App.tsx`, `InvoiceLivePreview.tsx` | Desktop Split 58/42 radna ploha s multi-stavkama (Alt+N), F2 izdavanjem, zaključavanjem izmjena i storno tokom | 🟢 Gate-Check PROŠAO |
| 2026-10-24 16:30 | Faza 6 | `packages/core/src/domain/kpr.ts` | Implementiran KPR sustav: raspodjela kvartala (Q1-Q4), porezni razredi 1-5, servis evidentiranja uplate (`evidentirajNaplatu`) po danu izvoda/gotovine i sažetak | Završeno |
| 2026-10-24 16:32 | Faza 6 | `packages/core/src/domain/posd-xml.ts` | Službeni generator Obrasca PO-SD XML za ePoreznu (shema v2.0) i rigorozni validator (deklaracija, namespace, OIB, matematički pariteti kvartala i sume) | Završeno |
| 2026-10-24 16:34 | Faza 6 | `packages/core/tests/posd.test.ts` | 6 novih jediničnih testova za KPR, porezne razrede, prelazak limita 40k € i XML strukturu (72/72 ukupno) | 🟢 Gate-Check PROŠAO (72/72) |
| 2026-10-24 16:36 | Faza 6 | `apps/web/src/components/KprDrawer.tsx` | Izrađena ladica s 3 taba: (1) Knjiga Prometa tablica s ručnim unosom i printom, (2) PO-SD kvartalne kartice s XML preuzimanjem i validacijom, (3) Nadzor praga 40k € | Završeno |
| 2026-10-24 16:38 | Faza 6 | `apps/web/src/App.tsx` | Integriran dinamički header widget za prag 40.000 € (zeleno/žuto/crveno), prečac na KPR drawer i akcija evidentiranja uplate u KPR za izdane račune | 🟢 Gate-Check PROŠAO |
| 2026-10-24 16:46 | Faza 7 | `packages/core/src/domain/fiskalizacija.ts` | Implementirana Fiskalizacija 1.0: ZKI raw string format, RFC 1321 MD5 heksadecimalni sažetak, CIS SOAP XML generator i parser, 48h offline fallback tajmer | Završeno |
| 2026-10-24 16:47 | Faza 7 | `packages/core/src/domain/ubl-eracun.ts` | Implementirana Fiskalizacija 2.0: UBL 2.1 CIUS-HR XML generator i validator s obaveznim KPD 2025 šiframa na svim stavkama i čl. 90 st. 2 oslobođenjem | Završeno |
| 2026-10-24 16:48 | Faza 7 | `packages/core/src/domain/certificate-vault.ts` | Implementiran Web Crypto trezor: PBKDF2 (100.000 iteracija) + AES-256-GCM enkripcija privatnog ključa s PIN-om, FINA DEMO certifikat i validacija | Završeno |
| 2026-10-24 16:49 | Faza 7 | `packages/core/src/proxy/worker.ts` | Izrađen bezstanjski Cloudflare Worker proxy (CORS premošćivanje za CIS Porezne uprave i API posrednika bez spremanja podataka) | Završeno |
| 2026-10-24 16:52 | Faza 7 | `packages/core/tests/*.test.ts` | 17 novih jediničnih testova (fiskalizacija, ubl-eracun, certificate-vault) • Ukupno 16 datoteka i 89/89 prolaznih testova | 🟢 Gate-Check PROŠAO (89/89) |
| 2026-10-24 16:55 | Faza 7 | `apps/web/src/services/fiscal-service.ts`, `FiscalDrawer.tsx` | Izrađen klijentski fiskalni servis i ladica s 3 taba (FINA trezor, CIS gotovina s offline redom, e-Račun UBL 2.1) | Završeno |
| 2026-10-24 16:58 | Faza 7 | `apps/web/src/App.tsx`, `InvoiceLivePreview.tsx` | Integrirana automatska fiskalizacija pri izdavanju gotovinskog računa (F2), prikaz ZKI/JIR-a, fiskalni QR Porezne uprave, A4 ispis i e-Račun preuzimanje | 🟢 Gate-Check PROŠAO |
| 2026-10-24 17:15 | Refaktoring | `App.tsx`, `engine/*`, `hooks/*`, `components/*` | Dekompozicija monolitnog App.tsx (sa 1.273 na ~115 linija): izdvajanje engine sloja (types, obrt-profile, invoice-mapper), 5 custom hookova i 8 UI podkomponenti | 🟢 Gate-Check PROŠAO (89/89 testova, 0 grešaka) |
| 2026-10-24 17:21 | Verifikacija | Monorepo (Faza 0 – 7) | Pokrenut cjelokupni Smoke Test cjevovod: 16 testnih datoteka (89/89 testova), tsc -b bez grešaka, Vite produkcijski build i provjera dev servera (200 OK) | 🟢 Gate-Check PROŠAO (100% uspješnost) |
| 2026-10-24 17:34 | Faza 8 | `useObrtProfile.ts`, `usePartners.ts`, `SettingsDrawer.tsx`, `PartnerDrawer.tsx`, `InvoiceLivePreview.tsx` | Implementirane Postavke obrta, adresar partnera, upload loga i digitalnog pečata/potpisa (Base64) s automatskim ugrađivanjem u A4 račun i PDF | 🟢 Gate-Check PROŠAO (89/89 testova, 0 grešaka) |

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
* **ADR-009 (Nepromjenjivost Izdanog Dokumenta - Immutability, Statusni Automat i Brzi Tipkovnički Unos):** Prema Zakonu o računovodstvu i Zakonu o fiskalizaciji RH, jednom izdani dokumenti ne smiju se retroaktivno mijenjati. Sustav uvodi strogi statusni automat: dokument nastaje kao `NACRT` gdje je omogućeno slobodno dodavanje stavaka (`Alt+N`) i izmjene. Činom izdavanja (`F2`), dodjeljuje se trajni sekvencijalni broj bez rupa (`1/POSL1/1`), generiraju se HUB-3 i EPC kodovi, a status prelazi u `IZDANO`. U tom trenutku svi ulazni elementi postaju 'read-only' i 'disabled' (immutability). Svaka korekcija zakonski se rješava isključivo stvaranjem novog povezanog `STORNO_RACUN` dokumenta s negativnim predznakom u nizu.
* **ADR-010 (Knjiga Prometa - KPR, Kvartalni Obračun i Službeni PO-SD XML Generator za ePoreznu):** Prema članku 82. Zakona o porezu na dohodak i Pravilniku o paušalnom oporezivanju samostalnih djelatnosti, račun se u Knjigu Prometa (KPR) **ne unosi** u trenutku izdavanja, već isključivo na dan kada je stvorena stvarna novčana naplata (dan bankovnog izvoda za bezgotovinska plaćanja ili trenutak naplate gotovinom). Sustav uvodi:
  1. **Evidenciju naplate (`evidentirajNaplatu`)**: Svaka naplata dobiva sekvencijalni broj stavke u KPR-u (`brojKprStavke`), vezu na broj računa/temeljnice i točan datum primitka sredstava.
  2. **Automatsko razvrstavanje po kvartalima (Q1-Q4)**: Kvartal se određuje strogo prema datumu naplate, uz odvajanje gotovinskog prometa od bezgotovinskog (žiro-račun).
  3. **Porezne razrede i nadzor praga 40.000 €**: Sustav kontinuirano mapira godišnje primitke u zakonskih 5 poreznih razreda (godišnji porezi: 207 €, 270 €, 360 €, 540 €, 720 €) te vizualno upozorava na 75% (30.000 €) i 90% (36.000 €) iskorištenosti, s crvenim alarmom pri prelasku 40.000 € (obveza ulaska u PDV i redovno knjigovodstvo).
  4. **Službeni XML generator za Obrazac PO-SD**: Kreira XML datoteku usklađenu s važećom XSD shemom Porezne uprave RH `v2.0` (`http://e-porezna.porezna-uprava.hr/sheme/zahtjevi/ObrazacPOSD/v2_0`). Datoteka automatski prolazi ugrađenu validaciju zaglavlja, OIB-a i matematičke jednakosti kvartala (`Gotovina + Bezgotovinski = Ukupno`) te je spremna za predaju na portal ePorezna bez posrednika.
* **ADR-011 (Web Crypto Trezor Certifikata, ZKI/JIR Automati, 48h Offline Fallback i UBL 2.1 CIUS-HR e-Račun Standard):** Za potrebe usklađenosti s hrvatskim zakonodavstvom o fiskalizaciji (Zakon o fiskalizaciji u prometu gotovinom - Fiskalizacija 1.0 te Zakon o fiskalizaciji u B2B prometu - Fiskalizacija 2.0 s KPD 2025 standardom):
  1. **Sigurnost privatnih ključeva (Zero Plaintext Storage)**: Korisnički FINA certifikat i privatni RSA ključ enkriptiraju se u korisničkom pregledniku 256-bitnim AES-GCM algoritmom s ključem izvedenim iz korisničkog PIN-a (PBKDF2 s 100.000 iteracija SHA-256). Privatni ključ nikada ne napušta preglednik u otvorenom obliku. Za razvoj i testiranje ugrađen je službeni FINA DEMO profil.
  2. **ZKI izračun (RFC 1321 MD5)**: Generira standardizirani sirovi niz znakova (`OIB + DatumVrijeme + BrojOznRac + OznPosPr + OznNapUr + UkupIzn`) koji se potpisuje privatnim ključem certifikata, a nad potpisom se izračunava 32-znakovni MD5 sažetak malim heksadecimalnim slovima.
  3. **Offline Fallback mehanizam (rok 48h)**: Ako CIS Porezne uprave nije dostupan ili je veza u prekidu, račun se trenutno izdaje s generiranim ZKI-jem i dobiva status `OFFLINE_ZKI_IZDAN`. Sustav u pozadini prati zakonski rok od 48 sati te omogućuje jednoklikno naknadno slanje čim se internetska veza uspostavi (`<f73:NakDost>true</f73:NakDost>`).
  4. **Fiskalizacija 2.0 (UBL 2.1 CIUS-HR s KPD 2025)**: B2B računi automatski generiraju e-Račun u formatu UBL 2.1 sukladno normi EN 16931 i nacionalnoj specifikaciji CIUS-HR. Svaka stavka obavezno nosi propisanu KPD 2025 šifru (`<cbc:ItemClassificationCode listID="KPD2025">`), a iznos je mapiran na poreznu kategoriju E (oslobođeno prema čl. 90 st. 2).
  5. **Bezstanjski Cloudflare Worker Proxy**: Rješava CORS prepreke web preglednika prema CIS poslužitelju Porezne uprave i API-jima posrednika, bez baze podataka i bez spremanja poslovnih podataka korisnika (Zero-Knowledge Architecture).
* **ADR-012 (Modularizacija App.tsx i Troslojna Arhitektura Web Aplikacije):** Kako je aplikacija rasla kroz Faze 1 do 7, datoteka `App.tsx` narasla je na 1.273 linije, miješajući orkestraciju sučelja, kalkulaciju stavaka, statusni automat i mapiranje podataka za ladice. Sustav je dekomponiran u tri strogo odvojena sloja:
  1. **Engine & Domain sloj (`apps/web/src/engine/`)**: Izolirani tipovi (`types.ts`), statički profil obrta (`obrt-profile.ts`) i čiste funkcije za mapiranje (`invoice-mapper.ts`) koje pripremaju nacrte i rekvizite za ladice bez JSX ovisnosti.
  2. **Custom Hooks sloj (`apps/web/src/hooks/`)**: Samostalni hookovi za upravljanje stanjem stavaka (`useInvoiceItems`), formom kupca (`useInvoiceForm`), životnim ciklusom i fiskalizacijom (`useInvoiceWorkflow`), tipkovničkim prečacima (`useKeyboardShortcuts` za F2 i Alt+N) i agregiranim brojačima (`useAppStats`).
  3. **UI Prezentacijski sloj (`apps/web/src/components/`)**: Podijeljen na `layout/` (`AppHeader`, `HeroBanner`, `PhaseOverviewGrid`, `ManifestReferenceCard`, `AppFooter`, `MobileTabSwitcher`), `desk/` (`InvoiceDesk`, `DocumentStatusBar`, `CustomerSection`, `InvoiceItemsEditor`, `InvoiceDeskActions`) i `drawers/` (`AppDrawers`).
  Ovim refaktoringom `App.tsx` je smanjen na ~115 linija čistog deklarativnog sastavljanja, uz zadržavanje 100% postojećeg ponašanja, tipkovničkih prečaca, responzivnosti i nulte regresije na 89/89 testova.
* **ADR-013 (Klijentski Branding, Upload Loga/Pečata i Dinamički Adresar Partnera u Dexie Bazi):** Kako bi obrtnik imao potpunu kontrolu nad vizualnim identitetom i profesionalnim izgledom računa bez ovisnosti o vanjskim poslužiteljima:
  1. **Lokalni upload slika (Zero Server Storage)**: Korisnik može učitati logotip (PNG/JPG/SVG do 500 KB) i digitalni pečat/potpis (PNG s prozirnom pozadinom). Slike se u pregledniku konvertiraju u Base64 data URL stringove i perzistiraju u Dexie IndexedDB tablici `obrtProfil`.
  2. **Automatska ugradnja u memorandum (A4 & PDF)**: Živi A4 račun i klijentski PDF generator (`html2canvas-pro` s očuvanjem transparentnosti i oštrine) automatski ugrađuju logo u zaglavlje i digitalni pečat s potpisom iznad linije izdavatelja na dnu računa.
  3. **Adresar kupaca s brzim odabirom**: Uveden je `PartnerDrawer` i tablica `partneri` s tražilicom u realnom vremenu po nazivu, OIB-u ili gradu, te gumb *"Odaberi iz adresara"* na radnoj plohi koji jednim klikom popunjava naziv, OIB i poreznu zonu kupca.

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

---

## 5. Verifikacijski Izvještaj: Validacija Ispisa i Generiranja PDF-a (Responsive Flow & ISO 32000-1)

### 5.1. Nativni Ispis Preglednika (`@media print` Responsive Flow Engine)
* **Izolacija elemenata**: Svi navigacijski elementi, alati, showroom preklopnici i svih 6 ladica (`FiscalDrawer`, `SettingsDrawer`, `PartnerDrawer`, `KprDrawer`, `DocumentDrawer`, `SystemLogDrawer`) označeni su klasom `.no-print` uz striktno pravilo `display: none !important; visibility: hidden !important;`.
* **Responzivna robusnost**: Uvedena klasa `.printable-invoice-wrapper` i pravila koja osiguravaju da stablo računa (`#root`, `main`, `.grid`) u ispisu uvijek bude `display: block !important; overflow: visible !important;`, čime je eliminiran rizik skrivanja računa pri tiskanju s mobilnog prikaza ili neaktivnog taba.
* **Format i margine**: Standardiziran `A4 portrait` format s marginama od `10mm` i `-webkit-print-color-adjust: exact` direktivom.
* **Čistoća papira**: Pozadina računa fiksirana na čisto bijelu (`#FFFFFF`), a tekst na tamnu (`#0F172A`), neovisno o temi odabranoj na ekranu.
* **Zaštita prijeloma stranica**: `.page-break-avoid`, `tr` i `.barcode-container` imaju `break-inside: avoid !important;` i `page-break-inside: avoid !important;`, sprječavajući rezanje redaka tablice i barkodova preko stranica.

### 5.2. Klijentsko Generiranje PDF-a (DOM Flow & Vektorski Fallback)
1. **DOM Flow snimanje (`generateInvoicePdfFromDom`)**:
   * Koristi `html2canvas-pro` pri 2x DPI skali (192 DPI oštrina).
   * Očuvanje hrvatske tipografije (UTF-8 dijakritici Č, Ć, Ž, Š, Đ) bez gubitka kodne stranice.
   * `onclone` filter za neutralizaciju tamnih tema na čisto bijeli papir.
2. **Čisti vektorski generator (`generateInvoicePdf`)**:
   * Automatski fallback ako DOM renderiranje naiđe na nekompatibilna stanja.
   * Integriran memorandum: logotip obrta u zaglavlju (22x22mm) i digitalni pečat s potpisom izdavatelja (36x13mm) u sekciji 5.5.
   * Izračunato vrijeme generiranja: **16 - 54 ms** (daleko ispod Gate-Check limita od 300 ms).
3. **Provjera strukture prema normi ISO 32000-1 (`validatePdfStructure`)**:
   * Svaki generirani PDF automatski se validira na bajtovskoj razini:
     * Zaglavlje: `%PDF-1.x` (`hasMagicHeader: true`)
     * Završni marker: `%%EOF` (`hasEofTrailer: true`)
     * Objektni katalog: `/Catalog` (`hasCatalog: true`)
     * Hijerarhija stranica: `/Pages` (`hasPages: true`)
4. **Barkodovi i m-Banking**:
   * HUB-3 PDF417 (sukladno HUB standardu, error correction level 4, točno 14 redaka).
   * EPC SEPA QR kod (EPC069-12 v002 standard) ili fiskalni URL Porezne uprave.

### 5.3. Sažetak Testne Pokrivenosti
* **Automatski testovi**: 17 testnih datoteka, **92/92 testova prolazi** (100% prolaznost na cijelom monorepou).
* **Produkcijski build**: `tsc -b && vite build` prolazi s 0 grešaka.

---

## 6. Dnevnik Implementacije: FAZA 9 – Katalog Usluga (KPD 2025), KPR CSV Izvoz i Kriptirani Trezor (AES-256-GCM)

### 6.1. Pregled Implementiranih Komponenti
1. **Katalog Artikala i Usluga (Cjenik s KPD 2025)**:
   * **`useArticles.ts`**: React kuka s Dexie perzistencijom tablice `db.artikli`, trenutnim pretraživanjem po nazivu, šifri i KPD oznaci, te filtriranjem po kategorijama (`SVE` | `USLUGE` | `ROBA`).
   * **Inicijalni Seed**: 6 standardnih paušalnih IT i poslovnih usluga s KPD 2025 šiframa (`62.01.11`, `62.02.20`, `74.10.11`, `70.22.11`, `74.30.11`, `62.03.11`).
   * **`ArticleDrawer.tsx`**: Sharp UI ladica s formom za dodavanje/uređivanje artikala, integriranim `KpdPicker`, `CurrencyInput`, odabirom mjerne jedinice (`sat`, `kom`, `paušal`, `dan`, `mjesec`, `projekt`, `kartica`, `km`) i akcijom direktnog dodavanja na aktivni račun.
   * **Uvezivanje u Račun**: Dodan gumb *"Odaberi iz cjenika"* u zaglavlje editora stavaka (`InvoiceItemsEditor.tsx`) te brza akcija *"Spremi u cjenik"* u podnožju svakog retka stavke.
   * **Navigacija**: Gumb *"Cjenik"* u `AppHeader.tsx` s ikonom `BookMarked` za trenutan pristup cjeniku.

2. **Službeni KPR CSV / Excel Izvoz (`kpr-csv.ts`)**:
   * **Excel Regionalna Kompatibilnost**: Dodan UTF-8 BOM bajt (`\uFEFF`) na početak datoteke kako bi Microsoft Excel na Windowsima u hrvatskoj lokalizaciji automatski prepoznao dijakritike (`Č, Ć, Ž, Š, Đ`).
   * **Delimiter & Formati**: Korišten točka-zarez (`;`) kao delimiter polja te hrvatski decimalni zarez (`,`) za novčane iznose (npr. `1.250,00`).
   * **Kvartalni Sažetak & Ukupno**: Izračun kvartalnih međusuma (Q1–Q4) i ukupnog prometa u gotovini i bezgotovinskim uplatama.
   * **Dostupnost**: Gumb *"Preuzmi CSV"* u `KprDrawer.tsx` (Tab Knjiga Prometa) koji generira `KPR_YYYY_OIB.csv`.

3. **Lokalni Kriptirani Sigurnosni Backup (AES-256-GCM / PBKDF2 100k)**:
   * **`useBackupRestore.ts`**: Kuka za upravljanje sigurnosnim kopijama:
     * `exportEncryptedBackup`: Generira `.obrtniq` paket zaštićen korisničkom lozinkom (Web Crypto API, PBKDF2 s 100.000 iteracija, SHA-256 i AES-256-GCM).
     * `exportJsonSnapshot`: Generira otvoreni JSON snapshot sheme v3.0 za knjigovodstvo ili vanjsku analizu.
     * `inspectBackupFile`: Pregledava format datoteke prije uvoza i detektira enkripciju.
     * `restoreFromFile`: Atomski vraća sve tablice (obrt profil, partneri, artikli, dokumenti, kpr) uz provjeru lozinke i integriteta.
     * `resetDatabase`: Sigurno tvorničko brisanje lokalne IndexedDB baze uz obavezno upisivanje riječi `OBRISI`.
   * **Integracija u Postavke**: Četvrti tab *"4. Backup & Trezor"* u `SettingsDrawer.tsx` s jasnim statusnim obavijestima i pregledom restauriranih entiteta.

4. **Prezentacijski Sloj & Kartica Faze 9**:
   * Ažuriran `PhaseOverviewGrid.tsx` s novom karticom za **FAZU 9** ("Cjenik & Backup", status GOTOVO).
   * Ažuriran `useAppDrawers.ts` i `AppDrawers.tsx` za upravljanje stanjem i prikaz `ArticleDrawer`.

### 6.2. Verifikacija i Testna Pokrivenost
* **Novi testovi**:
  * `packages/core/tests/kpr-csv.test.ts`: 7/7 testova prolazi (BOM marker, delimiter, formatiranje, kvartali, sanitizacija).
  * `packages/core/tests/articles-catalog.test.ts`: 3/3 testa prolaze (KPD perzistencija, filtriranje, AES-256-GCM backup/restore roundtrip).
* **Ukupno automatskih testova**: **19 testnih datoteka, 102/102 testa prolaze** (100% prolaznost).
* **TypeScript & Vite build**: `npm run build` na monorepou završava s kodom 0.
* **Lokalni dev server**: Radi stabilno na `http://localhost:5173/` (HTTP 200).

---

## 7. Dnevnik Implementacije: FAZA 10 – Zero-Server Cloud & AI Arhitektura (Google Identity Crypto Anchor, Drive AppData Sync, Gemini Assistant BYOK)

### 7.1. Pregled Implementiranih Komponenti
1. **Google Identity kao Kripto-Sidro (Zero-Knowledge AES-256-GCM)**:
   * **Invarijanta Google `sub`**: Trajni numerički 21-znamenkasti korisnički identifikator iz Google Identity Services SDK-a koristi se kao determinističko kriptografsko sidro.
   * **Izvođenje Kripto Ključa**: `buildIdentitySecret(googleSub, userPin?)` stvara soljeni identifikator preko imenskog prostora `OBRTNIQ:GOOGLE_SUB:` te kroz PBKDF2 (100.000 iteracija, SHA-256) generira simetrični 256-bitni AES-GCM ključ bez potrebe za slanjem korisničkih podataka na bilo koji vanjski poslužitelj.
   * **Automatska Enkripcija & Dekripcija**: Implementirane metode `encryptBackupWithGoogleSub` i `decryptBackupWithGoogleSub` u `@obrtniq/core`.
   * **Demo Način Rada**: `loginDemoUser()` pruža deterministički offline identitet za testiranje i rad bez konfiguriranog Google Client ID-a.

2. **Google Drive AppData Automatizirana Sinkronizacija (`drive.appdata`)**:
   * **Izolirani AppDataFolder**: Korištenje skrivene mape Google Drivea (`appDataFolder`) koja je korisniku nevidljiva na drive.google.com, čime se eliminira mogućnost slučajnog brisanja ili narušavanja datoteka.
   * **REST API v3 Multipart Upload**: Direktan klijentski REST API prijenos kriptiranih `.obrtniq` arhiva s metapodacima (`obrtniq_backup`, timestamp, verzija sheme).
   * **Popis i Restauracija**: Kuka `useGoogleDriveSync` omogućuje dohvat popisa svih povijesnih točaka oporavka, 1-klik sigurnosnu kopiju i trenutnu restauraciju cijele baze podataka u slučaju promjene uređaja ili havarije.
   * **Vizualni Indikator**: `AppHeader.tsx` prikazuje Google profilnu sliku, status oblaka (`Zeleni oblak` za sinkronizirano, `Rotirajući` tijekom sinkronizacije) i vrijeme zadnje sinkronizacije.

3. **Gemini AI Asistent za e-Račun i KPD 2025 (Bring-Your-Own-Key & RH Heuristika)**:
   * **BYOK Arhitektura**: Korisnik unosi svoj Google AI Studio API ključ koji se pohranjuje isključivo u lokalni preglednik (`localStorage`) i direktno komunicira s Google Gemini REST API-jem (`gemini-2.0-flash`).
   * **Pametno Prepoznavanje KPD 2025**:
     * Prompt inženjering prilagođen hrvatskim računovodstvenim propisima za e-Račun i Fiskalizaciju 2.0.
     * Vraća strukturirani JSON: `kpdSifra`, `kpdNaziv`, `preporucenaJedinica`, `preporucenaCijena`, `objasnjenje`.
   * **100% Offline RH Heuristički Fallback**: Čak i ako korisnik nema uneseni API ključ ili nema internetsku vezu, sustav primjenjuje ugrađeni algoritam koji analizira hrvatske ključne riječi (softver, web, programiranje, dizajn, logotip, brending, savjetovanje, IT održavanje, prevođenje, marketing) i predlaže točne službene KPD šifre.
   * **Interaktivno Sučelje u Editoru Stavaka**:
     * U `InvoiceItemsEditor.tsx`, svaki redak stavke sadrži gumb `AI KPD Asistent` sa zvjezdicom (`Sparkles`).
     * Klikom se otvara kompaktni okvir za unos prirodnog opisa usluge s brzim primjerima ("Programiranje web aplikacija", "Dizajn logotipa", "Poslovno savjetovanje"...).
     * Klik na gumb *"Primijeni na stavku"* automatski popunjava KPD šifru, službeni naziv, mjernu jedinicu i okvirnu tržišnu cijenu.

4. **Povezivanje Postavki (Tab 5. Google & AI)**:
   * `SettingsDrawer.tsx` proširen petim tabom s kontrolama za:
     * Google prijavu, status sesije, prikaz Google računa i Demo prijavu.
     * Google Drive AppData status, gumb za trenutnu sinkronizaciju, opcionalni PIN i listu točaka oporavka s Drivea.
     * Gemini API konfiguraciju, odabir modela, unos API ključa uz skrivanje/prikaz lozinke i ping test veze.
     * Opcionalnu Firebase konfiguraciju.

5. **Ažuriranje Mreže Faza (`PhaseOverviewGrid.tsx`)**:
   * Dodana kartica **FAZA 10** ("Google & AI", status GOTOVO) s ikonom `Sparkles`.

### 7.2. Verifikacija i Testna Pokrivenost
* **Novi testovi**:
  * `packages/core/tests/crypto-anchor.test.ts`: 3/3 testa prolaze (V10-1: `buildIdentitySecret`, V10-2: `encrypt/decryptBackupWithGoogleSub`, V10-3: Google Sub + PIN).
  * `apps/web/tests/gemini.test.ts`: 9/9 testova prolazi (V10-4: Inteligentna RH heuristika za 5 ključnih djelatnosti i opći fallback, V10-5: Google Identity demo invarijante, V10-6: Upravljanje API ključem i modelom).
* **Ukupno automatskih testova**: **21 testna datoteka, 120/120 testova prolazi** (100% prolaznost na cijelom monorepou).
* **TypeScript & Vite build**: `npm run build` na cijelom projektu završava s kodom 0 bez ikakvih grešaka.
* **Lokalni dev server**: Radi stabilno na `http://localhost:5173/` (HTTP 200).

---

## 8. Dnevnik Implementacije: MEĐU-FAZA 10.5 – Sveobuhvatni Dijagnostički & Telemetrijski Sustav
* **Dokument:** [`docs/plan_implementacije_faza_10_5.md`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/docs/plan_implementacije_faza_10_5.md)
* **Status:** 🟢 ZAVRŠENO
* **Postignuća:**
  - `stack-parser.ts`: Parser Call Stacka koji razdvaja aplikacijski kod (`isAppCode: true`) od vendor okvira (`node_modules`) i normalizira staze.
  - Global Error Trap (`window.onerror`, `window.onunhandledrejection`) i `<AppErrorBoundary>` u Reactu s mogućnošću trenutnog oporavka i ponovnog pokušaja.
  - Auto-Open na grešku (`obrtniq_auto_open_log_on_error`) koji trenutno otvara `SystemLogDrawer` uz automatsko proširenje najnovijeg stack tracea i 1-klik kopiranje.
  - Instrumentacija domenskih modula (`calculator`, `oib`, `iban`, `barcode`, `dexie-db`) s razinama `VERBOSE`, `DEBUG`, `INFO`, `WARN`, `ERROR`.
  - 6/6 novih testova u `logging-system.test.ts` i 5/5 testova u `stack-parser.test.ts` (131/131 prolaznih testova).

---

## 9. Dnevnik Implementacije: FAZA 11 – Žigo Autonomni Klijentski Agent (Gemini 2.0 Function Calling, Multimodal, Perzistentni Chat & Žigin Rez)
* **Dokument:** [`docs/plan_implementacije_faza_11.md`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/docs/plan_implementacije_faza_11.md)
* **Status:** 🟢 ZAVRŠENO (100% Prolaznost Gate-Check Protokola V11-1 do V11-8)

### 9.1. Pregled Implementiranih Komponenti
1. **Baza Podataka i Domena (Dexie.js v2 & IChatRepository)**:
   - Proširena shema IndexedDB baze na verziju 2 s novim tablicama `chatSesije` i `chatPoruke`.
   - Definirana domenska sučelja `ZigoChatSesija`, `ZigoChatPoruka`, `ZigoAttachment`, `ZigoToolCall` i `ZigoToolResult` u `@obrtniq/core`.
   - Implementiran `DexieChatRepository` i `MemoryChatRepository` s podrškom za sesije, poruke i kaskadno brisanje.
   - Uključen puni chat kontekst u `.obrtniq` enkriptirani paket (AES-256-GCM) u `crypto-backup.ts`.

2. **Gemini 2.0 Tool Engine & Orlandov Kodeks (`gemini-service.ts`)**:
   - Ugrađena kompletna persona viteza Orlanda i diplomacije Dubrovačke Republike prema `zigo_info.md` (dubrovački lakat, mir na 60 otkucaja, stoički humor).
   - Nativne deklaracije alata (`ZIGO_FUNCTION_DECLARATIONS`) za 12 operacija sustava.
   - Multimodalna obrada slika i PDF e-Računa putem `inlineData` / Base64.
   - 100% Offline / Local Heuristic fallback: inteligentno prepoznavanje namjera, priprema računa, trijaža, provjera praga i porezni filtar čak i bez API ključa ili interneta.
   - **Porezni filtar za opravdanost troškova (Ćevapi Test)**: Zaštita obrtnika od poreznog nadzora - duhovito odbijanje knjiženja privatnih troškova (roštilj, parfem, odjeća).

3. **Autonomni Dispečer Alata (`zigo-tools-dispatcher.ts`)**:
   - Povezuje 12 alata s radnom plohom unosa, katalogom cjenika, adresarom partnera, Knjigom prometa (KPR) i obrascem PO-SD.
   - Izvršava operacije u realnom vremenu: `postavi_kupca`, `dodaj_stavku_racuna`, `ocisti_stavke_racuna`, `izdaj_aktivni_racun`, `storniraj_racun`, `pretrazi_cjenik`, `dodaj_u_cjenik`, `pretrazi_partnere`, `dohvati_financijski_status`, `izvezi_kpr_csv`, `izvezi_posd_xml`, `aktiviraj_zigin_rez`.

4. **Reaktivno Upravljanje Stanjem (`useZigoAgent.ts`)**:
   - Kuka za upravljanje aktivnim sesijama, slanjem poruka, učitavanjem privitaka, izvršavanjem alata i statusom razmišljanja (`isThinking`).

5. **Korisničko Sučelje (Sharp UI & Dubrovački amblem)**:
   - `FloatingZigoWidget.tsx`: Plutajući brončano-kameni amblem sa štitom i animiranim Q-prstenom koji se pri obradi vrti brzinom centrifuge. Uključuje brzi gumb *"Žigo, presijeci"*.
   - `ZigoChatDrawer.tsx`: Puna ladica za razgovor s poviješću sesija, drag-and-drop podrškom za slike/PDF račune, mjehurićima razgovora i brzim akcijama.
   - `ZigoActionCard.tsx`: Sharp UI akcijske kartice u chatu (trijaža Žiginog reza u tri točke, potvrda unosa kupca, dodane stavke, vizualna traka praga 40k € i dodavanje u cjenik).
   - `AppHeader.tsx`: Gumb *"Žigo AI"* u navigacijskoj traci.
   - `PhaseOverviewGrid.tsx`: Dodana kartica **FAZA 11** ("Žigo Agent", status GOTOVO).

### 9.2. Verifikacija i Testna Pokrivenost
* **Testni scenariji (`apps/web/tests/zigo-agent.test.ts`)**:
  - `V11-1`: Baza podataka (stvaranje sesije, poruke s privitcima, kaskadno brisanje).
  - `V11-2`: Function calling za pripremu računa (dispečiranje `postavi_kupca` i `dodaj_stavku_racuna`).
  - `V11-3`: Function calling za cjenik (automatska KPD 2025 klasifikacija `74.10.11` i unos).
  - `V11-4`: Financijski status i paušalni prag od 40.000 € (izračun naplaćenog i preostalog iznosa).
  - `V11-5`: Žigin Rez (trijaža u 3 točke: 1. Što gori, 2. Što čeka, 3. Akcija sad).
  - `V11-6`: Porezni filtar / Ćevapi test (odbijanje pravdanja privatnog roštilja).
  - `V11-7`: Multimodalni sken (prepoznavanje opravdanog poslovnog računa za uredski materijal).
  - `V11-8`: Zero-Server Kripto Backup (kriptiranje i uspješna restauracija chat povijesti).
* **Ukupno automatskih testova**: **25 testnih datoteka, 140/140 testova prolazi** (100% prolaznost na cijelom monorepou).
* **TypeScript & Vite build**: `npm run build` završava s kodom 0.
* **Lokalni dev server**: Radi stabilno na `http://localhost:5173/` (HTTP 200).

---

## 10. Dnevnik Implementacije: FAZA 12 – Vektorski Sustav Ikona, Orlando Pečati i Dinamičko Temiranje
* **Dokument:** [`docs/plan_implementacije_faza_12.md`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/docs/plan_implementacije_faza_12.md)
* **Status:** 🟢 ZAVRŠENO (100% Prolaznost Gate-Check Protokola V12-1 do V12-6)

### 10.1. Pregled Implementiranih Komponenti
1. **Slojevita Arhitektura & CSS Tokeni (`index.css`, `icons.css`)**:
   - Uveden 5-slojni kompozitni model (`base`, `metal`, `accent`, `gold`, `glow`/`stroke`) u `:root` i za monokromatsku temu `[data-theme="carbon"]`.
   - Definirane CSS varijable: `--icon-layer-base`, `--icon-layer-base-border`, `--icon-layer-metal`, `--icon-layer-metal-dark`, `--icon-layer-accent`, `--icon-layer-gold`, `--icon-layer-gold-light`, `--icon-layer-stroke`, `--icon-layer-glow`, `--icon-layer-cyan`.
   - Implementirane micro-animacije: rotirajući zupčanik (`.obrt-anim-gear`), pulsirajući vodovi i dioda (`.obrt-anim-pulse`), pomak mača (`.obrt-anim-sword`), rast grafikona (`.obrt-anim-arrow`) i radarski puls alarma (`.obrt-anim-radar`).
   - Ugrađena puna podrška za smanjeno kretanje (`@media (prefers-reduced-motion: reduce)`).

2. **Vektorski Registar Ikona (`registry.tsx`, `types.ts`)**:
   - Implementirano svih 20 vektorskih ikona visoke preciznosti (SVG 48x48) prema priloženim referencama viteza Orlanda i Dubrovačke Republike:
     - **4 Brending Amblema**: `app-seal` (glavni pečat s dubrovačkim laktom pod 90°, mačem, Q krunom/mozgom i kulom Minčeta), `zigo-emblem` (kiber-pečat sa štitom, mačem, munjom i sidrom), `orlando-knight` (Orlandov reljef s mačem i štitom), `core-gear-q` (mikročip jezgra sa slovom Q).
     - **11 Domenskih Modula**: `invoice-document` (račun s operacijama + - * = i euro kovanicom), `crypto-vault` (sef s kiber-vodovima), `kpr-tower` (kula Minčeta s grafom rasta prometa), `b2b-partners` (Vrata od Pila s rukovanjem), `catalog-pricing` (etiketa cijene s KPD zupčanikom), `fiscal-quill` (guščje pero s pečatom ovjere), `legal-scales` (vaga pravde s dukatima), `obrt-tools` (čekić i dubrovačko ravnalo), `bell-deadline` (zvono sa satom i kalendarom), `shield-security` (štit s ključem i vodovima), `storno-trash` (industrijska kanta sa zupčanicima).
     - **5 Telemetrijskih i Signalnih Indikatora**: `signal-error` (crveni alarmni štit s radarom), `signal-warning` (jantarni trokut sa sirenom), `signal-success` (smaragdni štit s kvačicom), `signal-info` (čelični krug s plavim neonom), `telemetry-terminal` (konzola dnevnika s promptom `>_` i treperećim kursorom).

3. **React Komponente (`ObrtIcon`, `ObrtBadge`, `ObrtEmblem`, `index.ts`)**:
   - `ObrtIcon.tsx`: Univerzalni SVG renderer s podrškom za dinamičke CSS stilove, varijante (`glyph`, `badge`, `monochrome`, `raw`), `colorMode` preslikavanje i WAI-ARIA pristupačnost (`role="img"` uz `aria-label` ili `role="presentation"` uz `aria-hidden="true"`).
   - `ObrtBadge.tsx`: Kružni medaljon klesanog kamena sa Slike 1 (`ObrtIQ_Icons01.png`), dvostrukim prstenom, reljefom i interaktivnim hover stanjima.
   - `ObrtEmblem.tsx`: Ceremonijalni pečat sa Slika 2 i 3 s vanjskim rotirajućim prstenom meandra/labirinta i auričnim sjajem.

4. **Dinamički SVG Favicon Sustav (`useDynamicFavicon.ts`, `favicon.svg`)**:
   - Kreiran nativni vektorski favicon `apps/web/public/favicon.svg`.
   - Razvijena React kuka `useDynamicFavicon()` koja generira inline SVG Data URI za `<link rel="icon">` u zaglavlju dokumenta:
     - Automatski rotira nijansu ikone u kartici preglednika u skladu s aktivnom temom (`--theme-hue`).
     - Prebacuje se u upečatljiv crveni alarm (`#EF4444`) u slučaju neuhvaćenih grešaka u aplikaciji.
   - Integrirana u korijenski `App.tsx`.

5. **Integracija u Korisničko Sučelje**:
   - `AppHeader.tsx`: Glavni logo zamijenjen ceremonijalnim `app-seal` badgeom; navigacijski gumbi opremljeni animiranim ikonama `invoice-document`, `kpr-tower`, `fiscal-quill`, `catalog-pricing`, `b2b-partners`, `obrt-tools` i `zigo-emblem`.
   - `PhaseOverviewGrid.tsx`: Svih 11 postojećih kartica ažurirano odgovarajućim `ObrtIcon` simbolima, te dodana kartica **FAZA 12** ("Vektorski Pečati", status GOTOVO) čime je mreža postigla savršenih 12 kartica.
   - `SettingsTabsNav.tsx`: 5 navigacijskih tabova u postavkama opremljeno semantičkim ikonama (`obrt-tools`, `invoice-document`, `fiscal-quill`, `crypto-vault`, `shield-security`).
   - `FloatingZigoWidget.tsx`: Integriran `ObrtEmblem` s Orlandovim amblemom, reaktivnim rotirajućim prstenom i statusnom iskrom.
   - `SystemLogDrawer.tsx`: Zaglavlje, brojači grešaka/upozorenja i prazno stanje opremljeni `telemetry-terminal`, `signal-error` i `signal-warning` ikonama.

### 10.2. Verifikacija i Testna Pokrivenost
* **Testni scenariji (`apps/web/tests/icon-system.test.ts`)**:
  - `IS-01`: Cjelovitost registra (svih 20 ikona, 4 amblema, 11 modula, 5 signala, viewBox `0 0 48 48`).
  - `IS-02`: Vektorska arhitektura i renderiranje (ispravnost vraćenih React SVG čvorova za glyph i badge varijante).
  - `IS-03`: `ObrtIcon` komponenta i CSS mapiranje (dimenzije, custom accentColor, semantički colorMode, isAnimated, ARIA atributi).
  - `IS-04`: `ObrtBadge` kružni kameni medaljon (proporcije, klik događaj, glow efekt).
  - `IS-05`: `ObrtEmblem` ceremonijalni pečat (rotirajući prsten, proporcije, dječji elementi).
  - `IS-06`: Dinamički Favicon generator (SVG struktura, hue mapiranje i prebacivanje na crveni alarm).
* **Ukupno automatskih testova**: **30 testnih datoteka, 208/208 testova prolazi** (100% prolaznost na cijelom monorepou).
* **TypeScript & Vite build**: `tsc -b && vite build` uspješno generira produkcijski paket bez ijedne greške.

---

## 11. Faza 13: Žigo Omni-Copilot & Sustav Svjesnosti Konteksta (Real-Time Eyes-on-Glass)

### 11.1. Arhitektonska Preobrazba i Realizacija
Preobrazba agenta Žiga iz pasivnog modala u aktivnog kognitivnog kopilota (po uzoru na Google Gemini u Gmailu/Driveu/Docsima i Microsoft Copilot u Edgeu):
1. **Omni-Context Sabirnica (`useLiveScreenContext.ts`, `zigo-context-builder.ts`, `zigo-context.ts`)**:
   - Strukturirani snimak stanja ekrana u stvarnom vremenu (`LiveScreenContextSnapshot`):
     - **Aktivni pogled:** `InvoiceDesk`, `KprDrawer`, `SettingsDrawer`, `SystemLogDrawer`, `FiscalDrawer`, itd.
     - **Stanje radnog računa:** Kupac, OIB s MOD 11 provjerom, stavke s cijenama i količinama, KPD 2025 klasifikacija, ukupni iznos.
     - **Orlandov financijski radar:** KPR promet tekuće godine, udaljenost do poreznog praga od 40.000 € i izračun probija li aktivni račun limit!
     - **Telemetrija sustava:** Stanje mreže, Google Drive sinkronizacija, pretplata na `appLogger` za praćenje najnovijih sistemskih grešaka.
2. **Usklađivanje sa Specifikacijom i Dubrovačkom Fonologijom (`gemini-service.ts`)**:
   - Implementiran sistemski prompt točno prema [`zigo_specifikacija_i_sistemski_prompt.md`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/docs/zigo_specifikacija_i_sistemski_prompt.md).
   - Neutralizacija nazala: završno `-m` obavezno prelazi u `-n` (*gledan, vidin, radin, nêmân, znan, ostavljan, brišen*).
   - Očuvanje glasa `h` (*harač, hladno, hrana*).
   - Autohtoni leksik (*gosparu, preša, spêndza, šesan, rabota, duka, harač, fjaka*).
   - Obavezna trodijelna struktura svakog odgovora: **1. Opservacija -> 2. Dijagnoza -> 3. Žigin Rez (Akcija)**.
   - Sva 4 few-shot scenarija (kašnjenje naplate 90 dana, pad CIS servera/Napoleon, privatni roštilj/ćevapi test, prag od 40k €).
3. **Korisničko Sučelje Copilota (`ZigoCopilotPanel.tsx`, `ZigoChatDrawer.tsx`, `FloatingZigoWidget.tsx`)**:
   - **Dvojni način rada:**
     - *Docked Sidecar način:* Usidreni desni panel uz `InvoiceDesk` (46% unosa / 32% pregled / 22% kopilot) za istovremeni rad na računu bez zatvaranja chata.
     - *Floating Drawer način:* Skočna ladica s pozadinskim blur preklapanjem za brze upite i manje ekrane.
   - **"Orlando motri" statusna traka (Eyes-on-Glass):** Živi indikator na vrhu kopilota koji prikazuje trenutno promatrani dokument, stanje OIB-a i praga.
   - **Dinamički kontekstualni čipovi:** Automatski generirani akcijski prijedlozi temeljeni na stanju forme (`[⚠️ Probijanje praga 40k!]`, `[🔍 Provjeri OIB kupca]`, `[🏷️ Dodijeli KPD 2025 šifre]`, `[🗡️ Žigo, presijeci]`, `[🌙 Fjaka: Odmori]`).
4. **Proširenje Alata (`zigo-tools-dispatcher.ts`)**:
   - `auto_ispuni_kpd_sifre`: Automatska dodjela KPD 2025 šifri stavkama na radnoj plohi.
   - `provjeri_i_ispravi_oib`: Validacija i popravak OIB-a prema ISO 7064 MOD 11,10.
   - `simuliraj_utjecaj_na_prag`: Simulacija prelaska paušalnog limita od 40.000 €.
   - `prebaci_datum_u_iducu_godinu`: Postavljanje datuma izdavanja i isporuke na 02.01. iduće godine.
   - `aktiviraj_fjaku`: Stoički anti-burnout podsjetnik za rad vikendom kasno u noć.
5. **Verifikacija i Testna Pokrivenost**:
   - Novi testni paket `apps/web/tests/zigo-omni-copilot.test.ts` s 10 cjelovitih testnih scenarija.
   - **Ukupno testova u repozitoriju:** **31 testna datoteka, 220/220 testova prolazi (100% prolaznost)**.
   - Produkcijski paket `npm run build` uspješno kompajliran i verificiran.

---

## 12. Faza 13.1: Stiliziranje Odgovora Agenta i Detaljno Logiranje AI Sustava po Razinama

### 12.1. Stiliziranje i Vizualna Hijerarhija Odgovora (`ZigoMessageContent.tsx`, `ZigoCopilotPanel.tsx`)
1. **Dizajn sekcija prema dubrovačkom arhetipu Digitalnog Orlanda**:
   - Umjesto monotonog sirovog markdown teksta s neparsiranom zvjezdicom `**Opservacija:**`, implementiran je namjenski parser i komponenta [ZigoMessageContent.tsx](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/components/ZigoMessageContent.tsx):
     - **1. Opservacija (`opservacija`)**:
       - Zlatno-kameni medaljon zaglavlja s ikonom `Compass`, oznakom `1. Opservacija • Dubrovački osvrt` i bedžom `MIROVANJE`.
       - Kartica s pozadinskim zlatnim gradijentom (`border-l-[#d4af37]`), topla antička estetika, elegantna serif kurzivna tipografija (`font-serif italic text-[#f4ebd0]`).
     - **2. Dijagnoza (`dijagnoza`)**:
       - Tehničko-operativno plavo zaglavlje s ikonom `Activity`, oznakom `2. Dijagnoza • Stanje papira & propisa` i bedžom `FISKALNI RADAR`.
       - Kartica s hladnim čeličnim gradijentom (`border-l-[#38bdf8]`), sans-serif tipografija visoke čitljivosti (`text-gray-200`).
       - Automatski stilizirani inline kod bedževi za porezne zone i KPD šifre (npr. `` `DOMACI_B2B` ``, `` `62.01.11` ``).
     - **3. Žigin Rez (`rez`)**:
       - Odlučni smaragdno-zeleni kontejner akcije s ikonom `Sword`, oznakom `3. Žigin Rez • Kirurški rez & akcija` i pulzirajućim bedžom `PULS 60`.
       - Smaragdni rub (`border-l-[#10b981]`) i jasan kontrast za ključne korake.
       - Automatski konvertor tipkovničkih prečaca: prečaci poput `**F2**`, `**Enter**` ili `**Esc**` renderiraju se kao interaktivni hardverski keycap elementi (`<kbd>`).
     - **Trijažne sekcije**: Podrška za `1. ŠTO GORI (<24h)` (crveni alarm), `2. ŠTO ČEKA` (jantarno odgađanje), i `3. AKCIJA SAD` (zelena promptna akcija).
2. **Inline Markdown Formatter**:
   - Bez vanjskih teških ovisnosti, podržava tipkovničke prečace (`<kbd>`), kodne blokove (<code>), masni tekst (<strong>) i kurziv (<em>).

### 12.2. Detaljno Logiranje AI Agent Sustava po Razinama (`ERROR`, `WARN`, `INFO`, `DEBUG`, `VERBOSE`)
Implementirana je duboka observabilnost kroz sve slojeve agentnog ekosustava:
1. **Opseg `AI:CONTEXT` / `AI:CONTEXT:LIVE`**:
   - `DEBUG`: Logira snimak stanja ekrana (aktivni ekran, partner, OIB valjanost, broj stavki, ukupni iznos, KPR YTD promet, porezni prag, status ugroze).
   - `VERBOSE`: Logira kompletan `LiveScreenContextSnapshot` JSON objekt.
2. **Opseg `AI:PROMPT`**:
   - `DEBUG`: Logira model, duljinu sistemske upute u znakovima, broj poruka u povijesti, broj deklariranih alata, prisutnost privitaka.
   - `VERBOSE`: Logira cjelokupni sastavljeni prompt s injektiranim stanjem ekrana i povijesti poruka.
3. **Opseg `AI:GEMINI:REQ` & `AI:GEMINI:RES`**:
   - `INFO`: Logira model, slanje HTTP zahtjeva, latenciju u milisekundama, statusni kod poslužitelja (npr. 200 OK) i detekciju poziva alata.
   - `VERBOSE`: Logira puni JSON zahtjeva i sirovi Google API kandidat odgovor.
4. **Opseg `AI:GEMINI:ERROR`**:
   - `ERROR`: Logira točne HTTP greške i poruke poslužitelja ako dođe do pada API-ja.
   - `WARN`: Logira automatsko prebacivanje na lokalni stoički heuristički fallback.
5. **Opseg `AI:HEURISTIC`**:
   - `DEBUG`: Logira ulazni korisnički tekst, detektirana stanja ekrana i evaluaciju heurističkih pravila.
   - `INFO`: Logira točno koje je od 13 heurističkih pravila okinuto (npr. *#1 Ćevapi test*, *#2 Prag 40k ugroza*, *#3 Neispravan OIB*, *#4 KPD šifriranje*, *#5 Žigin Rez*, *#6 Fjaka Mode*, itd.).
   - `VERBOSE`: Logira cjeloviti generirani odgovor i parametre pripremljenog alata.
6. **Opseg `AI:KPD`**:
   - `INFO`: Pokretanje analize i preporučena 6-znamenkasta KPD 2025 šifra.
   - `DEBUG`: Odabrani način (Gemini API vs lokalni katalog).
   - `VERBOSE`: Puni JSON s obrazloženjem i cijenom.
7. **Opseg `AGENT:TOOL:<IME_ALATA>`**:
   - `INFO`: Pokretanje i uspješan dovršetak svakog alata s mjerenjem trajanja (`trajanjeMs`).
   - `DEBUG`: Validacija ulaznih parametara i adresarske provjere.
   - `VERBOSE`: Detaljni podaci izračuna, MOD 11 znamenke i ažurirane stavke.
8. **Opseg `AGENT:CHAT` & `AGENT:SESSION`**:
   - `INFO`: Slanje korisničkih poruka, generiranje odgovora agenta.
   - `DEBUG`: Tranzicije stanja razmišljanja (`isThinking: true -> false`), automatsko imenovanje sesija.
   - `VERBOSE`: Spremljeni entiteti u Dexie.js bazu podataka.

### 12.3. Verifikacija i Testna Pokrivenost
- Novi testni paketi:
  - `apps/web/tests/zigo-message-content.test.ts` (4 testa: provjera raščlanjivanja odgovora iz korisničke slike, trijažni uvod, opće poruke, inline tipkovnički prečaci `**F2**` i kodovi).
  - `apps/web/tests/zigo-leveled-logging.test.ts` (4 testa: provjera emisije log zapisa po razinama za `AI:CONTEXT`, `AI:HEURISTIC`, `AI:KPD`, `AGENT:TOOL`, te `WARN`/`ERROR` u slučaju pada).
- **Ukupno automatskih testova u repozitoriju**: **33 testne datoteke, 228/228 testova prolazi (100% prolaznost)**.
- **Produkcijski bundle**: `tsc -b && vite build` prolazi za 4.29 sekundi bez ikakvih TypeScript grešaka.

---

## 13. Dnevnik Implementacije: FAZA 14 & 15 — Dvosmjerni Glasovni Sustav Žiga (100% In-Browser STT & TTS Narator)

### 13.1. Faza 14: Žigo Glasovni Bedem (In-Browser STT & Akustički Leksikalni Normalizator)
- **100% In-Browser & Zero-Server:** Uklonjeni su svi vanjski poslužitelji, proxyji i Python skripte; glasovno uzorkovanje odvija se kroz Web Speech API (`hr-HR`).
- **Leksikalni normalizator ([`packages/core/src/domain/voice.ts`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/packages/core/src/domain/voice.ts)):**
  - Funkcija `normalizeZigoVoiceTranscript` u manje od milisekunde normalizira fonetski razdvojene kratice:
    `k p r` -> `KPR`, `z.k.i.` -> `ZKI`, `j i r` -> `JIR`, `o i b` -> `OIB`, `p o s d` -> `PO-SD`, `e-racun` -> `e-Račun`, `prag od 40000 eura` -> `prag od 40.000 €`, `žigo presjeci` -> `Žigo, presijeci`.
- **UI Komponenta ([`apps/web/src/components/ZigoVoiceBar.tsx`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/components/ZigoVoiceBar.tsx)):**
  - Prikaz transkripcije uživo s crvenom tipkom STOP za trenutačni abort govora i dumanja.
  - Integrirano u `ZigoCopilotPanel.tsx` preko ikone mikrofona.

### 13.2. Faza 15: Žigo Glasovni Narator & Centralizirani Audio Transport (In-Browser TTS)
- **Domenski parser naracije ([`packages/core/src/domain/audio-transport.ts`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/packages/core/src/domain/audio-transport.ts)):**
  - `cleanTextForSpeech`: Čisti Markdown sintaksu i fonetski optimizira akronime (KPR -> "K P R", OIB -> "O I B", € -> "eura").
  - `prepareMessageForNarration`: Raščlanjuje trodijelni odgovor Žiga na semantičke elemente (1. Opservacija, 2. Dijagnoza, 3. Žigin Rez).
- **Master Audio Transport ([`apps/web/src/context/AudioTransportContext.tsx`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/context/AudioTransportContext.tsx)):**
  - **Invarijanta jednog govornika:** Ni u jednom trenutku se glasovi ne preklapaju; `speechSynthesis.cancel()` prekida prethodni govor prije novog.
  - Podrška za globalni STOP, PAUZU, NASTAVAK, MUTE i SKIP.
  - **Auto-Read način rada:** Automatsko čitanje novih odgovora asistenta, trajno spremljeno u `localStorage`.
  - **Akustička zaštita mikrofona:** Čim se uključi mikrofon (STT), audio narator se trenutačno gasi (`stop()`) radi sprječavanja eha.
- **UI Kontrolna Traka ([`apps/web/src/components/ZigoGlobalAudioTransport.tsx`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/components/ZigoGlobalAudioTransport.tsx)):**
  - Master traka sa statusom, tekstualnim isječkom i kontrolama.
- **Isticanje elemenata u poruci ([`apps/web/src/components/ZigoMessageContent.tsx`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/components/ZigoMessageContent.tsx)):**
  - Sekcija koja se u tom trenutku čita vizualno dobiva jantarni sjaj (`ring-2 ring-[#ffd700]`).
- **Gumb za čitanje po poruci:**
  - Svaka poruka ima tipku `Poslušaj` u zaglavlju s dinamičkim stanjem i animacijom.

### 13.3. Testna Verifikacija
- Dodani testovi:
  - `packages/core/tests/voice.test.ts` (6 testova)
  - `packages/core/tests/audio-transport.test.ts` (8 testova)
  - `apps/web/tests/zigo-voice.test.ts` (8 testova)
  - `apps/web/tests/zigo-audio-transport.test.ts` (5 testova)
- **Cjelokupni suite:** Svi testovi prolaze zeleno (100% prolaznost).
- **Produkcijski bundle:** `npm run build` prolazi bez ikakvih grešaka.

---

## 14. Dnevnik Implementacije: FAZA 16 — Google Cloud Speech-to-Text V2 Postavke (BYOK, Dual-Mode Auth & Hibridni STT)

### 14.1. Domenski Sloj i Validacija (`packages/core/src/domain/voice.ts`)
- Definiran konfiguracijski model `ZigoSttConfig`, tip motora `ZigoSttEngine` (`'browser'` | `'gcp_stt_v2'`) i način autorizacije `GcpSttAuthMode` (`'service_account'` | `'api_key'`).
- `DEFAULT_ZIGO_STT_CONFIG`: Početne vrijednosti s pregledničkim motorom, Service Account načinom, modelom `chirp_2` i regijom `eu`.
- `parseServiceAccountJson`: Pomoćna funkcija za sigurno parsiranje i provjeru Service Account JSON datoteka (`type: "service_account"`, `project_id`, `private_key`, `client_email`).
- `validateGcpSttConfig`: Statička provjera formata API ključa (`AIza...`), Service Account JSON-a, GCP Project ID-ja (regex 6-30 znakova) i lokacije.

### 14.2. Klijentski Servis (`apps/web/src/services/google-stt-service.ts`)
- Upravljanje lokalnom pohranom u pregledniku (`localStorage: obrtniq_stt_config`) prema Zero-Server BYOK načelu.
- `testConnection`: Podržava provjeru Service Account ključa (verifikacija potpisa i projekta) ili direktni REST poziv prema `https://speech.googleapis.com/v2/projects/{projectId}/locations/{location}/recognizers?key={apiKey}` s mjerenjem latencije i detaljnom dijagnostikom (200 OK, 400 API_KEY_INVALID, 403 SERVICE_DISABLED s poveznicom za aktivaciju).

### 14.3. Korisničko Sučelje (`apps/web/src/components/settings/cloud/GoogleSttSettingsCard.tsx`)
- Izbornik motora (Preglednički Web Speech API vs. Google Cloud STT V2).
- **Dual-Mode Prekidač**:
  - `🔑 Service Account JSON`: Drag-and-drop / file upload `.json` ključa s automatskim popunjavanjem Project ID-ja i Client Emaila.
  - `⚡ Klasični API Key`: Polje za unos ključa s okom za prikaz/skrivanje i jasnom napomenom o ograničenjima REST protokola naspram streaminga.
- Polja za lokaciju (`eu`), model (`chirp_2`, `latest_short`, `chirp`, `long`).
- Preklopnik naprednih postavki za Recognizer ID, Audio format indikator (`Linear PCM 16kHz Mono`) i Phrase Adaptation dubrovačkog/fiskalnog leksika.
- Ugrađen interaktivni vodič u 3 koraka s deep-linkovima na GCP konzolu.
- Gumbi "Testiraj STT vezu" i "Spremi STT postavke".
- **Status Naratora & Audio Transport Kontrole:**
  - Prikaz statusa naratora uživo (`ŽIGO GOVORI` s pulsirajućim indikatorom, `PAUZIRANO`, `MIROVANJE (IDLE)`).
  - Brojač aktivnog reda čekanja (npr. `2 / 3`), status zvuka (`Utišano` / `Aktivno`), status automatskog čitanja (`ON` / `OFF`) i tekstualni isječak trenutnog govora.
  - Akcijski gumbi: "Pošalji Testnu Naraciju na Transport" (3-dijelna strukturirana orlandovska poruka), "Očisti Transport", Mute preklopnik i Auto-čitaj preklopnik.
- **Automatsko Čišćenje i Rekreacija Transporta pri Promjeni Konfiguracije:**
  - Svaka promjena STT motora, promjena načina autorizacije, upload Service Account JSON-a, spremanje postavki ili povratak na tvorničke postavke automatski poziva `clearQueue()` i `reloadVoices()`.
  - Time se trenutno zaustavlja prethodni govor, prazni transportna lista i rekreira sinkronizacija s promijenjenom konfiguracijom.
- Integrirano u `CloudAiTab.tsx` unutar `SettingsDrawer.tsx`.

### 14.4. Testna Verifikacija
- Dodani i prošireni testovi:
  - `packages/core/tests/voice.test.ts` (12 testova — prošireno za Service Account i API Key validaciju)
  - `apps/web/tests/google-stt-settings.test.ts` (10 testova — provjera pohrane, statičke validacije, oba auth načina i svih HTTP statusa)
  - `apps/web/tests/zigo-audio-transport.test.ts` (8 testova — provjera `clearQueue()`, rekreacije transporta i parsiranja testne naracije)
- **Cjelokupni suite**: **20 testnih datoteka, 178/178 testova prolazi (100%)**.
- **Produkcijski bundle**: `npm run build` prolazi za 4.66 sekundi bez grešaka.

---

## 15. Dnevnik Implementacije: Google Drive API 401 Dijagnostika & Automatski Token Retry Mehanizam

### 15.1. Uzrok Problema (Root Cause Analysis)
- **Istek OAuth tokena na poslužitelju:** Google OAuth access tokeni izdani preko browser GIS biblioteke (`initTokenClient`) imaju strog životni vijek od **1 sat (3599 sekundi)**. Zbog lokalne konstante od 6 sati, klijentski kod nije prepoznavao istek nakon 60 minuta te je slao istekli token, što je Google Drive API odbijao s `HTTP 401 Unauthorized`.
- **Prazan statusText u HTTP/2 protokolu:** Zbog RFC 7540 specifikacije, moderni preglednici ne prosljeđuju statusne poruke preko HTTP/2 (`statusText: ""`), pa je zapis greške u logeru glasio `Google Drive API greška (401): ` bez tijela odgovora.
- **Nedostatak oporavka od greške (Fail-recovery gap):** Kada bi nastupio 401, stari istekli token ostajao je spremljen u `localStorage`, a klijent nije automatski pokušavao tiho obnavljanje niti uklanjao nevažeći token.

### 15.2. Rješenje i Implementacija
1. **Dinamički `expires_in`:** `googleAuthService` sada prioritetno koristi stvarni `response.expires_in` (3599 s) koji vraća Google, osiguravajući da pozadinski liveness interval na vrijeme (prije minute 55) tiho obnovi token u pozadini.
2. **Čišćenje isteklih tokena (`clearStoredTokens`):** Dodana funkcija koja uklanja nevažeći token čim se detektira 401.
3. **Automatski Retry mehanizam (`executeWithTokenRetry` u `useGoogleDriveSync`):** Sve operacije prema Driveu (`listBackups`, `uploadBackup`, `downloadBackup`) automatski presreću 401 grešku, prazne nevažeći token, pozivaju tiho/novo osvježavanje i ponavljaju operaciju jednom transparentno.
4. **Strukturirano parsiranje grešaka u `googleDriveService`:** Ekstrakcija JSON polja `error.message` iz odgovora Google poslužitelja.
5. **Akcijski gumbi u UI sučelju (`GoogleDriveSyncCard`):** U slučaju trajno nevažeće sesije, korisnik direktno u kartici dobiva gumb `[Obnovi prijavu]` ili poveznicu za aktivaciju Google Drive API-ja.

### 15.3. Testna Verifikacija
- Dodani testovi: `apps/web/tests/google-drive.test.ts` (GD-11, GD-12 za strukturirano parsiranje 401 greške).
- **Cjelokupni suite:** **20 testnih datoteka, 180/180 testova prolazi (100%)**.
- **Produkcijski bundle:** `npm run build` prolazi bez ikakvih grešaka.

---

## 16. Dnevnik Implementacije: Obrnuti Poredak Sustavnog Dnevnika (Zadnje Poruke na Vrh / Newest First)

### 16.1. Korisnički Zahtjev i Motivacija
- Korisnik je zatražio da sustavni dnevnik ide "unatraške" kako bi najnovije poruke (posebice novonastale greške i statusi) bile odmah vidljive na samom vrhu panela, bez potrebe za ručnim skrolanjem do dna dugačkog popisa od 500 unosa.

### 16.2. Implementirano Rješenje ([`SystemLogDrawer.tsx`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/components/SystemLogDrawer.tsx))
1. **Zadani poredak: Najnovije poruke dolaze na vrh (`isNewestFirst = true`):**
   - Popis `filteredLogs` se sada reverzira (`list.slice().reverse()`) tako da je indeks 0 najnoviji događaj.
   - Kada se pojavi greška (`lastErrorEntry`), ona se automatski proširuje na samom vrhu bez ikakvog skrolanja.
2. **Korisnički preklopnik poretka:**
   - Dodan gumb `[Najnovije gore / Kronološki]` s ikonom `ArrowDownUp` u gornju traku kontrola.
   - Korisnik jednim klikom može prebaciti između obrnutog i klasičnog kronološkog prikaza.
   - Odabir se trajno pamti u `localStorage: obrtniq_log_order_newest_first`.
3. **Auto-Fokus / Auto-Scroll Preklopnik & Skrolanje na dno:**
   - Dodan preklopnik `[Auto-fokus: ON / OFF]` s ikonom `Focus` u gornjoj traci (trajno spremljen u `localStorage: obrtniq_log_auto_scroll`).
   - Kada je auto-fokus uključen:
     - Pri prebacivanju s "najnovije gore" na "kronološki", lista se automatski pozicionira na sam **dno** (`scrollHeight`) gdje se nalaze najnoviji unosi.
     - Prilikom primitka svakog novog log zapisa (`logs.length`), lista se u kronološkom načinu rada automatski skrola na dno, a u načinu rada "najnovije gore" ostaje pozicionirana na vrhu.
     - Ako korisnik želi pregledavati starije unose bez ometanja novih zapisa, može jednim klikom isključiti `Auto-fokus`.
4. **Ažurirani brojač:**
   - Zaglavlje prikazuje točan status: `({logs.length}/500 unosa • najnovije gore)`.

### 16.3. Testna Verifikacija
- Dodani testovi:
  - `SLS-08`: provjera ispravnosti reverziranja liste za prikaz najnovijih poruka na vrhu.
  - `SLS-09`: provjera izračuna pozicije auto-fokus scrollanja (vrh za obrnuti prikaz, dno za kronološki prikaz).
- **Cjelokupni suite:** **20 testnih datoteka, 188/188 testova prolazi (100%)**.
- **Produkcijski bundle:** `npm run build` prolazi bez grešaka.

---

## 17. Dnevnik Implementacije: Žigo Muški Bariton (Orlando) & Napredna TTS Sinteza Govora

### 17.1. Korisnički Zahtjev i Motivacija
- Korisnik je izričito zatražio refokusiranje na TTS sustav Žiga, eliminaciju piskutavog/ženskog zvuka standardnog web naratora ("nećemo se praviti da je Žiga pičkica ni da zvuči ovako"), promjenu glasa u zrelog muškarca viteškog karaktera (Orlando), analizu problema u sustavu te izradu plana za popravke i nadogradnje.

### 17.2. Detektirani Problemi u Sustavu
1. **Abecedni bias u Windows jezičnom paketu:**
   - Na Windows 10/11 instaliran je `Microsoft Gabrijela` (ženski) i `Microsoft Matej` (muški).
   - Inicijalni selektor `list.find(v => v.lang.startsWith('hr'))` uvijek je odabirao Gabrijelu jer je "G" ispred "M".
2. **Neprirodna frekvencija tona (Pitch):**
   - Vrijednost `pitch: 0.92` na ženskom glasu zvučala je groteskno, umjesto viteškog baritona.
3. **Asinkrono učitavanje glasova u Chromiumu:**
   - `speechSynthesis.getVoices()` pri inicijalnom renderu vraća `[]`, što je uzrokovalo pad na generičke ženske glasove sustava ako se izgovor pokrene rano.
4. **Chromium 15-sekundni SpeechSynthesis Bug:**
   - U preglednicima baziranim na Chromiumu, izgovori duži od 15 sekundi tiho se zamrzavaju bez okidanja `onend` događaja.

### 17.3. Implementirano Rješenje
1. **Domenski model i heuristika prioritizacije muških glasova ([`packages/core/src/domain/audio-transport.ts`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/packages/core/src/domain/audio-transport.ts)):**
   - Implementirane funkcije `classifyVoice()` i `selectBestMasculineVoice()`.
   - Ljestvica bodovanja:
     - Korisnički odabir (`preferredURI`): +10.000 bodova (apsolutni prioritet).
     - Hrvatski muški glas (`Matej`, `Ivan`, `Luka`): +2.000 bodova.
     - Hrvatski neutralni glas (`Google hrvatski`): +1.400 bodova.
     - Južnoslavenski muški glas (`Nikola`, `Stefan`, `Filip`): +1.200 bodova.
     - Hrvatski ženski glas (`Gabrijela`): +900 bodova (uz automatsko spuštanje pitcha na 0.78).
     - Globalni muški glas (`David`, `George`, `Mark`): +300 bodova.
2. **Globalni Audio Transport Context ([`apps/web/src/context/AudioTransportContext.tsx`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/context/AudioTransportContext.tsx)):**
   - Dodani state i perzistencija za: `availableVoices`, `selectedVoiceURI`, `voicePitch`, `voiceRate` i `currentVoice`.
   - Zadani stoički parametri: `pitch: 0.86`, `rate: 0.94` (`DEFAULT_ZIGO_VOICE_CONFIG`).
   - Implementiran periodički heartbeat watchdog svakih 10s (`pause() / resume()`) koji neutralizira Chromium 15s freeze bug.
3. **UI Kontrole za Glas u Postavkama ([`GoogleSttSettingsCard.tsx`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/components/settings/cloud/GoogleSttSettingsCard.tsx)):**
   - Prikaz statusa aktivnog sintetizatora (`[MUŠKI BARITON (ORLANDO)]`, `[HRVATSKI (hr-HR)]` ili žuto upozorenje za ženski glas s uputom za instalaciju `Microsoft Mateja` u Windowsima).
   - Dropdown selektor svih instaliranih glasova na računalu s jasnim oznakama.
   - Slajderi za Pitch (0.60 - 1.20) i Rate (0.75 - 1.25) s tipkom za trenutno vraćanje na viteške postavke.
4. **Prošireni leksički normalizator:**
   - Podrška za valute/cente (`125,50 €` ➔ `125 i 50 centi`), postotke (`25%` ➔ `25 posto`) i akronime (`PDV`, `HZZO`, `FINA`, `IBAN`, `FRO`, `EP`).

### 17.4. Verifikacija
- Dodano 6 novih jediničnih testova u [`zigo-audio-transport.test.ts`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/tests/zigo-audio-transport.test.ts).
- Cjelokupni testni suite: **20 datoteka, 188/188 testova prolazi (100%)**.
- Produkcijski paket: `npm run build` izgrađen čisto u 13.43s.

---

## 18. Dnevnik Implementacije: Google Cloud Text-to-Speech (TTS) Primarni Motor, Testiranje/Debugiranje & Hibridni Fallback

### 18.1. Korisnički Zahtjev
- Primarno koristiti **Google Cloud Text-to-Speech API** za sintezu Žigovog glasa (WaveNet bariton).
- Zadržati lokalne opcije (Microsoft Matej / lokalni preglednički Web Speech) kao trenutačni, automatski **fallback** u slučaju greške, offline rada ili prekoračenja kvote.
- Implementirati mogućnost **debugiranja i testiranja** Google TTS API-ja izravno iz sučelja (mjerenje latencije, provjera prava, trenutna reprodukcija audio uzorka).

### 18.2. Arhitektura i Rješenje (100% In-Browser & Zero-Server)
1. **Google Cloud Text-to-Speech REST Servis ([`apps/web/src/services/google-tts-service.ts`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/services/google-tts-service.ts)):**
   - Izravni poziv na Google REST endpoint `https://texttospeech.googleapis.com/v1/text:synthesize?key=AIza...`.
   - **BYOK dijeljenje ključa:** Ako je uključen `useSttApiKey: true`, servis automatski koristi isti GCP API ključ iz Speech-to-Text konfiguracije bez potrebe za dvostrukim unosom.
   - **In-Memory Audio Caching:** Svi sintetizirani audio blobi spremaju se u memorijski `Map` po ključu `(voiceName, rate, pitch, text)` kako se ne bi ponovno trošila GCP kvota i novac za identične rečenice.
   - **Audio dekodiranje:** Base64 `audioContent` se dekodira u binarni Blob (`audio/mp3`) i pretvara u lokalni URL (`URL.createObjectURL(blob)`).
   - **Dohvaćanje glasova:** Metoda `fetchVoices()` za dinamički pregled svih dostupnih Google WaveNet/Neural glasova na projektu.
2. **Globalni Hibridni Audio Transport ([`apps/web/src/context/AudioTransportContext.tsx`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/context/AudioTransportContext.tsx)):**
   - Ako je motor postavljen na `google_cloud` i API je konfiguriran, `speakCurrentItem()` šalje tekst na Google Cloud TTS.
   - Audio se reproducira putem HTML5 Audio elementa s potpunom sinkronizacijom master kontrola (STOP, Pauza, Nastavak, Mute, Preskakanje).
   - **Besprijekoran Fallback:** Ako Google TTS baci bilo kakvu grešku (npr. HTTP 403, prekid interneta, nevaljan ključ) ili `audio.onerror` detektira problem, sustav istog trenutka aktivira `fallbackToWebSpeech()` s muškim baritonom `Microsoft Matej`.
3. **UI Postavke, Debugiranje i Testiranje ([`apps/web/src/components/settings/cloud/GoogleSttSettingsCard.tsx`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/components/settings/cloud/GoogleSttSettingsCard.tsx)):**
   - Preklopnik između Google Cloud TTS i Lokalnog preglednika / Microsofta.
   - Odabir glasa: `hr-HR-Wavenet-B` (muški bariton), `hr-HR-Wavenet-A` (ženski Wavenet), `hr-HR-Standard-A` i južnoslavenske opcije.
   - Gumb *"Testiraj i Debugiraj Google TTS Vezu"*:
     - Mjeri mrežnu latenciju u milisekundama.
     - Prikazuje status uspješnosti ili točan opis greške (uz poveznicu na GCP Marketplace za aktivaciju ako je HTTP 403).
     - Odmah reproducira sintetizirani audio uzorak viteza Orlanda u zvučnicima.
4. **Validacija postavki ([`packages/core/src/domain/audio-transport.ts`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/packages/core/src/domain/audio-transport.ts)):**
5. **Prioritizacija Web Client API ključa aplikacije ([`app-client-credentials.ts`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/services/app-client-credentials.ts)):**
   - Ako je u okruženju (`.env`) zadan aplikacijski Web Client API ključ (`VITE_GOOGLE_CLIENT_API_KEY` ili `VITE_GOOGLE_API_KEY`), aplikacija ga **prvo i automatski** koristi za Google TTS i STT V2 bez potrebe za ručnim kopiranjem u polja za unos.
   - Podržan i Google OAuth 2.0 Web Client Bearer token (`Authorization: Bearer <token>`) ako je korisnik prijavljen sa svojim Google računom.
   - Korisnik u sučelju vidi točan izvor aktivnog ključa (`Izvor: Aplikacijski Web Client API ključ (.env / sustav)`) te može unijeti vlastiti ključ za nadjačavanje ako to želi.

### 18.3. Verifikacija
- Testni suite: [`apps/web/tests/google-tts.test.ts`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/tests/google-tts.test.ts) proširen na **23 testa** (uključujući test za detekciju 403 `insufficient authentication scopes`).
- **Cjelokupni monorepo testovi:** **21 testna datoteka, 211/211 testova prolazi (100%)**.
- **Produkcijski bundle:** `npm run build` završen s 0 grešaka u 4.4 sekunde.

---

## 19. Sigurnosna analiza Google autentifikacije: API Ključ vs. OAuth Scopes

### 19.1. Analiza problema `HTTP 403: Request had insufficient authentication scopes`
- **Uzrok:** Kada u postavkama ili okruženju nije bio postavljen Google Cloud API ključ (`AIzaSy...`), sustav je posegnuo za OAuth tokenom prijavljenog korisnika (`ya29...`). Taj je token izdan isključivo s opsezima za Google Drive backup (`drive.appdata`) i korisnički profil (`openid`, `email`, `profile`), bez ovlasti nad Google Cloud Platformom.
- **Dozvola korisnika (Consent):**
  - **API ključ (`AIzaSy...`):** Korisnik **NE MORA** davati privolu. Ključ je vezan uz GCP projekt i autorizira Cloud TTS/STT pozive bez korisničkog popup ekrana.
  - **OAuth prijava (`ya29...`):** Korisnik bi morao dati privolu za pristup Google Cloudu, što bi zahtijevalo verifikaciju aplikacije kod Googlea i korisnički GCP račun s uključenim billingom.
- **Potreban scope za OAuth:** `https://www.googleapis.com/auth/cloud-platform`. Zbog osjetljivosti i rizika (traži pristup svim GCP resursima korisnika), **ne preporučuje se** dodavati ga na korisnički OAuth login.
- **Zadani (Default) mehanizam:** **Google Cloud API ključ (`AIzaSy...`)** postavljen u `.env` (`VITE_GOOGLE_CLIENT_API_KEY`) s restrikcijom domene (`localhost` i web domena aplikacije) i restrikcijom API-ja (`Cloud Text-to-Speech API`).

---

## 20. Faza 17: Sveobuhvatno Knjigovodstvo Obrta: Obvezni Doprinosi, HUB-3 Nalozi, Troškovnik i Bankovni Izvodi

### 20.1. Pregled Implementiranih Sustava
1. **Domenski Modul Obveznih Doprinosa i Poreza (`packages/core/src/domain/doprinosi.ts`):**
   - Službene osnovice i stope doprinosa za paušalne obrtnike u RH (2026. godina): MIO I. stup (15%), MIO II. stup (5%), HZZO (16,5%).
   - Generiranje standardnih naloga za plaćanje:
     - MIO 1: Državni proračun RH (`HR1210010051863000160`), model `HR68`, poziv `8214-OIB`.
     - MIO 2: REGOS (`HR7410010051700036001`), model `HR68`, poziv `2054-OIB`.
     - HZZO: Državni proračun RH (`HR1210010051863000160`), model `HR68`, poziv `8478-OIB`.
     - Kvartalni porez: Račun općine/grada prema sjedištu obrta, model `HR68`, poziv `1414-OIB`.
   - Automatski izračun dospijeća (15. u mjesecu za doprinose prethodnog mjeseca; zadnji dan kvartala za porez).
2. **Knjiga Ulaznih Troškova i Dugotrajna Imovina (`packages/core/src/domain/troskovi.ts`):**
   - 10 kategorija troškova (softver, hosting, uredski materijal, alati, knjigovodstvo, najam, gorivo, komore/članarine, reprezentacija, ostalo).
   - Detekcija dugotrajne imovine prema zakonskom pragu od 663,61 € (bivših 5.000 HRK) s evidentiranjem serijskog broja i automatskim tagiranjem.
   - Izračun rekapitulacije troškova i dugotrajne imovine.
3. **Financijska Slika i Cash-Flow Izračun (`packages/core/src/utils/cashflow.ts`):**
   - Sintetizira KPR primitke, plaćene operativne troškove, uplaćene doprinose i paušalni porez.
   - Prikazuje stvarnu čistu neto dobit obrta i profitnu maržu.
4. **Univerzalni Parser Bankovnih Izvoda (`packages/core/src/domain/bank-statement.ts`):**
   - Podrška za CSV i TXT izvoze vodećih hrvatskih banaka: ZABA, PBZ, Erste (George), HPB, OTP i Revolut Business.
   - Automatsko prepoznavanje stupaca (datum, opis, IBAN, uplate, isplate, poziv na broj).
   - Algoritam uparivanja transakcije s izdanim računom (`upariTransakcijuSRacunom`).
5. **HUB-3 PDF417 i EPC SEPA QR Generator Uplatnica (`packages/core/src/utils/hub3-gov.ts` & `Hub3PaymentModal.tsx`):**
   - Generiranje standardnih HUB-3 tekstualnih payloadova za državne račune i REGOS.
   - Generiranje EPC SEPA QR kodova.
   - Modalni prozor s Canvas renderiranjem na čistoj bijeloj podlozi za kamere m-bankinga, 1-klik kopiranjem IBAN-a i poziva na broj, ispisom uplatnice i označavanjem uplate.
6. **Objedinjeni 5-Tab Knjigovodstveni Centar (`BookkeepingDrawer.tsx`):**
   - Tab 1: Knjiga Prometa (KPR) s vizualnim nadzorom zakonskog praga 40.000,00 € (75% oprez, 90% upozorenje, prekoračen prag), tablicom stavaka, ručnim unosom i CSV izvozom s UTF-8 BOM.
   - Tab 2: Obrazac PO-SD s 4 kvartalne kartice i validacijom službenog XML-a za ePoreznu.
   - Tab 3: Obvezni doprinosi i kvartalni porezi s 12 mjesečnih kartica, statusnim bedževima i HUB-3 uplatnicama.
   - Tab 4: Troškovnik i dugotrajna imovina s filtriranjem po kategorijama, statusu plaćanja, unosom računa i pregledom neto dobiti.
   - Tab 5: Bankovni izvodi s drag-and-drop CSV zonom, listom transakcija i 1-klik knjiženjem u KPR uz automatsku promjenu statusa računa u `PLACENO`.
7. **Pohrana i Kriptirani Backup:**
   - Dexie baza nadograđena na shemu v4 (tablice `troskovi` i `doprinosiUplate`).
   - Apstraktni repozitoriji `ITroskoviRepository` i `IDoprinosiRepository` integrirani u `IObrtnIQStorage`, `InMemoryObrtnIQStorage` i AES-256-GCM kriptirani JSON backup/restore (`ObrtnIQBackupData`).

### 20.2. Verifikacija i Testovi (Gate-Check V17)
- **Paket `@obrtniq/core`:** 25 testnih datoteka, **140/140 prolaznih testova (100%)**.
- **Paket `@obrtniq/web`:** 22 testne datoteke, **217/217 prolaznih testova (100%)**.
- **Ukupno u monorepu:** **357/357 prolaznih testova (100%)**.
- **TypeScript build:** `tsc -b` prolazi s **0 grešaka** u svim paketima.
- **Vite produkcijski bundle:** Uspješno izgrađen za 4,39 sekundi.

---

## 21. Faza 18: Žigo Inteligentni Knjigovodstveni Copilot, PWA Offline Instalabilnost & Godišnji Analitički Izvještaji Obrta

### 21.1. Pregled Implementiranih Sustava
1. **Četiri Nova Autonomna AI Knjigovodstvena Alata (`ZIGO_TOOLS` & `zigo-tools-dispatcher.ts`):**
   - `provjeri_obvezne_doprinose_i_porez`: Provjera dospijeća i statusa MIO I, II i HZZO doprinosa te kvartalnog paušalnog poreza s automatskim pozivom HUB-3 uplatnica.
   - `evidentiraj_ulazni_trosak`: Unos ulaznog računa/odreska s normalizacijom 10 kategorija troškova i automatskom detekcijom dugotrajne imovine (> 663,61 €).
   - `dohvati_financijsku_sliku_i_dobit`: Sinteza KPR primitaka, operativnih izdataka i javnih davanja u čistu neto dobit i profitnu maržu.
   - `saldiraj_izvod_transakcije`: Automatsko knjiženje bezgotovinskih uplata s izvoda u KPR i prebacivanje povezanog računa u status `PLACENO`.
2. **Knjigovodstvene Akcijske Kartice (`ZigoActionCard.tsx`):**
   - Četiri specijalizirane interaktivne kartice s dubrovačkom orlandovskom temom (`#b89758` / `#ffd700`), jasnim raščlambama troškova, marže i statusa uplate.
3. **PWA Offline Instalabilnost i Service Worker:**
   - `apps/web/public/manifest.webmanifest`: PWA konfiguracija za desktop i mobilne uređaje (Midnight tema `#0F172A`, standalone prikaz).
   - Generirane visoko-rezolucijske ikone (`icon-192.png` i `icon-512.png`).
   - `apps/web/public/sw.js`: Native Service Worker s Cache-First strategijom za statičke resurse i Google fontove, te Network-First za Google Cloud i CIS API-je.
   - `apps/web/src/hooks/usePwaInstall.ts`: Hook za detekciju `beforeinstallprompt`, instalacijski status i offline radar.
   - `AppHeader.tsx`: PWA install gumb s animacijom i diskretni offline bedž kada nema internetske veze.
4. **Domenski Kalkulator Godišnje Analitike (`packages/core/src/domain/analytics.ts`):**
   - Funkcija `izracunajGodisnjuAnalitiku`: Izračun ukupnih KPR primitaka, operativnih troškova, doprinosa, poreza, neto dobiti, profitne marže, strukture troškova po 10 kategorija, top 5 klijenata po prometu, 12-mjesečnog trenda poslovanja i registra dugotrajne imovine.
5. **UI Analitika i A4 PDF Izvještaj Obrta (`BookkeepingDrawer.tsx` Tab 6):**
   - `AnalitikaTab.tsx`: KPI kartice, status paušalnog praga (40.000 €), distribucija troškova, top partneri, mjesečni grafikon trenda i registar opreme.
   - `AnnualReportPdfModal.tsx`: Službeni ISO 32000-1 A4 godišnji financijski izvještaj s memorandumom obrta, rekapitulacijom i mjestom za potpis/pečat za arhivu i kreditne institucije.

### 21.2. Verifikacija i Testovi (Gate-Check V18-1 do V18-10)
- **Paket `@obrtniq/core`:** 26 testnih datoteka, **141/141 prolaznih testova (100%)**.
- **Paket `@obrtniq/web`:** 24 testne datoteke, **223/223 prolaznih testova (100%)**.
- **Ukupno u monorepu:** **364/364 prolazna testa (100%)**.
- **TypeScript build (`tsc -b`):** Prolazi s **0 grešaka** u svim paketima monorepa.
- **Vite produkcijski bundle:** Uspješno izgrađen za 4,45 sekundi.

---

## 22. Faza 19: Modularna Workspace Arhitektura i In-Place Navigacija (Bez Modalnog Zamagljenja)

### 22.1. Pregled Arhitekture i Izmjena
1. **Eliminacija Modalnog Zamagljenja & Pozadinskog Zatamnjenja (`backdrop-blur` / `bg-black/60`):**
   - Umjesto prethodnog koncepta u kojem su se svi moduli otvarali kao plutajuće ladice (drawers) koje zatamnjuju i blokiraju glavni radni prostor, ObrtnIQ je pretvoren u **Modularnu Workspace Aplikaciju**.
   - Središnji radni prostor (`<main>`) dinamički zamjenjuje prikaz željenim modulom u punoj širini ekrana (`w-full`), pružajući maksimalnu preglednost tablica, analitika i obrazaca.
2. **Klijentski Workspace Router (`useWorkspaceRouter.ts`):**
   - Podržava 8 modularnih ruta: `'home' | 'bookkeeping' | 'documents' | 'fiscal' | 'articles' | 'partners' | 'settings' | 'logs'`.
   - Dvosmjerna sinkronizacija s URL hash sidrom (`#home`, `#bookkeeping`, `#documents`, `#fiscal`, itd.) i parametrima prikaza (npr. `#bookkeeping?tab=doprinosi`).
   - Dinamičko ažuriranje naslova dokumenta u pregledniku (`document.title`).
3. **Trajno Aktivno Zaglavlje (`AppHeader.tsx`):**
   - Zlatni Orlando amblem i naziv "ObrtnIQ" služe kao primarno Home sidro.
   - Dodan posvećeni gumb: `0. Home / Radna ploha (Novi račun)` s ikonom kuće i aktivnim indikatorom.
   - Svi gumbi modula (`Knjigovodstvo`, `Dokumenti`, `Fiskalizacija`, `Cjenik`, `Partneri`, `Postavke`) dinamički reflektiraju aktivno stanje s donjom crtom u boji teme.
4. **Puni In-Place Workspace Prikazi (`*WorkspaceView.tsx`):**
   - `BookkeepingWorkspaceView`: Puni raspon 6 knjigovodstvenih tabova (KPR, PO-SD, Doprinosi, Troškovnik, Izvodi, Analitika) bez suženja na 1024px.
   - `SettingsWorkspaceView`: Puni prikaz postavki obrta, memoranduma, Cloud synca i AI motora.
   - `DocumentWorkspaceView`: Pregledna evidencija izdanih računa s brzom navigacijom na radnu plohu jednim klikom na dokument.
   - `FiscalWorkspaceView`: Cjelovita kontrolna ploča CIS Fiskalizacije 1.0 i e-Račun UBL 2.1 validatora.
   - `ArticleWorkspaceView`: Katalog usluga s KPD 2025 tražilicom i trenutnim dodavanjem na račun uz povratak na radnu plohu.
   - `PartnerWorkspaceView`: Adresar kupaca s OIB provjerom i jednokliknim odabirom partnera na radnu plohu.
   - `SystemLogWorkspaceView`: Puni konzolni prikaz telemetrije i call stacka.
   - Svaki workspace prikaz ima ugrađeni breadcrumb (`[🏠 Radna ploha (Home)] > Modul`) i gumb za povratak na radnu plohu (`← Povratak na Radnu plohu (Home)`).
5. **Očuvanje Stanja Nacrta Računa u Memoriji:**
   - Navigacijom na knjigovodstvo, postavke ili cjenik podaci računa u formi (`useInvoiceForm`), stavke (`useInvoiceItems`) i status (`useInvoiceWorkflow`) ostaju 100% sačuvani u memoriji React stabla.
6. **Integracija s Žigo Copilotom i Tipkovničkim Prečacima:**
   - Žigo u realnom vremenu zna točan aktivni ekran (`snapshot.aktivniEkran`).
   - Tipkovnički prečac `Alt+H` u bilo kojem trenutku vraća korisnika na radnu plohu.
   - Tipka `Escape` kada korisnik nije na početnom ekranu vraća na radnu plohu.

### 22.2. Verifikacija i Testovi (Gate-Check V19-1 do V19-8)
- **Paket `@obrtniq/core`:** 26 testnih datoteka, **141/141 prolaznih testova (100%)**.
- **Paket `@obrtniq/web`:** 26 testnih datoteka, **230/230 prolaznih testova (100%)**.
- **Ukupno u monorepu:** **52 testne datoteke, 371/371 prolaznih testova (100%)**.
- **TypeScript provjera tipova:** `npx tsc --noEmit` i `tsc -b` prolaze s **0 grešaka**.
- **Vite produkcijski bundle:** Uspješno izgrađen za 4,62 sekunde.

---

## 23. Faza 20: Poslovno Proširenje Obrta: Ponavljajući Računi (Subscriptions), Službeni Porezni Kalendar RH, Više Poslovnih Prostora (Multi-Location) te 1-Klik Arhivski Paket (ZIP)

### 23.1. Pregled Implementiranih Sustava i Modula
1. **Ponavljajući Računi i Pretplate (Subscriptions & Retainers):**
   - **Domenski kalkulator (`packages/core/src/domain/recurring.ts`):** Podrška za frekvencije `MJESECNO`, `KVARTALNO` i `GODISNJE`, odabir fiksnog dana u mjesecu (1–31) uz automatsku korekciju za kraće mjesece (npr. 28/29. veljače), funkcija `jeDospjeloZaIzdavanje`, validacija profila i kalkulacija ukupnog iznosa.
   - **Dexie perzistencija (`apps/web/src/storage/dexie-db.ts`):** Nadogradnja sheme na verziju 5 s novom tablicom `recurringProfiles`, implementacija `DexieRecurringRepository` i `MemoryRecurringRepository`.
   - **Hook upravljanja (`apps/web/src/hooks/useRecurringInvoices.ts`):** Kompletne CRUD operacije, kreiranje predložaka s više stavaka i KPD 2025 šiframa, metoda `generirajNacrt` koja stvara novi račun u statusu `NACRT` na radnoj plohi, te metoda `generirajSveDospjele` za masovnu pripremu paušala jednim potezom.
   - **UI komponente:** `RecurringInvoicesModal.tsx` za kreiranje i pregled pretplata s karticama i indikatorima dospijeća, te `RecurringSentinelBanner.tsx` na vrhu radne plohe za proaktivno upozorenje obrtnika o dospjelim računima.

2. **Službeni Porezni Kalendar RH za Paušaliste i Proaktivni Sentinel:**
   - **Domenski kalendar (`packages/core/src/domain/tax-calendar.ts`):** Katalog 17 službenih zakonskih rokova za paušalne obrtnike (12x mjesečni doprinosi MIO I, MIO II i HZZO s dospijećem 15. u mjesecu za prethodni mjesec, 4x kvartalni paušalni porez s dospijećem zadnji dan kvartala, 1x predaja Obrasca PO-SD s dospijećem 15. siječnja).
   - **Izračun preostalih dana i statusi:** Funkcija `izracunajPreostaleDane` i statusi `CEKA_UPLATU`, `UPLACENO`, `PREKORACENO` s kronološkim sortiranjem i prepoznavanjem hitnosti (≤ 7 dana).
   - **UI Tab 7 u Knjigovodstvu (`PorezniKalendarTab.tsx`):** Vremenska crta svih 17 rokova za zadanu godinu, brzi filtri (`Svi`, `Doprinosi`, `Porez`, `PO-SD`, `Čeka uplatu`), statusne značke i gumb za instant generiranje HUB-3 uplatnice i EPC-QR koda putem `Hub3PaymentModal`.
   - **Tax Sentinel Banner (`TaxSentinelBanner.tsx`):** Proaktivni banner na vrhu radne plohe koji se aktivira 7 dana prije dospijeća poreza ili doprinosa s odbrojavanjem i 1-klik otvaranjem uplatnice.

3. **Više Poslovnih Prostora i Naplatnih Uređaja (Multi-Premise & Multi-Device):**
   - **Domenska specifikacija (`packages/core/src/domain/premises.ts`):** Strukture `PoslovniProstorConfig` i `NaplatniUredjajConfig`, formatiranje zakonskog broja dokumenta `Broj/Prostor/Uređaj` (npr. `1/POSL1/1`, `1/TEREN/1`), parsiranje i validacija oznaka (1–10 alfanumeričkih znakova, bez kosih crta).
   - **Postavke obrta (`PoslovanjeTab.tsx`):** Upravljanje listom poslovnih prostora i pripadajućih uređaja (dodavanje, brisanje, adresa, radno vrijeme).
   - **Workflow integracija (`useInvoiceWorkflow.ts`):** Odabir aktivnog prostora i uređaja za svaki račun uz očuvanje nezavisnih sekvenci numeriranja.

4. **Klijentski Dispečer Slanja i Dijeljenja Računa (`invoice-dispatcher.ts`):**
   - **E-mail dispečer (`buildMailtoUrl`):** Generira `mailto:` poveznicu s automatski sročenim hrvatskim tekstom koji sadrži broj računa, iznos, poziv na broj i IBAN obrta.
   - **Chat sažetak (`buildChatSummary` & `buildWhatsAppUrl`):** Formatirani kratki sažetak računa za WhatsApp/Viber/SMS s funkcijom sigurnog kopiranja u međuspremnik (`copyToClipboard`).
   - **Web Share API (`shareInvoicePdf`):** Korištenje modernog `navigator.share` API-ja za slanje generirane PDF datoteke direktno iz preglednika na podržanim mobilnim i desktop sustavima uz fallback na preuzimanje.
   - **UI akcije:** Padajući izbornik *"Pošalji / Podijeli"* u `InvoiceLivePreview.tsx`.

5. **1-Klik Arhivski Revizorski Paket (ZIP) (`audit-export-service.ts`):**
   - **Pakiranje u pregledniku (`jszip`):** Potpuni klijentski izvoz svih relevantnih poslovnih knjiga i dokumenata za zadanu godinu u strukturirani ZIP arhiv naziva `ObrtnIQ_Porezni_Paket_[OIB]_[GODINA].zip`.
   - **Struktura mapa u paketu:**
     - `01_Knjiga_Prometa/`: Službeni `KPR_[GODINA].csv` s UTF-8 BOM za Excel i `KPR_Sazetak_[GODINA].txt`.
     - `02_Obrazac_POSD/`: Službeni `Obrazac_POSD_[GODINA].xml` usklađen s ePorezna shemom v2.0.
     - `03_Troskovnik_I_Imovina/`: `Evidencija_Troskova_[GODINA].csv` i `Registar_Dugotrajne_Imovine_[GODINA].csv`.
     - `04_Godisnja_Analitika/`: Tekstualni financijski sažetak poslovanja.
     - `METAPODACI_REVIZIJA.json`: Metapodaci o generiranju, verziji sustava, profilu obrta i kontrolnom zbroju stavki.
   - **UI integracija:** Gumb *"📦 Preuzmi cjeloviti godišnji porezni paket (ZIP)"* u `AnalitikaTab.tsx`.

6. **Žigo AI Copilot Proširenje Alata (`gemini-service.ts` & `zigo-tools-dispatcher.ts`):**
   - **Alat `provjeri_porezni_kalendar_i_rokove`:** Žigo provjerava stanje poreznih obveza i rokova, izračunava preostale dane te korisnika obavještava u orlandovskom dubrovačkom tonu uz preporuku plaćanja.
   - **Alat `pregledaj_dospjele_ponavljajuce_racune`:** Žigo detektira pretplate koje čekaju izdavanje na današnji dan, izračunava ukupni iznos i nudi generiranje nacrta.

### 23.2. Verifikacija i Testovi (Gate-Check V20-1 do V20-8)
- **Paket `@obrtniq/core`:** 29 testnih datoteka, **156/156 prolaznih testova (100%)**.
  - `recurring.test.ts` (6 testova)
  - `tax-calendar.test.ts` (4 testa)
  - `premises.test.ts` (5 testova)
- **Paket `@obrtniq/web`:** 32 testne datoteke, **248/248 prolaznih testova (100%)**.
  - `recurring-invoices.test.ts` (3 testa)
  - `tax-calendar-ui.test.ts` (3 testa)
  - `premises-workflow.test.ts` (3 testa)
  - `invoice-dispatcher.test.ts` (3 testa)
  - `audit-export.test.ts` (1 test)
  - `zigo-faza20-tools.test.ts` (5 testova)
- **Ukupno u monorepu:** **61 testna datoteka, 404/404 prolazna testa (100%)**.
- **TypeScript provjera tipova (`tsc -b`):** 0 grešaka u svim paketima monorepa.
- **Vite produkcijski bundle:** Uspješno izgrađen za 5,62 sekunde.


