# Plan Implementacije — Faza 14: Žigo Glasovni Bedem (100% In-Browser Speech Recognition & Client-Side Leksikalna Prilagodba)

> **Dokument:** Arhitektonski i operativni plan integracije glasovnog sučelja u sustav ObrtnIQ  
> **Status:** Implementirano i verificirano (100% In-Browser / Zero-Server)  
> **Referentni dokument:** [`docs/igo_stt_v2_implementation_guide.md`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/docs/igo_stt_v2_implementation_guide.md)  
> **Povezani dokumenti:**  
> - [`docs/plan_implementacije_faza_13_zigo_omni_copilot.md`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/docs/plan_implementacije_faza_13_zigo_omni_copilot.md)  
> - [`docs/arhitektura_zigo_ai_agenta.md`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/docs/arhitektura_zigo_ai_agenta.md)  
> - [`docs/zigo_specifikacija_i_sistemski_prompt.md`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/docs/zigo_specifikacija_i_sistemski_prompt.md)  
> **Temeljna maksima:** *"Non bene pro toto libertas venditur auro"* — Nulti poslužitelj, nulti Python, potpuna privatnost podataka, 100% unutar korisničkog web preglednika.

---

## 1. Arhitektonska Odluka: 100% Klijentski Prijenos (Zero-Server & Zero-Python)

Izvorna specifikacija u [`docs/igo_stt_v2_implementation_guide.md`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/docs/igo_stt_v2_implementation_guide.md) predlagala je vanjski backend gateway i Python skriptu za postavljanje resursa na Google Cloudu.

U skladu s temeljnim načelom ObrtnIQ-a (*Local-First / Zero-Server*), arhitektura je optimizirana tako da se **cjelokupno prepoznavanje govora, leksikalna prilagodba i kontrola prekida (STOP) izvršavaju 100% unutar web aplikacije i preglednika korisnika**:

1. **Uklonjen je Python i vanjski poslužitelji:** Cijeli sustav je ujedinjen u TypeScript / React ekosustav. Korisnik ne mora pokretati poslužitelje, instalirati Python ni plaćati vanjske streaming API-je.
2. **Klijentski Web Speech API (`hr-HR`):** Izravno uzorkovanje i prepoznavanje govora u stvarnom vremenu s podrškom za privremeni (`interim`) i konačni (`final`) tekst.
3. **In-Browser Leksikalni i Dijalektalni Normalizator (`packages/core`):** Umjesto oblaka, lokalna funkcija `normalizeZigoVoiceTranscript` u manje od milisekunde prevodi fonetski razdvojene kratice (`k p r`, `z k i`, `j i r`, `o i b`, `p o s d`, `e-racun`, `prag 40000 eura`, `orlandov lakat`) u kanonske domenske pojmove sustava ObrtnIQ.
4. **Instantna tipka STOP (`AbortController` + `SpeechRecognition.abort()`):** Trenutačni prekid bez zaostalih procesa i bez mrežnog kašnjenja.

---

## 2. Arhitekturni Dijagram Klijentskog Sustava

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              KLIJENTSKI PREGLEDNIK (apps/web)                          │
│                                                                                        │
│   Mikrofon (Web Speech API / AudioWorklet)                                              │
│          │                                                                             │
│          ▼                                                                             │
│   SpeechRecognition (hr-HR, continuous=true, interimResults=true)                      │
│          │                                                                             │
│          ├─► interimText ──► Prikaz u stvarnom vremenu u ZigoVoiceBar                  │
│          │                                                                             │
│          ▼ finalText (sirovi govor)                                                    │
│   normalizeZigoVoiceTranscript() [packages/core]                                       │
│          │ (Pretvara: "otvori k p r i provjeri z.k.i." -> "otvori KPR i provjeri ZKI")  │
│          │ (Pretvara: "koliko do praga od 40000 eura" -> "koliko do prag od 40.000 €") │
│          │ (Pretvara: "žigo presjeci" -> "Žigo, presijeci")                            │
│          ▼                                                                             │
│   useZigoAgent.posaljiPoruku(normaliziraniTekst) ──► Žigo Omni-Copilot obrada          │
│                                                                                        │
│   [CRVENA TIPKA STOP] ──► recognition.abort() + agent.zaustaviDumanje()                │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Komponente Sustava

### 3.1. Domenska Jezgra i Leksikalni Normalizator ([`packages/core/src/domain/voice.ts`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/packages/core/src/domain/voice.ts))
- `ScreenContextData`: Struktura konteksta ekrana koja definira trenutni fokus i financijsko stanje.
- `normalizeZigoVoiceTranscript(rawText)`: Brzi lokalni normalizator s podrškom za dijakritike (`č, ć, ž, š, đ`) i točkama razdvojene kratice (`KPR`, `ZKI`, `JIR`, `OIB`, `PO-SD`, `KPD`, `e-Račun`, `prag od 40.000 €`).
- `getZigoDumanjeLabel(currentScreen)`: Vraća autentične dubrovačke statuse (*„Žigo duma nad poreznin limiton...”, „Žigo duma nad iznoson računa i pragom od 40.000 €...”*).
- `ZIGO_DUBROVNIK_PHRASES` i `ZIGO_FISCAL_PHRASES`: Definirani rječnici s težinama.

### 3.2. Klijentski Hook ([`apps/web/src/hooks/useZigoVoice.ts`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/hooks/useZigoVoice.ts))
- Automatski detektira podršku preglednika (`SpeechRecognition || webkitSpeechRecognition`).
- Upravlja stanjima `isRecording`, `isDumando`, `interimText`, `finalText`, `errorMessage`.
- Povezan s `ScreenContextData` i automatski šalje transkript u `onFinalTranscript`.
- `stopAll()`: Poziva `abort()` na nativnom objektu i trenutačno gasi sve dretve.

### 3.3. Korisničko Sučelje ([`apps/web/src/components/ZigoVoiceBar.tsx`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/components/ZigoVoiceBar.tsx))
- Tamni vizualni identitet s orlandovskim jantar/zlato detaljima.
- Pulsirajući indikator "SLUŠAN".
- Crvena tipka **STOP** s trenutnim prekidom rada.
- Prikaz transkripcije uživo i dubrovačkih statusa dumanja.
- Integriran unutar [`ZigoCopilotPanel.tsx`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/components/ZigoCopilotPanel.tsx) putem nove ikone mikrofona.

---

## 4. Matrica Verifikacije i Rezultati Testiranja

| ID | Test | Što se testira | Status |
| :--- | :--- | :--- | :--- |
| **V14-1** | **Preglednička Inicijalizacija** | Postojanje i konfiguracija `SpeechRecognition` na `hr-HR`, `continuous` i `interimResults`. | 🟢 PROŠLO (`zigo-voice.test.ts`) |
| **V14-2** | **Lokalni Leksikalni Normalizator** | Normalizacija akronima `KPR`, `ZKI`, `JIR`, `OIB`, `PO-SD`, `KPD`, `e-Račun`. | 🟢 PROŠLO (`voice.test.ts`) |
| **V14-3** | **Porezni Prag Normalizacija** | Prepoznavanje izgovora `prag od 40000 eura` / `40 tisuća` u `prag od 40.000 €`. | 🟢 PROŠLO (`voice.test.ts`) |
| **V14-4** | **Žigine Naredbe s Dijakritikama** | Izgovor `žigo presjeci` / `zigo presijeci` -> `Žigo, presijeci`. | 🟢 PROŠLO (`voice.test.ts`) |
| **V14-5** | **Trenutačni STOP Signal** | Poziv `abort()` na prepoznavanju i trenutno poništavanje `AbortController`-a u agentu. | 🟢 PROŠLO (`zigo-voice.test.ts`) |
| **V14-6** | **Kontekstualni Statusi Dumanja** | Generiranje točnog natpisa ovisno o aktivnom ekranu (`InvoiceDesk`, `KprDrawer`, itd.). | 🟢 PROŠLO (`zigo-voice.test.ts`) |
| **V14-7** | **Zero-Server & Zero-Python Invarijanta** | 0 poziva prema backend poslužitelju, 0 Python skripti u repozitoriju. | 🟢 PROŠLO |
| **V14-8** | **Integracija u ZigoCopilotPanel** | Tipka mikrofona u polju unosa i prikaz ZigoVoiceBar komponente. | 🟢 PROŠLO |
| **V14-9** | **Cjelokupni Monorepo Build** | `npm run build && npm test` na razini cijelog repozitorija (**18 testnih datoteka, 160/160 testova prolaze**). | 🟢 PROŠLO |
