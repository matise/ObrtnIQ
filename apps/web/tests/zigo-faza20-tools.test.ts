import { describe, it, expect, beforeEach } from 'vitest';
import { executeZigoTool } from '../src/services/zigo-tools-dispatcher';
import { ZIGO_FUNCTION_DECLARATIONS } from '../src/services/gemini-service';
import { createInMemoryStorage, type RecurringProfile } from '@obrtniq/core';

describe('Faza 20: Žigo Copilot Alati za Kalendar i Pretplate (Gate-Check V20-7)', () => {
  let memoryStorage: ReturnType<typeof createInMemoryStorage>;

  beforeEach(async () => {
    memoryStorage = createInMemoryStorage();
    await memoryStorage.obrt.saveProfil({
      oib: '79102730089',
      naziv: 'Dubrovnik Softver Obrt',
      vlasnik: 'Gospar Orlando',
      adresa: 'Stradun 1, Dubrovnik',
      iban: 'HR1234567890123456789',
    });
  });

  describe('1. Deklaracije Alata za Gemini', () => {
    it('sadrži deklaracije provjeri_porezni_kalendar_i_rokove i pregledaj_dospjele_ponavljajuce_racune', () => {
      const toolNames = ZIGO_FUNCTION_DECLARATIONS.map(d => d.name);
      expect(toolNames).toContain('provjeri_porezni_kalendar_i_rokove');
      expect(toolNames).toContain('pregledaj_dospjele_ponavljajuce_racune');
    });
  });

  describe('2. provjeri_porezni_kalendar_i_rokove', () => {
    it('dohvaća porezne rokove i identificira predstojeće obveze', async () => {
      const result = await executeZigoTool(
        'provjeri_porezni_kalendar_i_rokove',
        { godina: 2026, samoPredstojeci: false },
        { storage: memoryStorage as any }
      );

      expect(result.uspjeh).toBe(true);
      expect(result.podaci).toBeDefined();
      expect(result.podaci.godina).toBe(2026);
      expect(result.podaci.rokovi).toBeDefined();
      expect(result.podaci.rokovi.length).toBeGreaterThan(10);
      expect(typeof result.poruka).toBe('string');
      expect(result.poruka.length).toBeGreaterThan(10);
    });

    it('vraća dubrovački ton i prepoznaje uplaćene statuse', async () => {
      // Zabilježi uplatu za siječanj
      if (memoryStorage.doprinosi) {
        await memoryStorage.doprinosi.saveUplata({
          id: 'u-1',
          godina: 2026,
          mjesec: 1,
          iznosEur: 236.46,
          status: 'UPLACENO',
          datumUplate: '2026-02-14',
        });
      }

      const result = await executeZigoTool(
        'provjeri_porezni_kalendar_i_rokove',
        { godina: 2026, samoPredstojeci: false },
        { storage: memoryStorage as any }
      );

      expect(result.uspjeh).toBe(true);
      const sijecanjDoprinos = result.podaci.rokovi.find((r: any) => r.vrsta === 'DOPRINOSI' && r.mjesec === 1);
      expect(sijecanjDoprinos).toBeDefined();
      expect(sijecanjDoprinos.uplaceno).toBe(true);
      expect(sijecanjDoprinos.status).toBe('UPLACENO');
    });
  });

  describe('3. pregledaj_dospjele_ponavljajuce_racune', () => {
    it('obavještava kad nema dospjelih pretplata na miran gosparski način', async () => {
      const result = await executeZigoTool(
        'pregledaj_dospjele_ponavljajuce_racune',
        { datum: '2026-01-01' },
        { storage: memoryStorage as any }
      );

      expect(result.uspjeh).toBe(true);
      expect(result.podaci.brojDospjelih).toBe(0);
      expect(result.podaci.ukupnoDospjeloEur).toBe(0);
      expect(result.poruka).toContain('barke pod zidinama');
    });

    it('detektira dospjele pretplate, računa ukupni iznos i sastavlja operativnu poruku', async () => {
      const profil1: RecurringProfile = {
        id: 'rec-1',
        nazivPredloska: 'Mjesečno održavanje web servera',
        aktivan: true,
        frekvencija: 'MJESECNO',
        danUMjesecu: 15,
        partnerNaziv: 'ACME Adria d.o.o.',
        partnerOib: '69435151530',
        poreznaZona: 'DOMACI_B2B',
        nacinPlacanja: 'TRANSAKCIJSKI_RACUN',
        stavke: [
          {
            id: 'item-1',
            naziv: 'Cloud Hosting SLA',
            kpdSifra: '62.01.11',
            kolicina: 1,
            jedinicaMjere: 'mj',
            cijena: 250.00,
            popustPostotak: 0,
            ukupnoEur: 250.00,
          }
        ],
        pocetniDatum: '2026-01-15',
        sljedeceDospijeceDatum: '2026-10-15',
        kreirano: '2026-01-01T00:00:00Z',
        azurirano: '2026-01-01T00:00:00Z',
      };

      const profil2: RecurringProfile = {
        id: 'rec-2',
        nazivPredloska: 'SEO monitoring',
        aktivan: true,
        frekvencija: 'MJESECNO',
        danUMjesecu: 1,
        partnerNaziv: 'Dubrovnik Sailing d.o.o.',
        partnerOib: '69435151530',
        poreznaZona: 'DOMACI_B2B',
        nacinPlacanja: 'TRANSAKCIJSKI_RACUN',
        stavke: [
          {
            id: 'item-2',
            naziv: 'SEO optimizacija',
            kpdSifra: '62.01.11',
            kolicina: 1,
            jedinicaMjere: 'mj',
            cijena: 150.00,
            popustPostotak: 0,
            ukupnoEur: 150.00,
          }
        ],
        pocetniDatum: '2026-01-01',
        sljedeceDospijeceDatum: '2026-11-01', // U budućnosti
        kreirano: '2026-01-01T00:00:00Z',
        azurirano: '2026-01-01T00:00:00Z',
      };

      const profilNeaktivan: RecurringProfile = {
        ...profil1,
        id: 'rec-3',
        aktivan: false,
        partnerNaziv: 'Neaktivan Klijent d.o.o.',
      };

      await memoryStorage.recurring.save(profil1);
      await memoryStorage.recurring.save(profil2);
      await memoryStorage.recurring.save(profilNeaktivan);

      // Testiramo na dan 2026-10-25: profil1 je dospio (2026-10-15 <= 2026-10-25), profil2 nije (2026-11-01 > 2026-10-25)
      const result = await executeZigoTool(
        'pregledaj_dospjele_ponavljajuce_racune',
        { datum: '2026-10-25' },
        { storage: memoryStorage as any }
      );

      expect(result.uspjeh).toBe(true);
      expect(result.podaci.brojAktivnih).toBe(2);
      expect(result.podaci.brojDospjelih).toBe(1);
      expect(result.podaci.ukupnoDospjeloEur).toBe(250.00);
      expect(result.podaci.dospjeliProfili[0].id).toBe('rec-1');
      expect(result.poruka).toContain('ACME Adria d.o.o.');
      expect(result.poruka).toContain('250,00 €');
    });
  });
});
