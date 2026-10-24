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
| **Faza 4** | **Generator Kodova i PDF Engine** | 🟡 **SLJEDEĆA NA REDU** | HUB-3 PDF417 skenabilan m-bankingom, PDF export < 300ms | - |
| **Faza 5** | **Ekran za Izdavanje Računa & Workflow** | ⚪ Čeka | Izdavanje računa tipkovnicom < 30s, statusni automat, immutability | - |
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

---

## 3. Registar Ključnih Arhitektonskih Odluka (ADR)

* **ADR-001 (Monorepo struktura):** Odabran `npm workspaces` pristup (`packages/core` + `apps/web`) kako bi domenska logika, financijska matematika i validacije ostali 100% neovisni o UI-ju i poslužitelju, čime se omogućuje neovisno testiranje i potencijalna ponovna iskoristivost u Web Workeru ili Cloudflare proxyju.
* **ADR-002 (Local-First pohrana):** Koristi se lokalna baza unutar korisničkog preglednika (Dexie.js / SQLite Wasm preko OPFS-a) bez ikakvog centralnog poslužitelja ili mjesečnih troškova infrastrukture.
* **ADR-003 (Precizna financijska matematika):** Svi iznosi se interno računaju u centima (integer) ili decimalnom reprezentacijom s eksplicitnim zaokruživanjem kako bi se eliminirale `IEEE 754 float` anomalije.
