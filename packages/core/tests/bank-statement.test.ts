// packages/core/tests/bank-statement.test.ts

import { describe, it, expect } from 'vitest';
import { 
  parseBankStatementCsv,
  normalizirajDatum,
  parsirajIznos,
  upariTransakcijuSRacunom
} from '../src';

describe('Faza 17: Parser Bankovnih Izvoda i Automatsko Saldiranje', () => {
  it('Normalizacija različitih formata datuma u YYYY-MM-DD', () => {
    expect(normalizirajDatum('24.10.2026')).toBe('2026-10-24');
    expect(normalizirajDatum('24.10.2026.')).toBe('2026-10-24');
    expect(normalizirajDatum('05/11/2026')).toBe('2026-11-05');
    expect(normalizirajDatum('2026-12-31')).toBe('2026-12-31');
  });

  it('Parsiranje novčanih iznosa s točkom ili zarezom i valutom', () => {
    expect(parsirajIznos('1.250,50 €')).toBe(1250.50);
    expect(parsirajIznos('1250,50')).toBe(1250.50);
    expect(parsirajIznos('45.00 EUR')).toBe(45.00);
    expect(parsirajIznos('-107,88 €')).toBe(107.88);
  });

  it('V17-7: Parsiranje tipičnog CSV izvoda hrvatske banke (ZABA/PBZ/Erste točka-zarez format s dijakriticima)', () => {
    const csvContent = 
`Datum knjiženja;Naziv partnera / Opis;Broj računa / IBAN;Iznos;Poziv na broj
24.10.2026;ACME Solutions d.o.o. Zagreb;HR1223600001101234567;1.250,00;HR00 12-2026
25.10.2026;Kupac Šime Čačić Dubrovnik;HR8424020061109876543;450,00;14-2026
26.10.2026;Hrvatski Telekom d.d. Zagreb;HR1224840081105555555;-40,00;00 98214-2026
28.10.2026;Državni proračun RH;HR1210010051863000160;-107,88;HR68 8214-79102730089-2610
`;

    const result = parseBankStatementCsv(csvContent);

    expect(result.brojStavaka).toBe(4);
    expect(result.ukupnoUplateEur).toBe(1700.00); // 1250 + 450
    expect(result.ukupnoIsplateEur).toBe(147.88); // 40 + 107.88
    
    // Stavka 1 (Uplata ACME)
    expect(result.stavke[0]!.smjer).toBe('UPLATA');
    expect(result.stavke[0]!.nazivPartnera).toContain('ACME Solutions');
    expect(result.stavke[0]!.iznosEur).toBe(1250.00);
    expect(result.stavke[0]!.pozivNaBroj).toBe('HR00 12-2026');

    // Stavka 2 (Uplata Šime Čačić s dijakriticima)
    expect(result.stavke[1]!.smjer).toBe('UPLATA');
    expect(result.stavke[1]!.nazivPartnera).toContain('Šime Čačić');
    expect(result.stavke[1]!.iznosEur).toBe(450.00);

    // Stavka 4 (Isplata doprinosa)
    expect(result.stavke[3]!.smjer).toBe('ISPLATA');
    expect(result.stavke[3]!.iznosEur).toBe(107.88);
  });

  it('V17-8: Automatsko uparivanje uplate iz izvoda s neplaćenim izdanim računom', () => {
    const dokumenti = [
      {
        id: 'doc-1',
        brojDokumenta: '12/POSL1/1',
        pozivNaBroj: 'HR00 12-2026',
        ukupnoIznos: 1250.00,
        status: 'IZDANO',
      },
      {
        id: 'doc-2',
        brojDokumenta: '14/POSL1/1',
        pozivNaBroj: 'HR00 14-2026',
        ukupnoIznos: 450.00,
        status: 'IZDANO',
      },
      {
        id: 'doc-3',
        brojDokumenta: '15/POSL1/1',
        pozivNaBroj: 'HR00 15-2026',
        ukupnoIznos: 900.00,
        status: 'PLACENO', // Već plaćeno
      },
    ];

    const stavkaUplata1 = {
      id: 'trx-1',
      brojIzvoda: 'IZV-1',
      datumKnjizenja: '2026-10-24',
      nazivPartnera: 'ACME Solutions',
      smjer: 'UPLATA' as const,
      iznosEur: 1250.00,
      pozivNaBroj: 'HR00 12-2026',
      opisPlacanja: 'Plaćanje računa 12/POSL1/1',
      statusPovezivanja: 'NEPOVEZANO' as const,
    };

    const upareniId = upariTransakcijuSRacunom(stavkaUplata1, dokumenti);
    expect(upareniId).toBe('doc-1');

    // Transakcija koja je isplata ne smije se povezati
    const stavkaIsplata = {
      ...stavkaUplata1,
      smjer: 'ISPLATA' as const,
    };
    expect(upariTransakcijuSRacunom(stavkaIsplata, dokumenti)).toBeNull();
  });
});
