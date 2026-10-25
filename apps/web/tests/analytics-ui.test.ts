import { describe, it, expect } from 'vitest';
import { izracunajGodisnjuAnalitiku } from '@obrtniq/core';

describe('Faza 18: Godišnja Analitika Obrta & PWA Funkcionalnosti', () => {
  it('točno sintetizira KPR primitke, operativne troškove i registar dugotrajne imovine', () => {
    const analitika = izracunajGodisnjuAnalitiku({
      godina: 2026,
      kprStavke: [
        {
          id: 'kpr-1',
          brojDokumenta: '1/2026',
          datumNaplate: '2026-02-10',
          iznosGotovina: 500,
          iznosBezgotovinski: 1500,
          ukupnoNaplaceno: 2000,
          kvartal: 1,
          godina: 2026,
          tipUplate: 'GOTOVINA',
          stvoreno: '2026-02-10T10:00:00.000Z',
          opis: 'Usluge dizajna',
        },
        {
          id: 'kpr-2',
          brojDokumenta: '2/2026',
          datumNaplate: '2026-06-20',
          iznosGotovina: 0,
          iznosBezgotovinski: 8000,
          ukupnoNaplaceno: 8000,
          kvartal: 2,
          godina: 2026,
          tipUplate: 'TRANSAKCIJSKI_RACUN',
          stvoreno: '2026-06-20T10:00:00.000Z',
          opis: 'Razvoj softvera',
        },
      ],
      troskovi: [
        {
          id: 't-1',
          dobavljacNaziv: 'INA d.d.',
          kategorija: 'GORIVO',
          opis: 'Gorivo za teren',
          ukupnoEur: 120,
          datumRacuna: '2026-02-15',
          nacinPlacanja: 'KARTICA_POSLOVNA',
          status: 'PLACENO',
          jeDugotrajnaImovina: false,
          stvoreno: '2026-02-15T12:00:00.000Z',
        },
        {
          id: 't-2',
          dobavljacNaziv: 'Pevex d.d.',
          kategorija: 'ALAT_I_OPREMA',
          opis: 'Udarna bušilica i stalak',
          ukupnoEur: 950,
          datumRacuna: '2026-03-01',
          nacinPlacanja: 'TRANSAKCIJSKI_RACUN',
          status: 'PLACENO',
          jeDugotrajnaImovina: true,
          serijskiBrojOpreme: 'SN-PEVEX-9988',
          stvoreno: '2026-03-01T10:00:00.000Z',
        },
      ],
      doprinosiUplate: [
        {
          id: 'dop-1',
          oib: '12345678901',
          mjesec: 1,
          godina: 2026,
          mjesecNaziv: 'Siječanj',
          doprinosMio1Eur: 115.00,
          doprinosMio2Eur: 38.33,
          doprinosHzzoEur: 126.50,
          ukupnoDoprinosiEur: 279.83,
          rokUplate: '2026-02-15',
          datumUplate: '2026-02-14',
          status: 'UPLACENO',
          pozivNaBroj: 'HR68 12345678901-01',
          ibanPrimatelja: 'HR12345678901',
          stvoreno: '2026-01-01T00:00:00.000Z',
        },
      ],
      kvartalniPorezi: [
        {
          id: 'por-1',
          oib: '12345678901',
          kvartal: 1,
          godina: 2026,
          kvartalNaziv: 'Q1',
          iznosPorezaEur: 150.00,
          rokUplate: '2026-03-31',
          datumUplate: '2026-03-30',
          status: 'UPLACENO',
          pozivNaBroj: 'HR68 12345678901-Q1',
          ibanPrimatelja: 'HR12345678901',
          stvoreno: '2026-03-31T00:00:00.000Z',
        },
      ],
    });

    expect(analitika.godina).toBe(2026);
    expect(analitika.ukupniPrimiciEur).toBe(10000);
    expect(analitika.ukupniOperativniTroskoviEur).toBe(1070);
    expect(analitika.ukupnoPlaceniDoprinosiEur).toBe(279.83);
    expect(analitika.ukupnoPlaceniPorezEur).toBe(150);
    expect(analitika.ukupniIzdaciEur).toBe(1499.83);
    expect(analitika.netoDobitEur).toBe(8500.17);
    expect(analitika.profitnaMarzaPostotak).toBe(85);

    // Dugotrajna imovina
    expect(analitika.dugotrajnaImovinaPopis.length).toBe(1);
    expect(analitika.dugotrajnaImovinaPopis[0]?.iznosEur).toBe(950);
    expect(analitika.dugotrajnaImovinaPopis[0]?.dobavljacNaziv).toBe('Pevex d.d.');
    expect(analitika.dugotrajnaImovinaUkupnoEur).toBe(950);

    // Prag status
    expect(analitika.pragLimitPausalEur).toBe(40000);
    expect(analitika.postotakIskoristenostiPraga).toBe(25);
  });
});
