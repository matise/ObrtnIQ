# Protokol Zajedničke Integracijske Validacije: Faza 9 i Faza 10 (End-to-End Master Test Matrix)

Ovaj dokument služi kao **službena matrica i protokol za zajedničku integracijsku validaciju** modula [Faze 9](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/docs/plan_implementacije_faza_9.md) (Katalog artikala, KPR CSV izvoz, Lokalni AES-256 backup) i [Faze 10](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/docs/plan_implementacije_faza_10.md) (Google Identity, Google Drive AppData Cloud Sync, Gemini AI Asistent).

---

## 1. Svrha i Arhitektonska Povezanost

Faza 9 i Faza 10 čine zaokruženu cjelinu koja lokalnu operativnost obrtnika podiže na razinu autonomnog oblaka uz očuvanje načela **nultog troška poslužitelja (Zero-Server Architecture)**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│               ARHITEKTURNA SINERGIJA FAZE 9 I FAZE 10                                  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│   FAZA 9 (Lokalna Operativnost)                 FAZA 10 (Cloud & AI Sinergija)         │
│  ┌─────────────────────────────┐               ┌─────────────────────────────┐         │
│  │ Cjenik & Katalog Artikala   │ ◄───────────► │ Gemini AI KPD 2025 Birač    │         │
│  │ (IndexedDB artikli tablica) │   AI Pomoć    │ (Google AI Studio BYOK)     │         │
│  └──────────────┬──────────────┘               └─────────────────────────────┘         │
│                 │                                             ▲                        │
│                 ▼                                             │ Autentikacija          │
│  ┌─────────────────────────────┐               ┌──────────────┴──────────────┐         │
│  │ Lokalni Kriptirani Backup   │ ◄───────────► │ Google Identity & Kripto ID │         │
│  │ (.obrtniq AES-256-GCM)      │  Kripto Sidro │ (Web Crypto PBKDF2 googleSub│         │
│  └──────────────┬──────────────┘               └──────────────┬──────────────┘         │
│                 │                                             │                        │
│                 ▼                                             ▼                        │
│  ┌─────────────────────────────┐               ┌─────────────────────────────┐         │
│  │ Knjigovodstveni KPR CSV     │ ◄───────────► │ Google Drive AppData Sync   │         │
│  │ (Excel BOM, točka-zarez)    │  Cloud Arhiva │ (drive.appdata skrivena mapa│         │
│  └─────────────────────────────┘               └─────────────────────────────┘         │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Matrica Validacijskih Scenarija (Test Matrix)

| ID | Područje | Scenarij i Koraci | Očekivani Rezultat |
|---|---|---|---|
| **Z-01** | **AI Asistent ➔ Cjenik** | U unosu stavke korisnik upisuje *"izrada landing stranice i responzivnog dizajna"*, klikne ikonu Gemini | Gemini predlaže KPD `62.01.11` i cijenu; korisnik klikne *"Spremi u cjenik"*; artikl je trajno spremljen u Dexie bazu |
| **Z-02** | **Cjenik ➔ Račun ➔ F2** | Korisnik na praznom nacrtu klikne *"Odaberi iz cjenika"*, bira novu uslugu i pritisne `F2` | Naziv, KPD šifra, jedinica mjere i cijena se popunjavaju u `< 100 ms`, račun se zaključava (`IZDANO`), dodjeljuje se broj `1/POSL1/1` |
| **Z-03** | **KPR ➔ Knjigovodstveni CSV** | Uplaćeni račun unosi se u KPR. Korisnik otvara [KprDrawer.tsx](file:///d:/Documents/Robot%20Hand%20Made/ObrtnIQ/apps/web/src/components/KprDrawer.tsx) i klika *"Preuzmi KPR CSV"* | Generira se `KPR_2026.csv` s `\uFEFF` UTF-8 BOM-om, točka-zarezom `;`, decimalnim zarezom i točnim sumama stupaca |
| **Z-04** | **Google Prijava ➔ Kripto Sidro** | Korisnik u postavkama klikne *"Prijavi se putem Googlea"* | Google Identity Services vraća `sub`, email i sliku. Web Crypto API izvodi 256-bitni AES-GCM ključ iz `googleSub` i lokalnog sola. U headeru se prikazuje avatar |
| **Z-05** | **Cloud Backup (Drive AppData)** | Korisnik u postavkama klikne *"Sinkroniziraj na Google Drive"* | Baza (uključujući novi cjenik i KPR) se enkriptira u `.obrtniq` paket i šalje u skrivenu `appDataFolder` mapu Drivea. Status postaje *"Sinkronizirano"* |
| **Z-06** | **Disaster Recovery (Restore)** | Korisnik očisti lokalnu bazu (0 računa, 0 artikala). Ponovno se prijavi Googleom i klikne *"Vrati s Google Drivea"* | Najnoviji `.obrtniq` backup se preuzima, dekriptira i atomski vraća; cjenik, partneri, računi i KPR su 100% obnovljeni |
| **Z-07** | **Offline Otpornost (Fallback)** | Prekine se internetska veza (zrakoplovni mod) | Aplikacija normalno radi lokalno: cjenik, izdavanje računa, KPR i lokalni izvoz funkcioniraju bez ikakvog zastoja |

---

## 3. Automatizirani Protokol Izvođenja (Runbook)

Za automatsku verifikaciju cjelokupnog rješenja koristi se jedinstveni cjevovod:

```powershell
# 1. Pokretanje cjelokupnog Vitest paketa (Core + Web)
npm test

# 2. Provjera TypeScript tipova i Vite produkcijskog bundlea
npm run build --workspaces

# 3. Provjera HTTP odziva lokalnog dev poslužitelja
powershell -Command "Invoke-WebRequest -Uri 'http://localhost:5173/' -UseBasicParsing | Select-Object StatusCode, StatusDescription"
```

### Kriteriji Uspješnosti (Gate-Check Pass):
1. **Vitest**: 100% prolaznih testova (svi testovi Faza 1 do 8 + novi testovi za Fazu 9 i Fazu 10).
2. **TypeScript & Bundler**: `0 errors` i `0 warnings` u `tsc -b && vite build`.
3. **Lokalni poslužitelj**: `StatusCode: 200 OK`.
4. **Sigurnost**: Niti jedan neenkriptirani financijski podatak ne napušta preglednik; Google Drive sinkronizacija koristi isključivo zaštićeni `appDataFolder`.
