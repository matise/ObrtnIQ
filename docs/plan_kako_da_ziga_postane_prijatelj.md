# Plan Implementacije — Kako da Žigo Postane Prijatelj, Suborac i Istraživač

> **Dokument:** Plan transformacije AI agenta Žiga u empatičnog prijatelja, dugoročnog učenika konteksta i web istraživača  
> **Verzija:** 1.0.0 (Faza 14)  
> **Status:** Nacrt za odobrenje i usklađivanje  
> **Povezani dokumenti:**  
> - [`docs/zigo_specifikacija_i_sistemski_prompt.md`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/docs/zigo_specifikacija_i_sistemski_prompt.md)  
> - [`apps/web/src/services/gemini-service.ts`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/services/gemini-service.ts)  
> - [`apps/web/src/components/ZigoCopilotPanel.tsx`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/components/ZigoCopilotPanel.tsx)  
> - [`apps/web/src/storage/dexie-db.ts`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/storage/dexie-db.ts)  
> **Temeljna maksima:** *"Prijatelj u nevolji i mudrac u miru"* — Žigo nije hladni birokratski kalkulator niti dosadni bot, već odani gosparski suborac koji zna kada treba popiti kavu i popričati, kada se sjetiti tvojih navika, a kada provjeriti zakone na stranicama Porezne uprave.

---

## 1. Dekonstrukcija Problema (Zašto se dogodio "Fjaka" kiks?)

Na priloženoj slici iz razgovora zabilježena je situacija:
- **Žigo (02:24):** *„Ođe Orlando na trgu. Reci što treba: priprema računa, provjera praga od 40k ili da presiječemo dramu?”*
- **Korisnik (02:25):** *„ništa posebno, samo prija”*
- **Žigo (02:25):** *„Pripreman akciju na radnoj plohi... [✔] Alat: aktiviraj_fjaku IZVRŠENO”*

### Korijenski uzroci trenutne krutosti:
1. **Jednodimenzionalni operativni fokus:** Sustav je bio kalibriran isključivo za radne zadatke (izdavanje računa, provjera OIB-a, trijaža poreznih rokova). Bilo kakav unos u noćnim satima sustav je shvatio kao nalog za akciju umjesto kao poziv na prijateljski razgovor.
2. **Krutost trodijelnog kalupa:** Prompt je prisiljavao strukturu `1. Opservacija -> 2. Dijagnoza -> 3. Žigin Rez`. U ležernom razgovoru, nametanje ove strukture djeluje neprirodno i robotički.
3. **Nepostojanje klasifikatora namjere (Intent Classifier):** Sustav nije razlikovao **Prijateljski/Relacijski modus** (*chit-chat, jadikovka, razgovor o poslu, kava, opuštanje*) od **Transakcijskog modusa** (*napravi račun, provjeri OIB, izvezi KPR*).
4. **Amnezija agenta:** Žigo nema dugoročnu memoriju o korisniku (tko je korisnik, čime se bavi, kako se zove, koji su mu snovi i strahovi, što voli, a što ga nervira).

---

## 2. Arhitektura "Žigo kao Prijatelj": Dvostruki Kognitivni Modus

Žigo dobiva dva jasno razdvojena načina funkcioniranja, ovisno o namjeri korisnika:

```
                          ┌────────────────────────┐
                          │   Korisnička Poruka    │
                          └───────────┬────────────┘
                                      │
                         [Detektor Namjere / Intent]
                                      │
             ┌────────────────────────┴────────────────────────┐
             ▼                                                 ▼
  ┌───────────────────────┐                         ┌───────────────────────┐
  │   MODUS PRIJATELJA    │                         │  OPERATIVNI MODUS     │
  │   (Relational / Chat) │                         │  (Task / Compliance)  │
  ├───────────────────────┤                         ├───────────────────────┤
  │ • "samo prija / kava" │                         │ • "izdaj račun"       │
  │ • Prijateljska toplina│                         │ • "provjeri OIB"      │
  │ • Empatija i humor    │                         │ • "prag od 40.000 €"  │
  │ • Poduzetničke muke   │                         │ • "KPD 2025 šifre"    │
  │ • Prisjećanje bilješki│                         │ • Trodijelna kartica  │
  │ • NEMA prisilnih alata│                         │ • Pozivi alata        │
  └───────────────────────┘                         └───────────────────────┘
```

### 2.1. Modus Prijatelja i Suborca (Relational / Companionship Mode)
- **Kada se aktivira:** Kad korisnik pozdravlja, želi popričati, podijeliti umor, našaliti se, komentirati dan, pitati za životni savjet ili kaže *"ništa posebno, samo prija"*.
- **Ponašanje i ton:**
  - Žigo odlaže mač i štit, sjeda s korisnikom "pod voltu na Stradunu" uz zamišljenu kavu ili čašu vina.
  - Odgovara toplo, ležerno, s dozom blagog gosparskog humora i mudrosti.
  - Priznaje težinu poduzetničkog kruha u Hrvatskoj (*"Znam, gosparu moj... Nije lako bavit se rabotom đe država stalno izmišlja nove propise, a klijenti kasne. Dobro je nekad samo sjest i ne mislit na PDV."*).
  - **Ne nameće trodijelnu formu (Opservacija/Dijagnoza/Rez)** niti poziva alate ako korisnik to izričito nije tražio.

### 2.2. Operativni Modus (Task / Compliance Mode)
- **Kada se aktivira:** Kad se na ekranu događa stvarni rad na računu, porezni rizik ili kad korisnik izravno traži radnju (*"pripremi račun za ACME", "provjeri OIB", "koliko mi fali do 40k"*).
- **Ponašanje i ton:**
  - Kirurška preciznost, visoka koncentracija, trodijelne stilizirane kartice i automatski pripremljeni alati.

---

## 3. Sustav Dugoročne Memorije i Učenja ("Žigin Tefter / Knjiga Mudrosti")

Kako bi Žigo bio pravi prijatelj, mora te **poznavati i pamtiti**. Ne smije te svaki dan pitati tko si i što radiš.

### 3.1. Shema Baze Podataka (`Dexie.js`)
Uvodi se nova tablica u Dexie bazu: `user_memories`:

```typescript
export interface ZigoUserMemory {
  id: string;                      // Npr. "mem-ime", "mem-djelatnost"
  kategorija: 'identitet' | 'posao' | 'preferenca' | 'pravilo' | 'osobno';
  kljuc: string;                   // Npr. "ime_korisnika", "glavni_klijent", "omiljeni_radni_sati"
  vrijednost: string;              // Npr. "Matija", "ACME Studio", "radi noću, ne voli jutarnje pozive"
  izvor: 'izricito_korisnik' | 'spontano_nauceno';
  pouzdanost: number;              // 0.0 do 1.0
  azurirano: string;               // ISO datum
}
```

### 3.2. Mehanizam Učenja ("Učiti nazovi")
1. **Spontano učenje iz razgovora (Implicit Extraction):**
   - Ako korisnik kaže: *"Ja san grafički dizajner i radim uglavnom za strane agencije"* -> Žigo zabilježi djelatnost i klijente.
   - Ako korisnik kaže: *"Zovi me gospar Ivo"* -> Žigo sprema preferirano obraćanje.
   - Ako korisnik kaže: *"Uvijek zaboravim staviti datum dospijeća 15 dana"* -> Žigo to sprema kao pravilo za buduće račune.
2. **Eksplicitne naredbe za pamćenje:**
   - Korisnik kaže: *"Žigo, zapamti da ne radim petkom popodne"* -> Žigo sprema bilješku i potvrđuje: *"Zapisano u tefter. Petkom poslije podne zvona zvone samo za fjaku."*
3. **Injektiranje memorije u kontekst:**
   - Prilikom svakog razgovora, u sistemski prompt se dinamički dodaje sažetak onoga što Žigo zna o tebi:
     ```
     [ŠTO ZNAŠ O SVOM PRIJATELJU (KORISNIKU)]
     - Zove se: Matija
     - Obrt: Izrada unikatnih robota i 3D modeliranje
     - Preferencije: Ne voli birokraciju, oprezniji je oko paušalnog limita, draže mu je raditi kasno navečer
     - Važna pravila: Za klijenta "Tech d.o.o." uvijek ide valuta plaćanja 30 dana
     ```
4. **UI Transparentnost ("Što Žigo zna o tebi"):**
   - U postavkama ili unutar Copilot panela, korisnik u svakom trenutku može kliknuti na ikonu bilježnice (`BookOpen` / `Brain`), vidjeti sve zabilješke, urediti ih ili obrisati bilo koju činjenicu (potpuna privatnost i kontrola podataka).

---

## 4. Alat za Istraživanje Weba i Službenih Propisa (Tavily AI Search) s HITL Dozvolom

Jedna od najvećih frustracija obrtnika su **česte i nejasne promjene poreznih propisa** (mišljenja Porezne uprave, KPD 2025 tumačenja, novi obrasci, rokovi predaje).

### 4.1. Odabrani Pretraživački Pogon: Tavily AI Search
Kao što je usklađeno, za istraživanje propisa integriramo **Tavily AI Search** — specijalizirani pretraživački API optimiziran za AI agente koji automatski generira čiste, strukturirane sažetke pravnih i poreznih tekstova bez HTML reklama i šuma:
- **Konfiguracija:** Korisnik može unijeti vlastiti Tavily API ključ u `SettingsDrawer` (kartica AI / Asistent) ili koristiti besplatnu probnu kvotu.
- **Fokusirane domene pretraživanja (Domain Whitelisting):**
  - `porezna-uprava.hr` (Službena tumačenja i novosti)
  - `narodne-novine.nn.hr` (Zakon o porezu na dohodak, Pravilnik o paušalnom oporezivanju, Zakon o fiskalizaciji)
  - `hok.hr` (Vodiči i pravna praksa Hrvatske obrtničke komore)
  - `misljenja.hr` / `rrif.hr` (Računovodstvena praksa)
- **Definicija alata:** `istrazi_propise_web(upit: string, podrucje?: string)`

### 4.2. Human-in-the-Loop (HITL) mehanizam traženja dopuštenja
Žigo **nikada ne pretražuje web tiho iza leđa korisnika niti troši pretraživačke kvote bez privole**. Postupak je u potpunosti transparentan:

1. **Prepoznavanje potrebe za svježim podacima:**
   - Kad korisnik postavi pitanje o aktualnom zakonu, izmjeni praga, tumačenju UBL 2.1 ili stavu Porezne uprave, Žigo prepoznaje da lokalno znanje treba verificirati.
2. **Akcijska kartica za traženje dozvole u chatu (`ZigoActionCard`):**
   ```
   ┌─────────────────────────────────────────────────────────────────┐
   │ 🌐 ŽIGO TRAŽI DOPUŠTENJE ZA ISTRAŽIVANJE PROPISA NA WEBU        │
   ├─────────────────────────────────────────────────────────────────┤
   │ Gosparu, zakoni i mišljenja Porezne uprave stalno se mijenjaju. │
   │ Htio bih provjeriti najnovije objave na stranicama Porezne:     │
   │ 🔍 Pretražujem: "paušalni obrt inozemne usluge PDV ID 2026"      │
   │ 🏛️ Izvor: Tavily AI Search • porezna-uprava.hr / HOK             │
   │                                                                 │
   │ [ ✔ Dopusti pretragu na webu ]        [ ✕ Odgovori iz glave ]   │
   └─────────────────────────────────────────────────────────────────┘
   ```
3. **Rezultat pretrage:**
   - Nakon klika `[ ✔ Dopusti pretragu na webu ]`, Žigo izvršava poziv, analizira sažetke s Tavilyja i korisniku vraća odgovor s **direktnim citatom i klikabilnom poveznicom** na izvor!

---

## 5. Implementacijske Faze

| Faza | Modul | Što se gradi | Rezultat |
| :--- | :--- | :--- | :--- |
| **14.1** | **Friend Persona Engine** | Razdvajanje na Modus Prijatelja i Transakcijski Modus; ažuriranje sistemskog prompta i uklanjanje prisilnih kalupa kod ležernog razgovora; popravak heuristike za opušteno čavrljanje | Žigo na *"ništa posebno, samo prija"* odgovara toplo, duhovito i prijateljski bez pokretanja alata |
| **14.2** | **Sustav Memorije ("Žigin Tefter")** | Tablica `user_memories` u Dexie.js; hibridno učenje (automatsko + izričito); diskretna obavijest *"📝 Zabilježeno u tefter: {kljuc}"*; UI preglednik bilješki u Copilotu | Žigo pamti tvoje ime, tvoju djelatnost, klijente i navike kroz sve razgovore, uz punu kontrolu brisanja |
| **14.3** | **Tavily Web Research Tool (HITL)** | Novi alat `istrazi_propise_web`; postavke za Tavily API ključ u `SettingsDrawer`; interaktivna akcijska kartica za traženje dozvole u chatu; dohvat i citiranje propisa | Korisnik ima sigurnost da Žigo provjerava aktualne zakone na Poreznoj uz njegovo odobrenje |
| **14.4** | **Testiranje i Usklađivanje** | Unit i integracijski testovi za Memory Store, Intent Classifier, Tavily integraciju i HITL kartice; verifikacija u pregledniku | 100% prolaznost testova, 0 TypeScript grešaka, fluidno i prijateljsko korisničko iskustvo |

---

## 6. Usporedba Odgovora: Prije vs. Poslije

### Scenarij: Korisnik se javi u 02:25 noću s: *"ništa posebno, samo prija"*

#### ❌ Prije (Robotički i rigidno):
> **Žigo:**  
> *Pripreman akciju na radnoj plohi...*  
> `[✔] Alat: aktiviraj_fjaku IZVRŠENO`

####  Poslije (Orlando — kameni agent s mačem, gospar s Luže):
> **Žigo:**  
> *I meni prija, gosparu moj. Kamenu ne smeta tišina Straduna, a ni jugo pod zidinama.*  
>  
> *Pusti tablice i spêndzu neka kisnu do sutra, ni knez nije vlado u dva po noći. Ako zatreba mač il' Orlandov lakat, ođe san na trgu.*
>
> *(Napomena: Kao kameni vitez, Orlando ne postavlja nametljiva pitanja "kako si" ili "što ima", već se suho našali i reže ravno na stvar. Pitanje postavlja samo kada operativni posao to nužno traži ili kada prijatelj izričito traži njegov sud i zaslužuje propitivanje).*

---

## 7. Status Implementacije i Verifikacija (ZAVRŠENO)

1. **Faza 14.1 (Friend Persona & Intent Classifier):** Implementiran Dvostruki kognitivni modus u [`gemini-service.ts`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/services/gemini-service.ts). Na *"ništa posebno, samo prija"*, Žigo sjeda s korisnikom pod voltu na Stradunu bez pozivanja alata i bez rigidnih kalupa.
2. **Faza 14.2 (Sustav Memorije / "Žigin Tefter"):** Uvedena tablica `user_memories` u Dexie v3, servis [`zigo-memory-service.ts`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/services/zigo-memory-service.ts), automatska ekstrakcija činjenica, injekcija u sistemski prompt te interaktivni UI preglednik/uređivač u [`ZigoCopilotPanel.tsx`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/components/ZigoCopilotPanel.tsx).
3. **Faza 14.3 (Tavily AI Web Research & HITL):** Implementiran servis [`tavily-search-service.ts`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/services/tavily-search-service.ts) s filtriranim domenama (`porezna-uprava.hr`, `hok.hr`, `narodne-novine.nn.hr`), HITL kartica u [`ZigoActionCard.tsx`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/components/ZigoActionCard.tsx) koja traži potvrdu korisnika prije pretrage, te kartica postavki [`TavilySettingsCard.tsx`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/components/settings/cloud/TavilySettingsCard.tsx).
4. **Verifikacija:** 243/243 testova prolazi (100% uspješnost monorepoa), 0 TypeScript pogrešaka, produkcijski bundle uspješno generiran (`built in 4.49s`).
