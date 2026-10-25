// packages/core/tests/troskovi.test.ts

import { describe, it, expect } from 'vitest';
import { 
  izracunajTroskovnikSazetak,
  provjeriPragDugotrajneImovine,
  PRAG_DUGOTRAJNE_IMOVINE_EUR,
  izracunajCashFlow,
  createInMemoryStorage,
  createBackupSnapshot,
  restoreBackupSnapshot,
  encryptBackupData,
  decryptBackupData,
  type UlazniTrosak
} from '../src';

describe('Faza 17: Troškovnik, Dugotrajna Imovina, Cash-Flow i Backup', () => {
  const sampleTroskovi: UlazniTrosak[] = [
    {
      id: 't-1',
      brojUlaznogDokumenta: 'INV-2026-01',
      dobavljacNaziv: 'Google Cloud EMEA',
      datumRacuna: '2026-03-01',
      datumDospijeca: '2026-03-15',
      datumPlacanja: '2026-03-05',
      kategorija: 'SOFTVERSKE_PRETPLATE',
      opis: 'Google Cloud TTS & Gemini API',
      iznosBezPdvEur: 40.00,
      iznosPdvEur: 10.00,
      ukupnoEur: 50.00,
      nacinPlacanja: 'KARTICA_POSLOVNA',
      status: 'PLACENO',
      jeDugotrajnaImovina: false,
    },
    {
      id: 't-2',
      brojUlaznogDokumenta: 'RAC-3D-99',
      dobavljacNaziv: '3D Print Shop d.o.o.',
      datumRacuna: '2026-04-10',
      datumDospijeca: '2026-04-25',
      datumPlacanja: '2026-04-12',
      kategorija: 'OPREMA_I_HARDVER',
      opis: 'Novi 3D printer Bambu Lab X1C',
      iznosBezPdvEur: 1200.00,
      iznosPdvEur: 300.00,
      ukupnoEur: 1500.00,
      nacinPlacanja: 'TRANSAKCIJSKI_RACUN',
      status: 'PLACENO',
      jeDugotrajnaImovina: true,
      serijskiBrojOpreme: 'BL-X1C-98217',
    },
    {
      id: 't-3',
      brojUlaznogDokumenta: 'TEL-2026-04',
      dobavljacNaziv: 'Hrvatski Telekom d.d.',
      datumRacuna: '2026-04-15',
      datumDospijeca: '2026-04-30',
      kategorija: 'TELEKOMUNIKACIJE_NET',
      opis: 'Optički internet za poslovni prostor',
      iznosBezPdvEur: 32.00,
      iznosPdvEur: 8.00,
      ukupnoEur: 40.00,
      nacinPlacanja: 'TRANSAKCIJSKI_RACUN',
      status: 'NEPLACENO',
      jeDugotrajnaImovina: false,
    },
  ];

  it('V17-5: Provjera kategorizacije, zbrojeva i praga dugotrajne imovine', () => {
    expect(provjeriPragDugotrajneImovine(50.00)).toBe(false);
    expect(provjeriPragDugotrajneImovine(PRAG_DUGOTRAJNE_IMOVINE_EUR)).toBe(true);
    expect(provjeriPragDugotrajneImovine(1500.00)).toBe(true);

    const sazetak = izracunajTroskovnikSazetak(sampleTroskovi, 2026);

    expect(sazetak.brojTroskova).toBe(3);
    expect(sazetak.ukupnoTroskovaEur).toBe(1590.00);
    expect(sazetak.ukupnoPlacenoEur).toBe(1550.00);
    expect(sazetak.ukupnoNeplacenoEur).toBe(40.00);
    expect(sazetak.dugotrajnaImovinaUkupnoEur).toBe(1500.00);
    expect(sazetak.poKategorijama.SOFTVERSKE_PRETPLATE).toBe(50.00);
    expect(sazetak.poKategorijama.OPREMA_I_HARDVER).toBe(1500.00);
    expect(sazetak.poKategorijama.TELEKOMUNIKACIJE_NET).toBe(40.00);
  });

  it('V17-6: Cash-Flow analiza i stvarna neto dobit obrta', () => {
    // Primici: 20.000 €
    // Troškovi: 1.550 €
    // Doprinosi: 2.625,10 € (10 mjeseci po 262,51 €)
    // Porez: 360,00 € (4 kvartala po 90 €)
    // Ukupni izdaci: 1.550 + 2.625,10 + 360 = 4.535,10 €
    // Neto dobit: 20.000 - 4.535,10 = 15.464,90 €
    const cf = izracunajCashFlow({
      ukupnoNaplacenoKprEur: 20000.00,
      ukupnoPlaceniTroskoviEur: 1550.00,
      ukupnoPlaceniDoprinosiEur: 2625.10,
      ukupnoPlaceniPorezEur: 360.00,
      zakonskiPragEur: 40000.00,
    });

    expect(cf.ukupniPrimiciEur).toBe(20000.00);
    expect(cf.ukupniIzdaciEur).toBe(4535.10);
    expect(cf.netoDobitEur).toBe(15464.90);
    expect(cf.preostaloDoPragaEur).toBe(20000.00);
    expect(cf.postotakIskoristenostiPraga).toBe(50.00);
    expect(cf.profitnaMarzaPostotak).toBe(77.32); // 15.464,90 / 20.000 * 100
  });

  it('V17-10: In-Memory Storage i AES-256-GCM Backup/Restore s troškovima i doprinosima', async () => {
    const storage = createInMemoryStorage();

    // Spremi trošak
    await storage.troskovi!.save(sampleTroskovi[0]!);
    await storage.troskovi!.save(sampleTroskovi[1]!);

    // Spremi uplatu doprinosa
    const sampleDoprinos = {
      id: 'doprinos-2026-10',
      godina: 2026,
      mjesec: 10,
      rokPlacanja: '2026-11-15',
      status: 'UPLACENO' as const,
      datumUplate: '2026-11-10',
      iznosMio1Eur: 107.88,
      pozivNaBrojMio1: '8214-79102730089-2610',
      ibanMio1: 'HR1210010051863000160',
      iznosMio2Eur: 35.96,
      pozivNaBrojMio2: '2054-79102730089-2610',
      ibanMio2: 'HR8410010051863000213',
      iznosHzzoEur: 118.67,
      pozivNaBrojHzzo: '8478-79102730089-2610',
      ibanHzzo: 'HR1210010051863000160',
      ukupnoDoprinosiEur: 262.51,
    };
    await storage.doprinosi!.saveUplata(sampleDoprinos);

    // Kreiraj snapshot
    const snapshot = await createBackupSnapshot(storage);
    expect(snapshot.troskovi?.length).toBe(2);
    expect(snapshot.doprinosi?.length).toBe(1);

    // Enkriptiraj lozinkom
    const lozinka = 'TajnaLozinka123!';
    const encrypted = await encryptBackupData(snapshot, lozinka);
    expect(typeof encrypted).toBe('string');
    expect(encrypted.length).toBeGreaterThan(100);

    // Dekriptiraj
    const decrypted = await decryptBackupData(encrypted, lozinka);
    expect(decrypted.troskovi?.length).toBe(2);
    expect(decrypted.doprinosi?.length).toBe(1);

    // Restauriraj u novi prazni storage
    const newStorage = createInMemoryStorage();
    await restoreBackupSnapshot(newStorage, decrypted);

    const restoredTroskovi = await newStorage.troskovi!.getAll();
    expect(restoredTroskovi.length).toBe(2);
    expect(restoredTroskovi[1]!.opis).toBe('Novi 3D printer Bambu Lab X1C');

    const restoredDoprinosi = await newStorage.doprinosi!.getAllUplate();
    expect(restoredDoprinosi.length).toBe(1);
    expect(restoredDoprinosi[0]!.ukupnoDoprinosiEur).toBe(262.51);
  });
});
