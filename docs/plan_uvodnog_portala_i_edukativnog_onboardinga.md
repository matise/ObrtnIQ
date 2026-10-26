# Plan Implementacije: Uvodni Portal ObrtnIQ & Edukativni Onboarding
## "Od Praznog Papira do Suverenog Obrtnika" (Brz, Jasan, Lak i Edukativan Proces)

**Status:** Planiranje i Arhitektura (Verzija 1.0)  
**Datum:** 26. listopada 2026.  
**Autor:** Matija & DeepMind Antigravity Pair  
**Projekt:** ObrtnIQ v3.0 — Dubrovačka Kripto-Republika  
**Povezani dokumenti:**
- [plan_implementacije_onboarding_wizard_upoznaj_ziga.md](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/docs/plan_implementacije_onboarding_wizard_upoznaj_ziga.md)
- [plan_redizajna_ui_centar_toolbar_i_sustav_dokumentacije.md](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/docs/plan_redizajna_ui_centar_toolbar_i_sustav_dokumentacije.md)
- [zigo_specifikacija_i_sistemski_prompt.md](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/docs/zigo_specifikacija_i_sistemski_prompt.md)

---

## 1. Kontekst i Korisnički Uvid (Problem "Popunjene Forme")

U dosadašnjoj početnoj verziji Onboarding Wizarda, forma za unos novog obrta (Čin 2: Kapetan Obrta) inicijalizirala se preuzimanjem zadanog profila (`DEFAULT_OBRT_PROFIL`):
- Puni naziv obrta: *Orlando Libertas, obrt za programiranje i savjetovanje*
- Ime i prezime vlasnika: *Vlaho Sorkočević*
- OIB obrta / vlasnika: *69435151530*
- Ulica i broj: *Placa Stradun 1*
- Poštanski broj i mjesto: *20000 Dubrovnik*

### Zašto je to problematično za korisničko iskustvo (UX)?
1. **Gubitak osjećaja osobnog vlasništva:** Korisnik koji tek otvara aplikaciju ne želi uređivati tuđe podatke. Želi započeti sa **svojim obrtom** na čistom papiru.
2. **Pasivnost umjesto aktivne validacije:** Kada su polja već popunjena, validacija (npr. zeleni bedž `ISO MOD 11 Ispravan`) već stoji zelena, pa korisnik ne doživljava trenutak kada sustav prepoznaje i potvrđuje **njegov vlastiti OIB** ili IBAN.
3. **Konfuzija između primjera i stvarnosti:** Korisnik se pita: *"Je li ovo moj obrt ili demo račun? Moram li sve brisati slovo po slovo?"*

### Nova Paradigma: Clean Slate + Interaktivna Validacija + Edukativni Primjer
- **Prazan početak (Clean Slate):** Sva polja počinju prazna s jasnim i elegantnim placeholderima koji sugeriraju format.
- **Validacija u realnom vremenu (Gate-Check):** Tipka *"Sljedeći korak"* vodi korisnika korak po korak i postaje aktivna tek kada su obavezna polja trenutnog koraka ispravna.
- **Primjer kao pomoć, a ne teret:** Podaci iz primjera (*Orlando Libertas / Vlaho Sorkočević / 69435151530*) premještaju se u **Žigove edukativne upute** i opcionalni gumb `[ 💡 Pogledaj primjer ]` ili `[ Popuni primjerom za test ]`. Ako korisnik zapne ili nema pri ruci svoj OIB, Žigo mu priskače u pomoć s objašnjenjem.

---

## 2. Četiri Stupa Uvodnog Portala

```
┌────────────────────────────────────────────────────────────────────────┐
│                   UVODNI PORTAL OBRTNIQ (ČETIRI STUPA)                  │
├────────────────────┬────────────────────┬──────────────────────────────┤
│ 1. BRZ (FAST)      │ 2. JASAN (CLEAR)   │ 3. LAK (EASY)                │
│ • Autofokus polja  │ • OIB MOD 11 brojač│ • Bez birokratskog žargona   │
│ • Enter za naprijed│ • Prepoznavanje    │ • Žigo kao mentor i oslonac  │
│ • Samo 5 činova    │   banke u letu     │ • Mogućnost "Nazad" bez gub. │
├────────────────────┴────────────────────┴──────────────────────────────┤
│ 4. EDUKATIVAN (EDUCATIONAL)                                            │
│ • Objašnjenje ZAŠTO je koji podatak potreban (Porezna, HUB-3, KPD 2025)│
│ • Žigova kartica primjera (Orlando Libertas) na zahtjev jednim klikom  │
│ • Usklađeno s paušalnim pragom 40.000 € i čl. 90. Zakona o PDV-u       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detaljan Pregled Činova s Validacijom Korak po Korak

### ČIN 1: Prijateljski Stisak Ruke (Izbor Puta)
- **Cilj:** Razbijanje administrativne treme, dobrodošlica i izbor načina rada.
- **Govor Žiga:**  
  > *"Pozdravljam te, gosparu! Ja sam Žigo, digitalni Orlando ove naše Kripto-Republike. Ako ti srce malo brže lupa od same pomisli na poreznu, obrasce i zakone, na pravom si mjestu. Ovdje si svoj na svome. Nema vanjskih servera koji njuškaju po računima. Hoćemo li postaviti tvoj pravi obrt, ili želiš prvo isprobati kako sve radi na gotovom primjeru?"*
- **Dvije jasne staze (Dual Path):**
  1. `[ 🚀 Započni unos mog obrta ]` *(Glavna akcija — vodi na prazan Čin 2)*
  2. `[ 🧪 Učitaj primjer (Orlando Libertas) ]` *(Za istraživanje bez unosa svojih podataka)*

---

### ČIN 2: Kapetan Obrta (Puni Naziv, Vlasnik i OIB)
- **Cilj:** Postavljanje osnovnog pravnog identiteta obrta uz provjeru kontrolne znamenke.
- **Početno stanje:** **Sva polja su prazna (`""`).**
- **Polja i validacija:**
  1. **Puni naziv obrta (`*` Obavezno):**
     - *Placeholder:* `npr. Atelijer Ragusa, obrt za dizajn i keramiku, vl. Marko Marojica`
     - *Validacija:* Minimalno 3 znaka.
     - *Edukativni savjet Žiga:* *"Zakon o obrtu traži: naziv obrta, djelatnost i tvoje ime. Možeš ga kasnije promijeniti u bilo kojem trenu."*
  2. **Ime i prezime vlasnika (`*` Obavezno):**
     - *Placeholder:* `npr. Marko Marojica`
     - *Validacija:* Minimalno 2 riječi (ime i prezime).
  3. **OIB obrta / vlasnika (`*` Obavezno):**
     - *Placeholder:* `11 znamenki (npr. 69435151530)`
     - *Živi indikator unosa:*
       - `0/11` — Siva oznaka unosa
       - `1..10/11` — Žuti brojač: *"Upiši još X znamenki"*
       - `11/11` Neispravno — Crveni bedž: `⚠ ISO MOD 11 Neispravan` (objašnjenje: *"Zadnja kontrolna znamenka ne odgovara formuli Porezne uprave"*)
       - `11/11` Ispravno — Zeleni sjajni bedž: `✓ ISO MOD 11 Ispravan`
  4. **Adresa (Ulica, broj, poštanski broj i mjesto):**
     - *Placeholderi:* `npr. Gundulićeva poljana 3`, `20000`, `Dubrovnik`
     - *Podrazumijevano:* Poštanski broj i mjesto mogu imati pametni prijedlog `20000 Dubrovnik` ili biti prazni uz brzi odabir.
- **Žigova pomoćna kartica (`[ 💡 Pogledaj primjer ]`):**
  - Klikom na gumb prikazuje se oblačić s podacima sa slike:  
    *Naziv: Orlando Libertas, obrt za programiranje i savjetovanje*  
    *Vlasnik: Vlaho Sorkočević*  
    *OIB: 69435151530*  
    *Adresa: Placa Stradun 1, 20000 Dubrovnik*
  - Mogućnost: `[ Primijeni ovaj primjer u formu ]` ako korisnik ne želi sam tipkati.
- **Gate-Check za prelazak:** Tipka `Sljedeći korak ->` onemogućena je dok naziv nema ≥ 3 znaka, ime i prezime ≥ 2 riječi, a OIB nije prošao MOD 11 validaciju.

---

### ČIN 3: Žila Kucavica (IBAN & KPD 2025 Djelatnost)
- **Cilj:** Postavljanje poslovnog računa za uplate i službene klasifikacije djelatnosti.
- **Početno stanje:** Polje IBAN je prazno.
- **Polja i validacija:**
  1. **IBAN žiro-računa (`*` Obavezno):**
     - *Placeholder:* `HR................... (21 znak)`
     - *Interaktivna detekcija:*
       - Čim korisnik unese prvih 7 znamenki (`HRxx2360000...`), u realnom vremenu se prikazuje bedž banke:
         - `2360000` -> Zagrebačka banka d.d.
         - `2340009` -> Privredna banka Zagreb d.d.
         - `2402006` -> Erste & Steiermärkische Bank d.d.
         - `2390001` -> Hrvatska poštanska banka d.d.
         - `2484008` -> Raiffeisenbank Austria d.d.
         - `2500009` -> Addiko Bank d.d.
       - Na 21 znaku vrši se ISO 13616 / MOD 97 provjera: zeleni bedž `✓ Valjan HR IBAN`.
  2. **Primarna djelatnost obrta (KPD 2025):**
     - Prikaz 6 najčešćih paušalnih kartica (IT razvoj `62.01.11`, Poslovno savjetovanje `70.22.10`, Dizajn `74.10.19`, Građevina `43.39.10`, Edukacije `85.59.19`, Foto/Video `74.20.21`).
     - Korisnik jednim klikom odabire svoju djelatnost.
- **Edukativni savjet Žiga:**
  - *"Zašto KPD 2025? Od 2025. godine Porezna uprava i standard e-Računa zahtijevaju službenu 6-znamenkastu šifru na svakom računu. Ako tvoje djelatnosti nema ovdje, ne brini — u Cjeniku možeš dodati bilo koju KPD šifru."*

---

### ČIN 4: Tvoj Pečat (Memorandum & 5 Dubrovačkih Tema)
- **Cilj:** Vizualni identitet računa i personalizacija radnog okruženja.
- **Interaktivni elementi:**
  1. **Odabir Dubrovačke Teme (5 kovanih stilova):**
     - *Knežev Purpur* (Amethyst `#A855F7`) — Noć nad Stradunom
     - *Zelenci s Luže* (Emerald `#10B981`) — Bronca Mara i Bara
     - *Jadranska Bonaca* (Cobalt `#38BDF8`) — More podno Lovrjenca
     - *Dubrovački Dukat* (Bronze `#F59E0B`) — Zlato Riznice Republike
     - *Klesani Kamen* (Carbon `#E4E4E7`) — Orlandov mač i kamene ploče
     - *Živi odaziv:* Klikom na temu odmah se mijenja paleta sučelja u pozadini!
  2. **Logo i Pečat obrta (Opcionalno):**
     - Mogućnost drag & drop uvoza loga ili digitalnog pečata.
     - Ako korisnik nema logo, Žigo generira **Dubrovački Kripto-Pečat** s OIB-om obrta.

---

### ČIN 5: Prvi Rez (Izdavanje Računa Br. 1-1-1)
- **Cilj:** Psihološki prijelaz iz straha u akciju — prvi račun je spreman za izdavanje.
- **Živi A4 Prikaz:**
  - Račun je složen **točno s podacima koje je korisnik upravo unio** u Činovima 2, 3 i 4.
  - Sadrži:
    - Zaglavlje s nazivom i adresom obrta
    - OIB i IBAN s detektiranom bankom
    - Stavku prema odabranoj KPD djelatnosti (npr. *10 sati razvoja softvera* ili *Dizajn vizualnog identiteta*)
    - Automatski generiranu HUB-3 uplatnicu s EPC barkodom
    - Zakonsku klauzulu za paušaliste: *"Oslobođeno PDV-a prema čl. 90. st. 2. Zakona o PDV-u"*
- **Glavni poziv na akciju (CTA):**
  - Veliki zeleni pulsirajući gumb: `[ ⚔️ IZDAJ MOJ PRVI RAČUN (F2) ]`
  - Klikom na gumb račun se fiskalizira u lokalnoj bazi, otvara se Knjiga prometa (KPR), čarobnjak se zatvara uz konfete/zvučnu čestitku Žiga, a korisnik se nalazi na radnoj plohi sa spremljenim gotovim računom!

---

## 4. Edukativni Sustav "Žigo Pomoćnik" (Ako Korisnik Zapne)

Za svaki čin implementira se edukativna ladica/oblačić koja se aktivira klikom na ikonu `💡 Savjet i Primjer`:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 💡 ŽIGOV EDUKATIVNI VODIČ: ČIN 2 — Identitet Obrta                     │
├────────────────────────────────────────────────────────────────────────┤
│ "Gosparu, zbunile su te rubrike? Evo kako to jednostavno riješiti:"    │
│                                                                        │
│ 1. Puni naziv: Prema čl. 15. Zakona o obrtu, naziv mora sadržavati     │
│    tvoje ime i vrstu djelatnosti.                                      │
│                                                                        │
│ 2. OIB: 11 znamenki. Zadnja je kontrolna po formuli ISO 7064 MOD 11.  │
│    Ako nemaš svoj OIB pri ruci, možeš upotrijebiti testni: 69435151530. │
│                                                                        │
│ 3. Primjer s dubrovačkog Straduna:                                     │
│    • Naziv: Orlando Libertas, obrt za programiranje i savjetovanje     │
│    • Vlasnik: Vlaho Sorkočević                                         │
│    • OIB: 69435151530                                                  │
│                                                                        │
│ [ 📋 Prekopiraj ovaj primjer u formu ]    [ Razumijem, pišem svoje ✕ ] │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Tehnički Plan Izvedbe (Action Plan)

| Korak | Komponenta / Datoteka | Opis zahvata | Status |
| :--- | :--- | :--- | :--- |
| **Korak 1** | [`useOnboardingWizard.ts`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/hooks/useOnboardingWizard.ts) | • Polja `naziv`, `vlasnikImePrezime`, `oib`, `ulicaIBroj`, `iban` inicijalizirati praznim stringovima `""`<br>• Ukloniti nasilno prepisivanje iz `DEFAULT_OBRT_PROFIL`<br>• Dodati `isStepValid` validator za svaki korak (Čin 2: naziv ≥3, vlasnik ≥2 riječi, OIB MOD 11; Čin 3: IBAN validan)<br>• Dodati akciju `loadExampleData()` za dobrovoljno popunjavanje primjerom | ⏳ Spremno |
| **Korak 2** | [`OnboardingWizardModal.tsx`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/components/onboarding/OnboardingWizardModal.tsx) | • U Činu 2 i 3 dodati jasne placeholder tekstove<br>• Onemogućiti tipku `Sljedeći korak ->` dok `isStepValid` nije `true`<br>• Dodati gumb i modal `[ 💡 Žigov savjet i primjer ]`<br>• Dodati podršku za tipku `Enter` za prelazak u iduće polje/korak | ⏳ Spremno |
| **Korak 3** | [`onboarding-dialogues.ts`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/services/onboarding-dialogues.ts) | • Ažurirati dijaloge sa stavom mentora koji ohrabruje unos s praznog papira<br>• Dodati edukativne tekstove za modal primjera | ⏳ Spremno |
| **Korak 4** | [`onboarding-wizard.test.ts`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/tests/onboarding-wizard.test.ts) | • Testirati da wizard na mountu starta s praznim poljima<br>• Testirati da je Čin 2 nevaljan dok polja nisu popunjena<br>• Testirati akciju `loadExampleData` | ⏳ Spremno |
| **Korak 5** | Testiranje i Build | • Pokrenuti `npm test --workspace=@obrtniq/web`<br>• Pokrenuti `npm run build` | ⏳ Spremno |

---

## 6. Verifikacijski Kriteriji (Gate-Checks)

1. **Clean Slate Provjera:** Kada novi korisnik otvori čarobnjak, sva tekstualna polja su prazna, a placeholderi jasno sugeriraju format.
2. **Progresivna Validacija:** Korisnik ne može kliknuti *"Sljedeći korak"* s neispravnim OIB-om ili praznim imenom.
3. **Edukativni Primjer na Zahtjev:** Primjer *"Orlando Libertas"* dostupan je unutar Žigova vodiča na klik, uz mogućnost automatskog prepisivanja u formu ako korisnik to zatraži.
4. **Potpuna Automatizacija Testova:** Svi postojeći i novi testovi prolaze 100% zeleno, bez regresija.

---
*Dokument je formalno unesen u repozitorij pod oznakom Faza 21+ Edukativni Onboarding.*
