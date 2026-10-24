# Arhitektura Autonomnog Agenta: Žigo — Digitalni Orlando (Gemini 2.0 Function Calling, Multimodal & Context Engine)

> **Dokument:** Arhitektonski plan implementacije inteligentnog agenta sustava ObrtnIQ  
> **Status:** Nacrt i specifikacija implementacije  
> **Temelji se na:** [`zigo_info.md`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/docs/zigo_info.md), Google Gemini 2.0 Flash REST API, Web Crypto API, Dexie.js IndexedDB  
> **Temeljna maksima:** *"Non bene pro toto libertas venditur auro"* — Nulti poslužitelj (Zero-Server), potpuna privatnost, klijentska autonomija.

---

## 1. Vizija i Cilj Agenta

**Žigo** nije običan generički chatbot koji ponavlja tekst iz priručnika. On je **autonomni operativni klijentski agent** s punim poznavanjem sustava ObrtnIQ i hrvatskih poreznih propisa.

Žigo:
1. **Ima autentičnu osobnost** temeljenu na dubrovačkom vitezu Orlandu i diplomaciji Dubrovačke Republike — miran, stoički, duhovit, kirurški precizan, reže birokratsku dramu i servira točno jedno rješenje.
2. **Poznaje sustav u dušu** — od izračuna OIB MOD 11 i IBAN MOD 97, preko fiskalizacije 1.0 (CIS ZKI/JIR) i 2.0 (UBL 2.1 e-Račun), KPD 2025 šifarnika, praga od 40.000 €, do HUB-3 PDF417 barkoda i AES-256 kripto-trezora.
3. **Može planirati i izvršavati akcije (Function Calling)** — manipulirati radnom plohom unosa, dodavati stavke, pretraživati partnere, provjeravati KPR i proračunavati porez.
4. **Ima perzistentne razgovore i kontekste** — sve sesije i poruke pohranjuju se lokalno u Dexie.js IndexedDB, kriptiraju se u `.obrtniq` arhivu i sinkroniziraju na privatni Google Drive bez ikakvog trećeg poslužitelja.
5. **Multimodalan je** — prima slike računa (fotografije, zgužvane slipove, račune za gorivo) i PDF dokumente (ulazne e-Račune, ugovore), analizira ih, prepoznaje poslovnu opravdanost troška i nudi trenutni unos u sustav.

---

## 2. Arhitektura Sustava Agenta

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     OBRTNIQ KLIJENTSKI AGENT                                 │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│   KORISNIK (Chat / Drag & Drop slike / PDF / Glas)                                          │
│         │                                                                                    │
│         ▼                                                                                    │
│   ┌──────────────────────────────────────────────────────────────────────────────────────┐   │
│   │ ZigoChatDrawer / ZigoAgentController                                                 │   │
│   │ ─────────────────────────────────────────────────────────────────────────────────── │   │
│   │ • Upravljanje sesijama i kontekstom (Dexie: chatSesije, chatPoruke)                 │   │
│   │ • Multimodalni procesor (File -> Base64 inlineData: image/jpeg, pdf)                 │   │
│   │ • Orlandov zvučni i vizualni indikator (rotirajući Q-prsten)                        │   │
│   └──────────────────────────────────────────┬───────────────────────────────────────────┘   │
│                                              │                                               │
│                                              ▼                                               │
│   ┌──────────────────────────────────────────────────────────────────────────────────────┐   │
│   │ ZigoAgentEngine (Gemini 2.0 Flash REST API)                                          │   │
│   │ ─────────────────────────────────────────────────────────────────────────────────── │   │
│   │ • System Instruction: Persona Orlanda / Dubrovački lakat / Zero-Panic               │   │
│   │ • System Knowledge Context: Propisi RH, porezni razredi, e-Račun, KPD 2025           │   │
│   │ • Tools Declaration: 12 nativnih funkcija ObrtnIQ sustava                            │   │
│   └─────────────────────┬──────────────────────────────────────────────┬─────────────────┘   │
│                         │                                              │                     │
│         Model vraća:    │ functionCall(name, args)                     │ tekst odgovora      │
│                         ▼                                              ▼                     │
│   ┌──────────────────────────────────────────────┐               ┌───────────────────────┐   │
│   │ ZigoToolDispatcher (Lokalni Izvršitelj)      │               │ Prikaz u Chatu        │   │
│   │ ───────────────────────────────────────────  │               │ • Dubrovački ton      │   │
│   │ 1. InvoiceDesk: popuni, dodajStavku, izdaj   │               │ • Akcijska kartica    │   │
│   │ 2. Katalog & Partneri: pretraži, dodaj       │               │ • Gumb za potvrdu     │   │
│   │ 3. KPR & Prag: status, izvoz CSV, PO-SD XML  │               └───────────────────────┘   │
│   │ 4. Fiskalizacija & Cloud: status, backup     │                                           │
│   │ 5. Žigin Rez: analiza i 3-point sažetak      │                                           │
│   └─────────────────────┬────────────────────────┘                                           │
│                         │                                                                    │
│                         ▼                                                                    │
│   ┌──────────────────────────────────────────────┐                                           │
│   │ Povratni rezultat u Gemini: functionResponse │                                           │
│   └──────────────────────────────────────────────┘                                           │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Persona i Sistemska Instrukcija (System Instruction)

Sistemski prompt koji definira kognitivni model i stil komunikacije agenta Žiga:

```markdown
Ti si Žigo — Digitalni Orlando i autonomni operativni čuvar sustava ObrtnIQ za hrvatske obrtnike.
U tebi živi duh i diplomacija Dubrovačke Republike: miran, stoički, duhovit, pronicljiv, nikad ne paničariš.
Govoriš prirodnim, odmjerenim hrvatskim jezikom s blagim, aristokratsko-uličnim dubrovačkim senzibilitetom (koristiš izraze poput "gosparu", "đe je preša", "ođe mjerimo po zakonu", "sačuvaj glavu, lako ćemo za slavu", ali bez pretjerane karikature).

TVOJE TEMELJNO NAČELO:
"Non bene pro toto libertas venditur auro" — Sloboda obrtnika je svetinja.
Tvoj lakat je univerzalno mjerilo: „Ni milimetra više državi nego što joj pripada, ni centa manje da ti ne zatvore vrata.”

PONAŠANJE U KRIZNIM TRENUCIMA:
1. Kada korisnik paničari oko poreza, inspekcije ili novih nameta: spusti mu puls na 60. Ne dijeli jeftinu utjehu, nego ogoli situaciju do apsurda, presijeci dramu i ponudi točno jedno dugme koje treba stisnuti.
2. Kada korisnik pokuša opravdati privatne troškove na obrt (npr. roštilj, parfem, privatna putovanja): oštro i duhovito ga zaustavi. Objasni mu da mu inspektor neće oprostiti ćevape na račun poslovanja.
3. Kada se promet približi 40.000 €: upozori ga na ulazak u sustav PDV-a i predloži diplomatsko odgađanje fakturiranja za iduću kalendarsku godinu ako je legalno izvedivo.
4. Kada padne poslužitelj Porezne uprave ili CIS: podsjeti ga da je pao i Napoleon, a Grad još stoji; objasni da je račun zapečaćen lokalnim ZKI kodom i bit će poslan čim proradi veza.

POZNAVANJE SUSTAVA:
U dušu poznaješ ObrtnIQ: OIB MOD 11, IBAN MOD 97, KPR knjigu prometa, PO-SD obrazac, Fiskalizaciju 1.0 (ZKI/JIR), Fiskalizaciju 2.0 (UBL 2.1 e-Račun), KPD 2025 šifarnik, HUB-3 barkodove, lokalni AES-256 backup i Google Drive sync.

KORIŠTENJE ALATA (TOOL CALLING):
Kada korisnik zatraži akciju (npr. "dodaj stavku", "tko mi duguje", "izdaj račun", "analiziraj ovaj račun"), NEMOJ samo pričati — pozovi odgovarajuću funkciju sustava!
```

---

## 4. Šifarnik Alata Sustava (Function Declarations)

Agent ima pristup do 12 specijaliziranih alata koji direktno upravljaju stanjem aplikacije ObrtnIQ:

### A. Upravljanje Računima i Radnom Plohom
1. **`postavi_kupca`**
   * *Opis:* Postavlja podatke o kupcu na aktivni račun.
   * *Parametri:* `partnerNaziv` (string), `oib` (string), `iban` (string, opc.), `taxZone` ('DOMACA' | 'EU' | 'INO')
2. **`dodaj_stavku_racuna`**
   * *Opis:* Dodaje novu stavku na aktivni račun uz KPD 2025 klasifikaciju.
   * *Parametri:* `naziv` (string), `kpdSifra` (string), `kolicina` (broj), `cijena` (broj), `jedinicaMjere` (string)
3. **`ocisti_stavke_racuna`**
   * *Opis:* Uklanja sve stavke s trenutnog nacrta računa.
4. **`izdaj_aktivni_racun`**
   * *Opis:* Zaključava aktivni dokument, dodjeljuje redni broj i pokreće postupak izdavanja (F2).
   * *Sigurnost:* Zahtijeva eksplicitnu korisničku potvrdu u sučelju prije konačnog zaključavanja.
5. **`storniraj_racun`**
   * *Opis:* Kreira storno račun za zadani broj dokumenta uz navođenje razloga.
   * *Parametri:* `brojDokumenta` (string), `razlog` (string)

### B. Katalog i Adresar
6. **`pretrazi_cjenik`**
   * *Opis:* Pretražuje lokalni cjenik artikala i usluga po nazivu ili KPD šifri.
   * *Parametri:* `pojam` (string)
7. **`dodaj_u_cjenik`**
   * *Opis:* Sprema novu uslugu ili artikl u trajni lokalni katalog.
   * *Parametri:* `naziv` (string), `kpdSifra` (string), `cijena` (broj), `jedinicaMjere` (string)
8. **`pretrazi_partnere`**
   * *Opis:* Pretražuje adresar partnera po nazivu ili OIB-u.
   * *Parametri:* `pojam` (string)

### C. Knjigovodstvo, Prag i Porez
9. **`dohvati_financijski_status`**
   * *Opis:* Vraća ukupno naplaćeni iznos u tekućoj godini, preostali iznos do paušalnog praga od 40.000 € te rekapitulaciju po kvartalima.
10. **`izvezi_kpr_csv`**
    * *Opis:* Pokreće preuzimanje službenog KPR CSV-a formatiranog za Excel (s UTF-8 BOM-om).
11. **`izvezi_posd_xml`**
    * *Opis:* Generira službeni PO-SD obrazac u XML formatu za portal ePorezna.

### D. Žigin „Rez” & Trijaža
12. **`aktiviraj_zigin_rez`**
    * *Opis:* Skenira cjelokupnu bazu neplaćenih računa, rokova poreza i zakonskih obveza te generira instantnu trijažu: 1. Što gori (rok < 24h), 2. Što čeka, 3. Jedna konkretna akcija sad.

---

## 5. Multimodalna Analiza (Slike i Dokumenti)

Korisnik može u chat povući ili učitati:
1. **Fotografiju ili sken računa (JPG, PNG, WebP)**:
   * Primjer: Račun iz trgovine, gorivo, uredski materijal, oprema za 3D printer.
   * **Žigina uloga:**
     * Ekstrahira OIB dobavljača, datum, broj računa, stavke i iznos.
     * **Porezni filter:** Provjerava je li trošak opravdan za djelatnost obrta. Ako korisnik pokuša pravdati osobni trošak, Žigo ga upozorava.
     * Nudi gumb: *"Želiš li da ovog dobavljača spremim u adresar?"*
2. **Ulazni PDF e-Račun ili ugovor**:
   * Analizira uvjete plaćanja, IBAN za uplatu, poziv na broj i automatski generira HUB-3 nalog za m-Banking plaćanje.

---

## 6. Shema Baze Podataka za Kontekste i Chatove (Dexie.js)

U lokalnu Dexie bazu dodaju se dvije nove tablice:

```typescript
export interface ZigoChatSesija {
  id: string;               // UUID sesije
  naslov: string;           // npr. "Priprema ponude za klijenta iz Hamburga"
  kreirano: string;         // ISO datum
  azurirano: string;        // ISO datum
  arhivirano: boolean;
  zadnjiKpdContext?: string;// Opcionalni kontekst zadnje obrađene djelatnosti
}

export interface ZigoChatPoruka {
  id: string;               // UUID poruke
  sesijaId: string;         // Vanjski ključ na ZigoChatSesija
  uloga: 'user' | 'assistant' | 'tool';
  tekst: string;
  privitci?: Array<{
    naziv: string;
    mimeType: string;
    base64Data: string;     // Za slike i PDF-ove
    velicinaBajtova: number;
  }>;
  toolPoziv?: {
    imeFunkcije: string;
    argumenti: Record<string, any>;
  };
  toolRezultat?: {
    uspjeh: boolean;
    podaci: any;
    poruka?: string;
  };
  kreirano: string;         // ISO timestamp
}
```

### Integracija s Kripto-Trezorom i Cloud Sync-om
* Budući da su `chatSesije` i `chatPoruke` dio Dexie baze, one se **automatski uključuju u enkriptirani `.obrtniq` paket** (AES-256-GCM).
* Prilikom sinkronizacije na Google Drive AppData, cjelokupna povijest razgovora s agentom ostaje privatna i zaštićena korisnikovim Google Sub sidrom.

---

## 7. Korisničko Sučelje (Sharp UI & Žigo Drawer)

1. **Plutajući gumb (Floating Orlando Widget)**:
   * Smješten u donjem desnom kutu aplikacije.
   * Sadrži brončano-kameni amblem viteza Orlanda i **rotirajući Q-prsten**.
   * Dok Žigo razmišlja ili poziva alate sustava, Q-prsten se animirano vrti.
2. **Žigo Ladica (Drawer)**:
   * Prikaz povijesti sesija (lijevi panel ili padajući izbornik).
   * Glavni prozor s porukama: poruke korisnika, Žigini odgovori i **interaktivne kartice alata** (Action Cards).
   * Polje za unos teksta s ikonom spajalice za slike/PDF-ove, tipkom za brzi primjer i tipkom **„Žigo, presijeci”**.
3. **Akcijske Kartice (Interactive Action Cards)**:
   * Kada Žigo pozove funkciju (npr. `popuni_formu_racuna`), u chatu se ne prikazuje suhoparni JSON, već elegantna kartica:
     ```
     ┌────────────────────────────────────────────────────────┐
     │ 📋 ŽIGO JE PRIPREMIO RAČUN                            │
     │ Kupac: ACME Solutions GmbH (Njemačka, EU)              │
     │ Stavka: Razvoj cloud mikroservisa (60 sati x 60 €)     │
     │ Ukupno: 3.600,00 €                                     │
     │ Napomena: Prijenos porezne obveze (Reverse Charge)     │
     │                                                        │
     │ [ Primijeni na Radnu Plohu ]   [ Izdaj Račun (F2) ]   │
     └────────────────────────────────────────────────────────┘
     ```

---

## 8. Faze Implementacije za Fazu 11

| Korak | Naziv modula | Opis zadataka |
| :---: | :--- | :--- |
| **11.1** | **Proširenje Dexie baze** | Dodavanje tablica `chatSesije` i `chatPoruke`, migracija baze na v2, ažuriranje snapshot backup enginea. |
| **11.2** | **Gemini Tool Calling Engine** | Proširenje [`gemini-service.ts`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/services/gemini-service.ts) za podršku `tools`, definicija 12 funkcija i rukovanje `functionCall` ciklusom. |
| **11.3** | **Zigo Agent Controller & Tools** | Izrada dispečera alata koji spaja stanje aktivnog računa, bazu partnera, artikala i KPR-a s pozivima modela. |
| **11.4** | **Multimodalni procesor** | Prihvat slika računa (OCR & ekstrakcija stavaka) i PDF-ova kroz `inlineData` format. |
| **11.5** | **UI Komponenta `ZigoChatDrawer`** | Sharp UI ladica s temom Orlanda, rotirajućim Q-prstenom, tipkom „Žigo, presijeci” i interaktivnim akcijskim karticama. |
| **11.6** | **Integracijski testovi** | Provjera agentic loopa, tool callinga i perzistencije u `apps/web/tests/zigo-agent.test.ts`. |

---

*Specifikacija je spremna za početak implementacije Faze 11 (Žigo Agent).*
