# Plan i Izvještaj Implementacije — Faza 16: Google Speech-to-Text V2 Konfiguracija u Postavkama (BYOK & Hibridni STT)

> **Dokument:** Arhitektonski plan, korisničko sučelje, validacija i integracija Google Speech-to-Text V2 postavki  
> **Status:** Implementirano i verificirano (100% In-Browser / Zero-Server / BYOK)  
> **Povezani dokumenti:**  
> - [`docs/plan_implementacije_faza_14_zigo_stt_v2_glasovni_asistent.md`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/docs/plan_implementacije_faza_14_zigo_stt_v2_glasovni_asistent.md)  
> - [`docs/plan_implementacije_faza_15_zigo_tts_glasovni_narator.md`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/docs/plan_implementacije_faza_15_zigo_tts_glasovni_narator.md)  
> - [`docs/igo_stt_v2_implementation_guide.md`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/docs/igo_stt_v2_implementation_guide.md)  

---

## 1. Arhitektonski Pregled i Ciljevi

Cilj ove faze je omogućiti korisniku fleksibilan, hibridni odabir mehanizma za prepoznavanje govora (Speech-to-Text) direktno unutar izbornika **Postavke (Settings Drawer) > Cloud & AI Tab**:

1. **Preglednički Web Speech API (Zadano & Preporučeno):**
   - 100% lokalno u pregledniku (Chrome, Brave, Edge).
   - Besplatno, bez registracije, nula API ključeva, trenutni odziv uz klijentsku normalizaciju dubrovačkog i fiskalnog leksika (`packages/core`).
2. **Google Cloud Speech-to-Text V2 (Chirp 2 / BYOK Model & Dual-Mode Auth):**
   - **Način A: Service Account JSON (Preporučeno za Streaming):** Korisnik učitava preuzeti Service Account JSON ključ s GCP konzole (`IAM & Admin > Service Accounts > Keys`). Sustav automatski parsira i verificira `project_id`, `client_email` i priprema autorizaciju za nisku latenciju i gRPC / WebSocket streaming.
   - **Način B: Klasični API Key (REST pozivi):** Korisnik unosi Google API ključ (`AIzaSy...`). Prepoznavanje radi preko sinkronog REST protokola (kratki audio isječci), uz jasnu napomenu u sučelju o razlikama u odnosu na streaming u stvarnom vremenu.
   - **Zero-Server jamstvo:** Svi ključevi spremaju se isključivo u lokalnu pohranu preglednika (`localStorage: obrtniq_stt_config`) i nikada se ne prenose na poslužitelje ObrtnIQ-a.

---

## 2. Dvorazinska Validacija i Dijagnostika

### Razina 1: Statička Client-Side Validacija (`packages/core`)
Funkcija `validateGcpSttConfig` provjerava integritet parametara prije slanja mrežnog zahtjeva:
- **API Ključ:** Obavezan za `gcp_stt_v2`, mora započinjati prefiksom `AIza` i imati barem 35 znakova.
- **Project ID:** 6 do 30 alfanumeričkih znakova i crtica prema GCP specifikaciji (`/^[a-z0-9][a-z0-9\-]{4,28}[a-z0-9]$/`).
- **Lokacija:** Obavezna (zadano `eu`).
- **Recognizer ID:** Alfanumerički identifikator s crticama.

### Razina 2: Interaktivni Test Veze (`apps/web/src/services/google-stt-service.ts`)
Gumb **"Testiraj STT vezu"** izvodi direktan REST poziv iz preglednika prema:
```
GET https://speech.googleapis.com/v2/projects/{projectId}/locations/{location}/recognizers?key={apiKey}
```
Odgovori se mapiraju u jasne dijagnostičke poruke na hrvatskom jeziku:
- `HTTP 200 OK`: Povezivanje uspješno (prikaz latencije u ms i broja konfiguriranih prepoznavača).
- `HTTP 400 Bad Request`: Nevaljan API ključ (`API_KEY_INVALID`).
- `HTTP 403 Forbidden`: Cloud Speech-to-Text API nije aktiviran na navedenom projektu ili ključ ima restrikcije (s izravnim linkom za aktivaciju u GCP konzoli).
- `HTTP 404 Not Found`: Projekt ili lokacija ne postoje.
- Mrežna greška / CORS: Uputa za provjeru internetske veze.

---

## 3. Implementirane Komponente

1. **Domenski Sloj (`packages/core/src/domain/voice.ts`):**
   - Definirani tipovi: `ZigoSttEngine`, `ZigoSttConfig`, `GcpSttValidationResult`.
   - Implementirane funkcije: `DEFAULT_ZIGO_STT_CONFIG` i `validateGcpSttConfig`.
2. **Klijentski Servis (`apps/web/src/services/google-stt-service.ts`):**
   - Čitanje i sigurno spremanje u `localStorage` (`obrtniq_stt_config`).
   - Metoda `testConnection` s mjerenjem latencije i obradom HTTP grešaka.
3. **Korisničko Sučelje (`apps/web/src/components/settings/cloud/GoogleSttSettingsCard.tsx`):**
   - Usklađeno s tamnom orlandovskom temom i postojećim BYOK karticama (`GeminiSettingsCard`).
   - Kartica s odabirom motora (Web Speech vs. Google Cloud STT V2).
   - Polja za Project ID, API ključ s okom za skrivanje/prikaz lozinke, lokaciju i model (`chirp_2`).
   - Napredne opcije (preklopnik): Recognizer ID i Phrase Adaptation zastavica.
   - Gumbi "Testiraj STT vezu", "Vrati na početno" i "Spremi STT postavke".
4. **Integracija s Audio Transportom & Kontrole Naratora (`GoogleSttSettingsCard.tsx`):**
   - **Status Naratora & Audio Transport:** Uživo prikaz stanja (`ŽIGO GOVORI` s animacijom, `PAUZIRANO`, `MIROVANJE (IDLE)`), brojača reda čekanja (`x / y`), mute statusa i auto-read stanja.
   - **Testna Naracija:** Gumb "Pošalji Testnu Naraciju na Transport" koji šalje trodijelnu orlandovsku poruku (Opservacija, Dijagnoza, Žigin Rez) u red čekanja, simulirajući punu dvosmjernu petlju.
   - **Automatsko Čišćenje i Rekreacija Transporta:** Bilo koja promjena konfiguracije (promjena motora, promjena načina autorizacije, upload Service Account JSON-a, spremanje postavki ili povratak na tvorničke postavke) automatski poziva `clearQueue()` (zaustavlja aktivni govor i prazni red čekanja) te `reloadVoices()` (re-sinkronizira dostupne glasove preglednika).
   - **Kontrole Naratora:** Brze akcije za MUTE/UNMUTE, uključivanje/isključivanje automatskog čitanja (Auto-read) i pražnjenje reda čekanja.
5. **Integracija u Postavke (`apps/web/src/components/settings/tabs/CloudAiTab.tsx`):**
   - Ugrađeno u tab Cloud & AI ispod Gemini asistenta.
6. **Povezivanje s Glasovnim Hookom (`apps/web/src/hooks/useZigoVoice.ts`):**
   - Hook učitava trenutnu konfiguraciju i dinamički prilagođava bilježenje motora.
   - Izloženi `activeEngine` i `sttConfig` u povratnom objektu.
   - `ZigoVoiceBar.tsx` prikazuje aktivni motor u podnožju trake.

---

## 4. Matrica Verifikacije i Testiranja

| ID | Testna Cjelina | Opis | Status |
| :--- | :--- | :--- | :--- |
| **V16-1** | **Zadane vrijednosti konfiguracije** | `DEFAULT_ZIGO_STT_CONFIG` koristi preglednički motor i regiju `eu`. | 🟢 PROŠLO (`voice.test.ts`) |
| **V16-2** | **Statička validacija formata ključa** | Odbija ključeve bez `AIza` prefiksa ili prekratke stringove. | 🟢 PROŠLO (`voice.test.ts`) |
| **V16-3** | **Statička validacija GCP Project ID-ja** | Provjerava dopuštene znakove i dužinu (6-30). | 🟢 PROŠLO (`voice.test.ts`) |
| **V16-4** | **Pohrana u localStorage** | Spremanje, dohvat i oporavak od korumpiranog JSON-a. | 🟢 PROŠLO (`google-stt-settings.test.ts`) |
| **V16-5** | **Test veze: HTTP 200 OK** | Mjeri latenciju i vraća uspjeh s brojem prepoznavača. | 🟢 PROŠLO (`google-stt-settings.test.ts`) |
| **V16-6** | **Test veze: HTTP 400 Bad Request** | Prepoznaje `API_KEY_INVALID` i vraća jasnu poruku. | 🟢 PROŠLO (`google-stt-settings.test.ts`) |
| **V16-7** | **Test veze: HTTP 403 Service Disabled** | Upozorava korisnika da omogući Speech API u GCP konzoli. | 🟢 PROŠLO (`google-stt-settings.test.ts`) |
| **V16-8** | **Test veze: HTTP 404 & Mrežna greška** | Ispravno rukuje nepostojećim resursom ili prekidom veze. | 🟢 PROŠLO (`google-stt-settings.test.ts`) |
| **V16-9** | **Integracija u ZigoVoiceBar** | Prikaz aktivnog motora u sučelju glasovnog bedema. | 🟢 PROŠLO |
| **V16-10**| **Čišćenje Transporta & Rekreacija** | Promjena postavki automatski prazni red čekanja i sinkronizira glasove. | 🟢 PROŠLO (`zigo-audio-transport.test.ts`) |
| **V16-11**| **Testna Naracija na Transport Listi** | Slanje strukturirane poruke iz postavki u red čekanja audio transporta. | 🟢 PROŠLO (`zigo-audio-transport.test.ts`) |
| **V16-12**| **Cjelokupni Monorepo Build & Testovi** | **20 testnih datoteka, 178/178 testova prolazi (100%)**, `vite build` 0 grešaka. | 🟢 PROŠLO |
