import { describe, it, expect } from 'vitest';
import { generateEpcQrPayload, parseEpcQrPayload, type EpcQrNalog } from '../src/utils/epc-qr';

describe('EPC QR Code (SEPA Credit Transfer EPC069-12 v002)', () => {
  it('generira ispravan EPC QR string za domaći i SEPA transfer', () => {
    const nalog: EpcQrNalog = {
      primateljIme: 'Robot Hand Made obrt',
      primateljIban: 'HR1223600001101234567',
      iznosEur: 1250.00,
      bic: 'ZABAHR2X',
      svrhaKod: 'GDSV',
      pozivNaBroj: 'HR00 1-2026',
      opisPlacanja: 'Račun 1/POSL1/1',
    };

    const payload = generateEpcQrPayload(nalog);
    const lines = payload.split('\n');

    expect(lines[0]).toBe('BCD');
    expect(lines[1]).toBe('002');
    expect(lines[2]).toBe('1');
    expect(lines[3]).toBe('SCT');
    expect(lines[4]).toBe('ZABAHR2X');
    expect(lines[5]).toBe('Robot Hand Made obrt');
    expect(lines[6]).toBe('HR1223600001101234567');
    expect(lines[7]).toBe('EUR1250.00');
    expect(lines[8]).toBe('GDSV');
    expect(lines[9]).toBe('HR00 1-2026');
    expect(lines[10]).toBe('Račun 1/POSL1/1');
  });

  it('ispravno parsira generirani EPC QR payload', () => {
    const nalog: EpcQrNalog = {
      primateljIme: 'Kupac Alpha d.o.o.',
      primateljIban: 'HR8424020061100543210',
      iznosEur: 85.50,
      svrhaKod: 'OTHR',
      pozivNaBroj: 'HR00 99-2026',
      opisPlacanja: 'Plaćanje usluga',
    };

    const payload = generateEpcQrPayload(nalog);
    const parsed = parseEpcQrPayload(payload);

    expect(parsed.primateljIme).toBe('Kupac Alpha d.o.o.');
    expect(parsed.primateljIban).toBe('HR8424020061100543210');
    expect(parsed.iznosEur).toBe(85.50);
    expect(parsed.svrhaKod).toBe('OTHR');
    expect(parsed.pozivNaBroj).toBe('HR00 99-2026');
    expect(parsed.opisPlacanja).toBe('Plaćanje usluga');
  });

  it('baca grešku kod neispravnog IBAN-a', () => {
    const invalidNalog: EpcQrNalog = {
      primateljIme: 'Test',
      primateljIban: '123',
      iznosEur: 10,
    };

    expect(() => generateEpcQrPayload(invalidNalog)).toThrow('Neispravan IBAN');
  });
});
