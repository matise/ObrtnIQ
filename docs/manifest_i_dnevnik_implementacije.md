# ObrtnIQ: Manifest i Dnevnik Implementacije (Project Progress Log)

Ovaj dokument služi kao jedinstveni izvor istine za praćenje napretka, evidentiranje odluka, faza, kreiranih datoteka i statusa verifikacije ("Gate-Check") prema [Glavnom Dizajn Dokumentu i Planu Implementacije](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/docs/glavni_dizajn_dokument_i_plan_implementacije_obrtniq.md).

---

## 1. Pregled Faza i Trenutni Status

| Faza | Naziv Modula / Cjeline | Status | Gate-Check Kriterij | Zadnja Izmjena |
|---|---|---|---|---|
| **Faza 0** | **Temeljna konfiguracija & Monorepo postavke** | 🟢 **ZAVRŠENO** | Uspješno kompajliranje, konfigurirani aliasi, postavljen test runner | 2026-10-24 |
| **Faza 1** | **Domena, Validacije i Poslovna Matematika (Core Engine)** | 🟡 **SLJEDEĆA NA REDU** | 100% prolaznost Vitest testova za OIB (ISO 7064), IBAN (MOD 97), popuste i HUB-3 | - |
| **Faza 2** | **Sloj Pohrane (Storage Abstraction & Adapter)** | ⚪ Čeka | In-memory CRUD testovi, sekvenca računa bez rupa, export/import | - |
| **Faza 3** | **Dizajn Sustav & Sharp UI Primitivi** | ⚪ Čeka | Responzivnost (375px/1440px), OibInput, IbanInput bank lookup | - |
| **Faza 4** | **Generator Kodova i PDF Engine** | ⚪ Čeka | HUB-3 PDF417 skenabilan m-bankingom, PDF export < 300ms | - |
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

---

## 3. Registar Ključnih Arhitektonskih Odluka (ADR)

* **ADR-001 (Monorepo struktura):** Odabran `npm workspaces` pristup (`packages/core` + `apps/web`) kako bi domenska logika, financijska matematika i validacije ostali 100% neovisni o UI-ju i poslužitelju, čime se omogućuje neovisno testiranje i potencijalna ponovna iskoristivost u Web Workeru ili Cloudflare proxyju.
* **ADR-002 (Local-First pohrana):** Koristi se lokalna baza unutar korisničkog preglednika (Dexie.js / SQLite Wasm preko OPFS-a) bez ikakvog centralnog poslužitelja ili mjesečnih troškova infrastrukture.
* **ADR-003 (Precizna financijska matematika):** Svi iznosi se interno računaju u centima (integer) ili decimalnom reprezentacijom s eksplicitnim zaokruživanjem kako bi se eliminirale `IEEE 754 float` anomalije.
