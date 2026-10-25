# Plan Implementacije — Faza 13: Žigo Omni-Copilot & Sustav Svjesnosti Konteksta (Real-Time Eyes-on-Glass)

> **Dokument:** Plan nadogradnje i integracije agentnog sustava Žigo  
> **Verzija:** 1.0.0 (Faza 13)  
> **Status:** Nacrt za odobrenje prije implementacije  
> **Izvorni dokumenti:**  
> - [`zigo_specifikacija_i_sistemski_prompt.md`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/docs/zigo_specifikacija_i_sistemski_prompt.md)  
> - [`arhitektura_zigo_ai_agenta.md`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/docs/arhitektura_zigo_ai_agenta.md)  
> - [`zigo_info.md`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/docs/zigo_info.md)  
> **Temeljna maksima:** *"Non bene pro toto libertas venditur auro"* — Nulti poslužitelj, potpuna privatnost, kirurška preciznost i stoički mir Dubrovačke Republike.

---

## 1. Sažetak i Cilj Faze 13

Dosadašnja implementacija agenta Žiga funkcionirala je kao izolirani razgovorni prozor (Drawer) u koji korisnik ručno tipka pitanja ili šalje privitke. Međutim, suvremeno iskustvo rada s naprednim klijentskim asistentima (poput **Geminija u Gmailu/Driveu/Docsima** ili **Microsoft Copilota u Edgeu**) zahtijeva da agent ima **stalan, trenutan uvid u sve što se događa na ekranu korisnika ("Eyes-on-Glass / Omni-Context")**.

Cilj Faze 13 je preobraziti Žiga iz pasivnog chatbota u **aktivnog kognitivnog kopilota** koji:
1. **Točno zna što korisnik u svakom trenutku radi:** Koji je ekran otvoren, tko je kupac, je li OIB prošao provjeru MOD 11, koje su stavke u tablici računa, koliko fali do poreznog praga od 40.000 €, jesu li KPD 2025 šifre ispravno dodijeljene te je li zabilježena greška u CIS fiskalizaciji ili Google Drive sinkronizaciji.
2. **Govori autentičnim dubrovačkim govorom i provodi filozofiju "Digitalnog Orlanda"** točno prema specifikaciji u [`zigo_specifikacija_i_sistemski_prompt.md`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/docs/zigo_specifikacija_i_sistemski_prompt.md):
   - Neutralizacija nazala na kraju riječi: `-m` -> `-n` (*gledan, nêmân, radin, mislin, jesan, razumin, vidin, znan, ostavljan, brišen*).
   - Očuvanje glasa `h` (*harač, hladno, hrana*).
   - Upotreba autohtonog leksika (*gosparu, preša, spêndza, šesan, rabota, duka, harač, fjaka*).
   - Stroga trodijelna struktura svakog odgovora: **1. Opservacija -> 2. Dijagnoza -> 3. Žigin Rez (Akcija)**.
   - Puna primjena kognitivnog algoritma (Chain-of-Thought): Procjena ugroze (0-10) -> Detekcija drame (kažnjavanje panike cinizmom) -> Dubrovačka diplomacija -> Kirurški rez.
3. **Nudi hibridni Copilot UI:** Uz klasični skočni Drawer, uvodi se **Docked Sidecar način rada** (poput desnog Copilot panela u Edgeu ili Geminija u radnom prostoru), omogućujući korisniku istovremeni rad na radnoj plohi `InvoiceDesk` bez zatvaranja ili preklapanja chata.
4. **Pruža proaktivne dinamičke čipove i Orlandov lakat:** Pametni akcijski čipovi koji se dinamički mijenjaju ovisno o stanju ekrana (npr. *„Provjeri OIB kupca”*, *„Predloži KPD 2025 šifru”*, *„Mjerin lakton: Prag 40k”*, *„Žigo, presijeci”*).
5. **Djeluje i u 100% offline načinu:** Unapređenje lokalnog heurističkog agenta s istim dubrovačkim fonološkim i logičkim pravilima kad nema definiranog Gemini API ključa.

---

## 2. Arhitektonska Usporedba: Trenutno Stanje vs. Omni-Copilot

| Značajka | Trenutno Stanje (Faza 11/12) | Novo Stanje (Faza 13: Omni-Copilot) |
| :--- | :--- | :--- |
| **Pristup podacima na ekranu** | Izolirano; agent zna samo ono što korisnik ručno napiše u poruci ili pita kroz alat. | **Live Screen Context Bus:** Agent automatski prima strukturirani `LiveScreenContextSnapshot` uz svaku poruku i akciju. |
| **Korisničko sučelje (UI)** | Samo plutajući gumb + skočna ladica (Drawer) koja prekriva dio radne površine. | **Dvojni način rada:** 1. Floating Drawer (brzi upiti) + 2. **Docked Sidecar Companion** (rad usporedo s računom). |
| **Status svjesnosti** | Samo generička ikona i "isThinking" puls. | **"Orlando motri" statusna traka:** Prikazuje aktivni kontekst (npr. *„Račun #2026-004 • 450,00 € • OIB valjan • Prag: 7.200 € slobodno”*). |
| **Sistemski prompt i stil** | Djelomična imitacija Orlanda; standardna gramatika. | **Strogi dubrovački standard:** Verificirana fonologija (`-n`, `h`), rječnik (*spêndza, šesan*), trodijelna struktura (Opservacija, Dijagnoza, Rez). |
| **Trijaža i prevencija panike** | Samo naredba "Žigo, presijeci" kao prečac u chatu. | **Ugrađena mehanika trijaže:** Filtar "Što gori", "Što čeka", "Akcija sad" + automatski "Fjaka Mode" za rad vikendom kasno noću. |
| **Akcijski prijedlozi (Chips)** | Statični primjeri pitanja. | **Dinamički kontekstualni čipovi:** Ponude akcija koje odgovaraju točno trenutnoj grešci ili praznom polju na ekranu. |
| **Offline rad** | Jednostavni lokalni heuristički odgovori na hrvatskom standardu. | **Dubrovački heuristički motor:** Isti ton, stil i trijaža čak i bez interneta i bez Gemini API ključa. |

---

## 3. Slojevi i Komponente Sustava

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     OBRTNIQ OMNI-COPILOT ARHITEKTURA                             │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│   KORISNIČKO SUČELJE (Radna površina: InvoiceDesk, KPR, Postavke, Dnevnik)                      │
│   ▲                                                                                              │
│   │ 1. Stalno praćenje promjena stanja (stanje forme, stavke, OIB, KPR, greške)                │
│   ▼                                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ LiveScreenContextBus (useLiveScreenContext)                                                  │ │
│ │ ──────────────────────────────────────────────────────────────────────────────────────────── │ │
│ │ • Aktivni ekran: 'InvoiceDesk' | 'KprDrawer' | 'SettingsDrawer' | 'SystemLogDrawer' ...       │ │
│ │ • Stanje računa: partner, OIB validacija, stavke, iznos, porezna zona, datumi                │ │
│ │ • Financijski radar: KPR promet YTD, prag 40.000 €, izračun hoće li račun probiti prag       │ │
│ │ • Integracije: Google Drive status, Gemini model, certifikat                                 │ │
│ │ • Telemetrija: Posljednje sistemske greške/upozorenja iz appLoggera                         │ │
│ └──────────────────────────────────────────────┬───────────────────────────────────────────────┘ │
│                                                │                                                 │
│                                                ▼ LiveScreenContextSnapshot                       │
│ ┌──────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ ZigoOmniAgentBridge (useZigoAgent + geminiService)                                           │ │
│ │ ──────────────────────────────────────────────────────────────────────────────────────────── │ │
│ │ • Injekcija konteksta u System Message (Gemini 2.0 / 3.8 Flash)                              │ │
│ │ • Strogi fonološki i stilski filtar (dubrovački leksik, -n završeci, očuvanje h)             │ │
│ │ • Chain-of-Thought evaluacija: Ugroza -> Drama -> Diplomacija -> Kirurški rez                │ │
│ │ • Offline Heuristic Engine: Dubrovački fallback ako nema API ključa                          │ │
│ └──────────────────────┬───────────────────────────────────────────────┬───────────────────────┘ │
│                        │                                               │                         │
│                        ▼ Poziv alata (Tool Calling)                    ▼ Odgovor & Prikaz        │
│ ┌──────────────────────────────────────────────┐               ┌───────────────────────────────┐ │
│ │ ZigoToolsDispatcher                          │               │ ZigoCopilotPanel              │ │
│ │ ──────────────────────────────────────────── │               │ ───────────────────────────── │ │
│ │ • postavi_kupca, dodaj_stavku_racuna         │               │ • "Orlando motri" status traka│ │
│ │ • auto_ispuni_kpd_sifre                      │               │ • Trodijelni prikaz odgovora  │ │
│ │ • provjeri_oib_partnera                      │               │ • Dinamički kontekstualni čip │ │
│ │ • simuliraj_utjecaj_na_prag                  │               │ • Docked / Sidecar splitter   │ │
│ │ • aktiviraj_zigin_rez                        │               │ • Fjaka Mode indikator        │ │
│ └──────────────────────────────────────────────┘               └───────────────────────────────┘ │
│                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Detaljni Plan Faza Implementacije

### Podfaza 13.1: Razvoj Sloja za Praćenje Konteksta u Stvarnom Vremenu (`LiveScreenContextBus`)
- **Datoteke:**
  - `apps/web/src/context/LiveScreenContext.tsx` *(novo)*
  - `apps/web/src/hooks/useLiveScreenContext.ts` *(novo)*
  - `apps/web/src/types/zigo-context.ts` *(novo)*
- **Opis funkcionalnosti:**
  - Definiranje sučelja `LiveScreenContextSnapshot` koje objedinjuje:
    - `aktivniEkran`: Trenutno fokusirani pogled (`InvoiceDesk`, `KprDrawer`, `SettingsDrawer`, `SystemLogDrawer`, `FiscalDrawer`, itd.).
    - `racun`: Trenutni unos na radnoj plohi (partnerNaziv, oib, isOibValid, iban, nacinPlacanja, taxZone, datumIzdavanja, datumDospijeca, stavke s cijenama i KPD šiframa, ukupniIznos).
    - `financije`: Ukupni KPR promet u tekućoj godini, preostali iznos do poreznog praga od 40.000 €, izračun prelaska praga ako se izda trenutni račun.
    - `sustav`: Status Google Drive sinkronizacije (Povezano/Nepovezano), Gemini model, prisutnost grešaka u dnevniku (npr. neuspjeli CIS poziv).
  - Povezivanje s `appLogger` pretplatnikom za hvatanje najnovijih grešaka u stvarnom vremenu.
  - Generiranje sažetog Markdown/JSON bloka spremanog za injekciju u prompt.

---

### Podfaza 13.2: Usklađivanje Sistemskog Prompta i Fonoloških Pravila (`gemini-service.ts`)
- **Datoteke:**
  - `apps/web/src/services/gemini-service.ts` *(modifikacija)*
  - `packages/core/src/constants/zigo-persona.ts` *(novo ili modifikacija core paketa)*
- **Opis funkcionalnosti:**
  - Ažuriranje `ZIGO_SYSTEM_INSTRUCTION` s doslovnim poštovanjem pravila iz [`zigo_specifikacija_i_sistemski_prompt.md`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/docs/zigo_specifikacija_i_sistemski_prompt.md):
    - **Pravilo fonologije:** Neutralizacija završnog `-m` u `-n` (*"gledan, vidin, radin, nêmân, znan, ostavljan, brišen"*), strogo očuvanje glasa `h` (*"harač, hladno, hrana"*).
    - **Leksik:** Obavezno korištenje riječi: *gosparu, preša, spêndza, šesan, rabota, duka, harač, fjaka*.
    - **Struktura odgovora (obvezna tri dijela):**
      1. **Opservacija:** Sarkastična ili smirujuća lokalna/povijesna analogija.
      2. **Dijagnoza:** Što se zapravo događa na ekranu.
      3. **Žigin Rez (Akcija):** Kirurški jasan korak ili gumb.
    - **Few-shot primjeri:** Uključivanje 4 službena scenarija iz specifikacije (nenaplaćeni račun 90 dana, pad ePorezne, privatni roštilj / "ćevapi test", prag od 40.000 €).
  - Injekcija dinamičkog konteksta: Svaki poziv Geminija u poruku ili sistemsku instrukciju ugrađuje najnoviji `LiveScreenContextSnapshot` kao `[TRENUTNO STANJE EKRANA I SUSTAVA]`.

---

### Podfaza 13.3: Nadogradnja Lokalnog Offline Heurističkog Motora
- **Datoteke:**
  - `apps/web/src/services/gemini-service.ts` (`chatWithAgentLocalHeuristic`)
- **Opis funkcionalnosti:**
  - Korisnici koji nemaju unesen Google Gemini API ključ ili rade u avio-modu/offline moraju dobiti identično iskustvo autentičnog dubrovačkog govora i svjesnosti konteksta.
  - Implementacija pametnog parsera koji iz `LiveScreenContextSnapshot` prepoznaje:
    - Ako korisnik pita "Što sad?", "Pregledaj račun", "Valja li ovo?": analizira OIB, KPD šifre i zbroj.
    - Ako je OIB neispravan: *"Gosparu, gledan ovaj OIB... Ne štima mu kontrolna znamenka po MOD-u 11. Provjeri cifre prije nego porezna zakuca na vrata."*
    - Ako nedostaje KPD šifra: *"Stavka ti je gola ko Stradun u podne ljeti. Fali joj KPD 2025 šifra. Dodajen 62.01.11 da papiri budu šesni."*
    - Ako je račun blizu 40.000 €: *"Stani malo! S ovim računon od [X] € probijaš 40.000 €. Ulaziš u PDV ko barka u orkansko jugo. Prebaci datum na prvi siječnja."*
    - Reakcija na "Žigo, presijeci": vraća strukturiranu trijažu (1. Što gori, 2. Što čeka, 3. Akcija sad).

---

### Podfaza 13.4: Copilot Companion UI — Docked Sidecar & Status "Orlando motri"
- **Datoteke:**
  - `apps/web/src/components/ZigoCopilotPanel.tsx` *(novo)*
  - `apps/web/src/components/ZigoChatDrawer.tsx` *(refaktoriranje u ponovno iskoristive komponente)*
  - `apps/web/src/components/FloatingZigoWidget.tsx` *(proširenje za dock tipku)*
  - `apps/web/src/App.tsx` *(prilagodba grid rasporeda)*
- **Opis funkcionalnosti:**
  - **Docked Sidecar način rada:**
    - Gumb za sidrenje (Dock to side) omogućuje podjelu ekrana na širokim monitorima (Desktop/Laptop):
      - *Normalni rad:* 58% InvoiceDesk / 42% Live Preview.
      - *Docked Copilot način:* 46% InvoiceDesk / 32% Live Preview / 22% Žigo Copilot (ili sidecar panel uz desni rub s glatkom CSS tranzicijom).
    - Korisnik može nesmetano tipkati po računu dok Žigo u desnom stupcu drži otvorenu sjednicu, bez zatvaranja modala ili prekrivanja polja.
  - **"Orlando motri" Statusna Traka (Eyes-on-Glass Pill):**
    - Na vrhu panela nalazi se diskretna statusna traka s pulsirajućim amblemom:
      - Npr.: `🟢 Orlando motri: Račun #2026-004 • 2 stavke (850,00 €) • OIB u redu • Do praga 40k: 8.500 €`
    - Klik na traku otvara brzi pregled konteksta koji agent trenutno vidi.
  - **Dinamički kontekstualni akcijski čipovi (Quick Contextual Chips):**
    - Umjesto statičnih pitanja, čipovi se generiraju iz stanja:
      - Ako je OIB neispravan: `[Ispravi OIB kupca]`
      - Ako nedostaje KPD: `[Predloži KPD šifru]`
      - Ako je račun velik: `[Provjeri prag od 40.000 €]`
      - Ako je otvoren KPR: `[Izvezi PO-SD obrazac]`
      - Ako je u tijeku rad noću: `[Fjaka: Pođi leć]`
  - **Fjaka Mode (Anti-Burnout vizualni podsjetnik):**
    - Kada je lokalno vrijeme nedjelja iza 21:00 ili radni dan iza 23:00, amblem poprima blagi topli ton uz diskretnu poruku: *"Novci poslani u ponoć ne putuju brže. Republika treba odmorne ljude."*

---

### Podfaza 13.5: Proširenje Alata Sustava (`zigo-tools-dispatcher.ts`)
- **Datoteke:**
  - `apps/web/src/services/zigo-tools-dispatcher.ts` *(modifikacija)*
  - `apps/web/src/services/gemini-service.ts` (`ZIGO_FUNCTION_DECLARATIONS`)
- **Novi i prošireni alati:**
  1. `auto_ispuni_kpd_sifre`: Prolazi kroz sve stavke na trenutnom računu i automatski im dodjeljuje odgovarajuće KPD 2025 šifre prema nazivu djelatnosti.
  2. `provjeri_i_ispravi_oib`: Provjerava kontrolnu znamenku OIB-a i predlaže točne podatke iz adresara ako partner već postoji.
  3. `simuliraj_utjecaj_na_prag`: Izračunava točan utjecaj trenutnog iznosa računa na godišnji limit od 40.000 € i savjetuje optimalni datum izdavanja.
  4. `prebaci_datum_u_iducu_godinu`: Ako je račun preblizu pragu, automatski postavlja datum izdavanja i isporuke na 02.01. iduće kalendarske godine.
  5. `aktiviraj_fjaku`: Aktivira opuštajući način rada i podsjeća korisnika na zasluženi odmor.

---

### Podfaza 13.6: Automatizirano Testiranje i Verifikacija
- **Datoteke:**
  - `apps/web/tests/zigo-omni-context.test.ts` *(novo)*
  - `apps/web/tests/zigo-phonology-and-persona.test.ts` *(novo)*
  - `apps/web/tests/zigo-copilot-tools.test.ts` *(novo)*
- **Provjere:**
  - Test ekstrakcije `LiveScreenContextSnapshot` iz stanja forme i aplikacije.
  - Test fonoloških pravila: detekcija završetaka na `-n`, očuvanja slova `h` i dubrovačkog leksika u odgovorima.
  - Test trodijelne strukture odgovora (Opservacija, Dijagnoza, Rez).
  - Test rada offline heuristike s lažiranim kontekstom (neispravan OIB, prekoračenje 40k €).
  - Test izvršavanja novih alata u `zigo-tools-dispatcher.ts`.
  - Puno pokretanje svih postojećih testova (208+ testova) kako bi se osigurala nulta regresija.

---

## 5. Korisnički Scenariji "Kao Gemini u Gmailu / Copilot u Edgeu"

### Scenarij A: Korisnik unosi novi račun za programiranje, zaboravio je KPD šifru
- **Korisnik:** Otvara `InvoiceDesk`, upisuje partnera "Informatika d.o.o." i stavku "Izrada web stranice" bez šifre.
- **Žigo (u Sidecar panelu odmah bilježi):**
  - Statusna traka: `🟢 Orlando motri: Radni račun (1 stavka • 1.200,00 €) • Nedostaje KPD šifra`
  - Kontekstualni čip: `[Dodaj KPD 62.01.11]`
- **Korisnik klikne čip ili pita:** "Što misliš o ovom računu?"
- **Žigo odgovara:**
  - *Opservacija:* „Gledan te kako vješto slažeš kod i dukate, ali papir ti je osta napola neobučen.”
  - *Dijagnoza:* „Stavka 'Izrada web stranice' nema KPD 2025 šifru. Bez toga će ti e-Račun zapet na carini ko neprijavljeni tovar.”
  - *Žigin Rez:* „Klikni 'Dodaj KPD 62.01.11' – već san pripremio šifru za računalno programiranje. Sad je sve šesno.”

### Scenarij B: Korisnik se opasno približio limitu od 40.000 € u prosincu
- **Kontekst:** KPR promet je 38.800 €. Korisnik upisuje račun na 2.500 €.
- **Žigo (proaktivno crveno upozorenje u Copilot traci):**
  - Statusna traka: `⚠️ Orlandov lakat: Račun probija prag od 40.000 € (Ukupno bi bilo: 41.300 €)!`
- **Žigo automatski nudi čip:** `[Prebaci datum na siječanj]`
- **Žigo objašnjava:**
  - *Opservacija:* „E, moj gosparu... Još samo ovaj potpis i ulaziš u PDV ko s barkom na Lokrum po orkanskom jugu.”
  - *Dijagnoza:* „S ovim računom prelaziš 40.000 € za točno 1.300 €. Država jedva čeka da ti pošalje knjigovođu i PDV obrasce.”
  - *Žigin Rez:* „Stisni gumb ispod: prebacujen datum izdavanja na 2. siječnja. Reci kupcu da radiš inventuru i moliš devetnicu, samo sačuvaj paušal.”

### Scenarij C: Pao je internet ili CIS Porezne uprave
- **Kontekst:** `appLogger` bilježi CIS network timeout.
- **Žigo (smiruje puls):**
  - *Opservacija:* „Pao server u Zagrebu? Ma neka je. Pao je i Napoleon, pa Grad eno još stoji đe je i bio.”
  - *Dijagnoza:* „Interneta nema ili CIS spava popodnevni san. Račun san zapečatio lokalnim ZKI kodom i zabilježio milisekundu.”
  - *Žigin Rez:* „Izdaj račun u miru, a kad gospoda uključe kabao u zid, poslat ćemo sve u nizu. Popij čašu vode, nemoj da ti tlak skače.”

---

## 6. Sigurnost, Privatnost i "Zero-Server" Obećanje

U skladu s temeljnom filozofijom ObrtnIQ sustava:
- `LiveScreenContextSnapshot` generira se **isključivo unutar memorije korisničkog preglednika**.
- Nema nikakvog posredničkog poslužitelja, baze podataka treće strane niti telemetrijskog praćenja.
- Ako se koristi Google Gemini API, kontekst se šalje **isključivo izravno iz klijentskog preglednika na službeni Google Gemini API endpoint** koristeći korisnikov osobni API ključ.
- Ako korisnik radi u lokalnom načinu rada (bez API ključa), svi kontekstualni izračuni, fonološka pravila i trijaža izvršavaju se **100% lokalno u TypeScript kodu preglednika**.

---

## 7. Plan Verifikacije i Koraci za Odobrenje

1. **Pregled i odobrenje plana:** Korisnik pregledava plan arhitekture i odobrava početak rada.
2. **Implementacija podfaza redom:**
   - Podfaza 13.1 (Context Bus) -> Podfaza 13.2 (Prompt & Fonologija) -> Podfaza 13.3 (Offline Heuristika) -> Podfaza 13.4 (Copilot UI & Sidecar) -> Podfaza 13.5 (Novi Alati).
3. **Automatizirani testovi:** Pokretanje `npm test` unutar `apps/web` i osiguravanje da svih 208+ testova prolazi s 0 regresija.
4. **Izrada završnog izvještaja:** Dokumentiranje promjena u [`manifest_i_dnevnik_implementacije.md`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/docs/manifest_i_dnevnik_implementacije.md).
