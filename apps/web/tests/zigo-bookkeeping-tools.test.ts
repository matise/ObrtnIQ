import { describe, it, expect, beforeEach } from 'vitest';
import { executeZigoTool } from '../src/services/zigo-tools-dispatcher';
import { createInMemoryStorage } from '@obrtniq/core';

describe('Faza 18: Žigo Knjigovodstveni Copilot Alati & Dispečer', () => {
  let memoryStorage: ReturnType<typeof createInMemoryStorage>;

  beforeEach(async () => {
    memoryStorage = createInMemoryStorage();
    await memoryStorage.obrt.saveProfil({
      oib: '12345678901',
      naziv: 'Dubrovnik IT Obrt',
      vlasnik: 'Gospar Orlando',
      adresa: 'Stradun 1, Dubrovnik',
      iban: 'HR1234567890123456789',
    });
  });

  describe('1. provjeri_obvezne_doprinose_i_porez', () => {
    it('uspješno dohvata status doprinosa i poreza za traženu godinu', async () => {
      const result = await executeZigoTool(
        'provjeri_obvezne_doprinose_i_porez',
        { godina: 2026 },
        { storage: memoryStorage as any }
      );

      expect(result.uspjeh).toBe(true);
      expect(result.podaci).toBeDefined();
      expect(result.podaci.godina).toBe(2026);
      expect(result.podaci.doprinosi).toBeDefined();
      expect(result.podaci.doprinosi.length).toBe(12);
      expect(result.podaci.kvartalniPorezi).toBeDefined();
      expect(result.podaci.kvartalniPorezi.length).toBe(4);
      expect(result.poruka).toContain('Doprinosi');
    });
  });

  describe('2. evidentiraj_ulazni_trosak', () => {
    it('evidentira standardni operativni trošak (npr. gorivo)', async () => {
      const result = await executeZigoTool(
        'evidentiraj_ulazni_trosak',
        {
          dobavljacNaziv: 'INA d.d.',
          kategorija: 'GORIVO',
          opis: 'Eurodiesel gorivo za terenski rad',
          ukupnoEur: 65.50,
          datumRacuna: '2026-03-15',
          nacinPlacanja: 'KARTICA_POSLOVNA',
          jePlaceno: true,
        },
        { storage: memoryStorage as any }
      );

      expect(result.uspjeh).toBe(true);
      expect(result.podaci?.trosak).toBeDefined();
      expect(result.podaci.trosak.dobavljacNaziv).toBe('INA d.d.');
      expect(result.podaci.trosak.kategorija).toBe('GORIVO_I_PUTOVANJA');
      expect(result.podaci.trosak.ukupnoEur).toBe(65.50);
      expect(result.podaci.trosak.jeDugotrajnaImovina).toBe(false);
      expect(result.poruka).toContain('Evidentiran trošak: INA d.d.');
    });

    it('automatski označava dugotrajnu imovinu kada je iznos >= 663,61 €', async () => {
      const result = await executeZigoTool(
        'evidentiraj_ulazni_trosak',
        {
          dobavljacNaziv: 'Pevex d.d.',
          kategorija: 'ALAT_I_OPREMA',
          opis: 'Profesionalna bušilica i oprema',
          ukupnoEur: 850.00,
          serijskiBrojOpreme: 'SN-BOSCH-994',
        },
        { storage: memoryStorage as any }
      );

      expect(result.uspjeh).toBe(true);
      expect(result.podaci.trosak.jeDugotrajnaImovina).toBe(true);
      expect(result.podaci.trosak.serijskiBrojOpreme).toBe('SN-BOSCH-994');
      expect(result.poruka).toContain('Prekoračen prag dugotrajne imovine');
    });
  });

  describe('3. dohvati_financijsku_sliku_i_dobit', () => {
    it('izračunava točnu financijsku sliku i maržu', async () => {
      // 1. Zavedi naplatu u KPR
      await memoryStorage.kpr.save({
        id: 'kpr-1',
        brojKprStavke: 1,
        datumNaplate: '2026-04-10',
        iznosGotovina: 0,
        iznosBezgotovinski: 5000,
        ukupnoNaplaceno: 5000,
        kvartal: 2,
        godina: 2026,
        opisPlatitelja: 'Partner d.o.o.',
        brojIzvoda: 'Izvod 4/2026',
      });

      // 2. Zavedi plaćeni trošak
      await memoryStorage.troskovi.save({
        id: 'tr-1',
        brojUlaznogDokumenta: 'UL-001',
        dobavljacNaziv: 'Telekom d.d.',
        kategorija: 'TELEKOMUNIKACIJE_NET',
        opis: 'Internet optika',
        iznosBezPdvEur: 40.00,
        iznosPdvEur: 10.00,
        ukupnoEur: 50.00,
        datumRacuna: '2026-04-12',
        datumDospijeca: '2026-04-20',
        nacinPlacanja: 'TRANSAKCIJSKI_RACUN',
        status: 'PLACENO',
        jeDugotrajnaImovina: false,
      });

      const result = await executeZigoTool(
        'dohvati_financijsku_sliku_i_dobit',
        { godina: 2026 },
        { storage: memoryStorage as any }
      );

      expect(result.uspjeh).toBe(true);
      expect(result.podaci.kprPrimiciEur).toBe(5000);
      expect(result.podaci.operativniTroskoviEur).toBe(50);
      expect(result.podaci.netoDobitEur).toBeLessThanOrEqual(4950);
      expect(result.podaci.profitnaMarzaPostotak).toBeGreaterThan(0);
      expect(result.poruka).toContain('Financijska slika za 2026.');
    });
  });

  describe('4. saldiraj_izvod_transakcije', () => {
    it('evidentira uplatu s izvoda u KPR i označava povezani račun kao plaćen', async () => {
      // 1. Stvori izlazni račun
      await memoryStorage.dokumenti.save({
        id: 'doc-123',
        brojSekvenca: 1,
        brojDokumenta: '1/POSL1/1',
        partnerId: 'part-1',
        partnerNazivSnapshot: 'Partner d.o.o.',
        partnerOibSnapshot: '98765432109',
        partnerAdresaSnapshot: 'Zagreb',
        vrstaDokumenta: 'RACUN',
        godina: 2026,
        poslovniProstorOznaka: 'POSL1',
        naplatniUredjajOznaka: '1',
        datumIzdavanja: '2026-05-01',
        vrijemeIzdavanja: '10:00:00',
        datumDospijeca: '2026-05-15',
        datumIsporuke: '2026-05-01',
        nacinPlacanja: 'TRANSAKCIJSKI_RACUN',
        iban: 'HR1234567890123456789',
        pozivNaBroj: 'HR00 1-2026',
        jeReverseCharge: false,
        zakonskaNapomena: 'Paušalni obrt',
        status: 'IZDANO',
        valuta: 'EUR',
        ukupnoOsnovica: 1200,
        ukupnoPdv: 0,
        ukupnoIznos: 1200,
        fiskalizacijaStatus: 'NIJE_POTREBNO',
      });

      const result = await executeZigoTool(
        'saldiraj_izvod_transakcije',
        {
          dokumentId: 'doc-123',
          iznosEur: 1200,
          datumNaplate: '2026-05-05',
          brojIzvoda: 'Izvod 5/2026',
          opisPlatitelja: 'Partner d.o.o.',
        },
        { storage: memoryStorage as any }
      );

      expect(result.uspjeh).toBe(true);
      expect(result.podaci.kprStavka).toBeDefined();
      expect(result.podaci.kprStavka.ukupnoNaplaceno).toBe(1200);

      // Provjeri je li račun u bazi postao označen kao PLAĆENO
      const azuriranDoc = await memoryStorage.dokumenti.getById('doc-123');
      expect(azuriranDoc?.status).toBe('PLACENO');
      expect(result.poruka).toContain('Transakcija saldirana u KPR');
    });
  });
});
