import { describe, it, expect } from 'vitest';
import { generateKprCsv, formatCsvIznos } from '../src/domain/kpr-csv';
import type { NaplataPromet } from '../src/domain/types';

describe('KPR CSV Generator (Hrvatski Knjigovodstveni Standard za MS Excel)', () => {
  const sampleStavke: NaplataPromet[] = [
    {
      id: 'nap-1',
      dokumentId: 'doc-1',
      brojKprStavke: 1,
      datumNaplate: '2026-02-15',
      iznosGotovina: 150.00,
      iznosBezgotovinski: 0.00,
      ukupnoNaplaceno: 150.00,
      kvartal: 1,
      godina: 2026,
      opisPlatitelja: 'Ivan Horvat (Račun 1/POSL1/1)',
      brojIzvoda: 'Račun 1/POSL1/1',
    },
    {
      id: 'nap-2',
      dokumentId: 'doc-2',
      brojKprStavke: 2,
      datumNaplate: '2026-05-20',
      iznosGotovina: 0.00,
      iznosBezgotovinski: 1250.50,
      ukupnoNaplaceno: 1250.50,
      kvartal: 2,
      godina: 2026,
      opisPlatitelja: 'Čistoća & Komunalije d.o.o. "Široki Brijeg"',
      brojIzvoda: 'Izvod 45/2026',
    },
    {
      id: 'nap-3',
      dokumentId: 'doc-3',
      brojKprStavke: 3,
      datumNaplate: '2026-11-03',
      iznosGotovina: 0.00,
      iznosBezgotovinski: 800.00,
      ukupnoNaplaceno: 800.00,
      kvartal: 4,
      godina: 2026,
      opisPlatitelja: 'Softver d.o.o. Đakovo',
      brojIzvoda: 'Izvod 99/2026',
    },
  ];

  it('započinje obaveznim UTF-8 BOM (\uFEFF) znakom za ispravan prikaz u Excelu', () => {
    const csv = generateKprCsv(sampleStavke, 2026);
    expect(csv.startsWith('\uFEFF')).toBe(true);
  });

  it('koristi točka-zarez (;) kao delimiter i Windows CRLF za prijelom retka', () => {
    const csv = generateKprCsv(sampleStavke, 2026);
    expect(csv).toContain(';');
    expect(csv).toContain('\r\n');
  });

  it('formatira brojeve s hrvatskim decimalnim zarezom (npr. 1250,50)', () => {
    expect(formatCsvIznos(1250.5)).toBe('1250,50');
    expect(formatCsvIznos(0)).toBe('0,00');
    expect(formatCsvIznos(99.99)).toBe('99,99');

    const csv = generateKprCsv(sampleStavke, 2026);
    expect(csv).toContain('1250,50');
    expect(csv).toContain('150,00');
    expect(csv).toContain('800,00');
  });

  it('točno sumira stupce gotovine, bezgotovinskih uplata i ukupno naplaćeno', () => {
    const csv = generateKprCsv(sampleStavke, 2026);
    // Gotovina: 150.00 -> "150,00"
    // Bezgotovinski: 1250.50 + 800.00 = 2050.50 -> "2050,50"
    // Ukupno: 150 + 2050.50 = 2200.50 -> "2200,50"
    expect(csv).toContain('UKUPNO;;;;150,00;2050,50;2200,50;');
  });

  it('očuvava hrvatske dijakritike (Č, Ć, Ž, Š, Đ) i escapa navodnike u opisu', () => {
    const csv = generateKprCsv(sampleStavke, 2026);
    expect(csv).toContain('Čistoća');
    expect(csv).toContain('Široki Brijeg');
    expect(csv).toContain('Đakovo');
    // Dupli navodnici za escape unutar CSV ćelije
    expect(csv).toContain('""Široki Brijeg""');
  });

  it('ispravno uključuje metapodatke obrta ako su zadani', () => {
    const csv = generateKprCsv(sampleStavke, 2026, {
      obrtNaziv: 'ROBOT HAND MADE',
      obrtOib: '12345678903',
    });
    expect(csv).toContain('KNJIGA PROMETA (KPR) - 2026. GODINA');
    expect(csv).toContain('ROBOT HAND MADE (OIB: 12345678903)');
  });

  it('ispravno obrađuje praznu listu uplata bez rušenja', () => {
    const csv = generateKprCsv([], 2026);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('R.br.;Datum uplate;Broj računa / temeljnice');
    expect(csv).toContain('UKUPNO;;;;0,00;0,00;0,00;');
  });
});
