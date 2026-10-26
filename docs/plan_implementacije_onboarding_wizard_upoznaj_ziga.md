# Plan Implementacije — Onboarding Wizard: "Upoznaj Žiga, Gospara od Obrta"

> **Dokument:** Detaljni arhitektonski i narativni plan za Wizard prvog pokretanja (Onboarding)  
> **Verzija:** 1.0.0 (Faza 22)  
> **Status:** Spreman za pregled i implementaciju  
> **Povezani dokumenti:**  
> - [`docs/plan_redizajna_ui_centar_toolbar_i_sustav_dokumentacije.md`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/docs/plan_redizajna_ui_centar_toolbar_i_sustav_dokumentacije.md)  
> - [`docs/plan_kako_da_ziga_postane_prijatelj.md`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/docs/plan_kako_da_ziga_postane_prijatelj.md)  
> - [`docs/zigo_specifikacija_i_sistemski_prompt.md`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/docs/zigo_specifikacija_i_sistemski_prompt.md)  
> - [`apps/web/src/context/AudioTransportContext.tsx`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/context/AudioTransportContext.tsx)  
> - [`apps/web/src/components/layout/StartHubModal.tsx`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/components/layout/StartHubModal.tsx)  
> **Temeljna maksima:** *"Od treme i straha od propisa do prvog suverenog računa — u tri koraka, uz glasovnu mudrost Digitalnog Orlanda."*

---

## 1. VIZIJA I PSIHOLOŠKI CILJ (ZAŠTO ŽIGO KAO GOSPAR?)

### 1.1. Psihološki problem novog obrtnika
Otvaranje obrta u Republici Hrvatskoj često je praćeno snažnim stresom i nelagodom:
- **Strah od greške:** *"Što ako krivo upišem OIB, IBAN ili izdam račun bez nekog obveznog elementa?"*
- **Zamor od birokracije:** Propisi, zakoni, pravilnici, obrasci PO-SD, KPR, ZKI, JIR, UBL 2.1 — sve to djeluje zastrašujuće i hladno.
- **Sterilnost standardnog softvera:** Većina ERP rješenja dočekuje korisnika suhoparnom formom od 40 polja ili dosadnim modalom s 10 generičkih koraka "Next, Next, Finish".

### 1.2. Žigina uloga: Gospar koji siječe tremu
U ObrtnIQ-u, onboarding ne vodi bezlični sustav, već **Žigo (Digitalni Orlando)**:
- On je **Gospar** — iskusan, staložen, mudar stari meštar dubrovačke tradicije koji poznaje svaki zakonski kutak i poreznu zamku, ali s korisnikom razgovara kao prijatelj i zaštitnik.
- **Moć govora (Voice Interaction):** Žigo koristi svoj glas (prirodni staloženi bariton kroz Google Cloud TTS v2 ili Web Speech API) kako bi probio tišinu, razbio tremu i stvorio osjećaj sigurnosti:
  > *„Sjedni, gosparu. Znam ja taj grč kad se otvori obrt — svi ti mašu kaznama, inspekcijama i rokovima. Zato sam ja tu. U Kripto-Republici si. Tvoji podaci su samo tvoji, u tvom pregledniku. Dok popiješ gutljaj kave, mi ćemo tvoj obrt usidriti i izdati tvoj prvi račun. Pomalo, idemo po redu.”*
- **Od treme u realizaciju:** Korisnik ne ispunjava formu radi administracije; korisnik s gosparom oprema svoju poslovnu galiju za plovidbu i u manje od 2 minute drži u ruci svoj **prvi gotov račun**.

---

## 2. KARAKTER, GLAS I DIJALOŠKI SCENARIJ ŽIGA GOSPARA

### 2.1. Zvučni profil i vokalni transport
- **TTS mehanizam:** Koristi postojeći [`AudioTransportContext`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/context/AudioTransportContext.tsx) (`useAudioTransport`).
- **Glasovna kalibracija:** Muški staloženi glas (Wavenet-B / Journey / standardni hrvatski muški glas u pregledniku) s blagim smirenim tempom (`rate: 0.95`, `pitch: 0.98`).
- **Pristupačnost i kontrola:**
  - Zvuk je omogućen uz jasan vizualni gumb **Zvučnik (Mute/Unmute)** na vrhu wizarda.
  - Ispod Žigina amblema uvijek se ispisuju **dinamički titlovi** s blagom tipkajućom animacijom sinkroniziranom s govorom.
  - Korisnik u svakom trenutku može preskočiti govor klikom na "Dalje" ili pritiskom tipke `Enter`.

### 2.2. Podrška za govor korisnika (STT mikrofon)
- Uz svako ključno polje (OIB, Naziv obrta, Glavna usluga), korisnik može kliknuti ikonu mikrofona ili držati razmaknicu te **izgovoriti podatke**:
  - Primjer: *"Naziv obrta je Studio Lovrjenac, vlasnik Pero Perić, OIB 12345678901."*
  - Sustav lokalno parsira izgovoreni tekst, automatski izdvaja OIB, provjerava MOD 11 i popunjava polja.

---

## 3. KORISNIČKI TIJEK: PET ČINOVA WIZARDA ("OD TREME DO PRVOG REZA")

```
   ┌────────────────────────────────────────────────────────────────────────┐
   │                       ONBOARDING WIZARD MODAL                          │
   │  [Amblem Orlanda sa zlatnim sjajem]   [Zvučni val]   [Mute 🔊] [Izlaz ✕]│
   ├────────────────────────────────────────────────────────────────────────┤
   │                                                                        │
   │  ČIN 1: POZDRAV GOSPARA      ČIN 2: KAPETAN OBRTA   ČIN 3: KPR & BANKA │
   │  "Skidanje treme i           "OIB, vlasnik,         "IBAN, djelatnost, │
   │   odabir načina ulaska"       adresa i sjedište"     prag od 40.000 €" │
   │                                                                        │
   │  ČIN 4: BOJE I PEČAT         ČIN 5: PRVI REZ (REALIZACIJA)            │
   │  "Izbor dubrovačke teme      "Izdavanje prvog probnog računa           │
   │   i memorandum obrta"        uz živi A4 prikaz i čestitku Žiga"        │
   │                                                                        │
   └────────────────────────────────────────────────────────────────────────┘
```

---

### ČIN 1: "Sjedni i odahni, gosparu" (Razbijanje treme)
- **Vizualni dojam:** Orlando amblem (size 56) u središtu s pulsirajućim zlatnim prstenom i zvučnim valovima dok govori.
- **Žigina replika (Glas + Titl):**
  > *„Pozdravljam te, gosparu! Ja sam Žigo, digitalni Orlando ove naše Kripto-Republike. Ako ti srce malo brže lupa od same pomisli na poreznu, obrasce i zakone — na pravom si mjestu. Ovdje si svoj na svome. Nema pretplate, nema vanjskih poslužitelja koji ti njuškaju po računima. Reci mi, kako želiš da krenemo?”*
- **Tri ponuđena izbora:**
  1. **"Vodi me korak po korak"** *(Preporučeno — pokreće brzi čarobnjak u 4 kratka koraka)*
  2. **"Učitaj demo podatke za razgledavanje"** *(Učitava ogledni obrt i 3 računa za istraživanje sustava)*
  3. **"Znam sve, pusti me na radnu plohu"** *(Preskače wizard i otvara praznu formu)*

---

### ČIN 2: "Tko drži kormilo?" (Podaci o obrtu i vlasniku)
- **Žigina replika (Glas + Titl):**
  > *„Prvo ono najvažnije: tko je kapetan ove lađe? Daj mi tvoj OIB, naziv obrta i tvoje ime. I ne brini ako se zabuniš u brojkama — ja provjeravam kontrolnu znamenku po ISO MOD 11 algoritmu u letu. Prije Porezne ćemo sve ispravit.”*
- **Polja za unos:**
  - **Naziv obrta:** (npr. *„Klesarija Stradun, obrt za restauraciju”*)
  - **Ime i prezime vlasnika:** (npr. *„Vlaho Sorkočević”*)
  - **OIB:** 11 znamenki, s automatskim zelenim kvačicama čim je kontrolna znamenka matematički ispravna.
  - **Sjedište i adresa:** Ulica, kućni broj, poštanski broj i mjesto (s automatskim popunjavanjem na temelju poštanskog broja).
- **Interakcija s glasom:** Gumb mikrofon *"Izgovori podatke"* za diktiranje.

---

### ČIN 3: "Kuda teku dukati?" (IBAN, Banka i Djelatnost)
- **Žigina replika (Glas + Titl):**
  > *„Odlično. Sad mi reci kamo kupci uplaćuju tvoj pošteni trud. Upiši svoj IBAN — čim uneseš vodeći broj, sam ću prepoznati banku. I nemoj razbijati glavu s poreznim razredima: paušalni obrt ima jednostavan zakon, a prag od 40.000 eura pratit ćemo zajedno.”*
- **Polja za unos:**
  - **HR IBAN:** Automatska detekcija banke s bedžem (npr. *„Zagrebačka banka d.d.”*, *„PBZ d.d.”*, *„Erste&Steiermärkische Bank d.d.”* itd.).
  - **Glavna djelatnost obrta:** Padajući izbornik najčešćih paušalnih djelatnosti (IT, konzalting, građevinski radovi, poduka, turizam, dizajn) uz **automatski odabir službene KPD 2025 šifre**.
  - **Paušalni status:** Jasno istaknuto: *Paušalni obrtnik • Izvan sustava PDV-a (čl. 90. st. 1. i 2. Zakona o PDV-u)*.

---

### ČIN 4: "Boje tvoje galije" (Memorandum, Pečat i Tema)
- **Žigina replika (Glas + Titl):**
  > *„Svaki dubrovački trgovački brod imao je svoj stijeg i pečat. Tvoj račun je tvoja posjetnica. Izaberi boje pod kojima ploviš, a ako imaš logo, samo ga povuci ovamo. Ako nemaš, ja ću ti složiti oštar digitalni pečat s tvojim OIB-om.”*
- **Interaktivni elementi:**
  - **Paleta 5 Dubrovačkih Tema (trenutni pregled na klik):**
    1. *Knežev Purpur* (Midnight Amethyst)
    2. *Zelenci s Luže* (Emerald Stone)
    3. *Jadranska Bonaca* (Cobalt Sea)
    4. *Dubrovački Dukat* (Ducat Gold)
    5. *Klesani Kamen* (Carbon Minimal)
  - **Učitavanje logotipa:** Drag-and-drop zona s trenutnim pregledom.
  - **Digitalni pečat:** Prekidač *„Uključi digitalni pečat s potpisom na memorandumu”*.

---

### ČIN 5: "Prvi Rez — Krštenje prvog računa" (Realizacija bez treme)
- **Žigina replika (Glas + Titl):**
  > *„Evo ga, gosparu! Sve smo postavili. Da razbijemo i zadnji atom treme, složio sam ti tvoj prvi račun — Račun broj 1-1-1. Pogledaj ga desno: tu je tvoj memorandum, tvoj IBAN i gotova HUB-3 uplatnica s barkodom. Jedan klik i u igri si.”*
- **Elementi prikaza:**
  - **Mini A4 Live Preview:** Živi prikaz stvarnog računa koji je upravo kreiran s podacima koje je korisnik unio u prethodnim koracima.
  - **Jedna ogledna stavka:** Npr. *"Usluge prema ugovoru / narudžbi"* — 1 kom × 100,00 €.
  - **Glavni akcijski gumb (zlatni, pulsirajući):**
    - **`[ ⚔️ IZDAJ MOJ PRVI RAČUN (F2) ]`**
- **Nakon klika:**
  - Suptilni zlatni konfeti / animacija prstena.
  - Žigina završna trijumfalna replika:
    > *„Čestitam! Led je probijen, račun je u tvojoj lokalnoj arhivi, a knjiga prometa je otvorena. Sad si gazda u svojoj kući. Kad god zatrebaš savjet, stisni Alt+S za Start Centar ili me pozovi s Alt+Z. Sretna plovidba!”*
  - Automatsko preusmjeravanje na čistu radnu plohu unosa (`#home`).

---

## 4. TEHNIČKA ARHITEKTURA KOMPONENTI I POHRANE

### 4.1. Struktura novih datoteka

```
apps/web/src/
├── components/
│   └── onboarding/
│       ├── OnboardingWizardModal.tsx    # Glavni modalni kontejner s 5 činova
│       ├── OnboardingHeader.tsx         # Žigo amblem, glasovni val i kontrola zvuka
│       ├── OnboardingStepGreeting.tsx   # Čin 1: Upoznavanje i odabir načina
│       ├── OnboardingStepProfile.tsx    # Čin 2: Naziv, vlasnik i OIB (MOD 11)
│       ├── OnboardingStepFinancials.tsx # Čin 3: IBAN, banka, KPD i prag
│       ├── OnboardingStepBranding.tsx   # Čin 4: Teme, logo i pečat
│       └── OnboardingStepFirstInvoice.tsx # Čin 5: Mini A4 pregled i prvi rez
├── hooks/
│   └── useOnboardingWizard.ts           # Upravljanje stanjem, koracima i perzistencijom
└── services/
    └── onboarding-dialogues.ts          # Zvučni tekstovi, titlovi i replike Žiga
```

### 4.2. Domenski model i perzistencija u Dexie (`dexie-db.ts`)
U tablicu postavki ili profila obrta dodajemo polja:
```typescript
export interface OnboardingState {
  isCompleted: boolean;
  completedAt?: string;
  lastCompletedStep: number;
  mode: 'WIZARD' | 'DEMO' | 'SKIPPED';
}
```

Ako `isCompleted === false` ili u bazi ne postoji profil sa stvarnim OIB-om, aplikacija pri pokretanju automatski aktivira `OnboardingWizardModal`.

### 4.3. Zvučna integracija (`onboarding-dialogues.ts`)
```typescript
export interface OnboardingDialogue {
  step: number;
  speechText: string;    // Tekst koji se šalje u Google TTS / Web Speech
  displayText: string;   // Skraćeni ili formatirani titl za prikaz na ekranu
  emphasisPhrase?: string; // Ključna fraza označena zlatnom bojom
}

export const ONBOARDING_DIALOGUES: Record<number, OnboardingDialogue> = {
  1: {
    step: 1,
    speechText: "Pozdravljam te, gosparu! Ja sam Žigo, digitalni Orlando ove naše Kripto-Republike...",
    displayText: "Pozdravljam te, gosparu! Ja sam Žigo, digitalni Orlando. Sjedni i odahni — tvoj obrt je tvoja sloboda.",
    emphasisPhrase: "tvoj obrt je tvoja sloboda"
  },
  // ... činovi 2 do 5
};
```

---

## 5. INTEGRACIJSKE TOČKE U POSTOJEĆI SUSTAV

1. **U [`App.tsx`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/App.tsx):**
   - Dodavanje `isOnboardingOpen` stanja.
   - Prikaz `<OnboardingWizardModal>` ako obrtnik još nije dovršio onboarding ili ako je eksplicitno pozvan.
2. **U [`StartHubModal.tsx`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/components/layout/StartHubModal.tsx):**
   - Dodavanje istaknute kartice u brzim radnjama:
     *„🎓 Upoznaj Žiga i postavi obrt — Pokreni čarobnjak za postavljanje”*.
3. **U [`SettingsWorkspaceView.tsx`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/components/settings/SettingsWorkspaceView.tsx):**
   - Gumb u sekciji "Profil": *„Pokreni Onboarding Wizard ispočetka”*.

---

## 6. PLAN IMPLEMENTACIJE PO KORACIMA

### KORAK 1: Domenski dijalozi, zvučne replike i State Hook
- **Zadatak 1.1:** Napisati `onboarding-dialogues.ts` s autentičnim dubrovačkim tekstovima za svih 5 činova.
- **Zadatak 1.2:** Implementirati hook `useOnboardingWizard.ts` s podrškom za lokalno spremanje u Dexie, validaciju OIB-a i upravljanje koracima.

### KORAK 2: Izrada UI Komponenata Wizarda
- **Zadatak 2.1:** Kreirati `OnboardingWizardModal.tsx` s modernim staklenim dizajnom, oštrim rubovima i zlatnim Orlando akcentima.
- **Zadatak 2.2:** Implementirati podkomponente za činove 1 do 5 s interaktivnim kontrolama (`OibInput`, `IbanInput`, odabir tema, mini A4 preview).

### KORAK 3: Glasovna integracija i interakcija sa Žigom
- **Zadatak 3.1:** Povezati `useAudioTransport` tako da pri svakom prijelazu na novi korak Žigo automatski izgovara repliku (uz mogućnost `Mute`).
- **Zadatak 3.2:** Dodati vizualni audio val (`voice waveform`) koji pulsira dok Žigo govori i sinkronizirane titlove.
- **Zadatak 3.3:** Omogućiti mikrofon (STT) za diktiranje OIB-a i naziva obrta.

### KORAK 4: "Prvi Rez" i povezivanje s bazom i radnom plohom
- **Zadatak 4.1:** Spojiti završni korak tako da klik na *„Izdaj moj prvi račun”* kreira stvarni `Racun br. 1-1-1` u bazi s unesenim profilom.
- **Zadatak 4.2:** Osvježiti `stats` i radnu plohu tako da korisnik odmah vidi svoj gotov račun i prvu stavku u KPR-u.
- **Zadatak 4.3:** Dodati okidače u `App.tsx` (prvo pokretanje) i `StartHubModal.tsx` (manualno pokretanje).

### KORAK 5: Verifikacija, responzivnost i testovi
- **Zadatak 5.1:** Napisati unit testove `apps/web/tests/onboarding-wizard.test.ts` (testiranje koraka, OIB validacije, dovršetka i glasovnih replika).
- **Zadatak 5.2:** Testirati ponašanje na svim ekranima (od mobitela do 4K) i u svih 5 dubrovačkih tema.
- **Zadatak 5.3:** Izvršiti produkcijski build i provjeriti performanse.

---

## 7. KRITERIJI USPJEHA (GATE-CHECK)

| Kriterij | Metrika / Uvjet | Cilj |
|---|---|---|
| **Vrijeme do realizacije** | Od otvaranja aplikacije do izdanog prvog računa s valjanim OIB-om i IBAN-om | < 90 sekundi |
| **Razbijanje treme** | Žigo staloženim glasom i toplim tonom objašnjava svaki korak bez birokratskog žargona | 100% pokrivenost glasom i titlovima |
| **Točnost podataka** | Nemoguće je završiti wizard s nevaljanim OIB-om (MOD 11) ili pogrešnim IBAN formatom | 100% validacija |
| **Lokalna suverenost** | Svi uneseni podaci ostaju 100% lokalno u pregledniku korisnika (Dexie IndexedDB) | 0 poslužiteljskih poziva |
| **Prijelaz na radnu plohu** | Nakon klika na "Izdaj", korisnik je na glavnoj plohi, račun je u arhivi, a KPR je inicijaliziran | Besprijekoran prijelaz bez skrolanja |

---

*Dokument sastavljen i arhiviran u bazi projekta: `docs/plan_implementacije_onboarding_wizard_upoznaj_ziga.md`.*
