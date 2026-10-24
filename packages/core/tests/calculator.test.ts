import { describe, it, expect } from 'vitest';
import { 
  calculateStavka, 
  calculateDocumentTotals, 
  calculatePausalniPragStatus,
  round2,
  toCents,
  fromCents
} from '../src/utils/calculator';

describe('Financijski Kalkulator i Matematika (Core Engine)', () => {
  it('toCents i fromCents trebaju točno pretvarati bez gubitka preciznosti', () => {
    expect(toCents(12.34)).toBe(1234);
    expect(fromCents(1234)).toBe(12.34);
    expect(toCents(0.01)).toBe(1);
    expect(fromCents(1)).toBe(0.01);
  });

  it('round2 treba eliminirati floating-point IEEE 754 anomalije', () => {
    // Poznata greška u JS-u: 0.1 + 0.2 === 0.30000000000000004
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(1.005)).toBe(1.01);
    expect(round2(10.555)).toBe(10.56);
  });

  it('calculateStavka za paušalista (0% PDV, bez popusta)', () => {
    const rez = calculateStavka({
      kolicina: 5,
      jedinicnaCijena: 120.00,
      popustPostotak: 0,
      stopaPdv: 0,
    });

    expect(rez.iznosPrijePopusta).toBe(600.00);
    expect(rez.iznosPopusta).toBe(0.00);
    expect(rez.osnovica).toBe(600.00);
    expect(rez.stopaPdv).toBe(0);
    expect(rez.iznosPdv).toBe(0.00);
    expect(rez.ukupno).toBe(600.00);
  });

  it('calculateStavka sa standardnim popustom i PDV-om (25%)', () => {
    const rez = calculateStavka({
      kolicina: 3,
      jedinicnaCijena: 100.00,
      popustPostotak: 10, // 10% popusta
      stopaPdv: 25,
    });

    expect(rez.iznosPrijePopusta).toBe(300.00);
    expect(rez.iznosPopusta).toBe(30.00);
    expect(rez.osnovica).toBe(270.00);
    expect(rez.iznosPdv).toBe(67.50);
    expect(rez.ukupno).toBe(337.50);
  });

  it('calculateDocumentTotals treba točno rekapitulirati više stavki i stope', () => {
    const stavka1 = calculateStavka({ kolicina: 2, jedinicnaCijena: 50, popustPostotak: 0, stopaPdv: 25 });
    const stavka2 = calculateStavka({ kolicina: 1, jedinicnaCijena: 200, popustPostotak: 5, stopaPdv: 0 }); // paušalna usluga
    const stavka3 = calculateStavka({ kolicina: 4, jedinicnaCijena: 25, popustPostotak: 0, stopaPdv: 25 });

    const totals = calculateDocumentTotals([stavka1, stavka2, stavka3]);

    // Stavka 1: 100 osn + 25 pdv = 125
    // Stavka 2: 190 osn + 0 pdv = 190
    // Stavka 3: 100 osn + 25 pdv = 125
    // Ukupno: 390 osnovica + 50 pdv = 440 ukupno
    expect(totals.ukupnoOsnovica).toBe(390.00);
    expect(totals.ukupnoPdv).toBe(50.00);
    expect(totals.ukupnoIznos).toBe(440.00);

    expect(totals.rekapitulacijaPoreza).toHaveLength(2);
    // Stopa 0%
    expect(totals.rekapitulacijaPoreza[0]?.stopaPdv).toBe(0);
    expect(totals.rekapitulacijaPoreza[0]?.osnovica).toBe(190.00);
    expect(totals.rekapitulacijaPoreza[0]?.iznosPdv).toBe(0.00);
    // Stopa 25%
    expect(totals.rekapitulacijaPoreza[1]?.stopaPdv).toBe(25);
    expect(totals.rekapitulacijaPoreza[1]?.osnovica).toBe(200.00);
    expect(totals.rekapitulacijaPoreza[1]?.iznosPdv).toBe(50.00);
  });

  describe('Paušalni Prag 40.000,00 EUR', () => {
    it('ispravno prati stanje ispod 75%', () => {
      const status = calculatePausalniPragStatus(20000, 40000);
      expect(status.postotakIskoristenosti).toBe(50.00);
      expect(status.preostaloDoPragaEur).toBe(20000.00);
      expect(status.upozorenje75).toBe(false);
      expect(status.upozorenje90).toBe(false);
      expect(status.prekoracenPrag).toBe(false);
    });

    it('aktivira upozorenje 75% kada je promet između 75% i 90%', () => {
      const status = calculatePausalniPragStatus(31000, 40000);
      expect(status.postotakIskoristenosti).toBe(77.50);
      expect(status.preostaloDoPragaEur).toBe(9000.00);
      expect(status.upozorenje75).toBe(true);
      expect(status.upozorenje90).toBe(false);
      expect(status.prekoracenPrag).toBe(false);
    });

    it('aktivira upozorenje 90% kada je promet između 90% i 100%', () => {
      const status = calculatePausalniPragStatus(38500, 40000);
      expect(status.postotakIskoristenosti).toBe(96.25);
      expect(status.preostaloDoPragaEur).toBe(1500.00);
      expect(status.upozorenje75).toBe(false);
      expect(status.upozorenje90).toBe(true);
      expect(status.prekoracenPrag).toBe(false);
    });

    it('ispravno detektira prelazak zakonskog praga', () => {
      const status = calculatePausalniPragStatus(41250, 40000);
      expect(status.postotakIskoristenosti).toBe(103.13);
      expect(status.preostaloDoPragaEur).toBe(-1250.00);
      expect(status.prekoracenPrag).toBe(true);
    });
  });
});
