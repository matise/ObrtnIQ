import { describe, it, expect } from 'vitest';
import { izracunajGodisnjuAnalitiku } from '../src/domain/analytics';
import type { NaplataPromet } from '../src/domain/types';
import type { UlazniTrosak } from '../src/domain/troskovi';

describe('Godišnja Poslovna Analitika Obrta (Faza 18)', () => {
  it('ispravno sintetizira primitke, troškove po kategorijama i neto dobit', () => {
    const kprStavke: NaplataPromet[] = [
      {
        id: 'kpr-1',
        brojKprStavke: 1,
        datumNaplate: '2026-02-10',
        opisPlatitelja: 'Alpha Tech d.o.o.',
        iznosGotovina: 0,
        iznosBezgotovinski: 3000,
        ukupnoNaplaceno: 3000,
        kvartal: 1,
        godina: 2026,
      },
      {
        id: 'kpr-2',
        brojKprStavke: 2,
        datumNaplate: '2026-05-15',
        opisPlatitelja: 'Beta Corp',
        iznosGotovina: 0,
        iznosBezgotovinski: 2000,
        ukupnoNaplaceno: 2000,
        kvartal: 2,
        godina: 2026,
      },
      {
        id: 'kpr-3',
        brojKprStavke: 3,
        datumNaplate: '2026-08-20',
        opisPlatitelja: 'Alpha Tech d.o.o.',
        iznosGotovina: 0,
        iznosBezgotovinski: 5000,
        ukupnoNaplaceno: 5000,
        kvartal: 3,
        godina: 2026,
      },
    ];

    const troskovi: UlazniTrosak[] = [
      {
        id: 't-1',
        brojUlaznogDokumenta: 'R-1',
        dobavljacNaziv: 'Hetzner Online',
        datumRacuna: '2026-02-05',
        datumDospijeca: '2026-02-20',
        datumPlacanja: '2026-02-05',
        kategorija: 'HOSTING_I_DOMENE',
        opis: 'Cloud server',
        iznosBezPdvEur: 80,
        iznosPdvEur: 20,
        ukupnoEur: 100,
        nacinPlacanja: 'KARTICA_POSLOVNA',
        status: 'PLACENO',
        jeDugotrajnaImovina: false,
        kreirano: '2026-02-05T10:00:00Z',
      },
      {
        id: 't-2',
        brojUlaznogDokumenta: 'R-2',
        dobavljacNaziv: 'Apple Inc.',
        datumRacuna: '2026-03-01',
        datumDospijeca: '2026-03-01',
        datumPlacanja: '2026-03-01',
        kategorija: 'ALATI_I_OPREMA',
        opis: 'MacBook Pro',
        iznosBezPdvEur: 1600,
        iznosPdvEur: 400,
        ukupnoEur: 2000,
        nacinPlacanja: 'TRANSAKCIJSKI_RACUN',
        status: 'PLACENO',
        jeDugotrajnaImovina: true,
        serijskiBrojOpreme: 'C02G1234XYZ',
        kreirano: '2026-03-01T10:00:00Z',
      },
    ];

    const analitika = izracunajGodisnjuAnalitiku({
      godina: 2026,
      kprStavke,
      troskovi,
    });

    expect(analitika.godina).toBe(2026);
    expect(analitika.ukupniPrimiciEur).toBe(10000);
    expect(analitika.ukupniOperativniTroskoviEur).toBe(2100);
    expect(analitika.netoDobitEur).toBe(7900);
    expect(analitika.profitnaMarzaPostotak).toBe(79);

    // Provjera Top partnera
    expect(analitika.topPartneri.length).toBe(2);
    expect(analitika.topPartneri[0]?.partnerNaziv).toBe('Alpha Tech d.o.o.');
    expect(analitika.topPartneri[0]?.ukupnoUplacenoEur).toBe(8000);
    expect(analitika.topPartneri[0]?.postotakUdjela).toBe(80);

    // Provjera dugotrajne imovine
    expect(analitika.dugotrajnaImovinaPopis.length).toBe(1);
    expect(analitika.dugotrajnaImovinaPopis[0]?.opis).toBe('MacBook Pro');
    expect(analitika.dugotrajnaImovinaUkupnoEur).toBe(2000);

    // Provjera praga paušala
    expect(analitika.pragLimitPausalEur).toBe(40000);
    expect(analitika.postotakIskoristenostiPraga).toBe(25);
  });
});
