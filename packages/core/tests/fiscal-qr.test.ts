import { describe, it, expect } from 'vitest';
import { generateFiscalQrUrl, parseFiscalQrUrl, formatDatumZaFiscalQr, type FiscalQrData } from '../src/utils/fiscal-qr';

describe('Fiscal QR Code (Porezna uprava RH)', () => {
  it('ispravno formatira datum u YYYYMMDD format', () => {
    expect(formatDatumZaFiscalQr('2026-10-24')).toBe('20261024');
    expect(formatDatumZaFiscalQr('24.10.2026.')).toBe('20261024');
    expect(formatDatumZaFiscalQr('05.01.2026')).toBe('20260105');
  });

  it('generira ispravan službeni URL za provjeru na Poreznoj upravi', () => {
    const data: FiscalQrData = {
      zki: 'd41d8cd98f00b204e9800998ecf8427e',
      datumIzdavanja: '2026-10-24',
      ukupnoEur: 1250.00,
    };

    const url = generateFiscalQrUrl(data);
    expect(url).toBe('https://porezna.gov.hr/rn?z=d41d8cd98f00b204e9800998ecf8427e&d=20261024&i=125000');
  });

  it('uključuje JIR u URL ako je dostupan nakon fiskalizacije', () => {
    const data: FiscalQrData = {
      zki: 'a1b2c3d4e5f60718293a4b5c6d7e8f90',
      datumIzdavanja: '2026-10-24',
      ukupnoEur: 45.20,
      jir: '123e4567-e89b-12d3-a456-426614174000',
    };

    const url = generateFiscalQrUrl(data);
    expect(url).toContain('jir=123e4567-e89b-12d3-a456-426614174000');
    expect(url).toContain('i=4520');
  });

  it('ispravno parsira službeni Porezna uprava URL', () => {
    const url = 'https://porezna.gov.hr/rn?z=d41d8cd98f00b204e9800998ecf8427e&d=20261024&i=125000&jir=123e4567-e89b-12d3-a456-426614174000';
    const parsed = parseFiscalQrUrl(url);

    expect(parsed.zki).toBe('d41d8cd98f00b204e9800998ecf8427e');
    expect(parsed.datumIzdavanja).toBe('2026-10-24');
    expect(parsed.ukupnoEur).toBe(1250.00);
    expect(parsed.jir).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('baca grešku ako ZKI nije točno 32 heksadecimalna znaka', () => {
    const invalidData: FiscalQrData = {
      zki: 'prekratak-zki',
      datumIzdavanja: '2026-10-24',
      ukupnoEur: 100,
    };

    expect(() => generateFiscalQrUrl(invalidData)).toThrow('Neispravan ZKI');
  });
});
