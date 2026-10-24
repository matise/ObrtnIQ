import { describe, it, expect, beforeEach } from 'vitest';
import { 
  createInMemoryStorage, 
  createBackupSnapshot, 
  restoreBackupSnapshot, 
  encryptBackup, 
  decryptBackup,
  type IObrtnIQStorage, 
  type Artikl 
} from '../src';

describe('FAZA 9: Katalog Artikala i Usluga s KPD 2025 & Kriptirani Backup', () => {
  let storage: IObrtnIQStorage;

  beforeEach(async () => {
    storage = createInMemoryStorage();
    await storage.clearAll();
  });

  it('V9-1: Kreiranje i perzistencija usluga sa službenim KPD 2025 šiframa', async () => {
    const art1: Artikl = {
      id: 'art-1',
      sifra: 'USL-01',
      kpdSifra: '62.01.11',
      naziv: 'Razvoj softvera i web aplikacija',
      jedinicaMjere: 'sat',
      cijenaOsnovica: 60.0,
      stopaPdv: 0,
      pdvKategorijaPoreza: 'E',
      jeUsluga: true,
      aktivan: true,
    };

    const art2: Artikl = {
      id: 'art-2',
      sifra: 'ROB-01',
      kpdSifra: '26.20.11',
      naziv: 'Prijenosno računalo',
      jedinicaMjere: 'kom',
      cijenaOsnovica: 1200.0,
      stopaPdv: 0,
      pdvKategorijaPoreza: 'E',
      jeUsluga: false,
      aktivan: true,
    };

    await storage.artikli.save(art1);
    await storage.artikli.save(art2);

    const svi = await storage.artikli.getAll();
    expect(svi).toHaveLength(2);

    const dohvacen = await storage.artikli.getById('art-1');
    expect(dohvacen?.kpdSifra).toBe('62.01.11');
    expect(dohvacen?.cijenaOsnovica).toBe(60.0);
    expect(dohvacen?.jeUsluga).toBe(true);
  });

  it('V9-2: Filtriranje aktivnih artikala i deaktivacija', async () => {
    const artikli: Artikl[] = [
      { id: 'a1', kpdSifra: '62.01.11', naziv: 'Usluga A', jedinicaMjere: 'sat', cijenaOsnovica: 50, stopaPdv: 0, pdvKategorijaPoreza: 'E', jeUsluga: true, aktivan: true },
      { id: 'a2', kpdSifra: '62.02.20', naziv: 'Usluga B', jedinicaMjere: 'sat', cijenaOsnovica: 70, stopaPdv: 0, pdvKategorijaPoreza: 'E', jeUsluga: true, aktivan: false },
      { id: 'a3', kpdSifra: '74.10.11', naziv: 'Dizajn C', jedinicaMjere: 'sat', cijenaOsnovica: 45, stopaPdv: 0, pdvKategorijaPoreza: 'E', jeUsluga: true, aktivan: true },
    ];

    for (const a of artikli) {
      await storage.artikli.save(a);
    }

    const svi = await storage.artikli.getAll();
    expect(svi).toHaveLength(3);

    const samoAktivni = await storage.artikli.getAll(true);
    expect(samoAktivni).toHaveLength(2);
    expect(samoAktivni.map((a) => a.id)).toEqual(['a1', 'a3']);
  });

  it('V9-3: Kriptirani backup (AES-256-GCM) pohranjuje i restaurira katalog artikala', async () => {
    const art: Artikl = {
      id: 'art-backup',
      sifra: 'KPD-6201',
      kpdSifra: '62.01.11',
      naziv: 'Razvoj softvera za klijenta',
      jedinicaMjere: 'sat',
      cijenaOsnovica: 75.5,
      stopaPdv: 0,
      pdvKategorijaPoreza: 'E',
      jeUsluga: true,
      aktivan: true,
    };
    await storage.artikli.save(art);

    // 1. Snapshot
    const snapshot = await createBackupSnapshot(storage);
    expect(snapshot.artikli).toHaveLength(1);
    expect(snapshot.artikli[0]?.kpdSifra).toBe('62.01.11');

    // 2. Enkripcija
    const password = 'SuperTajnaLozinka2026!';
    const envelope = await encryptBackup(snapshot, password);
    expect(envelope.format).toBe('OBRTNIQ-AES-256-GCM');
    expect(envelope.salt).toBeDefined();
    expect(envelope.iv).toBeDefined();
    expect(envelope.ciphertext).toBeDefined();

    // 3. Dekripcija
    const decrypted = await decryptBackup(envelope, password);
    expect(decrypted.shemaVerzija).toBe('3.0');
    expect(decrypted.artikli).toHaveLength(1);
    expect(decrypted.artikli[0]?.naziv).toBe('Razvoj softvera za klijenta');
    expect(decrypted.artikli[0]?.cijenaOsnovica).toBe(75.5);

    // 4. Kriva lozinka mora baciti iznimku
    await expect(decryptBackup(envelope, 'PogresnaLozinka')).rejects.toThrow();

    // 5. Restore u novo čisto skladište
    const novoSkladiste = createInMemoryStorage();
    await restoreBackupSnapshot(novoSkladiste, decrypted, true);

    const restaurirani = await novoSkladiste.artikli.getAll();
    expect(restaurirani).toHaveLength(1);
    expect(restaurirani[0]?.kpdSifra).toBe('62.01.11');
  });
});
