import { describe, it, expect, vi, beforeAll } from 'vitest';
import { generateInvoicePdf, type InvoicePdfData } from '../src/utils/pdf-generator';

describe('PDF Engine Validation (Client-Side Vector & Print Standard)', () => {
  beforeAll(() => {
    // Mock minimal Canvas & URL environment for Node.js test runner
    if (typeof globalThis.document === 'undefined') {
      const mockCanvas: any = {
        width: 300,
        height: 100,
        getContext: () => ({
          fillRect: vi.fn(),
          clearRect: vi.fn(),
          getImageData: () => ({ data: [] }),
          putImageData: vi.fn(),
          createImageData: () => [],
          setTransform: vi.fn(),
          drawImage: vi.fn(),
          save: vi.fn(),
          fillText: vi.fn(),
          restore: vi.fn(),
          beginPath: vi.fn(),
          moveTo: vi.fn(),
          lineTo: vi.fn(),
          closePath: vi.fn(),
          stroke: vi.fn(),
          translate: vi.fn(),
          scale: vi.fn(),
          rotate: vi.fn(),
          arc: vi.fn(),
          fill: vi.fn(),
        }),
        toDataURL: () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      };

      (globalThis as any).document = {
        createElement: (tag: string) => {
          if (tag === 'canvas') return mockCanvas;
          return {};
        },
      };
    }

    if (typeof globalThis.URL.createObjectURL === 'undefined') {
      globalThis.URL.createObjectURL = () => 'blob:http://localhost/test-blob-url';
    }
  });

  const sampleInvoiceData: InvoicePdfData = {
    obrtNaziv: 'ROBOT HAND MADE',
    obrtVlasnik: 'Matija Horvat',
    obrtOib: '12345678903',
    obrtAdresa: 'Ilica 242, 10000 Zagreb',
    obrtIban: 'HR1223600001101234567',
    obrtBanka: 'Zagrebačka banka d.d.',
    kupacNaziv: 'ACME Solutions d.o.o.',
    kupacOib: '98765432101',
    kupacAdresa: 'Vukovarska 78, 10000 Zagreb',
    vrstaDokumentaNaziv: 'RAČUN',
    brojDokumenta: '1/POSL1/1',
    datumIzdavanja: '24.10.2026.',
    datumIsporuke: '24.10.2026.',
    datumDospijeca: '07.11.2026.',
    nacinPlacanjaNaziv: 'Transakcijski račun',
    pozivNaBroj: 'HR00 1-2026',
    stavke: [
      {
        rbr: 1,
        naziv: 'Razvoj softverske arhitekture i REST API servisa',
        kpdSifra: '62.01.11',
        kolicina: 10,
        jedinicaMjere: 'sat',
        jedinicnaCijena: 75.00,
        popustPostotak: 0,
        ukupno: 750.00,
      },
      {
        rbr: 2,
        naziv: 'Automatizacija testova i validacija fiskalizacije',
        kpdSifra: '62.02.20',
        kolicina: 5,
        jedinicaMjere: 'sat',
        jedinicnaCijena: 60.00,
        popustPostotak: 0,
        ukupno: 300.00,
      },
    ],
    ukupnoOsnovica: 1050.00,
    ukupnoPdv: 0.00,
    ukupnoIznos: 1050.00,
    zakonskaKlauzula: 'Paušalni obrt nije u sustavu PDV-a prema čl. 90. st. 2. Zakona o PDV-u. Izdano putem ObrtnIQ bez fizičkog potpisa.',
    includeHub3Barcode: true,
    includeQrCode: true,
    logoImageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    pecatPotpisImageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  };

  it('generira ISO 32000-1 valjan A4 PDF račun u manje od 300 ms', async () => {
    const result = await generateInvoicePdf(sampleInvoiceData);

    // 1. Provjera brzine (Target < 300 ms)
    expect(result.durationMs).toBeLessThan(300);

    // 2. Provjera ISO 32000-1 PDF strukture
    expect(result.validation.isValidPdf).toBe(true);
    expect(result.validation.hasMagicHeader).toBe(true);
    expect(result.validation.hasEofTrailer).toBe(true);
    expect(result.validation.hasCatalog).toBe(true);
    expect(result.validation.hasPages).toBe(true);
    expect(['1.3', '1.4', '1.5', '1.7']).toContain(result.validation.version);
    expect(result.validation.byteLength).toBeGreaterThan(1000);
    expect(result.validation.errors).toHaveLength(0);

    // 3. Provjera naziva datoteke
    expect(result.filename).toBe('Racun_1_POSL1_1.pdf');

    // 4. Provjera postojanja bloba
    expect(result.blob).toBeDefined();
    expect(result.blobUrl).toContain('blob:');
  });

  it('generira valjan PDF čak i bez logotipa i pečata (fallback mod)', async () => {
    const minimalData: InvoicePdfData = {
      ...sampleInvoiceData,
      brojDokumenta: '2/POSL1/1',
      logoImageData: undefined,
      pecatPotpisImageData: undefined,
    };

    const result = await generateInvoicePdf(minimalData);

    expect(result.validation.isValidPdf).toBe(true);
    expect(result.filename).toBe('Racun_2_POSL1_1.pdf');
    expect(result.validation.errors).toHaveLength(0);
  });

  it('ispravno podržava override fiskalnog QR URL-a u PDF-u', async () => {
    const fiscalData: InvoicePdfData = {
      ...sampleInvoiceData,
      brojDokumenta: '3/POSL1/1',
      qrPayloadOverride: 'https://porezna-uprava.gov.hr/rn?zki=f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2&dat=20261024_1752&izn=105000',
    };

    const result = await generateInvoicePdf(fiscalData);

    expect(result.validation.isValidPdf).toBe(true);
    expect(result.filename).toBe('Racun_3_POSL1_1.pdf');
  });
});
