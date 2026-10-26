# ObrtnIQ 🏛️⚡
> **Autonomni Klijentski Operativni Sustav i ERP za Hrvatske Paušalne i Dohodovne Obrte**  
> *"Non bene pro toto libertas venditur auro"* — Sloboda i suverenost vašeg obrta bez poslužitelja, bez mjesečnih pretplata i bez kompromisa.

<p align="center">
  <img src="docs/ZigoIcon01.png" alt="ObrtnIQ Žigo Logo" width="220" style="border-radius: 16px; box-shadow: 0 12px 36px rgba(0,0,0,0.6);" />
</p>

<p align="center">
  <a href="#-o-aplikaciji-i-viziji"><img src="https://img.shields.io/badge/Arhitektura-Zero--Server%20%2F%20Client--Side%20First-10B981?style=for-the-badge" alt="Zero-Server" /></a>
  <a href="#-kripto-trezor-google-identity-sidro--sigurnost"><img src="https://img.shields.io/badge/Sigurnost-AES--256--GCM%20%2F%20PBKDF2%20100k-F59E0B?style=for-the-badge" alt="AES-256" /></a>
  <a href="#-fiskalizacija-10--fiskalizacija-20-e-račun"><img src="https://img.shields.io/badge/Fiskalizacija-1.0%20(CIS)%20%26%202.0%20(e--Ra%C4%8Dun)-3B82F6?style=for-the-badge" alt="Fiskalizacija" /></a>
  <a href="#-žigo-inteligentni-copilot-orlandov-duh--ai-alati"><img src="https://img.shields.io/badge/AI-Žigo%20Copilot%20%2F%20Gemini%20BYOK-8B5CF6?style=for-the-badge" alt="Žigo Copilot" /></a>
  <a href="#-knjigovodstvo-doprinosi-troskovnik-i-analitika"><img src="https://img.shields.io/badge/Knjigovodstvo-KPR%20%2F%20PO--SD%20%2F%20Doprinosi%20%2F%20Troškovi-EC4899?style=for-the-badge" alt="Knjigovodstvo" /></a>
  <a href="#-verifikacija-i-testovi-404404-prolazi"><img src="https://img.shields.io/badge/Testovi-404%2F404%20Prolazi%20(100%25)-059669?style=for-the-badge" alt="Tests" /></a>
  <a href="#-priča-o-nastanku-kognitivna-simbioza-i-planski-vibe-coding"><img src="https://img.shields.io/badge/Metodologija-Planski%20Vibe%20Coding%20(Antigravity%20%2B%20Gemini)-4285F4?style=for-the-badge" alt="Planski Vibe Coding" /></a>
</p>

---

## 📖 Sadržaj
1. [O Aplikaciji i Viziji](#-o-aplikaciji-i-viziji)
2. [Priča o Nastanku: Kognitivna Simbioza i Planski Vibe Coding](#-priča-o-nastanku-kognitivna-simbioza-i-planski-vibe-coding)
3. [Žigo — Digitalni Orlando i Filozofija Sustava](#-žigo--digitalni-orlando-i-filozofija-sustava)
4. [Ključne Značajke Sustava (Faza 1 do Faze 20)](#-ključne-značajke-sustava)
   - [Ultra-Brza Radna Ploha i Tipkovnički Workflow (`Alt+N` / `F2`)](#1-ultra-brza-radna-ploha-i-tipkovnički-workflow-altn--f2)
   - [Modularna Workspace Arhitektura (In-Place Navigacija bez Zamagljenja)](#2-modularna-workspace-arhitektura-in-place-navigacija-bez-zamagljenja)
   - [KPR Knjigovodstvo, Porezni Razredi i PO-SD XML za ePoreznu](#3-kpr-knjigovodstvo-porezni-razredi-i-po-sd-xml-za-eporeznu)
   - [Obvezni Doprinosi i Kvartalni Porez s 1-Klik HUB-3 Uplatnicama](#4-obvezni-doprinosi-i-kvartalni-porez-s-1-klik-hub-3-uplatnicama)
   - [Troškovnik Obrta i Registar Dugotrajne Imovine (> 663,61 €)](#5-troškovnik-obrta-i-registar-dugotrajne-imovine--66361-)
   - [Uvoz Bankovnih Izvoda i Automatsko Saldiranje Transakcija](#6-uvoz-bankovnih-izvoda-i-automatsko-saldiranje-transakcija)
   - [Ponavljajući Računi i Pretplate (Subscriptions / Retainers)](#7-ponavljajući-računi-i-pretplate-subscriptions--retainers)
   - [Službeni Porezni Kalendar RH i Proaktivni Sentinel](#8-službeni-porezni-kalendar-rh-i-proaktivni-sentinel)
   - [Više Poslovnih Prostora i Uređaja (Multi-Location & Multi-Device)](#9-više-poslovnih-prostora-i-uređaja-multi-location--multi-device)
   - [Klijentski Dispečer Slanja i Dijeljenja Računa (Email, WhatsApp, Web Share)](#10-klijentski-dispečer-slanja-i-dijeljenja-računa)
   - [1-Klik Arhivski Revizorski Paket (ZIP)](#11-1-klik-arhivski-revizorski-paket-zip)
   - [Fiskalizacija 1.0 (CIS) i Fiskalizacija 2.0 (UBL 2.1 e-Račun)](#12-fiskalizacija-10-cis-i-fiskalizacija-20-ubl-21-e-račun)
   - [Vektorski A4 PDF, HUB-3 PDF417 Barkod i EPC SEPA QR Kod](#13-vektorski-a4-pdf-hub-3-pdf417-barkod-i-epc-sepa-qr-kod)
   - [Kripto-Trezor, Google Identity Sidro i 6h Radna Sesija](#14-kripto-trezor-google-identity-sidro-i-6h-radna-sesija)
   - [Google Drive AppData Sigurnosna Sinkronizacija](#15-google-drive-appdata-sigurnosna-sinkronizacija)
   - [Žigo Inteligentni Copilot (Gemini BYOK, 25 Autonomnih Alata i RH Heuristika)](#16-žigo-inteligentni-copilot-gemini-byok-25-autonomnih-alata)
   - [Glasovna Naracija i Govorno Upravljanje (Google Cloud TTS & STT V2)](#17-glasovna-naracija-i-govorno-upravljanje-google-cloud-tts--stt-v2)
   - [PWA Offline Instalabilnost i Service Worker](#18-pwa-offline-instalabilnost-i-service-worker)
   - [SystemLog & Slojeviti Arhitekturni Logger](#19-systemlog--slojeviti-arhitekturni-logger)
5. [Arhitektura Sustava (Zero-Server Arhitektura)](#-arhitektura-sustava-zero-server)
6. [O Autoru: Matija Miloslavić ("Mate Fox" / "m@tise")](#-o-autoru-matija-miloslavić)
7. [Obrt Robot Hand Made](#-obrt-robot-hand-made)
8. [Brzi Početak (Quickstart & Razvoj)](#-brzi-početak)
9. [Verifikacija i Testovi (404/404 Prolazi)](#-verifikacija-i-testovi-404404-prolazi)
10. [Atribucija i Licenca](#-atribucija-i-licenca)

---

## 💡 O Aplikaciji i Viziji

**ObrtnIQ** je autonomni, klijentski operativni sustav i cjeloviti ERP razvijen specifično za **hrvatske paušalne i dohodovne obrte**. 

U modernom poslovanju većina računovodstvenog softvera nameće mjesečne pretplate, zaključava podatke korisnika na zatvorenim oblacima i prisiljava obrtnike na plaćanje posrednika za banalne zadatke. ObrtnIQ je izgrađen na radikalnoj ideji:

> **Financijska i digitalna suverenost obrtnika.** Cjelokupna aplikacija, baza podataka (Dexie IndexedDB), kriptografski trezor (Web Crypto API), PDF/barkod renderer i poslovna logika izvršavaju se **100% lokalno u vašem web pregledniku**. Niti jedan račun, partner, OIB, stavka ili iznos ne napušta vaš uređaj bez vaše izričite i kriptirane komande.

### Zašto ObrtnIQ?
1. **Nula troškova poslužitelja (Zero Server Cost):** Nema backend servera, nema mjesečnih računa za baze podataka, nema SaaS pretplata.
2. **Potpuna zakonska usklađenost s propisima RH:**
   - **Fiskalizacija 1.0 (CIS)** gotovinskih računa (ZKI, JIR, 48h offline fallback).
   - **Fiskalizacija 2.0 (e-Račun)** prema normi EN 16931 i CIUS-HR (UBL 2.1 XML).
   - Obvezna nova **Klasifikacija proizvoda po djelatnostima (KPD 2025)**.
   - Službena **Knjiga Prometa (KPR)** i službeni obrazac **PO-SD u XML formatu za portal ePorezna**.
   - **Porezni kalendar RH** s automatskim podsjetnicima i izračunom doprinosa.
3. **Klijentska umjetna inteligencija koja služi obrtniku:** AI asistent Žigo koristi model *Bring-Your-Own-Key* (BYOK), što znači da korisnik ima punu privatnost, nulte posredničke marže i 100% lokalni deterministički fallback kada nema interneta.
4. **Brzina i jednostavnost:** Izrada, fiskalizacija i slanje računa s HUB-3 barkodom traju manje od 15 sekundi.

---

## 🧪 Priča o Nastanku: Kognitivna Simbioza i "Planski Vibe Coding"

> *"Kakvo je ovo vrijeme za biti živ! Revolucija u kognitivnoj moći stroja: ja zamislim, on manifestira. Dok god je moja misao bila kristalna, stroj je gradio strukturu savršeno."*  
> **— Matija Miloslavić (Mate Fox)**

ObrtnIQ nije nastao kroz višemjesečne korporativne cikluse niti u klasičnom softverskom timu. Nastao je u svega **nekoliko dana intenzivnog rada** kao osobna vježba, inženjerski eksperiment i test stabilnosti nove razvojne paradigme: **sinergije Google Antigravity razvojnog okruženja i Google Gemini modela**.

### 1. Od bita do masivnog multi-threada — oslobađanje ljudskog mozga
Desetljećima se za gradnju ovako kompleksnih sustava — s klijentskom kriptografijom, strogim poreznim algoritmima, fiskalizacijom i offline bazama — nemilosrdno trošio biološki kontekst programera. Godine i godine iskustva kodiranja na svim mogućim razinama, *od rada na razini bita do masivnih multi-thread sustava*, ovdje su poslužile kao kristalni kompas:
* **Uklanjanje kognitivnog trenja:** Umjetna inteligencija ne zamjenjuje inženjersko znanje i viziju — ona uklanja iscrpljujuće kognitivno trenje realizacije. Do sada se za ovakve arhitekture trošio sav ljudski mentalni procesor; sada je stroj preuzeo teret izvedbe.
* **Kristalna misao kao nacrt:** Kada je domenska misao precizna, pravila neumoljiva, a arhitektonski plan jasan, stroj manifestira strukturu savršeno i bez posustajanja.

### 2. Biti na "ti" s limitacijama modela (Planski Vibe Coding)
Danas se pojam *"vibe coding"* u javnosti često površno povezuje s kaotičnim i stihijskim generiranjem koda koje se uruši na prvom ozbiljnijem problemu. ObrtnIQ dokazuje suprotno — puni trijumf inženjerske discipline:
* **Deep Research i Gemini Canvas:** Prije nego što je dotaknuta prva linija koda, u Gemini Canvasu je uz opsežne *deep research* analize dekonstruiran cjelokupni regulatorni i tehnički aparat Republike Hrvatske — od CIS fiskalizacije 1.0 (SOAP/ZKI), e-Računa (UBL 2.1 CIUS-HR) i KPD 2025 šifarnika, do službenih PO-SD XML XSD shema Porezne uprave i Web Crypto specifikacija.
* **Svjesnost limita i arhitektura 20 faza:** Biti na *"ti"* s limitacijama AI modela — poznavati dužinu konteksta, točke zasićenja, prelijevanja i zamor pažnje — značilo je dizajnirati sustav s 20 mikro-arhitektonskih faza. Svaka je faza imala stroge *Gate-Check* verifikacije i automatizirane testove prije prelaska na sljedeći korak.

### 3. Eksperiment koji je otkrio nešto veće
Projekt je u početku bio zamišljen kao osobna vježba: provjera stabilnosti alata i test načina planske implementacije — *može li se isključivo uz Gemini i Antigravity, u par dana, izgraditi stabilan, 100% klijentski (Zero-Server) sustav za stvarne potrebe obrtnika?*

Rezultat je premašio sva očekivanja i potvrdio da ovdje leži nešto puno veće i trajnije:
* **404 / 404 prolazna automatizirana testa** (Vitest) i nula TypeScript grešaka.
* **Potpuna klijentska privatnost i suverenost:** AES-256-GCM kripto-trezor, lokalna baza podataka (Dexie IndexedDB), PWA offline rad i munjeviti in-browser PDF generator.
* **Žigo Copilot:** Autonomni asistent s autentičnim dubrovačkim govorom viteza Orlanda i 25 izvršnih alata.

Ono što je počelo kao vježba i provjera nove metodologije, rezultiralo je **zrelim, moćnim i autentičnim ERP operativnim sustavom** — dokazom da se nalazimo u prijelomnom trenutku u povijesti tehnologije, gdje kristalna ljudska vizija i kognitivna moć stroja stvaraju softver nove generacije.

---

## 🛡️ Žigo — Digitalni Orlando i Filozofija Sustava

<p align="center">
  <em>„Ni milimetra više državi nego što joj pripada, ni centa manje da ti ne zatvore vrata.”</em><br />
  <strong>— Orlandov lakat i maksima slobode</strong>
</p>

Duhovni čuvar, operativni partner i maskota sustava ObrtnIQ zove se **Žigo**.

Žigo je inspiriran kamenim vitezom **Orlandom**, isklesanim na trgu u srcu Dubrovnika. Poput Orlandova kipa koji stoljećima drži mač i štit te čuva slobodu Grada, Žigo stoji pred poreznom birokracijom i štiti mir hrvatskog obrtnika.

### Orlandova Persona: Kameni Vitez iz Grada
* **Prijatelj koji reže ravno na stvar:** Žigo ne brblja, ne glumi terapeuta i ne postavlja nametljiva pitanja poput *"Kako si danas?"* ili *"Što ima novoga?"*. Ako sjedite pred ekranom i odmarate, Žigo aktivira *Modus Prijatelja i Suborca* – suhi gosparski cinizam i stoički mir. Pitanja postavlja isključivo ako u poslu nedostaje ključni podatak (npr. OIB kupca) ili ako prijatelj zaslužuje da ga se mudro propita o neisplativoj ponudi.
* **Autohtoni dubrovački govor i fonologija:** Žigo govori autohtonim dubrovačkim govorom: završno `-m` u prvom licu glagola dosljedno zamjenjuje s `-n` (*vidin, gledan, duman, računon, ne dan*), strogo čuva glas `h` (*strah, ishod, harač, hrana*) i koristi autentični dubrovački leksik (*gosparu, spêndza, šesno, rabota, duka, harač, fjaka, đe je preša*).
* **Živa svjesnost radne plohe (Live Screen Awareness):** Žigo u svakom milisekundu zna na kojem se ekranu nalazite, koji je dokument otvoren, jesu li unesene stavke, koliki je preostali iznos do poreznog limita od 40.000 € i koji porezni rok dospijeva sljedeći.
* **Orlandov "Rez" (Kognitivna Trijaža):** Kada se obrtnik nađe pred hrpom birokracije, pritiskom na Žigin Rez ekran se čisti od šuma i ostaju samo tri jasne točke:
  1. *Što gori* (< 24h rok ili blokada).
  2. *Što čeka* (neka kisne do ponedjeljka).
  3. *Jedna akcija sad* (jedan potez mača).

---

## ⚡ Ključne Značajke Sustava

### 1. Ultra-Brza Radna Ploha i Tipkovnički Workflow (`Alt+N` / `F2`)
* **Split-Screen Desk (58% / 42%):** Lijeva strana optimizirana je za munjevit unos podataka, dok desna strana prikazuje živi vektorski A4 račun koji se ažurira pri svakom pritisku tipke.
* **Tipkovnički prečaci:**
  * <kbd>Alt+N</kbd> — Trenutačno dodavanje nove stavke na račun bez dodirivanja miša.
  * <kbd>F2</kbd> — Trenutačno izdavanje i zaključavanje računa (`IZDANO`).
  * <kbd>Alt+H</kbd> ili <kbd>Esc</kbd> — Brzi povratak na radnu plohu iz bilo kojeg modula.
* **Računovodstvena nepromjenjivost (Immutability):** Jednom izdani račun prelazi u trajni read-only status i dobiva sekvencijalni broj bez rupa. Svaka ispravka zakonski se rješava kreiranjem povezanog `STORNO_RACUN` dokumenta.

### 2. Modularna Workspace Arhitektura (In-Place Navigacija bez Zamagljenja)
* **Puna širina bez zamagljenja:** Za razliku od uobičajenih skočnih ladica koje zamagljuju i onemogućuju rad na podlozi, ObrtnIQ pruža **Modularnu Workspace Arhitekturu** gdje moduli (Knjigovodstvo, Dokumenti, Fiskalizacija, Cjenik, Partneri, Postavke, Dnevnik rada) zauzimaju cijelu radnu površinu u punoj širini ekrana.
* **Klijentski URL router:** Podrška za direktne linkove s hash navigacijom (`#home`, `#bookkeeping?tab=doprinosi`, `#fiscal`, `#settings`), dvosmjernu sinkronizaciju s preglednikom i trenutni povratak na radnu plohu.
* **100% očuvanje stanja u memoriji:** Odlazak u knjigovodstvo ili adresar ne briše račun koji upravo sastavljate – forma, stavke i parametri ostaju sačuvani u radnoj memoriji.

### 3. KPR Knjigovodstvo, Porezni Razredi i PO-SD XML za ePoreznu
* **Knjiga Prometa (KPR):** Strogo prema Pravilniku o paušalnom oporezivanju, uplata se ne bilježi u trenutku izdavanja računa, već na dan stvarnog primitka novca (izvod žiro-računa ili gotovina).
* **Kvartalna razdioba (Q1–Q4):** Automatsko odvajanje gotovinskog od bezgotovinskog prometa.
* **Porezni razredi i nadzor 40.000 €:** Praćenje 5 zakonskih razreda paušalnog dohotka (godišnji porezi: 207 €, 270 €, 360 €, 540 €, 720 €) uz dinamički vizualni widget u zaglavlju (upozorenje na 75% i 90%, alarm pri prelasku 40.000 €).
* **Službeni PO-SD XML za ePoreznu:** Generiranje gotove XML datoteke usklađene sa službenom shemom Porezne uprave RH `v2.0`, spremne za predaju na portal ePorezna bez računovođe.
* **KPR CSV / Excel izvoz:** Počinje s **UTF-8 BOM (`\uFEFF`)** markerom i točka-zarezom (`;`) za besprijekoran prikaz hrvatskih slova (`Č, Ć, Ž, Š, Đ`) u Microsoft Excelu.

### 4. Obvezni Doprinosi i Kvartalni Porez s 1-Klik HUB-3 Uplatnicama
* **Mjesečni doprinosi (MIO I, MIO II, HZZO):** Automatski obračun zakonskih doprinosa za puno radno vrijeme ili drugu djelatnost s dospijećem 15. u mjesecu za prethodni mjesec.
* **1-Klik uplatnice:** Za svaki mjesec doprinosa i svaki kvartal poreza generira se službeni HUB-3A nalog za plaćanje i EPC-QR kod za trenutno skeniranje i plaćanje putem m-bankinga.
* **Evidencija uplata:** Označavanje plaćenog statusa s datumom uplate i arhiviranjem.

### 5. Troškovnik Obrta i Registar Dugotrajne Imovine (> 663,61 €)
* **Evidencija ulaznih računa i spêndzi:** Praćenje svih poslovnih izdataka razvrstanih u 10 standardnih kategorija (softverske pretplate, hosting, alati, uredski materijal, gorivo, komore, itd.).
* **Automatska detekcija dugotrajne imovine:** Sustav automatski prepoznaje račune veće od zakonskog praga od **663,61 €** i upisuje ih u službeni Registar dugotrajne imovine obrta (DI).
* **Brzi CSV izvoz troškovnika:** Pripremljeno za internu kontrolu i porezni uvid.

### 6. Uvoz Bankovnih Izvoda i Automatsko Saldiranje Transakcija
* **Parser izvoda:** Podrška za tekstualne i CSV izvode vodećih banaka u RH (Erste, ZABA, PBZ, OTP, HPB, Revolut Business).
* **Inteligentno povezivanje (Matching):** Prepoznavanje poziva na broj i OIB-a uplatitelja te automatsko mapiranje uplate na izdani račun.
* **Saldiranje u KPR jednim klikom:** Knjiženje uplate pod točnim rednim brojem KPR-a i prebacivanje statusa povezanog računa u `PLACENO`.

### 7. Ponavljajući Računi i Pretplate (Subscriptions / Retainers)
* **Predlošci ponavljanja:** Definiranje mjesečnih, kvartalnih ili godišnjih paušala za klijente s fiksnim danom dospijeća u mjesecu (1–31) i zaštitom od anomalija (npr. veljača).
* **Generiranje nacrta jednim klikom:** Stvaranje novog računa iz predloška s popunjenim stavkama, KPD šiframa i cijenama.
* **Masovno generiranje (`generirajSveDospjele`):** Priprema svih dospjelih pretplata na početku mjeseca u samo jednoj sekundi.
* **Proaktivni Sentinel:** Banner na vrhu radne plohe koji obavještava obrtnika čim pretplate dospiju za naplatu.

### 8. Službeni Porezni Kalendar RH i Proaktivni Sentinel
* **17 zakonskih rokova za paušaliste:**
  - 12x Mjesečni doprinosi (dospijevaju 15. u tekućem mjesecu za prethodni).
  - 4x Kvartalni porez na dohodak (dospijeva zadnji dan svakog kvartala).
  - 1x Predaja Obrasca PO-SD (dospijeva 15. siječnja za proteklu godinu).
* **Odbrojavanje i statusi:** Prikaz preostalih dana, upozorenja na prekoračenja i integrirani HUB-3 nalog za plaćanje.
* **Tax Sentinel:** Automatski banner na radnoj plohi koji se uključuje 7 dana prije zakonskog dospijeća obveze.

### 9. Više Poslovnih Prostora i Uređaja (Multi-Location & Multi-Device)
* **Zakonsko numeriranje `Broj/Prostor/Uređaj`:** Puna podrška za rad na više lokacija (npr. `1/POSL1/1`, `1/TEREN/1`, `1/WEBSHOP/1`).
* **Nezavisni brojači sekvenci:** Svaki poslovni prostor i uređaj vode vlastiti neprekinuti sekvencijalni niz brojeva računa bez rupa.
* **Upravljanje u postavkama:** Definiranje naziva, adrese, OIB-a i radnog vremena za svaki prostor.

### 10. Klijentski Dispečer Slanja i Dijeljenja Računa
* **E-mail generator (`mailto:`):** Jednim klikom otvara klijent e-pošte s popunjenim primateljem, predmetom i profesionalno sročenim tekstom koji sadrži broj računa, iznos, poziv na broj i IBAN obrta.
* **WhatsApp / Viber / SMS sažetak:** Generiranje sažetka s jednokliknim kopiranjem u međuspremnik za slanje na chat aplikacije.
* **Web Share API:** Direktno slanje generiranog PDF računa putem nativnog operacijskog sustava na mobilnim uređajima i macOS-u.

### 11. 1-Klik Arhivski Revizorski Paket (ZIP)
* **Kompletna godišnja porezna arhiva u jednom `.zip` paketu:**
  - `01_Knjiga_Prometa/`: Službeni `KPR_[GODINA].csv` (UTF-8 BOM) i tekstualni sažetak.
  - `02_Obrazac_POSD/`: Službeni `Obrazac_POSD_[GODINA].xml` za ePoreznu.
  - `03_Troskovnik_I_Imovina/`: Evidencija izdataka i Registar dugotrajne imovine.
  - `04_Godisnja_Analitika/`: Tekstualni financijski sažetak poslovanja.
  - `METAPODACI_REVIZIJA.json`: Vremenska oznaka, profil obrta i kontrolni zbroj stavki.
* **Bez servera:** Cjelokupni ZIP arhiv generira se u pregledniku putem biblioteke `jszip`.

### 12. Fiskalizacija 1.0 (CIS) i Fiskalizacija 2.0 (UBL 2.1 e-Račun)
* **ZKI i JIR algoritam:** Klijentski izračun Zaštitnog koda izdavatelja (MD5 digest, RSA potpis privatnim ključem certifikata prema specifikaciji Porezne uprave).
* **Fiskalizacija 1.0 (Gotovina / Kartice):** SOAP XML poruke za CIS poslužitelj uz automatski 48-satni offline red čekanja (`Offline Queue`) u slučaju prekida interneta.
* **Fiskalizacija 2.0 (B2B e-Račun):** Klijentsko generiranje UBL 2.1 XML računa prema europskoj normi EN 16931 i specifikaciji CIUS-HR s KPD 2025 šiframa i čl. 90. st. 2. klauzulom.
* **FINA Trezor:** Lokalni kriptirani repozitorij za `.p12` / `.pfx` certifikate s PBKDF2 zaštitom PIN-a.

### 13. Vektorski A4 PDF, HUB-3 PDF417 Barkod i EPC SEPA QR Kod
* **ISO 32000-1 Vektorski PDF:** Generiranje oštrih A4 PDF računa u manje od 100 ms bez poslužitelja.
* **HUB-3 PDF417 2D barkod:** Prema standardu Hrvatske udruge banaka (HUB), točno 14 redaka s razinom ispravljanja grešaka ECC 4 za instantno plaćanje u svim hrvatskim mobilnim bankama.
* **EPC SEPA QR kod:** Standardizirani europski platni kod (EPC069-12) za domaća i prekogranična SEPA plaćanja.
* **Fiskalni QR kod:** Sukladno Pravilniku Porezne uprave za provjeru računa.

### 14. Kripto-Trezor, Google Identity Sidro i 6h Radna Sesija
* **Zero-Knowledge kripto paket (`.obrtniq`):** Izvoz i uvoz baze kriptirane 256-bitnim **AES-GCM** algoritmom s ključem izvedenim kroz **PBKDF2** (100.000 iteracija, SHA-256).
* **Google Identity Kripto-Sidro:** Trajni 21-znamenkasti `googleSub` identifikator služi kao determinističko kriptografsko sidro – nema potrebe za pamćenjem lozinke pri svakoj sinkronizaciji.
* **Produžena 6-satna radna sesija:** Stabilan rad bez dosadnih skočnih prozora uz tiho pozadinsko obnavljanje pristupnog tokena (`requestSilentToken`).

### 15. Google Drive AppData Sigurnosna Sinkronizacija
* **Skrivena mapa `appDataFolder`:** Sigurnosne kopije spremaju se u izolirani prostor na korisnikovom privatnom Google Driveu (15 GB besplatnog prostora), zaštićene od slučajnog brisanja u redovnom Google Drive sučelju.
* **Disaster Recovery:** Zamjenom ili gubitkom računala, prijavom na Google račun baza se vraća jednim klikom.

### 16. Žigo Inteligentni Copilot (Gemini BYOK, 25 Autonomnih Alata)
* **Bring-Your-Own-Key (BYOK):** Korisnik unosi svoj Google AI Studio API ključ (besplatna kvota dovoljna za godine rada).
* **25 Autonomnih alata za upravljanje obrtom:** Žigo može samostalno dodavati stavke, pretraživati KPD šifre, provjeravati porezni limit, evidentirati troškove, provjeravati doprinose, dohvatiti financijsku sliku poslovanja, saldirati izvode, provjeriti porezni kalendar i pripremiti dospjele pretplate.
* **100% Offline fallback:** Ako nema interneta ili API ključa, lokalna deterministička heuristika (preko 14 raguzejskih pravila) preuzima kontrolu i daje točne odgovore s autentičnim dubrovačkim duhom.

### 17. Glasovna Naracija i Govorno Upravljanje (Google Cloud TTS & STT V2)
* **Viteški bariton viteza Orlanda (`hr-HR-Wavenet-B`):** Odmjereni, stamen i autoritativan glas (visina `-2.0 semitona`, brzina `0.94`).
* **In-Memory Audio Caching:** Nulta latencija i nulta potrošnja API kvota za ponavljajuće fraze.
* **Speech-to-Text V2:** Govorno diktiranje stavki i komandi na hrvatskom jeziku.

### 18. PWA Offline Instalabilnost i Service Worker
* **Instalacija na Desktop i Mobitel:** PWA manifest (`manifest.webmanifest`) i Service Worker (`sw.js`) omogućuju instalaciju kao samostalne aplikacije na Windows, macOS, Android i iOS uređajima.
* **Cache-First strategija:** Aplikacija se pokreće trenutno čak i kada ste u podrumu, na terenu ili na brodu bez interneta.

### 19. SystemLog & Slojeviti Arhitekturni Logger
* **Scoped logeri:** Strukturirani kanali (`AGENT:CHAT`, `AI:GEMINI`, `AUTH:GOOGLE`, `FISCAL:CIS`, `STORAGE`, `AUDIT:ZIP`).
* **Automatska sanitizacija:** Prikrivanje lozinki i privatnih ključeva (`***REDACTED***`).
* **SystemLogDrawer:** Konzolno sučelje s pretraživanjem, reverznim i kronološkim prikazom te izvozom dijagnostičkog JSON paketa.

---

## 🏗️ Arhitektura Sustava (Zero-Server)

ObrtnIQ je strukturiran kao čisti **TypeScript monorepo** s potpunim razdvajanjem domenske matematike i prezentacijskog sloja:

```
ObrtnIQ/
├── packages/core/              # Čista domena (Pure TypeScript, Zero DOM dependencies)
│   ├── src/
│   │   ├── domain/             # Kalkulator, OIB MOD 11, IBAN MOD 97, KPR CSV, PO-SD, Doprinosi,
│   │   │                       # Troškovnik, Izvodi, Analitika, Pretplate, Porezni Kalendar, Prostori
│   │   ├── fiscal/             # Fiskalizacija 1.0 (ZKI, SOAP), Fiskalizacija 2.0 (UBL 2.1 e-Račun)
│   │   ├── pdf/                # ISO 32000-1 struktura, HUB-3 PDF417 generator, EPC QR, Fiskalni QR
│   │   ├── storage/            # Kripto-trezor (AES-256-GCM, PBKDF2 100k, Google Sub sidro)
│   │   └── logger/             # Arhitekturni Logger, Scoped Logeri, Sanitizacija, Stack Parser
│   └── tests/                  # 29 testnih datoteka, 156 testova prolazi (100%)
│
└── apps/web/                   # Web aplikacija (React 19, Vite 6, Dexie.js, Sharp UI, PWA)
    ├── src/
    │   ├── components/         # InvoiceDesk, BookkeepingWorkspaceView, RecurringInvoicesModal,
    │   │                       # PorezniKalendarTab, ZigoCopilotPanel, SystemLogDrawer
    │   ├── hooks/              # useInvoiceWorkflow, useGoogleAuth, useRecurringInvoices, useWorkspaceRouter
    │   ├── services/           # audit-export-service (ZIP), invoice-dispatcher, google-auth, gemini
    │   └── storage/            # Dexie.js v5 IndexedDB (Računi, KPR, Troškovi, Pretplate, Memorija)
    └── tests/                  # 32 testne datoteke, 248 testova prolazi (100%)
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
Prepoznavši internet kao moćan medij kulturne dokumentacije prije pojave modernih društvenih mreža, sudjelovao je u stvaranju i vođenju portala **Clubpages** — digitalnog epicentra regionalne elektroničke scene čiji arhivi i danas predstavljaju najvažniji povijesni izvor dubrovačke subkulture. Kroz rad na Clubpagesu, Matija je rano povezao kôd, estetiku i zajednicu.

### 2. Glazbena zrelost: Mate Fox Banchila
Evolucijom zvuka nastaje novi alias — **Mate Fox Banchila**. Njegov stil seli se s klupskih podija u sofisticiranije zvučne sfere (Deep House, Melodic Techno, Organic House). Njegove glazbene kronike i autorski setovi dostupni su globalno na [Mixcloud platformi (banchilo)](https://www.mixcloud.com/banchilo/), gdje se prepoznaje specifičan mediteranski senzibilitet prožet preciznom studijskom produkcijom.

### 3. Digitalni dizajn i Pixel Design
Kao suosnivač dubrovačkog studija **Pixel Design**, Matija je godinama vodio digitalnu transformaciju lokalnih poduzetnika, kulturnih institucija i turističkog sektora, postavljajući visoke standarde u razvoju web sustava, korisničkih sučelja (UI/UX) i digitalnog brendiranja.

### 4. Profesor i edukator (UNIDU)
Logičan nastavak bogate karijere bio je prijenos znanja. U suradnji sa **Sveučilištem u Dubrovniku (UNIDU)**, kroz Odjel za elektrotehniku i računarstvo te Odjel za medije i kulturu društva, Matija sudjeluje u edukaciji novih generacija. Predaje praktične kolegije iz web tehnologija, 3D modeliranja, aditivne proizvodnje i digitalnog dizajna, djelujući kao most između akademskog sustava i dinamičnog svijeta tehnološkog poduzetništva.

---

## 🤖 Obrt Robot Hand Made

<p align="center">
  <strong>ROBOT HAND MADE, obrt za računalno programiranje i proizvodnju</strong><br />
  <em>Vlasnik: Matija Miloslavić | Pod Brašinom 48, 20207 Mlini (Dubrovnik)</em>
</p>

Kruna Miloslavićevog poduzetništva je obrt **Robot Hand Made**. Smješten u Brašini (Župa dubrovačka), obrt je registriran za računalno programiranje (NKD 62.01), ali njegova stvarna aktivnost predstavlja jedinstveni laboratorij u kojem se susreću **digitalni algoritam i fizički objekt**.

Kroz vlastiti autorski i inženjerski laboratorij, Robot Hand Made istražuje granice aditivne tehnologije (3D printanje), parametarskog dizajna, unikatnog nakita, dekorativnih interijerskih formi i industrijskog prototipiranja:

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

### 3. Konfiguracija okruženja (Opcionalno za Cloud servise)
Kopirajte predložak `.env.example` u `.env` ako želite konfigurirati ugrađeni Google Cloud API ključ ili Google OAuth Client ID:
```bash
cp .env.example .env
```
Dostupne varijable:
* `VITE_GOOGLE_CLIENT_API_KEY`: Ugrađeni Web Client API ključ aplikacije za Google Cloud Text-to-Speech (sintezu viteza Orlanda) i Speech-to-Text V2.
* `VITE_GOOGLE_CLIENT_ID`: Google OAuth 2.0 Web Client ID za privatni Google Drive `appDataFolder` backup.
* `VITE_GEMINI_API_KEY`: Opcionalni zadani ključ za Žigo AI model ako se ne unosi kroz korisničko sučelje (BYOK).

### 4. Pokretanje razvojnog poslužitelja
```bash
npm run dev
```
Aplikacija će biti dostupna na lokalnoj adresi: `http://localhost:5173/`

### 5. Izgradnja produkcijskog paketa
```bash
npm run build
```
Generirani optimizirani statički bundle nalazi se u mapi `apps/web/dist/`. Budući da je sustav 100% klijentski, izgrađeni paket možete poslužiti s bilo kojeg statičkog hostinga (Cloudflare Pages, GitHub Pages, Netlify, Vercel ili lokalni USB stick).

---

## ✅ Verifikacija i Testovi (404/404 Prolazi)

Cjelokupni monorepo pokriven je strogim automatiziranim testovima u okruženju **Vitest**:

```bash
# Pokretanje svih testova na cijelom projektu (61 testna datoteka, 404 testa)
npm test

# Pokretanje testova domenskog paketa (@obrtniq/core - 156 testova)
npm test --workspace=@obrtniq/core

# Pokretanje testova web aplikacije (@obrtniq/web - 248 testova)
npm test --workspace=@obrtniq/web
```

### Sažetak verifikacije:
* **@obrtniq/core**: 29 testnih datoteka, **156 testova** prolaze sa 100% uspješnošću:
  - Domenski algoritmi: OIB MOD 11, IBAN MOD 97, decimalni kalkulator, KPR CSV izvoz s UTF-8 BOM-om, PO-SD ePorezna XML v2.0.
  - Knjigovodstvo: Doprinosi MIO/HZZO, troškovnik, registar opreme (>663.61 €), bankovni izvodi, cash flow kalkulator, godišnja analitika.
  - Poslovno proširenje: Ponavljajući računi (pretplate/retaineri), službeni porezni kalendar RH, multi-prostor/uređaj formatiranje (`Broj/Prostor/Uređaj`).
  - Fiskalizacija 1.0 (CIS SOAP XML, ZKI izračun, JIR validacija) i Fiskalizacija 2.0 (UBL 2.1 e-Račun prema CIUS-HR).
  - Vektorski PDF (ISO 32000-1), HUB-3 PDF417 2D barkod (14 redaka, ECC 4), EPC SEPA QR kod i fiskalni QR.
  - Audio Transport: Model zvučnog transporta i stanja reprodukcije naracije.
  - Kriptografski trezor: PBKDF2 (100k iteracija), AES-256-GCM enkripcija, Google Sub kripto-sidro.
  - Arhitekturni Logger: Ring-buffer, sanitizacija osjetljivih podataka, strukturirani stack trace parser.
* **@obrtniq/web**: 32 testne datoteke, **248 testova** prolaze sa 100% uspješnošću:
  - Žigo Inteligentni Copilot: Persona, autentični dubrovački leksik, heuristička pravila (14/14), live screen context, 25 izvršnih alata.
  - Knjigovodstvo UI: KPR tablica, PO-SD kartice, doprinosi, troškovnik, registar opreme, uvoz bankovnih izvoda, analitički grafovi i A4 financijski izvještaj.
  - Poslovno proširenje UI: Ponavljajući računi modal i radni sentinel, porezni kalendar s 12 mjeseci i 1-klik HUB-3 uplatnicama, multi-prostor workflow, klijentski dispečer slanja (email/chat/share), 1-klik revizorski ZIP paket (`audit-export`).
  - Google Cloud Audio: WaveNet sinteza viteza Orlanda (`hr-HR-Wavenet-B`), in-memory Blob caching, fallback na Web Speech API, STT prepoznavanje.
  - Stop & Error Handling: `AbortController` prekid zahtjeva na zahtjev korisnika, robusno 503 Overloaded procesiranje, automatsko prebacivanje na Orlandov fallback.
  - Google OAuth & Cloud Sync: 6-satna radna sesija, tiho pozadinsko obnavljanje, Google Drive `appDataFolder` sinkronizacija, cloud dijagnostika.
  - Modularni Workspace: Router s 8 in-place radnih površina bez modalnog zamagljenja, očuvanje stanja u memoriji, `Alt+H` prečac.
* **Ukupno**: **61 testna datoteka, 404 / 404 testa prolaze sa 100% uspješnošću** (0 grešaka, 0 preskočenih).
* **TypeScript provjera tipova (`tsc -b`):** 0 grešaka u svim paketima monorepa.
* **Vite produkcijski bundle:** Uspješno izgrađen za 5,02 sekunde.

---

## 📜 Atribucija i Licenca

* **Autor & Arhitekt**: Matija Miloslavić (Mate Fox)
* **Matični Obrt**: ROBOT HAND MADE, vl. Matija Miloslavić, Mlini / Dubrovnik
* **Kulturna inspiracija**: Dubrovačka Republika, Orlando, Lazareti, Clubpages arhiv
* **Licenca**: Autorsko pravo © 2026 Matija Miloslavić, Robot Hand Made. Otvoreni kôd licenciran pod [MIT Licencom](LICENSE) — slobodno za korištenje, učenje i prilagodbu uz očuvanje autorstva.

---

<p align="center">
  <em>Stvoreno s ponosom u Dubrovniku i Brašini. Čuvajte svoj obrt, radite pošteno i mirno spavajte.</em>
</p>
