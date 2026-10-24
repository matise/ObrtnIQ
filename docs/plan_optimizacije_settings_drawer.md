# Plan Optimizacije i Modularizacije: `SettingsDrawer.tsx`

## 1. Analiza Postojećeg Stanja (Monolitni Drawer)

Komponenta [`apps/web/src/components/SettingsDrawer.tsx`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/components/SettingsDrawer.tsx) trenutno broji **1.831 liniju koda** te sadrži 5 potpuno različitih domenskih cjelina i preko 25 stanja (`useState`):

```
apps/web/src/components/SettingsDrawer.tsx (1.831 linija)
├── 1. Imports & Props (linije 1-52)
├── 2. Stanja & Loggeri (linije 53-124) - 25+ useState varijabli
├── 3. Handleri profila i memoranduma (linije 125-205)
├── 4. Handleri sigurnosne kopije i vraćanja (linije 206-305)
├── 5. Handleri Google Autentifikacije (linije 306-347)
├── 6. Handleri Google Drive sinkronizacije (linije 348-385)
├── 7. Handleri Gemini AI modela (linije 386-414)
├── 8. Handler API dijagnostike / Health Check (linije 415-480)
├── 9. Header & Navigacijska traka (linije 481-588)
├── 10. TAB 1: Osnovni podaci obrta (linije 589-712) [~124 lin.]
├── 11. TAB 2: Poslovanje & Račun (linije 713-786) [~74 lin.]
├── 12. TAB 3: Memorandum & Grafika (linije 787-889) [~103 lin.]
├── 13. TAB 4: Sigurnosna kopija & Trezor (linije 890-1093) [~204 lin.]
├── 14. TAB 5: Google, Drive & Gemini AI (linije 1094-1804) [~710 lin.!]
│       ├── 0. Dijagnostika API-ja i dozvola (Health Check)
│       ├── 1. Google Identity & Kripto Sidro (Zero-Server)
│       ├── 2. Google Drive AppData Trezor
│       ├── 3. Google AI Studio (Gemini Asistent BYOK)
│       └── 4. Firebase / Firestore postavke
└── 15. Footer akcije za spremanje profila (linije 1805-1831)
```

---

## 2. Ciljna Arhitektura (Modularna Struktura)

Komponenta se dijeli na čisti **orkestrator** (`SettingsDrawer.tsx`) i specijalizirane tabove i kartice unutar novog direktorija [`apps/web/src/components/settings/`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/components/settings):

```
apps/web/src/components/
├── SettingsDrawer.tsx                     # Glavni orkestrator (~150 linija)
└── settings/                              # Modularne komponente postavki
    ├── types.ts                           # Tipovi i sučelja za postavke
    ├── SettingsTabsNav.tsx                # Navigacijski tabovi s bedževima
    ├── tabs/
    │   ├── OsnovniPodaciTab.tsx           # TAB 1: Naziv, OIB, adresa, vlasnik, kontakt
    │   ├── PoslovanjeTab.tsx              # TAB 2: IBAN, PDV/paušal, porezna, model plaćanja
    │   ├── MemorandumTab.tsx              # TAB 3: Upload logotipa i pečata (<500 KB)
    │   ├── BackupRestoreTab.tsx           # TAB 4: AES-256 šifriranje, JSON, uvoz, tvornički reset
    │   └── CloudAiTab.tsx                 # TAB 5: Kontejner za oblak i umjetnu inteligenciju
    └── cloud/                             # Podkomponente za Cloud & AI
        ├── CloudDiagnosticsCard.tsx       # 8 točaka dijagnostike i preporuke
        ├── GoogleIdentityCard.tsx         # Google profil, kripto-sidro, Client ID
        ├── GoogleDriveSyncCard.tsx        # AppData folder, PIN zaštita, verzije sigurnosnih kopija
        ├── GeminiSettingsCard.tsx         # BYOK API ključ, testiranje i izbor modela
        └── FirebaseSettingsCard.tsx       # Opcionalne postavke za Firebase
```

---

## 3. Povezanost s Backend Modulima i Hookovima

```mermaid
graph TD
    subgraph UI ["Prezentacijski Sloj (Settings)"]
        SD[SettingsDrawer - Orkestrator]
        T1[OsnovniPodaciTab]
        T2[PoslovanjeTab]
        T3[MemorandumTab]
        T4[BackupRestoreTab]
        T5[CloudAiTab]
        C1[CloudDiagnosticsCard]
        C2[GoogleIdentityCard]
        C3[GoogleDriveSyncCard]
        C4[GeminiSettingsCard]
    end

    subgraph Hooks ["Klijentski Hookovi (@web/hooks)"]
        HProfile[useObrtProfile]
        HBackup[useBackupRestore]
        HAuth[useGoogleAuth]
        HDrive[useGoogleDriveSync]
        HGemini[useGeminiAssistant]
    end

    subgraph Services ["Poslovna Logika & Servisi"]
        CoreDB[(IndexedDB / LocalStorage)]
        GasSvc[googleAuthService]
        DriveSvc[googleDriveService]
        GeminiSvc[geminiService]
        LogSvc[appLogger]
    end

    SD --> T1 & T2 & T3 & T4 & T5
    T5 --> C1 & C2 & C3 & C4

    T1 & T2 & T3 --> HProfile
    HProfile --> CoreDB

    T4 --> HBackup
    HBackup --> CoreDB

    C1 --> GasSvc & DriveSvc & GeminiSvc
    C2 --> HAuth
    HAuth --> GasSvc

    C3 --> HDrive
    HDrive --> DriveSvc

    C4 --> HGemini
    HGemini --> GeminiSvc

    SD & T1 & T2 & T3 & T4 & T5 & C1 & C2 & C3 & C4 -.-> LogSvc
```

---

## 4. Faze Implementacije

### Faza 1: Priprema strukture, tipova i navigacije
- **Cilj:** Uspostaviti direktorij [`apps/web/src/components/settings/`](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/components/settings) i definirati `types.ts`.
- **Komponente:**
  - `types.ts`: Zajednički tipovi za tabove (`SettingsTabId = 'osnovno' | 'poslovanje' | 'memorandum' | 'backup' | 'cloud'`).
  - `SettingsTabsNav.tsx`: Izdvajanje navigacijskih gumba sa statusnim točkicama i ikonama.

### Faza 2: Izdvajanje Tabova Profila Obrta (Tabovi 1, 2 i 3)
- **Cilj:** Odvojiti unos podataka o obrtu i memorandum u samostalne komponente.
- **Komponente:**
  - `OsnovniPodaciTab.tsx`: Prima `formData: ObrtProfil`, `onChange: (field, val) => void`. Koristi `OibInput`.
  - `PoslovanjeTab.tsx`: Prima `formData`, `onChange`. Koristi `IbanInput`, kontrole za PDV, paušal i poreznu upravu.
  - `MemorandumTab.tsx`: Sadrži logiku za upload slika (< 500 KB), preview i uklanjanje pečata i logotipa.
- **Prednost:** Smanjuje glavni drawer za preko 300 linija koda; izolira rad s datotekama slika.

### Faza 3: Izdvajanje Sigurnosne Kopije i Trezora (Tab 4)
- **Cilj:** Premjestiti logiku enkripcije, uvoza i tvorničkog brisanja.
- **Komponente:**
  - `BackupRestoreTab.tsx`:
    - Enkapsulira interna stanja: `backupPassword`, `restorePassword`, `restoreFile`, `isEncryptedFile`, `restoreSummary`, `resetConfirmInput`.
    - Povezuje se izravno na `useBackupRestore()`.
- **Prednost:** Uklanja 6 stanja i 5 handlera iz glavnog `SettingsDrawer`. Kriptografske operacije postaju lokalizirane.

### Faza 4: Modularizacija Cloud & AI Taba (Tab 5)
- **Cilj:** Rastaviti najveći dio koda (preko 710 linija) u 4 samostalne kartice:
  1. `CloudDiagnosticsCard.tsx`: Prikazuje Health Check (Origin, Network, Session, Scopes, Drive, Gemini, Recommendations) i pokreće dijagnostiku.
  2. `GoogleIdentityCard.tsx`: Prikazuje avatar, Google Sub, status tokena, demo prijavu i unos prilagođenog Client ID-a.
  3. `GoogleDriveSyncCard.tsx`: Prikazuje status zadnje sinkronizacije, listu verzija u AppData mapi, PIN zaštitu i gumb za vraćanje.
  4. `GeminiSettingsCard.tsx`: Unos API ključa, testiranje i izbor modela (`gemini-3.8-flash`, `gemini-4-argon`, itd.).
  5. `FirebaseSettingsCard.tsx`: Sklopivi prozor za opcionalne postavke Firestore replikacije.
  - `CloudAiTab.tsx`: Čisti kontejner koji okuplja gore navedene kartice.
- **Prednost:** Drastično smanjenje re-rendera kod tipkanja PIN-a ili Client ID-a.

### Faza 5: Refaktoriranje `SettingsDrawer.tsx` u Čisti Orkestrator
- **Cilj:** Svesti `SettingsDrawer.tsx` na preglednih ~150 linija koda:
  - Upravljanje otvaranjem/zatvaranjem i odabirom taba (`activeTab`).
  - Pozivanje `saveProfil` i `resetToDefault`.
  - Prikaz zajedničkog Backdopa, Headera i Footera.

### Faza 6: Verifikacija i Testiranje
- Provjera svih 157 postojećih testova (`npx vitest run`).
- Dodavanje jediničnih testova za modularne kartice:
  - `apps/web/tests/settings-profile-tabs.test.tsx`
  - `apps/web/tests/settings-backup-tab.test.tsx`
  - `apps/web/tests/settings-cloud-tab.test.tsx`
- Provjera rada u stvarnom pregledniku (otvaranje tabova, spremanje profila, promjena modela, pokretanje dijagnostike).
- Produkcijski build (`npm run build`).

---

## 5. Usporedba Prije i Poslije

| Metrika | Prije refaktoriranja | Nakon modularizacije |
| :--- | :--- | :--- |
| **Veličina glavne komponente** | 1.831 linija koda | ~150 - 180 linija koda |
| **Broj `useState` u glavnoj komponenti** | 25+ stanja | 3 stanja (`activeTab`, `formData`, `savedSuccess`) |
| **Broj datoteka** | 1 monolitni file | 1 orkestrator + 8 specijaliziranih komponenti |
| **Izolacija re-rendera** | Tipkanje u jednom polju renderira svih 1.800 linija | Renderira se samo aktivna podkomponenta |
| **Održavanje i proširivost** | Visok rizik od regresije | Svaka kartica ima jasne granice odgovornosti |
| **Testabilnost** | Zahtijeva mockiranje svih 5 servisa odjednom | Svaki tab se testira u potpunoj izolaciji |
