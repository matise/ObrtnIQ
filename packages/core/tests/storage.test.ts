import { describe, it, expect, beforeEach } from 'vitest';
import { 
  createInMemoryStorage,
  getNextSequenceNumber,
  stornirajDokument,
  createBackupSnapshot,
  restoreBackupSnapshot,
  encryptBackupData,
  decryptBackupData,
  type IObrtnIQStorage,
  type ObrtProfil,
  type Partner,
  type Dokument
} from '../src';

describe('FAZA 2: Gate-Check Integracijski Test Sloja Pohrane (Storage Adapter)', () => {
  let storage: IObrtnIQStorage;

  beforeEach(async () => {
    storage = createInMemoryStorage();
    await storage.clearAll();
  });

  it('Gate-Check Kriterij Faze 2: Kreiranje obrta, 5 partnera, sekvenca 1/POSL1/1, storniranje na 2/POSL1/1 bez rupa, export i import', async () => {
    // 1. Kreiranje novog profila obrta
    const obrt: ObrtProfil = {
      id: 'obrt-1',
      naziv: 'Robot Hand Made, obrt za programiranje',
      vlasnikImePrezime: 'Matija Obrtnik',
      oib: '69435151530',
      ulicaIBroj: 'Ilica 10',
      postanskiBroj: '10000',
      mjesto: 'Zagreb',
      drzavaIso: 'HR',
      email: 'info@obrtniq.hr',
      iban: 'HR1223600001101234567',
      jePausalist: true,
      uSustavuPdv: false,
      poslovniProstorOznaka: 'POSL1',
      naplatniUredjajOznaka: '1',
      eracunPosrednik: 'FINA',
    };
    await storage.obrt.saveProfil(obrt);
    const spremljenObrt = await storage.obrt.getProfil();
    expect(spremljenObrt?.oib).toBe('69435151530');

    // 2. Unos 5 partnera
    const partneriData: Partner[] = [
      { id: 'p-1', naziv: 'Partner Alpha d.o.o.', tipPartnera: 'PRAVNA_OSOBA', oib: '01234567896', adresa: 'Savska 1', postanskiBroj: '10000', grad: 'Zagreb', drzavaIso: 'HR', poreznaZona: 'DOMACI_B2B', aktivan: true },
      { id: 'p-2', naziv: 'Beta Solutions d.o.o.', tipPartnera: 'PRAVNA_OSOBA', oib: '12345678903', adresa: 'Vukovarska 2', postanskiBroj: '10000', grad: 'Zagreb', drzavaIso: 'HR', poreznaZona: 'DOMACI_B2B', aktivan: true },
      { id: 'p-3', naziv: 'Gama Tech GmbH', tipPartnera: 'PRAVNA_OSOBA', vatId: 'DE123456789', adresa: 'Hauptstrasse 5', postanskiBroj: '80331', grad: 'München', drzavaIso: 'DE', poreznaZona: 'EU_B2B', aktivan: true },
      { id: 'p-4', naziv: 'Marko Marković', tipPartnera: 'FIZICKA_OSOBA', adresa: 'Dubrava 14', postanskiBroj: '10000', grad: 'Zagreb', drzavaIso: 'HR', poreznaZona: 'DOMACI_B2C', aktivan: true },
      { id: 'p-5', naziv: 'Delta Inovacije j.d.o.o.', tipPartnera: 'PRAVNA_OSOBA', oib: '98765432100', adresa: 'Korzo 10', postanskiBroj: '51000', grad: 'Rijeka', drzavaIso: 'HR', poreznaZona: 'DOMACI_B2B', aktivan: false },
    ];

    for (const p of partneriData) {
      await storage.partneri.save(p);
    }

    const sviPartneri = await storage.partneri.getAll();
    expect(sviPartneri).toHaveLength(5);
    const aktivniPartneri = await storage.partneri.getAll(true);
    expect(aktivniPartneri).toHaveLength(4);

    // 3. Kreiranje prvog računa sa sekvencom 1/POSL1/1
    const seq1 = await getNextSequenceNumber(storage.dokumenti, 2026, 'POSL1', '1', 'RACUN');
    expect(seq1.brojSekvenca).toBe(1);
    expect(seq1.brojDokumenta).toBe('1/POSL1/1');

    const racun1: Dokument = {
      id: 'doc-1',
      partnerId: 'p-1',
      partnerNazivSnapshot: 'Partner Alpha d.o.o.',
      partnerOibSnapshot: '01234567896',
      partnerAdresaSnapshot: 'Savska 1, 10000 Zagreb',
      vrstaDokumenta: 'RACUN',
      godina: seq1.godina,
      brojSekvenca: seq1.brojSekvenca,
      brojDokumenta: seq1.brojDokumenta,
      poslovniProstorOznaka: seq1.poslovniProstorOznaka,
      naplatniUredjajOznaka: seq1.naplatniUredjajOznaka,
      datumIzdavanja: '2026-02-15',
      vrijemeIzdavanja: '10:30:00',
      datumDospijeca: '2026-02-25',
      datumIsporuke: '2026-02-15',
      nacinPlacanja: 'TRANSAKCIJSKI_RACUN',
      iban: 'HR1223600001101234567',
      pozivNaBroj: 'HR00 1-2026',
      jeReverseCharge: false,
      zakonskaNapomena: 'Paušalni obrt nije u sustavu PDV-a prema čl. 90. st. 2. Zakona o PDV-u.',
      status: 'IZDANO',
      valuta: 'EUR',
      ukupnoOsnovica: 1250.00,
      ukupnoPdv: 0.00,
      ukupnoIznos: 1250.00,
      fiskalizacijaStatus: 'NIJE_POTREBNO',
      eracunStatus: 'NIJE_POTREBNO',
      stavke: [
        {
          id: 'item-1',
          dokumentId: 'doc-1',
          redniBroj: 1,
          kpdSifra: '62.01.11',
          naziv: 'Razvoj web softvera',
          jedinicaMjere: 'sat',
          kolicina: 25,
          jedinicnaCijena: 50.00,
          popustPostotak: 0,
          iznosPopusta: 0,
          osnovica: 1250.00,
          stopaPdv: 0,
          iznosPdv: 0,
          ukupno: 1250.00,
        }
      ]
    };
    await storage.dokumenti.save(racun1);

    // 4. Storniranje računa 1/POSL1/1 -> mora stvoriti storno račun 2/POSL1/1 bez rupa
    const stornoDokument = await stornirajDokument(storage.dokumenti, 'doc-1', {
      datumIzdavanja: '2026-02-16',
      vrijemeIzdavanja: '11:00:00',
      razlogStorna: 'Pogrešna stavka narudžbe',
    });

    expect(stornoDokument.vrstaDokumenta).toBe('STORNO_RACUN');
    expect(stornoDokument.izvorniDokumentId).toBe('doc-1');
    expect(stornoDokument.brojSekvenca).toBe(2);
    expect(stornoDokument.brojDokumenta).toBe('2/POSL1/1');
    expect(stornoDokument.ukupnoIznos).toBe(-1250.00);

    // Provjera da je izvorni račun postao STORNIRANO
    const osvjezeniIzvorni = await storage.dokumenti.getById('doc-1');
    expect(osvjezeniIzvorni?.status).toBe('STORNIRANO');

    // Provjera da sljedeći redovni račun dobiva sekvencu 3/POSL1/1 bez rupa
    const seq3 = await getNextSequenceNumber(storage.dokumenti, 2026, 'POSL1', '1', 'RACUN');
    expect(seq3.brojSekvenca).toBe(3);
    expect(seq3.brojDokumenta).toBe('3/POSL1/1');

    // 5. Export baze, enkripcija i import
    const backupSnapshot = await createBackupSnapshot(storage);
    expect(backupSnapshot.partneri).toHaveLength(5);
    expect(backupSnapshot.dokumenti).toHaveLength(2); // 1 račun + 1 storno račun

    // AES-256-GCM enkripcija s lozinkom
    const lozinka = 'TajnaLozinka2026!';
    const encryptedBase64 = await encryptBackupData(backupSnapshot, lozinka);
    expect(encryptedBase64).toContain('OBRTNIQ-AES-256-GCM');

    // Dekripcija s točnom lozinkom
    const decryptedSnapshot = await decryptBackupData(encryptedBase64, lozinka);
    expect(decryptedSnapshot.obrt?.oib).toBe('69435151530');
    expect(decryptedSnapshot.partneri).toHaveLength(5);
    expect(decryptedSnapshot.dokumenti).toHaveLength(2);

    // Provjera da kriva lozinka baca grešku
    await expect(decryptBackupData(encryptedBase64, 'KrivaLozinka')).rejects.toThrow();

    // 6. Import u čistu novu bazu
    const novoCistoSkladiste = createInMemoryStorage();
    await restoreBackupSnapshot(novoCistoSkladiste, decryptedSnapshot, true);

    const uvezeniPartneri = await novoCistoSkladiste.partneri.getAll();
    expect(uvezeniPartneri).toHaveLength(5);

    const uvezeniDokumenti = await novoCistoSkladiste.dokumenti.getAll();
    expect(uvezeniDokumenti).toHaveLength(2);
    expect(uvezeniDokumenti[0]?.brojDokumenta).toBe('1/POSL1/1');
    expect(uvezeniDokumenti[1]?.brojDokumenta).toBe('2/POSL1/1');

    // Sljedeća sekvenca u uvezenoj bazi mora nastaviti s 3/POSL1/1
    const seqNakonUvoza = await getNextSequenceNumber(novoCistoSkladiste.dokumenti, 2026, 'POSL1', '1', 'RACUN');
    expect(seqNakonUvoza.brojSekvenca).toBe(3);
    expect(seqNakonUvoza.brojDokumenta).toBe('3/POSL1/1');
  });

  it('ne smije dopustiti brisanje izdanih dokumenata (immuatibility)', async () => {
    const doc: Dokument = {
      id: 'issued-doc',
      partnerId: 'p-1',
      partnerNazivSnapshot: 'Test',
      partnerAdresaSnapshot: 'Zagreb',
      vrstaDokumenta: 'RACUN',
      godina: 2026,
      brojSekvenca: 1,
      brojDokumenta: '1/POSL1/1',
      poslovniProstorOznaka: 'POSL1',
      naplatniUredjajOznaka: '1',
      datumIzdavanja: '2026-02-15',
      vrijemeIzdavanja: '10:00:00',
      datumDospijeca: '2026-02-25',
      datumIsporuke: '2026-02-15',
      nacinPlacanja: 'GOTOVINA',
      iban: 'HR1223600001101234567',
      pozivNaBroj: 'HR00 1-2026',
      jeReverseCharge: false,
      zakonskaNapomena: '',
      status: 'IZDANO', // Nije NACRT!
      valuta: 'EUR',
      ukupnoOsnovica: 100,
      ukupnoPdv: 0,
      ukupnoIznos: 100,
      fiskalizacijaStatus: 'NIJE_POTREBNO',
      eracunStatus: 'NIJE_POTREBNO',
      stavke: []
    };

    await storage.dokumenti.save(doc);

    // Pokušaj brisanja izdanog dokumenta mora baciti grešku
    await expect(storage.dokumenti.deleteDraft('issued-doc')).rejects.toThrow();

    // Provjera da dokument i dalje postoji
    const provjera = await storage.dokumenti.getById('issued-doc');
    expect(provjera).not.toBeNull();
  });
});
