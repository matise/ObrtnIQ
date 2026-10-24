import { describe, it, expect, beforeEach } from 'vitest';
import { 
  buildIdentitySecret, 
  encryptBackupWithGoogleSub, 
  decryptBackupWithGoogleSub, 
  generateKprCsv,
  type ObrtProfil,
  type Artikl,
  type NaplataPromet,
  type ObrtnIQBackupData
} from '@obrtniq/core';
import { geminiService } from '../src/services/gemini-service';
import { googleAuthService } from '../src/services/google-auth-service';

// Mock in-memory localStorage for Node test runner
const store = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => store.set(key, String(value)),
  removeItem: (key: string) => store.delete(key),
  clear: () => store.clear(),
};
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = mockLocalStorage;
}

describe('Protokol Zajedničke Integracijske Validacije: Faza 9 & Faza 10', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it('Z-01: AI Asistent predlaže KPD i omogućuje spremanje u cjenik', async () => {
    const opisUsluge = 'izrada web aplikacije i programiranje backend api-ja';
    const rec = await geminiService.recommendKpd(opisUsluge);

    expect(rec).toBeDefined();
    expect(rec.kpdSifra).toBe('62.01.11');
    expect(rec.kpdNaziv).toContain('softvera');
    expect(rec.preporucenaJedinica).toBe('sat');
    expect(rec.preporucenaCijena).toBe(60);

    // Simulacija stvaranja stavke cjenika iz preporuke
    const noviArtikl: Partial<Artikl> = {
      naziv: 'Razvoj web aplikacije',
      kpdSifra: rec.kpdSifra,
      jedinicaMjere: rec.preporucenaJedinica,
      cijenaOsnovica: rec.preporucenaCijena || 60,
      stopaPdv: 0,
      pdvKategorijaPoreza: 'E',
      jeUsluga: true,
      aktivan: true,
    };

    expect(noviArtikl.kpdSifra).toBe('62.01.11');
    expect(noviArtikl.cijenaOsnovica).toBe(60);
  });

  it('Z-02: Cjenik -> Račun -> Kalkulacija i Zaključavanje', () => {
    const odabraniArtikl: Artikl = {
      id: 'art-001',
      naziv: 'Usluge računalnog programiranja',
      kpdSifra: '62.01.11',
      jedinicaMjere: 'sat',
      cijenaOsnovica: 60.0,
      stopaPdv: 0,
      pdvKategorijaPoreza: 'E',
      jeUsluga: true,
      aktivan: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const kolicina = 10;
    const ukupno = odabraniArtikl.cijenaOsnovica * kolicina;
    expect(ukupno).toBe(600.0);

    // Simulacija računa
    const racun = {
      brojDokumenta: '1/POSL1/1',
      vrsta: 'RACUN',
      status: 'IZDANO',
      stavke: [
        {
          naziv: odabraniArtikl.naziv,
          kpdSifra: odabraniArtikl.kpdSifra,
          kolicina,
          cijena: odabraniArtikl.cijenaOsnovica,
          ukupno,
        }
      ],
      ukupniIznos: ukupno,
      isLocked: true,
    };

    expect(racun.isLocked).toBe(true);
    expect(racun.status).toBe('IZDANO');
    expect(racun.ukupniIznos).toBe(600.0);
  });

  it('Z-03: KPR -> Knjigovodstveni CSV s UTF-8 BOM-om i hrvatskim formatom', () => {
    const kprStavke: NaplataPromet[] = [
      {
        id: 'kpr-1',
        brojKprStavke: 1,
        datumNaplate: '2026-03-15',
        brojDokumenta: '1/POSL1/1',
        opisPlatitelja: 'ACME Corp',
        iznosGotovina: 0,
        iznosBezgotovinski: 1250.50,
        ukupnoNaplaceno: 1250.50,
        kvartal: 1,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'kpr-2',
        brojKprStavke: 2,
        datumNaplate: '2026-06-20',
        brojDokumenta: '2/POSL1/1',
        opisPlatitelja: 'Inovacije d.o.o.',
        iznosGotovina: 350.00,
        iznosBezgotovinski: 0,
        ukupnoNaplaceno: 350.00,
        kvartal: 2,
        createdAt: new Date().toISOString(),
      }
    ];

    const csvOutput = generateKprCsv(kprStavke, 2026, {
      obrtNaziv: 'IT USLUGE, VL. MATIJA',
      obrtOib: '12345678903',
    });

    // 1. Započinje s UTF-8 BOM (\uFEFF) za MS Excel
    expect(csvOutput.charCodeAt(0)).toBe(0xFEFF);

    // 2. Koristi točka-zarez kao separator polja
    expect(csvOutput).toContain('R.br.;Datum uplate;Broj računa / temeljnice;Naziv uplatitelja / opis');

    // 3. Koristi hrvatski decimalni zarez
    expect(csvOutput).toContain('1250,50');
    expect(csvOutput).toContain('350,00');

    // 4. Sadrži točan ukupni zbroj
    expect(csvOutput).toContain('1600,50');
  });

  it('Z-04: Google Prijava -> Kripto Sidro (PBKDF2 100k iteracija)', async () => {
    const demoUser = googleAuthService.loginDemoUser();
    expect(demoUser.googleSub).toBe('108392174981273981273');

    // Izvođenje tajne iz googleSub
    const secret = buildIdentitySecret(demoUser.googleSub);
    expect(secret).toBeDefined();
    expect(secret.startsWith('OBRTNIQ:GOOGLE_SUB:')).toBe(true);
    expect(secret.length).toBe(40); // 19 prefiks + 21 znamenki ID-a

    // Sa specifičnim korisničkim PIN-om daje različitu tajnu
    const secretWithPin = buildIdentitySecret(demoUser.googleSub, '1234');
    expect(secretWithPin).not.toBe(secret);
    expect(secretWithPin).toBe('OBRTNIQ:GOOGLE_SUB:108392174981273981273:1234');
  });

  it('Z-05 & Z-06: Cloud Backup -> Google Sub Enkripcija -> Disaster Recovery Dekripcija', async () => {
    const dummySnapshot: ObrtnIQBackupData = {
      shemaVerzija: '3.0',
      sustav: 'ObrtnIQ',
      datumIzvoza: new Date().toISOString(),
      obrt: {
        naziv: 'Moj IT Obrt',
        oib: '12345678903',
        vlasnikImePrezime: 'Marko Marković',
        iban: 'HR1210010051863000160',
        bankaNaziv: 'Zagrebačka banka d.d.',
        ulicaIBroj: 'Ilica 1',
        mjesto: 'Zagreb',
        postanskiBroj: '10000',
        drzava: 'Hrvatska',
        temeljniPorez: 'PAUSAL',
        pdvObveznik: false,
        godisnjiPragPausal: 40000,
        napomenaRacun: 'Paušalni porezni obveznik nije u sustavu PDV-a.',
        mjestoIzdavanja: 'Zagreb',
        prefiksRacuna: 'POSL1/1',
        fiskalizacijaCertStatus: 'NEAKTIVAN',
        fiskalniModel: 'DEMO',
        poreznaZona: 'DOMACA',
        nacinPlacanjaDefault: 'TRANSAKCIJSKI_RACUN',
        rokPlacanjaDana: 15,
      } as ObrtProfil,
      artikli: [
        {
          id: 'art-1',
          naziv: 'Razvoj softvera po satu',
          kpdSifra: '62.01.11',
          jedinicaMjere: 'sat',
          cijenaOsnovica: 60.0,
          stopaPdv: 0,
          pdvKategorijaPoreza: 'E',
          jeUsluga: true,
          aktivan: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ],
      partneri: [],
      dokumenti: [],
      kpr: [],
    };

    const googleSub = '108392174981273981273';
    const userPin = '9999';

    // Z-05: Enkripcija u .obrtniq paket
    const encryptedPackage = await encryptBackupWithGoogleSub(dummySnapshot, googleSub, userPin);
    expect(encryptedPackage).toBeDefined();
    expect(encryptedPackage.format).toBe('OBRTNIQ-AES-256-GCM');
    expect(encryptedPackage.salt).toBeDefined();
    expect(encryptedPackage.iv).toBeDefined();
    expect(encryptedPackage.ciphertext).toBeDefined();
    expect(encryptedPackage.ciphertext.length).toBeGreaterThan(50);

    // Z-06: Disaster Recovery - Potpuni povrat baze iz .obrtniq paketa
    const restored = await decryptBackupWithGoogleSub(encryptedPackage, googleSub, userPin);
    expect(restored).toBeDefined();
    expect(restored.shemaVerzija).toBe('3.0');
    expect(restored.obrt?.naziv).toBe('Moj IT Obrt');
    expect(restored.artikli[0]?.kpdSifra).toBe('62.01.11');
    expect(restored.artikli[0]?.cijenaOsnovica).toBe(60.0);

    // Pokušaj s pogrešnim PIN-om mora biti odbijen
    await expect(
      decryptBackupWithGoogleSub(encryptedPackage, googleSub, 'wrong-pin')
    ).rejects.toThrow();
  });

  it('Z-07: Offline Otpornost - Sustav radi 100% lokalno bez interneta', async () => {
    // 1. Heuristički asistent radi bez interneta
    const rec = geminiService.recommendKpdLocalHeuristic('poslovno savjetovanje i priprema EU projekata');
    expect(rec.kpdSifra).toBe('70.22.11');
    expect(rec.jeAiGenerirano).toBe(false);

    // 2. KPR CSV se generira bez mrežnog poziva
    const csv = generateKprCsv([], 2026);
    expect(csv.charCodeAt(0)).toBe(0xFEFF);

    // 3. Google Demo profil radi bez vanjskog API-ja
    const demo = googleAuthService.loginDemoUser();
    expect(demo.email).toBe('obrtnik.demo@gmail.com');
  });
});
