// apps/web/tests/bookkeeping.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  generirajGodisnjeDoprinose, 
  generirajKvartalnePorezneNaloge, 
  izracunajTroskovnikSazetak,
  izracunajCashFlow,
  parseBankStatementCsv,
  provjeriPragDugotrajneImovine,
  createInMemoryStorage,
  DEFAULT_DOPRINOSI_CONFIG_2026
} from '@obrtniq/core';

describe('Faza 17: Sveobuhvatno Knjigovodstvo Obrta (Testni Protokol V17)', () => {
  const testOib = '79102730089';
  let storage: ReturnType<typeof createInMemoryStorage>;

  beforeEach(() => {
    storage = createInMemoryStorage();
  });

  describe('BK-01: Obvezni doprinosi i kvartalni paušalni porez', () => {
    it('generira svih 12 mjeseci doprinosa s točnim iznosima i HR68 pozivima na broj', () => {
      const doprinosi = generirajGodisnjeDoprinose(testOib, 2026);
      expect(doprinosi.length).toBe(12);

      // Listopad (mjesec 10)
      const listopad = doprinosi[9]!;
      expect(listopad.mjesec).toBe(10);
      expect(listopad.iznosMio1Eur).toBe(107.88);
      expect(listopad.iznosMio2Eur).toBe(35.96);
      expect(listopad.iznosHzzoEur).toBe(118.67);
      expect(listopad.ukupnoDoprinosiEur).toBe(262.51);
      expect(listopad.pozivNaBrojMio1).toBe('8214-79102730089-2610');
      expect(listopad.pozivNaBrojMio2).toBe('2054-79102730089-2610');
      expect(listopad.pozivNaBrojHzzo).toBe('8478-79102730089-2610');
      expect(listopad.rokPlacanja).toBe('2026-11-15');
    });

    it('generira 4 kvartalna naloga poreza sa šifrom općine', () => {
      const nalozi = generirajKvartalnePorezneNaloge(testOib, 2026, 18000); // Razred 3
      expect(nalozi.length).toBe(4);
      expect(nalozi[0]!.razred).toBe(3);
      expect(nalozi[0]!.iznosPorezaEur).toBe(90.00);
      expect(nalozi[0]!.pozivNaBroj).toContain('1414-79102730089-0097');
      expect(nalozi[0]!.rokPlacanja).toBe('2026-03-31');
    });
  });

  describe('BK-02: Perzistencija uplata doprinosa u sloju pohrane', () => {
    it('uspješno sprema i dohvaća uplaćeni doprinos iz storage.doprinosi', async () => {
      const uplata = {
        id: 'doprinos-2026-10',
        godina: 2026,
        mjesec: 10,
        status: 'UPLACENO' as const,
        datumUplate: '2026-11-12',
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
        rokPlacanja: '2026-11-15',
      };

      await storage.doprinosi!.saveUplata(uplata);

      const all = await storage.doprinosi!.getAllUplate(2026);
      expect(all.length).toBe(1);
      expect(all[0]!.mjesec).toBe(10);
      expect(all[0]!.datumUplate).toBe('2026-11-12');
      expect(all[0]!.ukupnoDoprinosiEur).toBe(262.51);

      // Brisanje / poništavanje
      await storage.doprinosi!.deleteUplata('doprinos-2026-10');
      const afterDelete = await storage.doprinosi!.getAllUplate(2026);
      expect(afterDelete.length).toBe(0);
    });
  });

  describe('BK-03: Troškovnik i evidencija ulaznih računa u sloju pohrane', () => {
    it('sprema i filtrira ulazne troškove te prepoznaje dugotrajnu imovinu', async () => {
      const trosak1 = {
        id: 'tr-1',
        brojUlaznogDokumenta: 'RAC-101',
        dobavljacNaziv: 'Google Cloud EMEA',
        datumRacuna: '2026-05-01',
        datumDospijeca: '2026-05-15',
        kategorija: 'SOFTVERSKE_PRETPLATE' as const,
        opis: 'Google Cloud STT v2',
        iznosBezPdvEur: 20.00,
        iznosPdvEur: 5.00,
        ukupnoEur: 25.00,
        nacinPlacanja: 'KARTICA_POSLOVNA' as const,
        status: 'PLACENO' as const,
        jeDugotrajnaImovina: provjeriPragDugotrajneImovine(25.00),
      };

      const trosak2 = {
        id: 'tr-2',
        brojUlaznogDokumenta: 'INV-3D',
        dobavljacNaziv: 'Bambu Lab Store',
        datumRacuna: '2026-06-10',
        datumDospijeca: '2026-06-25',
        kategorija: 'OPREMA_I_HARDVER' as const,
        opis: '3D Printer X1-Carbon',
        iznosBezPdvEur: 1200.00,
        iznosPdvEur: 300.00,
        ukupnoEur: 1500.00,
        nacinPlacanja: 'TRANSAKCIJSKI_RACUN' as const,
        status: 'PLACENO' as const,
        jeDugotrajnaImovina: provjeriPragDugotrajneImovine(1500.00),
        serijskiBrojOpreme: 'BL-9812-X',
      };

      await storage.troskovi!.save(trosak1);
      await storage.troskovi!.save(trosak2);

      const items = await storage.troskovi!.getAll(2026);
      expect(items.length).toBe(2);

      const sazetak = izracunajTroskovnikSazetak(items, 2026);
      expect(sazetak.ukupnoTroskovaEur).toBe(1525.00);
      expect(sazetak.dugotrajnaImovinaUkupnoEur).toBe(1500.00);
      expect(sazetak.poKategorijama.OPREMA_I_HARDVER).toBe(1500.00);
      expect(sazetak.poKategorijama.SOFTVERSKE_PRETPLATE).toBe(25.00);
    });
  });

  describe('BK-04: Cash-Flow analiza i stvarna dobit', () => {
    it('točno računa profitnu maržu i preostali iznos do poreznog praga od 40.000 €', () => {
      const cf = izracunajCashFlow({
        ukupnoNaplacenoKprEur: 25000.00,
        ukupnoPlaceniTroskoviEur: 3000.00,
        ukupnoPlaceniDoprinosiEur: 3150.12, // 12 x 262.51
        ukupnoPlaceniPorezEur: 540.00,
      });

      expect(cf.ukupniPrimiciEur).toBe(25000.00);
      expect(cf.ukupniIzdaciEur).toBe(6690.12);
      expect(cf.netoDobitEur).toBe(18309.88);
      expect(cf.preostaloDoPragaEur).toBe(15000.00);
      expect(cf.profitnaMarzaPostotak).toBe(73.24);
    });
  });

  describe('BK-05: Parser bankovnih CSV izvoda', () => {
    it('točno prepoznaje uplate i isplate iz točka-zarez CSV formata', () => {
      const csv = `Datum;Partner;Iznos;Poziv
10.05.2026;Klijent A d.o.o.;800,00;HR00 2026-05
11.05.2026;Hrvatski Telekom;-35,00;00 9821
12.05.2026;Državni proračun;-262,51;HR68 8214-79102730089-2604`;

      const parsed = parseBankStatementCsv(csv);
      expect(parsed.brojStavaka).toBe(3);
      expect(parsed.ukupnoUplateEur).toBe(800.00);
      expect(parsed.ukupnoIsplateEur).toBe(297.51); // 35 + 262.51
      expect(parsed.stavke[0]!.smjer).toBe('UPLATA');
      expect(parsed.stavke[1]!.smjer).toBe('ISPLATA');
      expect(parsed.stavke[2]!.smjer).toBe('ISPLATA');
    });
  });
});
