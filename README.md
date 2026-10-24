# ObrtnIQ 🏛️⚡
> **Autonomni Klijentski Operativni Sustav i ERP za Hrvatske Paušalne i Dohodovne Obrte**  
> *"Non bene pro toto libertas venditur auro"* — Sloboda i suverenost vašeg obrta bez poslužitelja, bez mjesečnih pretplata i bez kompromisa.

<p align="center">
  <img src="docs/ZigoIcon01.png" alt="ObrtnIQ Žigo Logo" width="220" style="border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.5);" />
</p>

<p align="center">
  <a href="#-o-aplikaciji"><img src="https://img.shields.io/badge/Arhitektura-Zero--Server%20%2F%20Client--Side%20First-10B981?style=for-the-badge" alt="Zero-Server" /></a>
  <a href="#-kripto-trezor-i-google-sidro"><img src="https://img.shields.io/badge/Sigurnost-AES--256--GCM%20%2F%20PBKDF2%20100k-F59E0B?style=for-the-badge" alt="AES-256" /></a>
  <a href="#-fiskalizacija-10--20"><img src="https://img.shields.io/badge/Fiskalizacija-1.0%20(CIS)%20%26%202.0%20(e--Ra%C4%8Dun)-3B82F6?style=for-the-badge" alt="Fiskalizacija" /></a>
  <a href="#-gemini-ai-asistent-kpd-2025"><img src="https://img.shields.io/badge/AI-Gemini%202.0%20BYOK%20%2B%20RH%20Heuristika-8B5CF6?style=for-the-badge" alt="Gemini AI" /></a>
  <a href="#-testna-pokrivenost"><img src="https://img.shields.io/badge/Testovi-120%2F120%20Prolazi%20(100%25)-059669?style=for-the-badge" alt="Tests" /></a>
</p>

---

## 📖 Sadržaj
1. [O Aplikaciji](#-o-aplikaciji)
2. [Žigo — Digitalni Orlando i Filozofija Sustava](#-žigo--digitalni-orlando-i-filozofija-sustava)
3. [Ključne Značajke (Faza 0 do Faze 10)](#-ključne-značajke)
   - [Brzina i Tipkovnički Workflow](#1-brzina-i-tipkovnički-workflow-altn--f2)
   - [Fiskalizacija 1.0 (CIS) i Fiskalizacija 2.0 (e-Račun)](#2-fiskalizacija-10-cis-i-fiskalizacija-20-e-račun)
   - [Vektorski A4 PDF, HUB-3 PDF417 i EPC QR](#3-vektorski-a4-pdf-hub-3-pdf417-i-epc-qr)
   - [KPR & PO-SD Knjigovodstvo i KPR CSV Izvoz](#4-kpr--po-sd-knjigovodstvo-i-kpr-csv-izvoz)
   - [Katalog Artikala & KPD 2025](#5-katalog-artikala--kpd-2025)
   - [Kripto-Trezor i Google Identity Sidro](#6-kripto-trezor-i-google-identity-sidro)
   - [Google Drive AppData Sinkronizacija](#7-google-drive-appdata-sinkronizacija)
   - [Gemini AI Asistent (BYOK) i 100% Offline Heuristika](#8-gemini-ai-asistent-byok-i-100-offline-heuristika)
4. [Arhitektura Sustava (Zero-Server)](#-arhitektura-sustava-zero-server)
5. [O Autoru: Matija Miloslavić ("Mate Fox" / "m@tise")](#-o-autoru-matija-miloslavić)
6. [Obrt Robot Hand Made](#-obrt-robot-hand-made)
7. [Brzi Početak (Quickstart & Razvoj)](#-brzi-početak)
8. [Verifikacija i Testovi](#-verifikacija-i-testovi)
9. [Atribucija i Licenca](#-atribucija-i-licenca)

---

## 💡 O Aplikaciji

**ObrtnIQ** je autonomni, klijentski operativni sustav razvijen specifično za **hrvatske paušalne i dohodovne obrte**. 

U svijetu gdje većina računovodstvenog softvera nameće mjesečne pretplate, zaključava podatke korisnika na zatvorenim serverima i prodaje baze trećim stranama, ObrtnIQ se temelji na radikalnoj premisi:

> **Vaši financijski podaci pripadaju isključivo vama.** Cjelokupna aplikacija, baza podataka (IndexedDB), kriptografski trezor (Web Crypto API) i poslovna logika izvršavaju se **100% lokalno u vašem web pregledniku**. Niti jedan račun, OIB, IBAN ili iznos ne napušta vaš uređaj bez vaše izričite i kriptirane komande.

Aplikacija u potpunosti podržava sve aktualne i nadolazeće zakonske propise Republike Hrvatske:
* **Fiskalizaciju 1.0 (CIS)** gotovinskih i kartičnih računa (SOAP XML, ZKI generiranje, JIR, offline red čekanja).
* **Fiskalizaciju 2.0 (e-Račun)** prema europskoj normi EN 16931 i CIUS-HR (UBL 2.1 XML).
* Obveznu novu **Klasifikaciju proizvoda po djelatnostima (KPD 2025)**.
* **Godišnji prag od 40.000 €** za paušalno oporezivanje s dinamičkim praćenjem u stvarnom vremenu.
* **Knjigu prometa (KPR)** i automatizirani izvoz obrasca **PO-SD u XML-u za ePoreznu**.
* Vektorski **A4 PDF račun** s **HUB-3 PDF417 barkodom** za m-Banking i **EPC SEPA QR kodom**.

---

## 🛡️ Žigo — Digitalni Orlando i Filozofija Sustava

<p align="center">
  <em>„Ni milimetra više državi nego što joj pripada, ni centa manje da ti ne zatvore vrata.”</em>
</p>

Duhovni čuvar i maskota ObrtnIQ sustava zove se **Žigo**.

Žigo u sebi nosi mentalni sklop Dubrovačke Republike: diplomaciju koja rješava krizu bez ispaljenog metka, mudrost Senata zapakiranu u dvije rečenice i stoički kameni stav **dubrovačkog viteza Orlanda**.

On stoji uspravno usred modernog birokratskog kaosa točno onako kako Orlando stoljećima stoji na trgu Luža — dok oko njega prolaze nevere, osvajači, porezne reforme i novi zakoni objavljeni u petak u pet popodne. Njegov lakat nije samo povijesna mjera za tkaninu, nego **univerzalno mjerilo poštenja**:
* **Kad račun kasni s naplatom 90 dana**: Žigo servira diplomatsku opomenu pred ovrhu, sročenu tako fino da djeluje kao čestitka, a sjeda na račun u roku od pet dana.
* **Kad Porezna izbaci novi pravilnik ili padne server u Zagrebu**: Žigo mirno pečati račune lokalnim ZKI kodom i bilježi milisekunde, jer *„Pao je i Napoleon, a Grad eno još stoji đe je i bio”*.
* **Kad se približite pragu od 40.000 €**: Žigo spušta vizir i pravovremeno vas upozorava da sačuvate glavu i status paušalca prije nego vas zahvati oluja PDV-a.
* **Žigin „Rez”**: Kada se u radu pojavi preopterećenje, jednim klikom uklanja sav šum s ekrana i ostavlja samo tri jasne točke: *Što gori*, *Što čeka* i *Jedna akcija sad*.

---

## ⚡ Ključne Značajke

### 1. Brzina i Tipkovnički Workflow (`Alt+N` / `F2`)
* **Split-screen radna ploha**: 58% prostora namijenjeno je ultra-brzom unosu podataka, a 42% prikazuje živi A4 račun u stvarnom vremenu.
* **Tipkovnički prečaci**:
  * <kbd>Alt+N</kbd> — Trenutačno dodavanje nove stavke računa bez dodirivanja miša.
  * <kbd>F2</kbd> — Trenutačno izdavanje i zaključavanje računa (`IZDANO`).
* **Immutability & Storno**: Jednom izdani račun je trajno zaštićen od nehotičnih izmjena; storniranje se obavlja prema strogim računovodstvenim pravilima uz kreiranje korektivnog dokumenta.

### 2. Fiskalizacija 1.0 (CIS) i Fiskalizacija 2.0 (e-Račun)
* **ZKI & JIR Algoritam**: Klijentski izračun Zaštitnog koda izdavatelja (ZKI) prema specifikaciji Porezne uprave (MD5 digest, RSA potpis privatnim ključem, heksadecimalni ZKI).
* **Fiskalizacija 1.0**: Generiranje SOAP XML poruka za CIS poslužitelj, validacija certifikata i automatski offline red čekanja (`Offline Queue`) u slučaju prekida interneta.
* **Fiskalizacija 2.0 (UBL 2.1 e-Račun)**: Potpuno klijentsko generiranje `Invoice` XML-a sukladno CIUS-HR profilu i EN 16931 europskoj normi.
* **FINA Trezor**: Lokalni zaštićeni repozitorij za digitalne certifikate (`.p12` / `.pfx`) s provjerom valjanosti.

### 3. Vektorski A4 PDF, HUB-3 PDF417 i EPC QR
* **ISO 32000-1 Klijentski PDF Generator**: Generira čiste, vektorske A4 PDF račune u manje od 100 ms bez slanja podataka vanjskom PDF servisu.
* **HUB-3 PDF417 2D Barkod**: Generiran u skladu sa strogim standardom Hrvatske udruge banaka (HUB), točno 14 redaka, razina ispravljanja pogrešaka 4 (ECC 4) za instantno plaćanje u svim hrvatskim m-Banking aplikacijama.
* **EPC SEPA QR kod**: Standardizirani europski platni kod (EPC069-12 v002) za prekogranična i domaća plaćanja.
* **Fiskalni QR kod**: U skladu s Pravilnikom Porezne uprave RH za provjeru računa putem skenera.

### 4. KPR & PO-SD Knjigovodstvo i KPR CSV Izvoz
* **Knjiga Prometa (KPR)**: Automatsko evidentiranje svih gotovinskih i bezgotovinskih uplata razvrstanih po kvartalima (Q1, Q2, Q3, Q4).
* **Dinamički Prag (40.000 €)**: Vizualni widget u zaglavlju aplikacije koji u realnom vremenu prikazuje postotak iskorištenosti zakonskog limita za paušalne obrte.
* **PO-SD ePorezna XML**: Izvoz službenog XML obrasca spremnog za direktno učitavanje na portal ePorezna na kraju porezne godine.
* **KPR CSV / Excel Izvoz**:
  * Počinje s **UTF-8 BOM (`\uFEFF`)** markerom kako bi Microsoft Excel na Windowsima u hrvatskim regionalnim postavkama automatski prikazao dijakritike (`Č, Ć, Ž, Š, Đ`).
  * Točka-zarez (`;`) kao separator i hrvatski decimalni zarez (`,`) za novčane iznose.

### 5. Katalog Artikala & KPD 2025
* **Katalog Usluga i Proizvoda**: Predlošci artikala s nazivom, šifrom, poreznom stopom, cijenom i mjernom jedinicom (`sat`, `kom`, `paušal`, `dan`, `mjesec`, `projekt`, `kartica`, `km`).
* **Službeni KPD 2025**: Integrirani birač službenih šifara hrvatske *Klasifikacije proizvoda po djelatnostima* koje su zakonski obvezne za e-Račun.
* **Dvosmjerna integracija**: *"Odaberi iz cjenika"* na računu i *"Spremi u cjenik"* izravno iz stavke računa.

### 6. Kripto-Trezor i Google Identity Sidro
* **Zero-Knowledge Kripto Paket (`.obrtniq`)**: Izvoz i uvoz cjelokupne baze kriptirane pomoću **AES-256-GCM** algoritma s ključem izvedenim kroz **PBKDF2** (100.000 iteracija, SHA-256).
* **Google Identity Kripto-Sidro**:
  * Koristi trajni 21-znamenkasti korisnički `googleSub` identifikator dobiven putem službenog Google Identity Services (GIS) SDK-a kao determinističko sidro.
  * Korisnik ne mora pamtiti dugu lozinku pri svakoj sinkronizaciji — kripto ključ se izvodi lokalno na klijentu (`OBRTNIQ:GOOGLE_SUB:<id>[:pin]`).
* **Offline Demo Identitet**: Ugrađeni deterministički demo korisnik za lokalni razvoj i demonstraciju bez postavljanja Client ID-a.

### 7. Google Drive AppData Sinkronizacija
* **Izolirana mapa `appDataFolder`**: Sigurnosne kopije pohranjuju se u skriveni prostor aplikacije na korisnikovom privatnom Google Driveu (15 GB besplatnog prostora). Datoteke su nevidljive u redovnom drive.google.com sučelju, čime se sprječava slučajno brisanje.
* **Klijentski REST API v3**: Izravan multipart prijenos bez posrednog poslužitelja.
* **Disaster Recovery**: U slučaju gubitka ili zamjene računala, prijavom na Google račun dohvaća se povijest točaka oporavka i baza se obnavlja jednim klikom.

### 8. Gemini AI Asistent (BYOK) i 100% Offline Heuristika
* **Bring-Your-Own-Key (BYOK)**: Korisnik unosi svoj Google AI Studio API ključ koji se pohranjuje isključivo lokalno.
* **Pametna preporuka KPD 2025 šifri**: Korisnik opiše uslugu prirodnim jezikom (npr. *"izrada responzivnog web shopa u shopifyju i SEO optimizacija"*), a Gemini predlaže točnu šifru (`62.01.11`), službeni naziv, mjernu jedinicu i okvirnu tržišnu cijenu u EUR.
* **100% Offline RH Heuristički Fallback**: Čak i ako korisnik nema uneseni API ključ ili nema interneta, ugrađeni algoritam trenutno analizira ključne riječi hrvatskog jezika (softver, dizajn, logotip, brending, savjetovanje, prijevod, održavanje mreža, marketing) i nudi točnu klasifikaciju.

---

## 🏗️ Arhitektura Sustava (Zero-Server)

ObrtnIQ je strukturiran kao moderan **TypeScript monorepo** s potpunim razdvajanjem čiste domenske logike i prezentacijskog sloja:

```
ObrtnIQ/
├── packages/core/              # Čista domena (Pure TypeScript, Zero DOM dependencies)
│   ├── src/
│   │   ├── domain/             # Kalkulator, OIB MOD 11, IBAN MOD 97, KPR CSV, PO-SD
│   │   ├── fiscal/             # Fiskalizacija 1.0 (ZKI, SOAP), Fiskalizacija 2.0 (UBL 2.1)
│   │   ├── pdf/                # ISO 32000-1 struktura, HUB-3 barkod generator, EPC QR
│   │   └── storage/            # Kripto-trezor (AES-256-GCM, PBKDF2, Google Sub sidro)
│   └── tests/                  # 19 testnih datoteka, 102/102 testova prolazi
│
└── apps/web/                   # Web aplikacija (React 19, Vite 6, Dexie.js, Sharp UI)
    ├── src/
    │   ├── components/         # Sharp UI kontrole, InvoiceDesk, LivePreview, Ladice
    │   ├── hooks/              # useInvoiceWorkflow, useGoogleAuth, useGoogleDriveSync, useGeminiAssistant
    │   ├── services/           # google-auth-service, google-drive-service, gemini-service, logger
    │   └── storage/            # Dexie.js IndexedDB perzistencija
    └── tests/                  # Vitest integracijski testovi (Gemini, PDF, Joint Z01-Z07)
```

### Shema Kripto-Sidra i Prijenosa Podataka:
```
┌────────────────────────────────────────────────────────────────────────┐
│                        KORISNIKOV PREGLEDNIK                           │
│                                                                        │
│   ┌─────────────────────┐               ┌──────────────────────────┐   │
│   │ Dexie.js IndexedDB  │ ────────────► │ Web Crypto API (Subtle)  │   │
│   │ (Obrt, KPR, Računi) │               │ PBKDF2 100k + AES-256    │   │
│   └─────────────────────┘               └─────────────┬────────────┘   │
│              ▲                                        │                │
│              │ Restauracija                           ▼                │
│              │                           ┌──────────────────────────┐   │
│              └────────────────────────── │ Kriptirani .obrtniq paket│   │
│                                          └─────────────┬────────────┘   │
└────────────────────────────────────────────────────────┼───────────────┘
                                                         │
                                  Direktan REST v3 HTTPS │ (Google Token)
                                                         ▼
                                          ┌──────────────────────────────┐
                                          │ Google Drive (appDataFolder) │
                                          │ 15 GB Skrivena Izolirana     │
                                          │ Sigurnosna Pohrana           │
                                          └──────────────────────────────┘
```

---

## 👨‍💻 O Autoru: Matija Miloslavić

<p align="center">
  <strong>Matija Miloslavić</strong> (poznat i kao <strong>Mate Fox</strong> / <strong>Mate Fox Banchila</strong>, ranije <strong>m@tise</strong>)<br />
  <em>Polimatični tehnolog, inženjer, maker, dizajner, zvukopisac i edukator iz Dubrovnika.</em>
</p>

Put Matije Miloslavića odražava rijetku konvergenciju umjetnosti, inženjerstva i poduzetništva na jadranskoj obali:

### 1. Dubrovačka klupska renesansa i digitalni arhivi (`m@tise` & `Clubpages`)
Krajem devedesetih i početkom dvijetisućitih, u postratnom Dubrovniku, Matija je bio jedan od pionira klupske scene pod pseudonimom **DJ m@tise**. Nastupajući u kultnim **Lazaretima**, prostorima karantene pretvorenim u središte urbane emancipacije, donosio je zvukove progressive housea i techna.  
Prepoznavši internet kao moćan alat kulturne dokumentacije prije pojave društvenih mreža, sudjelovao je u stvaranju i vođenju portala **Clubpages** — digitalnog epicentra regionalne elektroničke scene čiji arhivi i danas predstavljaju najvažniji povijesni izvor dubrovačke subkulture. Kroz rad na Clubpagesu, Matija je rano povezao kôd, estetiku i zajednicu.

### 2. Glazbena zrelost: Mate Fox Banchila
Evolucijom zvuka nastaje novi alias — **Mate Fox Banchila**. Njegov stil seli se s klupskih podija u sofisticiranije zvučne sfere (Deep House, Melodic Techno, Organic House). Njegove glazbene kronike i autorski setovi dostupni su globalno na [Mixcloud platformi (banchilo)](https://www.mixcloud.com/banchilo/), gdje se prepoznaje specifičan mediteranski senzibilitet prožet preciznom studijskom produkcijom.

### 3. Digitalni dizajn i Pixel Design
Kao suosnivač dubrovačkog studija **Pixel Design**, Matija je godinama vodio digitalnu transformaciju lokalnih poduzetnika, kulturnih institucija i turističkog sektora, postavljajući visoke standarde u razvoju web sustava, korisničkih sučelja (UI/UX) i digitalnog brendiranja.

### 4. Profesor i edukator (UNIDU)
Logičan nastavak bogate karijere bio je prijenos znanja. U suradnji sa **Sveučilištem u Dubrovniku (UNIDU)**, kroz Odjel za elektrotehniku i računarstvo te Odjel za medije i kulturu društva, Matija sudjeluje u edukaciji novih generacija. Predaje praktične kolegije iz web tehnologija, 3D modeliranja, aditivne proizvodnje i digitalnog dizajna, djelujući kao most između tromog akademskog sustava i dinamičnog svijeta tehnološkog poduzetništva.

---

## 🤖 Obrt Robot Hand Made

<p align="center">
  <strong>ROBOT HAND MADE, obrt za računalno programiranje i proizvodnju</strong><br />
  <em>Vlasnik: Matija Miloslavić | Pod Brašinom 48, 20207 Mlini (Dubrovnik)</em>
</p>

Kruna Miloslavićevog poduzetništva je obrt **Robot Hand Made**. Smješten u Brašini (Župa dubrovačka), obrt je registriran za računalno programiranje (NKD 62.01), ali njegova stvarna aktivnost predstavlja jedinstveni laboratorij u kojem se susreću **digitalni algoritam i fizički objekt**.

U suradnji s **Ivanom Tepšić**, Robot Hand Made istražuje granice aditivne tehnologije (3D printanje), parametarskog dizajna, unikatnog nakita, dekorativnih interijerskih formi i industrijskog prototipiranja:

> **Filozofija imena:** Naziv *"Robot Hand Made"* namjerni je i duboki paradoks. Iako robot (3D printer ili numerički vođen stroj) fizički nanosi slojeve materijala, **ljudski um programera i ruka obrtnika** su ti koji daju dušu, matematiku i formu svakom gotovom proizvodu.

ObrtnIQ je proizašao upravo iz svakodnevnih potreba obrta Robot Hand Made — softver koji je obrtnik stvorio za obrtnike, poštujući njihovo vrijeme, novac i slobodu.

---

## 🚀 Brzi Početak

### Preduvjeti
* **Node.js** (verzija 18.0 ili novija)
* **npm** (verzija 9.0 ili novija)

### 1. Kloniranje repozitorija
```bash
git clone https://github.com/matise/ObrtnIQ.git
cd ObrtnIQ
```

### 2. Instalacija ovisnosti
```bash
npm install
```

### 3. Pokretanje razvojnog poslužitelja
```bash
npm run dev
```
Aplikacija će biti dostupna na lokalnoj adresi: `http://localhost:5173/`

### 4. Izgradnja produkcijskog paketa
```bash
npm run build
```
Generirani optimizirani statički bundle nalazi se u mapi `apps/web/dist/`. Budući da je sustav 100% klijentski, izgrađeni paket možete poslužiti s bilo kojeg statičkog hostinga (Cloudflare Pages, GitHub Pages, Netlify, Vercel ili lokalni USB stick).

---

## ✅ Verifikacija i Testovi

Cjelokupni monorepo pokriven je strogim automatiziranim testovima u okruženju **Vitest**:

```bash
# Pokretanje svih testova na cijelom projektu
npm test
```

### Sažetak verifikacije:
* **@obrtniq/core**: 19 testnih datoteka, **102 testa** prolaze (OIB, IBAN, kalkulator, ZKI, JIR, CIS SOAP, UBL 2.1 e-Račun, HUB-3 barkod, EPC QR, KPR CSV, PO-SD XML, PBKDF2/AES-256 kripto-sidro).
* **@obrtniq/web**: 3 testne datoteke, **18 testova** prolaze (Gemini AI heuristika, Google Demo sesija, PDF validator, E2E testna matrica Z-01 do Z-07).
* **Ukupno**: **120 / 120 testova prolazi sa 100% uspješnošću**.

---

## 📜 Atribucija i Licenca

* **Autor & Arhitekt**: Matija Miloslavić (Mate Fox)
* **Matični Obrt**: ROBOT HAND MADE, vl. Matija Miloslavić, Mlini / Dubrovnik
* **Suradnici na dizajnu i viziji**: Ivana Tepšić
* **Kulturna inspiracija**: Dubrovačka Republika, Orlando, Lazareti, Clubpages arhiv
* **Licenca**: Autorsko pravo © 2026 Matija Miloslavić, Robot Hand Made. Otvoreni kôd licenciran pod [MIT Licencom](LICENSE) — slobodno za korištenje, učenje i prilagodbu uz očuvanje autorstva.

---

<p align="center">
  <em>Stvoreno s ponosom u Dubrovniku i Brašini. Čuvajte svoj obrt, radite pošteno i mirno spavajte.</em>
</p>
