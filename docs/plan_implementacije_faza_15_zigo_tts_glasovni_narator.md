# Plan Implementacije — Faza 15: Žigo Glasovni Narator & Globalni Audio Transport (In-Browser TTS, Element-by-Element Čitanje & Centralizirana Playlista)

> **Dokument:** Arhitektonski i operativni plan implementacije audio naracije i globalnog transporta zvuka  
> **Status:** Nacrt spreman za implementaciju  
> **Povezani dokumenti:**  
> - [`docs/plan_implementacije_faza_14_zigo_stt_v2_glasovni_asistent.md`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/docs/plan_implementacije_faza_14_zigo_stt_v2_glasovni_asistent.md)  
> - [`docs/plan_implementacije_faza_13_zigo_omni_copilot.md`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/docs/plan_implementacije_faza_13_zigo_omni_copilot.md)  
> - [`docs/arhitektura_zigo_ai_agenta.md`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/docs/arhitektura_zigo_ai_agenta.md)  
> **Temeljna maksima:** *"Non bene pro toto libertas venditur auro"* — 100% In-Browser, nula vanjskih servera, jedan jedini izvor zvuka (Single Active Speaker), stoički ritam i potpuna korisnička kontrola nad zvukom.

---

## 1. Ciljevi i Vizija Sustava

Nakon što je Faza 14 uspješno omogućila klijentski unos glasa (Speech-to-Text / STT), Faza 15 zatvara dvosmjernu glasovnu petlju uvođenjem **Glasovnog Naratora (Text-to-Speech / TTS)** za Žigove poruke.

### Glavni zahtjevi korisnika:
1. **Ikona / alat za čitanje na svakoj Žiginoj poruci:**
   - Korisnik može kliknuti na ikonu zvučnika na pojedinačnoj poruci kako bi pokrenuo glasovno čitanje.
   - Generiranje i sinteza odvijaju se **asinkrono i element-po-element** (npr. Opservacija ➔ Dijagnoza ➔ Žigin Rez).
2. **Centralizirani Globalni Audio Transport (Playlist / Queue):**
   - **Invarijanta jednog govornika:** Ni pod kojim uvjetima ne smije doći do preklapanja više glasova istovremeno.
   - Sustav se ponaša poput inteligentne playliste s redom čekanja (`AudioQueue`).
   - Ako korisnik klikne čitanje nove poruke dok prethodna još govori, nova poruka se uredno stavlja u red ili preuzima prioritet prema korisničkoj odluci.
3. **Globalne kontrole za zvuk (Master Controls):**
   - **STOP:** Trenutačni prekid sveg govora i pražnjenje reda čekanja.
   - **MUTE / UNMUTE:** Trenutačno utišavanje zvuka bez gubljenja pozicije u tekstu.
   - **PAUSE / RESUME:** Privremeno zaustavljanje i nastavak izgovora.
   - **SKIP NEXT / PREV:** Preskakanje na idući ili prethodni element u redu čitanja.
4. **Auto-Read način rada (Automatsko čitanje novih odgovora):**
   - Prekidač u sučelju kojim korisnik može uključiti da Žigo automatski naglas pročita svaki novi pristigli odgovor, bez potrebe za ručnim klikanjem.
5. **Sinkronizirano vizualno isticanje (Karaoke / Glow Highlight):**
   - Dok Žigo naglas čita određenu sekciju ili rečenicu, taj se element u sučelju vizualno ističe jantarnim orlandovskim sjajem.

---

## 2. Arhitektura Sustava (100% In-Browser & Zero-Server)

Cjelokupna sinteza govora odvija se unutar preglednika koristeći standardni **Web Speech Synthesis API (`window.speechSynthesis`, `SpeechSynthesisUtterance`)**, uz podršku za hrvatski jezik (`hr-HR`).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        KORISNIČKO SUČELJE (ZigoCopilotPanel)                           │
│                                                                                        │
│   [Poruka #1] ─── Ikona "Čitaj" (Volume2) ──┐                                         │
│   [Poruka #2] ─── Auto-Read okidač ─────────┼──► Asinkrono parsiranje teksta           │
│                                              │    (parseZigoSections / rečenice)       │
│                                              ▼                                         │
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │                  AudioTransportContext (Globalni Upravljač Zvukom)                 │ │
│ │ ────────────────────────────────────────────────────────────────────────────────── │ │
│ │ • Playlist Queue: [ Item 1: Opservacija, Item 2: Dijagnoza, Item 3: Žigin Rez ]    │ │
│ │ • Status: 'idle' | 'playing' | 'paused' | 'muted'                                  │ │
│ │ • Aktivni element: { messageId, sectionIndex, elementId, text }                     │ │
│ │ • Kontrole: play(), pause(), resume(), stop(), toggleMute(), toggleAutoRead()      │ │
│ └────────────────────────────────────┬───────────────────────────────────────────────┘ │
│                                      │                                                 │
│                                      ├─► window.speechSynthesis (hr-HR, pitch, rate)   │
│                                      │                                                 │
│                                      ▼                                                 │
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │                ZigoGlobalAudioTransport (Master Kontrolna Traka)                   │ │
│ │ ────────────────────────────────────────────────────────────────────────────────── │ │
│ │ [⏮] [⏯ Pauza/Nastavi] [⏹ STOP] [⏭] [🔊 MUTE] [Auto-čitaj: ON/OFF]                │ │
│ │ Prikaz: "Žigo govori: Opservacija • Pao je i Napoleon..." (Dio 1/3)                │ │
│ └────────────────────────────────────────────────────────────────────────────────────┘ │
│                                      ▲                                                 │
│                                      │ Sinkronizacija stanja                           │
│                                      ▼                                                 │
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │                 ZigoMessageContent (Vizualno Isticanje Sekcije)                    │ │
│ │ ────────────────────────────────────────────────────────────────────────────────── │ │
│ │ • Aktivna sekcija dobiva jantarni obrub: ring-1 ring-[#ffd700] bg-[#ffd700]/5       │ │
│ └────────────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Faze Implementacije (Strukturirani Plan Razvoja)

Razvoj je organiziran u 6 povezanih i testabilnih faza:

```
  Faza 15.1: Domenski Model & Audio Parser (packages/core)
       │
       ▼
  Faza 15.2: Globalni AudioTransportContext & Hook (apps/web)
       │
       ▼
  Faza 15.3: UI Komponenta ZigoGlobalAudioTransport (Master Traka)
       │
       ▼
  Faza 15.4: Tipka za Čitanje na Žigovim Porukama (ZigoCopilotPanel)
       │
       ▼
  Faza 15.5: Sinkronizirano Isticanje Elemenata (ZigoMessageContent)
       │
       ▼
  Faza 15.6: Auto-Read Mehanizam & Cjelovita Validacija
```

---

### Faza 15.1: Domenski Model i Asinkroni Parser Naracije (`packages/core`)

* **Cilj:** Definirati tipove za audio red čekanja (`AudioQueueItem`) i funkciju za raščlanjivanje i čišćenje poruka u sekvence za izgovor.
* **Radni zadaci:**
  1. **Kreiranje datoteke [`packages/core/src/domain/audio-transport.ts`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/packages/core/src/domain/audio-transport.ts):**
     - Definiranje sučelja `AudioQueueItem`:
       ```typescript
       export interface AudioQueueItem {
         id: string; // npr. 'msg-123-sec-0'
         messageId: string;
         sectionIndex: number;
         sectionType: 'opservacija' | 'dijagnoza' | 'rez' | 'general' | 'intro';
         rawText: string;
         cleanTextForSpeech: string;
         label: string; // npr. "Opservacija", "Dijagnoza", "Žigin Rez"
       }
       ```
     - Definiranje sučelja `AudioTransportStatus`: `'idle' | 'playing' | 'paused' | 'stopped'`.
     - Definiranje konfiguracije `VoiceNarratorConfig`: `{ rate: number; pitch: number; autoRead: boolean; isMuted: boolean }`.
  2. **Funkcija `prepareMessageForNarration(messageId: string, rawText: string): AudioQueueItem[]`:**
     - Koristi strukturu Žiginih sekcija (Opservacija, Dijagnoza, Rez).
     - **Čišćenje Markdown oznaka:** Uklanjanje zvjezdica `**`, taraba `#`, backtickova i poveznica.
     - **Akustička optimizacija izgovora:**
       - "KPR" ➔ "K P R" (da se ne izgovara kao jedna nerazumljiva riječ).
       - "OIB" ➔ "O I B".
       - "ZKI" ➔ "Z K I".
       - "JIR" ➔ "J I R".
       - "€" ili "EUR" ➔ "eura".
       - "PO-SD" ➔ "P O S D obrazac".
  3. **Eksport u [`packages/core/src/index.ts`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/packages/core/src/index.ts).**
* **Izlazni artefakti:**
  - `packages/core/src/domain/audio-transport.ts`
  - `packages/core/tests/audio-transport.test.ts` (testovi parsiranja, čišćenja i fonetskih zamjena)

---

### Faza 15.2: Globalni `AudioTransportContext` i Hook (`apps/web`)

* **Cilj:** Implementirati jedinstveni, reaktivni upravljač zvukom koji kontrolira `window.speechSynthesis`, sprječava preklapanje glasova i upravlja redom čekanja.
* **Radni zadaci:**
  1. **Kreiranje [`apps/web/src/context/AudioTransportContext.tsx`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/context/AudioTransportContext.tsx):**
     - Stanja:
       - `queue: AudioQueueItem[]` (popis elemenata koji čekaju čitanje).
       - `currentIndex: number` (indeks elementa koji trenutno govori).
       - `status: AudioTransportStatus` ('idle', 'playing', 'paused', 'stopped').
       - `isMuted: boolean` (sprema se u `localStorage`).
       - `autoRead: boolean` (sprema se u `localStorage`).
       - `activeItem: AudioQueueItem | null`.
     - Metode:
       - `playMessage(messageId: string, text: string)`: Prazni trenutni red i odmah započinje čitanje odabrane poruke element-po-element.
       - `enqueueMessage(messageId: string, text: string)`: Dodaje poruku na kraj reda ako nešto već govori.
       - `pause()`: Poziva `speechSynthesis.pause()`.
       - `resume()`: Poziva `speechSynthesis.resume()`.
       - `stop()`: Poziva `speechSynthesis.cancel()`, prazni listu, postavlja status na `'idle'`.
       - `toggleMute()`: Utišava zvuk (postavlja volumen na 0 ili zaustavlja govor).
       - `toggleAutoRead()`: Mijenja postavku automatskog čitanja.
       - `skipNext()`: Odmah prelazi na idući element u redu.
       - `skipPrev()`: Vraća se na prethodni element.
  2. **Invarijanta jednog govornika (Single Active Speaker):**
     - Prije svakog `speechSynthesis.speak()` poziva se `speechSynthesis.cancel()`, osiguravajući da se glasovi nikada ne miješaju.
     - Automatski prelazak na idući element u redu kroz `utterance.onend`.
  3. **Konfiguracija glasa Orlanda:**
     - Pretraga dostupnih glasova u `speechSynthesis.getVoices()`.
     - Preferencija za hrvatski (`hr-HR`).
     - Postavke za stoički, miran dubrovački ton: `rate: 0.95`, `pitch: 0.92`.
  4. **Omotavanje aplikacije u `AudioTransportProvider` u [`apps/web/src/main.tsx`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/main.tsx).**
* **Izlazni artefakti:**
  - `apps/web/src/context/AudioTransportContext.tsx`
  - `apps/web/src/hooks/useAudioTransport.ts`

---

### Faza 15.3: UI Komponenta Master Kontrolne Trake (`ZigoGlobalAudioTransport`)

* **Cilj:** Pružiti korisniku jasan, uvijek dostupan kontrolni centar za audio reprodukciju s tipkama STOP, MUTE, PAUZA i prikazom aktivnog elementa.
* **Radni zadaci:**
  1. **Kreiranje [`apps/web/src/components/ZigoGlobalAudioTransport.tsx`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/components/ZigoGlobalAudioTransport.tsx):**
     - Dizajn u skladu s vizualnim identitetom (tamna tema `#141518`, jantarne bordure `#b89758`, zlatni detalji).
     - Prikazuje se na vrhu ili dnu `ZigoCopilotPanel` kada je `queue.length > 0` ili dok govor traje.
     - **Elementi sučelja:**
       - **Indikator govora:** Minijaturni rotirajući Orlandov Q-prsten i zvučni valovi.
       - **Tekstualni sažetak:** Naziv trenutne sekcije i isječak rečenice (*„Opservacija: Pao je i Napoleon...”*).
       - **Brojač elemenata:** npr. *„Dio 2 od 3”*.
       - **Glavne tipke:**
         - `[⏮]` Prethodni element.
         - `[⏸ / ▶]` Pauziraj / Nastavi izgovor.
         - `[⏹ STOP]` **Crvena tipka za trenutni prekid sveg zvuka**.
         - `[⏭]` Idući element.
         - `[🔊 / 🔇]` Mute prekidač.
         - `[Auto-čitaj]` Prekidač sa statusom (ON/OFF) i ikonom zvučnika s munjom.
  2. **Automatsko skrivanje u stanju mirovanja (`idle`):**
     - Kada nema aktivnog govora i red je prazan, traka prelazi u minimalistički diskretni indikator ili se povlači.
* **Izlazni artefakti:**
  - `apps/web/src/components/ZigoGlobalAudioTransport.tsx`

---

### Faza 15.4: Tipka za Čitanje na Žigovim Porukama (`ZigoCopilotPanel`)

* **Cilj:** Omogućiti korisniku pokretanje i zaustavljanje čitanja izravno s pojedinačne poruke u chatu.
* **Radni zadaci:**
  1. **Integracija u zaglavlje svake asistentske poruke:**
     - Dodavanje gumba `Volume2` u traci s vremenom poruke (`ŽIGO (ORLANDO) • 12:34`).
  2. **Pametna stanja ikone po poruci:**
     - **Miruje (Idle):** Siva/zlatna ikona `Volume2` — klik pokreće čitanje ove poruke.
     - **Govori (Playing):** Animirana zelena/zlatna ikona s pulsiranjem ili `Volume2` u plamenu — klik zaustavlja govor.
     - **U redu čekanja (Queued):** Žuta ikona sata ili broja u redu.
  3. **Rukovanje klikom:**
     - Ako korisnik klikne na poruku koja već govori ➔ poziva se `stop()`.
     - Ako klikne na novu poruku ➔ poziva se `playMessage(msg.id, msg.tekst)` i odmah započinje čitanje.
* **Izlazni artefakti:**
  - Modifikacija `apps/web/src/components/ZigoCopilotPanel.tsx`

---

### Faza 15.5: Sinkronizirano Isticanje Elemenata (Element-by-Element Highlight)

* **Cilj:** Osigurati vizualnu sinkronizaciju teksta i zvuka kako bi korisnik očima pratio točno onaj dio poruke koji Žigo u tom trenutku izgovara.
* **Radni zadaci:**
  1. **Proširenje [`apps/web/src/components/ZigoMessageContent.tsx`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/components/ZigoMessageContent.tsx):**
     - Prihvaća opcionalni prop `activeSectionIndex?: number` ili `activeMessageId?: string`.
     - Kada `activeItem?.messageId === currentMessageId && activeItem?.sectionIndex === idx`:
       - Sekcija dobiva prepoznatljivi jantarni sjaj:
         `border-[#ffd700] ring-1 ring-[#ffd700]/60 bg-[#ffd700]/5 transition-all duration-300`
       - Dodaje se minijaturna ikona zvučnika u kutu aktivne sekcije koja diskretno pulsira dok govor traje.
  2. **Glatko automatsko skrolanje:**
     - Ako je poruka dugačka, prozor poruka automatski skrola kako bi trenutno govoreća sekcija ostala unutar vidnog polja.
* **Izlazni artefakti:**
  - Modifikacija `apps/web/src/components/ZigoMessageContent.tsx`

---

### Faza 15.6: Auto-Read Način Rada & Validacijski Cjevovod

* **Cilj:** Implementirati automatsko čitanje novih odgovora i provesti cjelokupno testiranje svih scenarija.
* **Radni zadaci:**
  1. **Auto-Read reakcija u `useZigoAgent`:**
     - Kada asistent uspješno generira novu poruku (`assistantMsg` spremljen u bazu):
       - Provjerava se `autoReadEnabled && !isMuted`.
       - Ako je uključeno, automatski se poziva `playMessage(assistantMsg.id, assistantMsg.tekst)`.
  2. **Sigurnosna zaštita od prekida rada:**
     - Ako korisnik u bilo kojem trenutku stisne tipku `Escape` ili klikne globalni `STOP`, govor se trenutno gasi.
     - Ako korisnik pokrene snimanje mikrofona (`startListening()` iz Faze 14), narator se automatski gasi (mute/stop) kako mikrofon ne bi snimao Žigin vlastiti glas (akustička jeka).
* **Izlazni artefakti:**
  - Modifikacija `apps/web/src/hooks/useZigoAgent.ts`
  - `apps/web/tests/zigo-audio-transport.test.ts`

---

## 4. Matrica Validacije i Koraci Provjere (Verification Gates)

| ID Provjere | Naziv Provjere | Što se točno testira | Kriterij prolaznosti (Pass Criteria) |
| :--- | :--- | :--- | :--- |
| **V15-1** | **Parser Naracije & Čišćenje** | `prepareMessageForNarration` na poruci s Opservacijom, Dijagnozom i Rezom | Točno generirana 3 elementa; očišćen Markdown; KPR zamijenjen s "K P R", OIB s "O I B". |
| **V15-2** | **Invarijanta Jednog Govornika** | Pokretanje čitanja poruke A, a zatim odmah poruke B | Poruka A se prekida ili se poruka B uvrštava u red; nikada ne govore 2 glasa istovremeno. |
| **V15-3** | **Globalni STOP** | Klik na crvenu tipku STOP u transportnoj traci | `speechSynthesis.cancel()` pozvan u < 20 ms; red čekanja ispražnjen; status postavljen na `idle`. |
| **V15-4** | **Globalni MUTE** | Klik na tipku MUTE tijekom govora | Zvuk se trenutno utišava bez rušenja stanja; ikona prelazi u `VolumeX`. |
| **V15-5** | **Pauza i Nastavak** | Klik na tipku PAUSE, pa RESUME | Govor se privremeno zaustavlja i nastavlja od iste pozicije. |
| **V15-6** | **Element-by-Element Tok** | Sekvencijalni prolaz kroz elemente 1, 2 i 3 | Nakon završetka izgovora Opservacije (`onend`), automatski započinje Dijagnoza. |
| **V15-7** | **Sinkronizirani Highlight** | Vizualni izgled sekcije koja se trenutno izgovara | Aktivna sekcija posjeduje `ring-[#ffd700]` klasu i vizualno se ističe u odnosu na ostale. |
| **V15-8** | **Auto-Read Funkcionalnost** | Prijem novog odgovora asistenta uz uključen Auto-Read | Odgovor se automatski počinje izgovarati bez ručnog klika; ako je MUTE uključen, ne pokreće se. |
| **V15-9** | **Akustička Zaštita Mikrofona** | Pokretanje glasovnog unosa (STT) dok Žigo govori (TTS) | Narator se trenutno gasi (`stop()`) čim se uključi mikrofon, sprječavajući eho efekt. |
| **V15-10**| **Čišćenje Transporta pri Promjeni Postavki** | Promjena STT motora, ključa ili reset postavki | Red čekanja se automatski prazni (`clearQueue()`), govor se zaustavlja i sinkroniziraju se glasovi (`reloadVoices()`). |
| **V15-11**| **Testna Naracija iz Postavki** | Klik na tipku "Pošalji Testnu Naraciju" u STT/TTS kartici | Generira strukturiranu poruku u 3 elementa (Opservacija, Dijagnoza, Rez) i šalje na aktivni audio transport. |
| **V15-12**| **Monorepo Build & Gate-Check** | `npm run build && npm test` na razini cijelog repozitorija | 100% testova prolazi (178/178), 0 TypeScript grešaka, čist produkcijski paket. |

---

## 5. Korisničko Iskustvo i Vizualni Detalji

```
┌────────────────────────────────────────────────────────────────────────┐
│  🛡️ Žigo (Digitalni Orlando)                 [🔊 Auto-čitaj: ON] [X]   │
├────────────────────────────────────────────────────────────────────────┤
│  🎵 Žigo govori: Opservacija                                           │
│  "Pao server u Zagrebu? Ma neka je. Pao je i Napoleon..."              │
│  [⏮] [⏸ Pauza] [⏹ STOP] [⏭] [🔊 Mute]                Dio 1 od 3 │
├────────────────────────────────────────────────────────────────────────┤
│  ŽIGO (ORLANDO) • 12:34                               [🔊 Slušaj]      │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ ✨ OPSERVACIJA (Trenutno govori - jantarni sjaj)                 │  │
│  │ Pao server u Zagrebu? Ma neka je. Pao je i Napoleon...           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 🔍 DIJAGNOZA                                                     │  │
│  │ CIS ili internet spava. Račune san zapečatio lokalnim kodom.     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ ⚔️ ŽIGIN REZ                                                     │  │
│  │ Kad gospoda uključe kabao u zid, poslat ćemo sve u nizu.         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Nadogradnja: Muški Glas Viteza Orlanda & Plan za Unaprjeđenje Sinteze (TTS Upgrade Roadmap)

### 6.1. Dijagnoza i uzrok piskutavog/ženskog glasa

Pri inicijalnom testiranju Web Speech API naracije, Žigo je zvučao piskutavo, slabašno ili poput sintetičkog ženskog glasa:
1. **Abecedni nesrazmjer u sustavu Windows:**
   - Na Windows 10/11 instaliran je hrvatski jezični paket koji sadrži dva glasa:
     - `Microsoft Gabrijela - Croatian (Croatia)` (Ženski glas)
     - `Microsoft Matej - Croatian (Croatia)` (Muški glas)
   - Naivni poziv `voices.find(v => v.lang.startsWith('hr'))` uvijek je vraćao **Gabrijelu** jer se u nizu glasova nalazi ispred Mateja (G dolazi prije M).
2. **Neodgovarajući tonalitet (Pitch):**
   - Vrijednost `pitch: 0.92` na ženskom glasu ne stvara muški bariton, već zvuči kao usporena ili groteskna žena ("uncanny valley").
   - Za stoičkog dubrovačkog viteza Orlanda potreban je jasan, rezonantan bariton (`pitch: 0.86`, `rate: 0.94`), a u slučaju izostanka muškog glasa agresivniji pad na `0.78`.
3. **Asinkrono učitavanje glasova u Chromium preglednicima:**
   - U Google Chromeu i Microsoft Edgeu, `speechSynthesis.getVoices()` pri prvom pozivu vraća prazan niz `[]` dok se ne okine asinkroni događaj `onvoiceschanged`. Ako se izgovor pokrene prerano, preglednik poseže za zadanim sistemskim glasom (koji je često ženski engleski glas).

---

### 6.2. Implementirano rješenje (Phase 15A — Standard Web TTS Fix)

1. **Heuristička ljestvica selekcije glasa (`selectBestMasculineVoice`):**
   - **Prioritet 1 (Apsolutni korisnički odabir):** Ako je korisnik u postavkama eksplicitno odabrao glas (`preferredVoiceURI`), taj glas uvijek pobjeđuje (+10000 bodova).
   - **Prioritet 2 (Hrvatski muški glas):** `hr-HR` + muški marker (`Matej`, `Ivan`, `Luka`, itd.) bez ženskih markera (+2000 bodova).
   - **Prioritet 3 (Hrvatski neutralni glas):** npr. `Google hrvatski` (+1400 bodova).
   - **Prioritet 4 (Južnoslavenski muški glas):** `sr-Latn`, `bs-BA`, `sl-SI` muški glasovi (`Nikola`, `Stefan`, `Filip`) (+1200 bodova) koji fonetski zvuče neusporedivo autentičnije i muževnije od engleskih glasova.
   - **Prioritet 5 (Hrvatski ženski glas s korekcijom):** `Gabrijela` (+900 bodova) — ako je jedini dostupan glas na računalu, automatski se spušta na duboki bas registar (`pitch: 0.78`) kako bi zvučao staloženije.
   - **Prioritet 6 (Globalni muški glas):** `David`, `George`, `Mark` (+300 bodova).
2. **Korisničko sučelje za upravljanje glasom u Postavkama (`GoogleSttSettingsCard`):**
   - Prikaz aktivnog sintetizatora s bedževima: `[MUŠKI BARITON (ORLANDO)]`, `[HRVATSKI (hr-HR)]` ili upozorenjem `[ŽENSKI GLAS - KOREKCIJA]`.
   - Dropdown selektor koji prikazuje sve instalirane glasove na operativnom sustavu s prefiksima.
   - Klizači za **Pitch** (0.60 - 1.20) i **Rate** (0.75 - 1.25) s perzistencijom u `localStorage`.
   - Tipka `Vrati viteški zadano` (vraća na 0.86 pitch i 0.94 rate).
3. **Prošireni leksički normalizator (`cleanTextForSpeech`):**
   - Podrška za valute i cente: `125,50 €` ➔ `125 i 50 centi`.
   - Podrška za postotke: `25%` ➔ `25 posto`.
   - Fonetsko čitanje akronima: `PDV` ➔ `P D V`, `HZZO` ➔ `H Z Z O`, `FINA` ➔ `Fina`, `IBAN` ➔ `I B A N`, `FRO` ➔ `F R O`, `EP` ➔ `E P`.
4. **Chromium Watchdog Heartbeat:**
   - Periodički puls svake 10s (`pause()` / `resume()`) sprječava Chromium bug u kojem se izgovori duži od 15 sekundi tiho prekidaju bez aktivacije `onend` događaja.

---

### 6.3. Nadogradnja: Google Cloud Text-to-Speech (WaveNet) & Hibridni Fallback

Sustav je nadograđen na hibridnu arhitekturu koja primarno koristi **Google Cloud Text-to-Speech REST API** uz besprijekoran automatski fallback na lokalni preglednički motor (**Microsoft Matej**):

| Razina | Tehnologija | Opis i ponašanje | Prednosti |
| :--- | :--- | :--- | :--- |
| **Primarni Motor (Cloud)** | **Google Cloud Text-to-Speech REST API** (`v1/text:synthesize`) | Koristi Google WaveNet/Neural model (`hr-HR-Wavenet-B` muški bariton) s kalibracijom visine tona (`pitch: -2.0` semitona). | Vrhunska prirodna intonacija, duboki muški glas, profesionalna dikcija. |
| **Fallback Motor (Lokalno)** | **Web Speech Synthesis API** (`window.speechSynthesis`) | U slučaju gubitka interneta, prekoračenja GCP kvote, HTTP 403 ili nepostojanja ključa, trenutno preuzima **Microsoft Matej** (ili konfigurirani lokalni glas). | 100% otpornost, nula zastoja u radu, radi offline. |

---

## 7. Verifikacija, Dijagnostika i Testiranje Google TTS Sustava

### 7.1. Dijagnostički alati u postavkama (`GoogleSttSettingsCard`)
1. **Preklopnik primarnog motora:** Korisnik bira želi li primarno Google Cloud TTS ili isključivo lokalni preglednik.
2. **BYOK dijeljenje ključa:** Ako je uključen STT ključ (`useSttApiKey: true`), TTS automatski nasljeđuje isti GCP API ključ bez ponovnog unosa.
3. **Izravno testiranje i debugiranje veze:**
   - Tipka *"Testiraj i Debugiraj Google TTS Vezu"* šalje testnu frazu viteza Orlanda na endpoint `https://texttospeech.googleapis.com/v1/text:synthesize`.
   - Mjeri mrežnu latenciju u milisekundama (npr. `245 ms`).
   - Generira i dekodira MP3 Blob te automatski reproducira zvuk u zvučnicima za trenutnu provjeru.
   - Prikazuje precizne poruke grešaka i izravne poveznice na GCP konzolu za omogućavanje API-ja ako se javi HTTP 403.
4. **In-Memory Audio Caching:** Svi sintetizirani segmenti keširaju se u memoriji kako bi se spriječilo nepotrebno trošenje GCP kvote i ponovno plaćanje za identične rečenice.

### 7.2. Automatizirani testovi (`apps/web/tests/google-tts.test.ts` & `zigo-audio-transport.test.ts`)
- **19 novih jediničnih testova** specifično za Google TTS:
  - Pohrana i dohvat konfiguracije u `localStorage`
  - BYOK nasljeđivanje i prioritizacija zasebnog API ključa
  - Validacija formata ključa (`AIzaSy...`), raspona brzine i visine tona
  - REST poziv, leksička normalizacija i In-Memory Caching mehanizam
  - Dijagnostika grešaka (HTTP 400, HTTP 403, network error)
  - Mjerenje latencije u `testConnection()`
  - Filtriranje i dohvat glasova u `fetchVoices()`
- **Ukupno stanje projekta:** 21 testna datoteka, **207/207 testova prolazi (100%)**, produkcijski build prolazi čisto u 4.3s.

